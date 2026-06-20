import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, 
  Link2, Plus, Trash2, Edit3, Clock, MapPin, AlertTriangle, Check 
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const fetchCalendarData = async ({ queryKey }) => {
  const [_, start, end] = queryKey;
  const res = await api.get(`/events?start=${start}&end=${end}`);
  return res.data;
};

const CalendarPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());

  const dateParam = searchParams.get('date');

  useEffect(() => {
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (!isNaN(parsedDate.getTime())) {
        setCurrentDate(parsedDate);
        setSelectedDate(parsedDate);
        setActiveView('list');
        setIsPanelOpen(true);
        // Clear search param
        setSearchParams({}, { replace: true });
      }
    }
  }, [dateParam, setSearchParams]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeView, setActiveView] = useState('list'); // 'list' | 'detail' | 'create' | 'edit'
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Recurrence confirmation modal state
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [recurrenceAction, setRecurrenceAction] = useState('edit'); // 'edit' | 'delete'
  const [pendingFormValues, setPendingFormValues] = useState(null);

  // Slot Finder State
  const [showSlotFinder, setShowSlotFinder] = useState(false);
  const [slotSearchParams, setSlotSearchParams] = useState({
    dateStart: format(new Date(), 'yyyy-MM-dd'),
    dateEnd: format(addDays(new Date(), 3), 'yyyy-MM-dd'),
    duration: 60
  });
  const [slotsResults, setSlotsResults] = useState([]);
  const [isSearchingSlots, setIsSearchingSlots] = useState(false);
  const [searchedSlots, setSearchedSlots] = useState(false);

  // Server Conflict State
  const [showServerConflictModal, setShowServerConflictModal] = useState(false);
  const [serverConflicts, setServerConflicts] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'event',
    date: '',
    is_all_day: false,
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    reminder_minutes_before: '',
    is_recurring: false,
    recurrence_pattern: 'none',
    recurrence_end_date: '',
    end_date: '',
    ignoreConflict: false
  });

  // Calculate visible range to fetch events
  const { startDateStr, endDateStr, monthStart, monthEnd, gridStartDate, gridEndDate } = useMemo(() => {
    const startM = startOfMonth(currentDate);
    const endM = endOfMonth(startM);
    const startW = startOfWeek(startM, { weekStartsOn: 1 });
    const endW = endOfWeek(endM, { weekStartsOn: 1 });
    return {
      startDateStr: format(startW, 'yyyy-MM-dd'),
      endDateStr: format(endW, 'yyyy-MM-dd'),
      monthStart: startM,
      monthEnd: endM,
      gridStartDate: startW,
      gridEndDate: endW
    };
  }, [currentDate]);

  // Fetch events for the visible month grid
  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ['events', startDateStr, endDateStr],
    queryFn: fetchCalendarData
  });

  // Helper: check if event falls on a specific day (handles multi-day ranges)
  const isEventOnDay = (event, day) => {
    const eventStart = new Date(event.date);
    eventStart.setHours(0, 0, 0, 0);
    
    const targetDay = new Date(day);
    targetDay.setHours(0, 0, 0, 0);
    
    if (event.end_date) {
      const eventEnd = new Date(event.end_date);
      eventEnd.setHours(0, 0, 0, 0);
      return targetDay >= eventStart && targetDay <= eventEnd;
    }
    
    return isSameDay(eventStart, targetDay);
  };

  // Helper: Sort events consistently to align multi-day spans
  const sortEvents = (a, b) => {
    if (a.is_all_day && !b.is_all_day) return -1;
    if (!a.is_all_day && b.is_all_day) return 1;
    
    const aDuration = a.end_date ? (new Date(a.end_date) - new Date(a.date)) : 0;
    const bDuration = b.end_date ? (new Date(b.end_date) - new Date(b.date)) : 0;
    if (aDuration !== bDuration) {
      return bDuration - aDuration; // Longer durations first
    }
    
    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }
    if (a.start_time) return 1;
    if (b.start_time) return -1;
    
    return String(a._id).localeCompare(String(b._id));
  };

  // Helper: check if interview is coming up within 48h and has zero prep logged
  const isUpcomingInterviewWithoutPrep = (event) => {
    if (event.type !== 'interview') return false;
    if (event.hasPrep === true) return false;
    
    const eventDate = new Date(event.date);
    if (event.start_time) {
      const [h, m] = event.start_time.split(':').map(Number);
      eventDate.setHours(h, m, 0, 0);
    } else {
      eventDate.setHours(0, 0, 0, 0);
    }
    
    const now = new Date();
    const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return diffHours >= 0 && diffHours <= 48;
  };

  // Helper: Generate textual label for days of a multi-day span
  const getMultiDaySpanText = (event, day) => {
    if (!event.end_date) return '';
    const start = new Date(event.date);
    start.setHours(0,0,0,0);
    const end = new Date(event.end_date);
    end.setHours(0,0,0,0);
    const current = new Date(day);
    current.setHours(0,0,0,0);
    
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.round((current - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const label = event.type === 'application_deadline' ? 'Application Window' : 'Program Duration';
    return `Day ${currentDay} of ${totalDays} — ${label}`;
  };

  // Helper: Client-side conflict detection
  const checkConflictsClient = (formValues, allEvents, currentEventId) => {
    if (formValues.is_all_day) return { hasHard: false, hasSoft: false, conflicts: [] };
    if (!formValues.date || !formValues.start_time) return { hasHard: false, hasSoft: false, conflicts: [] };

    const startD = new Date(formValues.date);
    const [sh, sm] = formValues.start_time.split(':').map(Number);
    startD.setHours(sh, sm, 0, 0);

    const DEFAULT_DURATIONS = { interview: 60, event: 60, follow_up: 30, deadline: 0, application_deadline: 0, offer_deadline: 0 };
    const duration = formValues.end_time ? 0 : (DEFAULT_DURATIONS[formValues.type] || 60);
    
    const endD = new Date(startD.getTime());
    if (formValues.end_time) {
      const [eh, em] = formValues.end_time.split(':').map(Number);
      endD.setHours(eh, em, 0, 0);
    } else {
      endD.setMinutes(endD.getMinutes() + duration);
    }

    const conflicts = [];
    const startOfDay = new Date(formValues.date);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(formValues.date);
    endOfDay.setHours(23,59,59,999);

    // Filter events on the same day (excluding the current event being edited)
    const sameDayEvents = allEvents.filter(e => {
      if (String(e._id) === String(currentEventId)) return false;
      if (e.status === 'cancelled') return false;
      const eDate = new Date(e.date);
      return eDate >= startOfDay && eDate <= endOfDay;
    });

    for (const event of sameDayEvents) {
      if (event.is_all_day) continue;

      const evStart = new Date(event.date);
      if (event.start_time) {
        const [h, m] = event.start_time.split(':').map(Number);
        evStart.setHours(h, m, 0, 0);
      }

      const evDuration = event.end_time ? 0 : (DEFAULT_DURATIONS[event.type] || 60);
      const evEnd = new Date(evStart.getTime());
      if (event.end_time) {
        const [h, m] = event.end_time.split(':').map(Number);
        evEnd.setHours(h, m, 0, 0);
      } else {
        evEnd.setMinutes(evEnd.getMinutes() + evDuration);
      }

      // 1. Hard Conflict
      if (startD < evEnd && evStart < endD) {
        conflicts.push({
          type: 'hard',
          title: event.title,
          message: `Time overlap with "${event.title}" (${event.start_time})`
        });
        continue;
      }

      // 2. Soft Conflict (Tight gap at different locations)
      const diffMinutes1 = Math.abs(startD.getTime() - evEnd.getTime()) / 60000;
      const diffMinutes2 = Math.abs(evStart.getTime() - endD.getTime()) / 60000;
      const minGap = Math.min(diffMinutes1, diffMinutes2);

      if (minGap < 90) {
        if (formValues.location && event.location && formValues.location.trim().toLowerCase() !== event.location.trim().toLowerCase()) {
          conflicts.push({
            type: 'soft',
            title: event.title,
            message: `Tight gap (${Math.round(minGap)} mins) with "${event.title}" at different locations ("${formValues.location}" vs "${event.location}").`
          });
        }
      }
    }

    return {
      hasHard: conflicts.some(c => c.type === 'hard'),
      hasSoft: conflicts.some(c => c.type === 'soft'),
      conflicts
    };
  };

  // Memoized client conflicts info
  const conflictsInfo = useMemo(() => {
    return checkConflictsClient(formData, events, selectedEvent?._id);
  }, [formData, events, selectedEvent]);

  // Next 7 Days Strip selector
  const next7DaysEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = addDays(today, 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= sevenDaysFromNow;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => await api.post('/events', data),
    onSuccess: (res) => {
      if (res.data?.hasConflict) {
        setServerConflicts(res.data.conflicts);
        setShowServerConflictModal(true);
      } else {
        queryClient.invalidateQueries(['events']);
        toast.success('Event scheduled successfully');
        setIsPanelOpen(false);
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to schedule event';
      toast.error(msg);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => await api.put(`/events/${id}`, data),
    onSuccess: (res) => {
      if (res.data?.hasConflict) {
        setServerConflicts(res.data.conflicts);
        setShowServerConflictModal(true);
      } else {
        queryClient.invalidateQueries(['events']);
        toast.success('Event updated successfully');
        setIsPanelOpen(false);
      }
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to update event';
      toast.error(msg);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, editMode }) => await api.delete(`/events/${id}?recurrenceEditMode=${editMode}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      toast.success('Event removed successfully');
      setIsPanelOpen(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to remove event';
      toast.error(msg);
    }
  });

  // Navigation handlers
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  // Click on date cell
  const handleDateClick = (day) => {
    setSelectedDate(day);
    setActiveView('list');
    setIsPanelOpen(true);
  };

  // Open Add Form
  const openAddForm = () => {
    const formattedDate = format(selectedDate || new Date(), 'yyyy-MM-dd');
    setFormData({
      title: '',
      type: 'event',
      date: formattedDate,
      is_all_day: false,
      start_time: '09:00',
      end_time: '10:00',
      location: '',
      description: '',
      reminder_minutes_before: '',
      is_recurring: false,
      recurrence_pattern: 'none',
      recurrence_end_date: formattedDate,
      end_date: '',
      ignoreConflict: false
    });
    setShowSlotFinder(false);
    setSlotsResults([]);
    setSearchedSlots(false);
    setActiveView('create');
  };

  // Open Edit Form
  const openEditForm = (event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      type: event.type,
      date: format(new Date(event.date), 'yyyy-MM-dd'),
      is_all_day: event.is_all_day,
      start_time: event.start_time || '09:00',
      end_time: event.end_time || '10:00',
      location: event.location || '',
      description: event.description || '',
      reminder_minutes_before: event.reminder_minutes_before !== null ? String(event.reminder_minutes_before) : '',
      is_recurring: event.is_recurring,
      recurrence_pattern: event.recurrence_pattern || 'none',
      recurrence_end_date: event.recurrence_end_date ? format(new Date(event.recurrence_end_date), 'yyyy-MM-dd') : '',
      end_date: event.end_date ? format(new Date(event.end_date), 'yyyy-MM-dd') : '',
      ignoreConflict: false
    });
    setShowSlotFinder(false);
    setSlotsResults([]);
    setSearchedSlots(false);
    setActiveView('edit');
  };

  // Click on event chip
  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setSelectedDate(new Date(event.date));
    setActiveView('detail');
    setIsPanelOpen(true);
  };

  // Event submit handler
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Front-end block if hard conflict exists and ignoreConflict is not checked
    if (conflictsInfo.hasHard && !formData.ignoreConflict) {
      toast.error('Cannot save: Hard time overlap conflict detected. Check "Ignore conflict" to proceed.');
      return;
    }

    const submitData = { ...formData };
    if (submitData.reminder_minutes_before) {
      submitData.reminder_minutes_before = Number(submitData.reminder_minutes_before);
    } else {
      submitData.reminder_minutes_before = null;
    }

    // Clean up end_date if type is not event or application_deadline
    if (!['event', 'application_deadline'].includes(submitData.type)) {
      submitData.end_date = null;
    } else if (submitData.end_date) {
      if (new Date(submitData.end_date) < new Date(submitData.date)) {
        toast.error('End date cannot be before start date.');
        return;
      }
    }

    if (activeView === 'create') {
      createMutation.mutate(submitData);
    } else if (activeView === 'edit') {
      if (selectedEvent.is_recurring) {
        setRecurrenceAction('edit');
        setPendingFormValues(submitData);
        setShowRecurrenceModal(true);
      } else {
        updateMutation.mutate({ id: selectedEvent._id, data: { ...submitData, recurrenceEditMode: 'single' } });
      }
    }
  };

  // Delete event handler
  const handleDeleteClick = () => {
    if (selectedEvent.is_recurring) {
      setRecurrenceAction('delete');
      setShowRecurrenceModal(true);
    } else {
      deleteMutation.mutate({ id: selectedEvent._id, editMode: 'single' });
    }
  };

  // Handle recurring confirmation selection
  const handleRecurrenceActionConfirm = (editMode) => {
    setShowRecurrenceModal(false);
    if (recurrenceAction === 'edit') {
      updateMutation.mutate({ 
        id: selectedEvent._id, 
        data: { ...pendingFormValues, recurrenceEditMode: editMode } 
      });
    } else if (recurrenceAction === 'delete') {
      deleteMutation.mutate({ id: selectedEvent._id, editMode });
    }
  };

  // Handle server-side conflict confirmation save anyway
  const handleConfirmServerConflict = () => {
    setShowServerConflictModal(false);
    const submitData = { ...formData, ignoreConflict: true };
    if (submitData.reminder_minutes_before) {
      submitData.reminder_minutes_before = Number(submitData.reminder_minutes_before);
    } else {
      submitData.reminder_minutes_before = null;
    }

    if (activeView === 'create') {
      createMutation.mutate(submitData);
    } else if (activeView === 'edit') {
      if (selectedEvent.is_recurring) {
        updateMutation.mutate({ 
          id: selectedEvent._id, 
          data: { ...pendingFormValues, ignoreConflict: true } 
        });
      } else {
        updateMutation.mutate({ 
          id: selectedEvent._id, 
          data: { ...submitData, recurrenceEditMode: 'single', ignoreConflict: true } 
        });
      }
    }
  };

  // Slot finder search
  const handleSearchSlots = async () => {
    setIsSearchingSlots(true);
    setSearchedSlots(true);
    try {
      const res = await api.get('/events/slots/find', {
        params: {
          dateStart: slotSearchParams.dateStart,
          dateEnd: slotSearchParams.dateEnd,
          duration: slotSearchParams.duration
        }
      });
      setSlotsResults(res.data);
    } catch (err) {
      toast.error('Failed to find free slots.');
    } finally {
      setIsSearchingSlots(false);
    }
  };

  // Use slot from list finder
  const handleUseSlot = (slot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    setFormData({
      ...formData,
      date: format(start, 'yyyy-MM-dd'),
      start_time: format(start, 'HH:mm'),
      end_time: format(end, 'HH:mm'),
      is_all_day: false
    });
    setShowSlotFinder(false);
    toast.success('Applied slot to schedule');
  };

  // Export event to ICS standard file
  const handleExportICS = async (eventId) => {
    try {
      const response = await api.get(`/events/${eventId}/ics`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event_${eventId}.ics`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('ICS file exported');
    } catch (err) {
      toast.error('Failed to export event to ICS');
    }
  };

  // Color Mapping
  const getEventColors = (type, status) => {
    const isPast = status === 'completed' || status === 'missed';
    const opacityClass = isPast ? 'opacity-60' : 'opacity-100';

    switch (type) {
      case 'interview':
        return {
          chip: `bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 ${opacityClass}`,
          badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
          indicator: 'bg-amber-500'
        };
      case 'application_deadline':
        return {
          chip: `bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 ${opacityClass}`,
          badge: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
          indicator: 'bg-blue-500'
        };
      case 'offer_deadline':
        return {
          chip: `bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 ${opacityClass}`,
          badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
          indicator: 'bg-emerald-500'
        };
      case 'deadline':
        return {
          chip: `bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 ${opacityClass}`,
          badge: 'bg-red-500/20 text-red-300 border border-red-500/30',
          indicator: 'bg-red-500'
        };
      case 'follow_up':
        return {
          chip: `bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20 ${opacityClass}`,
          badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
          indicator: 'bg-orange-500'
        };
      default: // event
        return {
          chip: `bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20 ${opacityClass}`,
          badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
          indicator: 'bg-purple-500'
        };
    }
  };

  // Event list for side panel on clicked date
  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(e => isEventOnDay(e, selectedDate)).sort(sortEvents);
  }, [events, selectedDate]);

  // Generate Month Days Grid
  const gridCells = useMemo(() => {
    const cells = [];
    let day = gridStartDate;
    while (day <= gridEndDate) {
      cells.push(day);
      day = addDays(day, 1);
    }
    return cells;
  }, [gridStartDate, gridEndDate]);

  return (
    <div className="max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col pb-10 px-4 sm:px-6">
      
      {/* Header */}
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-white mb-1 flex items-center gap-2">
            <CalendarIcon className="text-[#00f0ff] w-8 h-8" />
            Calendar Hub
          </h1>
          <p className="text-[14px] text-slate-400">Manage interviews, deadlines, offers, and schedule custom reminders.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={jumpToToday} 
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            Today
          </button>
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-1.5 text-sm font-semibold text-white min-w-[120px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Next 7 Days Strip */}
      <section className="mb-6 bg-white/5 border border-white/5 rounded-2xl p-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Next 7 Days</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {next7DaysEvents.length === 0 ? (
            <p className="text-sm text-slate-500 py-2">No upcoming interviews or deadlines in the next 7 days.</p>
          ) : (
            next7DaysEvents.map(event => {
              const colors = getEventColors(event.type, event.status);
              return (
                <div 
                  key={event._id}
                  onClick={(e) => handleEventClick(event, e)}
                  className="flex-shrink-0 w-[200px] bg-[#13141f] border border-white/5 hover:border-white/10 p-3 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {format(new Date(event.date), 'EEE, MMM d')}
                    </span>
                    {event.source !== 'manual' && <Link2 className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <h4 className="text-sm font-bold text-white truncate mb-1">{event.title}</h4>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${colors.indicator}`} />
                    <span className="text-xs text-slate-400 capitalize">{event.type.replace('_', ' ')}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Main Grid View */}
      <div className="glass-card border border-white/5 rounded-2xl flex-1 overflow-hidden flex flex-col">
        {/* Day Name Row */}
        <div className="grid grid-cols-7 border-b border-white/5 bg-[#13141f]/30 shrink-0">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center font-bold text-xs text-slate-400 py-3 uppercase tracking-wider">{day}</div>
          ))}
        </div>
        
        {/* Days cells */}
        {isLoading ? (
          <div className="flex-1 min-h-[400px] grid grid-cols-7 grid-rows-5 gap-px bg-white/5 animate-pulse" />
        ) : (
          <div className="flex-1 grid grid-cols-7 grid-rows-5 auto-rows-fr bg-[#13141f]">
            {gridCells.map((day) => {
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayEvents = events.filter(e => isEventOnDay(e, day)).sort(sortEvents);
              const displayEvents = dayEvents.slice(0, 3);
              const overflowCount = dayEvents.length - 3;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  className={`min-h-[110px] p-2 cursor-pointer border border-white/5 transition-all flex flex-col justify-between hover:bg-white/5 overflow-hidden ${
                    !isCurrentMonth ? 'text-slate-600 bg-black/20' : 'text-slate-300 bg-[#13141f]'
                  } ${isToday ? 'ring-2 ring-[#00f0ff] ring-inset' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-[#00f0ff] text-[#13141f]' : ''
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  
                  {/* Event Chips */}
                  <div className="flex-1 flex flex-col gap-1 overflow-hidden justify-start w-full">
                    {displayEvents.map(event => {
                      const colors = getEventColors(event.type, event.status);
                      const isMultiDay = event.end_date && !isSameDay(new Date(event.date), new Date(event.end_date));
                      
                      let roundedClass = 'rounded';
                      let marginClass = '';
                      let borderClass = 'border';
                      let prefix = null;
                      let suffix = null;
                      let showText = true;

                      if (isMultiDay) {
                        const isStart = isSameDay(new Date(event.date), day);
                        const isEnd = isSameDay(new Date(event.end_date), day);
                        const isMon = day.getDay() === 1;
                        const isSun = day.getDay() === 0;

                        showText = isStart || isMon;

                        if (isStart) {
                          roundedClass = 'rounded-l-lg rounded-r-none';
                          borderClass = 'border border-r-0';
                          marginClass = 'mr-[-8px]';
                        } else if (isEnd) {
                          roundedClass = 'rounded-r-lg rounded-l-none';
                          borderClass = 'border border-l-0';
                          marginClass = 'ml-[-8px]';
                        } else {
                          roundedClass = 'rounded-none';
                          borderClass = 'border-y border-x-0';
                          marginClass = 'mx-[-8px]';
                        }

                        if (isMon && !isStart) {
                          prefix = <span className="text-[8px] mr-1 text-slate-400 font-bold shrink-0">◀</span>;
                        }
                        if (isSun && !isEnd) {
                          suffix = <span className="text-[8px] ml-1 text-slate-400 font-bold shrink-0">▶</span>;
                        }
                      }

                      const hasPrepWarning = isUpcomingInterviewWithoutPrep(event);

                      return (
                        <div 
                          key={event._id}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`text-[10px] px-1.5 py-0.5 truncate flex items-center justify-between cursor-pointer ${roundedClass} ${borderClass} ${marginClass} ${colors.chip}`}
                          title={`${event.title} ${event.end_date ? `(${format(new Date(event.date), 'MMM d')} - ${format(new Date(event.end_date), 'MMM d')})` : ''}`}
                        >
                          <div className="flex items-center truncate flex-1 font-medium">
                            {hasPrepWarning && (
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 mr-1.5 animate-pulse" title="No prep logged yet" />
                            )}
                            {prefix}
                            <span className="truncate">
                              {showText ? event.title : '\u00A0'}
                            </span>
                            {suffix}
                          </div>
                          {showText && event.source !== 'manual' && (
                            <Link2 className="w-2.5 h-2.5 ml-1 text-slate-500 opacity-60 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                    {overflowCount > 0 && (
                      <div className="text-[9px] text-slate-400 font-semibold pl-1.5">
                        +{overflowCount} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-6 justify-center text-xs text-slate-400 font-medium border-t border-white/5 pt-6">
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/30"></div><span>Interviews</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500/30"></div><span>Applications</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/30"></div><span>Offers</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-purple-500/20 border border-purple-500/30"></div><span>Events</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-500/30"></div><span>Deadlines</span></div>
        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-orange-500/20 border border-orange-500/30"></div><span>Follow Ups</span></div>
      </div>

      {/* Side Slide-over Drawer */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsPanelOpen(false)} 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" 
            />
            
            {/* Panel */}
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#13141f] border-l border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#13141f]/80 backdrop-blur-md sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {activeView === 'create' && 'Schedule Event'}
                    {activeView === 'edit' && 'Edit Event'}
                    {activeView === 'detail' && 'Event Details'}
                    {activeView === 'list' && format(selectedDate || new Date(), 'MMMM d, yyyy')}
                  </h3>
                  {activeView === 'list' && (
                    <p className="text-xs text-slate-400">Events scheduled for this day</p>
                  )}
                </div>
                <button 
                  onClick={() => setIsPanelOpen(false)} 
                  className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                
                {/* 1. Day Event List View */}
                {activeView === 'list' && (
                  <div className="flex flex-col h-full justify-between">
                    <div className="space-y-4">
                      {selectedDayEvents.length === 0 ? (
                        <div className="text-center py-10 bg-white/5 border border-white/5 border-dashed rounded-xl">
                          <p className="text-sm text-slate-500">No events scheduled for this day.</p>
                        </div>
                      ) : (
                        selectedDayEvents.map(event => {
                          const colors = getEventColors(event.type, event.status);
                          const hasPrepWarning = isUpcomingInterviewWithoutPrep(event);
                          const isMultiDay = event.end_date && !isSameDay(new Date(event.date), new Date(event.end_date));
                          return (
                            <div 
                              key={event._id}
                              onClick={(e) => handleEventClick(event, e)}
                              className={`p-4 rounded-xl border border-white/5 bg-[#181926]/50 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer flex flex-col gap-2 group`}
                            >
                              <div className="flex items-start justify-between w-full">
                                <div className="flex-1 min-w-0 pr-3">
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className={`w-2.5 h-2.5 rounded-full ${colors.indicator}`} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider capitalize">
                                      {event.type.replace('_', ' ')}
                                    </span>
                                    {event.source !== 'manual' && (
                                      <span className="px-1.5 py-0.5 bg-white/5 text-[9px] text-slate-500 rounded border border-white/10 flex items-center gap-1">
                                        <Link2 className="w-2.5 h-2.5" /> Synced
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white mb-1 truncate">{event.title}</h4>
                                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    {event.is_all_day ? 'All Day' : `${event.start_time} - ${event.end_time || 'End'}`}
                                  </p>
                                  {isMultiDay && (
                                    <p className="text-[11px] text-slate-400 font-semibold mt-1">
                                      {getMultiDaySpanText(event, selectedDate || new Date())}
                                    </p>
                                  )}
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-colors self-center flex-shrink-0" />
                              </div>

                              {hasPrepWarning && (
                                <div className="mt-1 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                  <div className="flex-1 flex justify-between items-center">
                                    <span className="text-xs text-amber-300 font-medium">No prep logged yet</span>
                                    <a 
                                      href="/interviews" 
                                      onClick={(e) => e.stopPropagation()} 
                                      className="text-xs text-[#00f0ff] hover:underline font-bold"
                                    >
                                      Add notes &rarr;
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <button 
                      onClick={openAddForm} 
                      className="w-full mt-6 py-3 bg-[#ff6b00] hover:bg-[#ff8c33] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 sticky bottom-0"
                    >
                      <Plus className="w-4 h-4" /> Add Event
                    </button>
                  </div>
                )}

                {/* 2. Event Detail View */}
                {activeView === 'detail' && selectedEvent && (
                  <div className="space-y-6">
                    {selectedEvent.source !== 'manual' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Synced Event</p>
                          <p className="text-xs text-amber-300/80 mt-1">
                            This event is auto-synced with an Interview, Application, or Offer record. Edits here will only affect the calendar.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getEventColors(selectedEvent.type, selectedEvent.status).badge}`}>
                          {selectedEvent.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white leading-tight">{selectedEvent.title}</h3>
                    </div>

                    <div className="border-t border-white/5 pt-4 space-y-3 text-sm text-slate-300">
                      <div className="flex items-start gap-3">
                        <CalendarIcon className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                          <span>
                            {format(new Date(selectedEvent.date), 'MMMM do, yyyy')}
                            {selectedEvent.end_date && ` - ${format(new Date(selectedEvent.end_date), 'MMMM do, yyyy')}`}
                          </span>
                          {selectedEvent.end_date && (
                            <p className="text-xs text-slate-400 mt-1">
                              {getMultiDaySpanText(selectedEvent, selectedDate || new Date())}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-500 shrink-0" />
                        <span>{selectedEvent.is_all_day ? 'All Day' : `${selectedEvent.start_time} - ${selectedEvent.end_time || 'None'}`}</span>
                      </div>
                      {selectedEvent.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-slate-500 shrink-0" />
                          <span className="truncate">{selectedEvent.location}</span>
                        </div>
                      )}
                    </div>

                    {isUpcomingInterviewWithoutPrep(selectedEvent) && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">No Preparation Logged</p>
                          <p className="text-xs text-amber-300/80 mt-1">
                            This interview is within 48 hours, but you have no checklist items completed or preparation notes saved.
                          </p>
                          <a 
                            href="/interviews" 
                            className="inline-flex items-center gap-1.5 text-xs text-[#00f0ff] hover:underline font-bold mt-2"
                          >
                            Go to Interviews Module to prepare &rarr;
                          </a>
                        </div>
                      </div>
                    )}

                    {selectedEvent.description && (
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</h4>
                        <p className="text-sm text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 whitespace-pre-line leading-relaxed">
                          {selectedEvent.description}
                        </p>
                      </div>
                    )}

                    <div className="border-t border-white/5 pt-4 space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                        <span>Reminder</span>
                        <span className="text-white">
                          {selectedEvent.reminder_minutes_before === null ? 'None' : 
                           selectedEvent.reminder_minutes_before === 15 ? '15 minutes before' :
                           selectedEvent.reminder_minutes_before === 60 ? '1 hour before' :
                           selectedEvent.reminder_minutes_before === 1440 ? '1 day before' :
                           selectedEvent.reminder_minutes_before === 10080 ? '1 week before' : `${selectedEvent.reminder_minutes_before} mins before`}
                        </span>
                      </div>
                      {selectedEvent.is_recurring && (
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500 pt-1">
                          <span>Recurrence</span>
                          <span className="text-white capitalize">
                            {selectedEvent.recurrence_pattern} (until {selectedEvent.recurrence_end_date && format(new Date(selectedEvent.recurrence_end_date), 'yyyy-MM-dd')})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => handleExportICS(selectedEvent._id)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <CalendarIcon className="w-4 h-4 text-[#00f0ff]" /> Export to ICS (.ics)
                      </button>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => openEditForm(selectedEvent)}
                          className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Edit3 className="w-4 h-4" /> Edit
                        </button>
                        <button 
                          onClick={handleDeleteClick}
                          className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Event Create / Edit Form View */}
                {(activeView === 'create' || activeView === 'edit') && (
                  <form onSubmit={handleFormSubmit} className="space-y-5 pb-10">
                    
                    {/* Inline warning for synced events */}
                    {activeView === 'edit' && selectedEvent?.source !== 'manual' && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Sync Warning</p>
                          <p className="text-xs text-amber-300/80 mt-1">
                            This will only update the calendar entry, not the original Interview/Application record. Edit the original record directly to change both.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Event Title</label>
                      <input 
                        type="text" 
                        required 
                        maxLength={100}
                        value={formData.title} 
                        onChange={(e) => setFormData({...formData, title: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm" 
                        placeholder="e.g. Recruiter Call or SOP Submission" 
                      />
                    </div>

                    {/* Type & Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Type</label>
                        <select 
                          value={formData.type} 
                          onChange={(e) => {
                            const newType = e.target.value;
                            const updated = { ...formData, type: newType };
                            if (!['event', 'application_deadline'].includes(newType)) {
                              updated.end_date = '';
                            }
                            setFormData(updated);
                          }} 
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm appearance-none"
                        >
                          <option value="event" className="bg-[#13141f]">Event</option>
                          <option value="deadline" className="bg-[#13141f]">Deadline</option>
                          <option value="interview" className="bg-[#13141f]">Interview</option>
                          <option value="application_deadline" className="bg-[#13141f]">App Deadline</option>
                          <option value="offer_deadline" className="bg-[#13141f]">Offer Deadline</option>
                          <option value="follow_up" className="bg-[#13141f]">Follow Up</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Start Date</label>
                        <input 
                          type="date" 
                          required 
                          value={formData.date} 
                          onChange={(e) => setFormData({...formData, date: e.target.value})} 
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm [color-scheme:dark]" 
                        />
                      </div>
                    </div>

                    {/* End Date (Multi-day spans) */}
                    {['event', 'application_deadline'].includes(formData.type) && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                          End Date (Optional - for multi-day spans)
                        </label>
                        <input 
                          type="date" 
                          value={formData.end_date || ''} 
                          onChange={(e) => setFormData({...formData, end_date: e.target.value})} 
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm [color-scheme:dark]" 
                        />
                      </div>
                    )}

                    {/* All-day toggle */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                      <div>
                        <label className="text-sm font-semibold text-white block">All-Day Event</label>
                        <p className="text-xs text-slate-500">Event runs the entire day</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={formData.is_all_day} 
                        onChange={(e) => setFormData({...formData, is_all_day: e.target.checked})} 
                        className="w-5 h-5 rounded border-white/20 bg-[#13141f] text-[#ff6b00] focus:ring-[#ff6b00] focus:ring-offset-[#13141f]"
                      />
                    </div>

                    {/* Start/End Times (hidden if all-day) */}
                    {!formData.is_all_day && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Start Time</label>
                            <input 
                              type="time" 
                              required={!formData.is_all_day}
                              value={formData.start_time} 
                              onChange={(e) => setFormData({...formData, start_time: e.target.value})} 
                              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm [color-scheme:dark]" 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">End Time</label>
                            <input 
                              type="time" 
                              required={!formData.is_all_day}
                              value={formData.end_time} 
                              onChange={(e) => setFormData({...formData, end_time: e.target.value})} 
                              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm [color-scheme:dark]" 
                            />
                          </div>
                        </div>
                        {activeView === 'create' && (
                          <div className="flex justify-end mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setShowSlotFinder(!showSlotFinder);
                                if (formData.date) {
                                  setSlotSearchParams({
                                    dateStart: formData.date,
                                    dateEnd: format(addDays(new Date(formData.date), 3), 'yyyy-MM-dd'),
                                    duration: 60
                                  });
                                }
                              }}
                              className="text-xs text-[#00f0ff] hover:underline font-semibold flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" /> 
                              {showSlotFinder ? 'Hide Slot Finder' : 'Find a Free Slot'}
                            </button>
                          </div>
                        )}
                        {showSlotFinder && activeView === 'create' && (
                          <div className="border border-white/10 rounded-xl p-4 bg-white/5 space-y-3 mt-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-slate-300 uppercase">Find Free Slots</h4>
                              <button 
                                type="button" 
                                onClick={() => setShowSlotFinder(false)}
                                className="text-xs text-slate-400 hover:text-white"
                              >
                                Hide
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Search Start</label>
                                <input 
                                  type="date"
                                  value={slotSearchParams.dateStart}
                                  onChange={(e) => setSlotSearchParams({ ...slotSearchParams, dateStart: e.target.value })}
                                  className="w-full bg-[#13141f] border border-white/10 rounded p-1.5 text-white text-xs [color-scheme:dark]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Search End</label>
                                <input 
                                  type="date"
                                  value={slotSearchParams.dateEnd}
                                  onChange={(e) => setSlotSearchParams({ ...slotSearchParams, dateEnd: e.target.value })}
                                  className="w-full bg-[#13141f] border border-white/10 rounded p-1.5 text-white text-xs [color-scheme:dark]"
                                />
                              </div>
                            </div>
                            
                            <div className="flex gap-2 items-center text-xs">
                              <span className="text-slate-400">Duration (mins):</span>
                              <select 
                                value={slotSearchParams.duration}
                                onChange={(e) => setSlotSearchParams({ ...slotSearchParams, duration: Number(e.target.value) })}
                                className="bg-[#13141f] border border-white/10 rounded p-1 text-white text-xs"
                              >
                                <option value={30}>30 mins</option>
                                <option value={60}>60 mins (1 hour)</option>
                                <option value={90}>90 mins</option>
                                <option value={120}>120 mins (2 hours)</option>
                              </select>
                              
                              <button
                                type="button"
                                onClick={handleSearchSlots}
                                className="ml-auto px-3 py-1 bg-[#ff6b00] hover:bg-[#ff8c33] text-white font-bold rounded text-xs transition-colors"
                              >
                                Search
                              </button>
                            </div>

                            {/* Slots Results */}
                            {isSearchingSlots ? (
                              <p className="text-xs text-slate-500">Searching slots...</p>
                            ) : slotsResults.length === 0 ? (
                              searchedSlots && <p className="text-xs text-slate-500">No free slots found.</p>
                            ) : (
                              <div className="space-y-1.5 pt-2 border-t border-white/5 max-h-[150px] overflow-y-auto custom-scrollbar">
                                {slotsResults.map((slot, index) => {
                                  const slotStart = new Date(slot.start);
                                  const slotEnd = new Date(slot.end);
                                  return (
                                    <div key={index} className="flex justify-between items-center bg-[#13141f] p-2 rounded border border-white/5">
                                      <span className="text-xs text-slate-300">
                                        {format(slotStart, 'MMM d, h:mm a')} - {format(slotEnd, 'h:mm a')}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleUseSlot(slot)}
                                        className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold hover:bg-emerald-500/30 transition-colors"
                                      >
                                        Use Slot
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Location */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Location (Optional)</label>
                      <input 
                        type="text" 
                        value={formData.location} 
                        onChange={(e) => setFormData({...formData, location: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm" 
                        placeholder="e.g. Zoom Link, Conference Room B" 
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description (Optional)</label>
                      <textarea 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm min-h-[80px] resize-y" 
                        placeholder="Details, interview requirements, links..." 
                      />
                    </div>

                    {/* Reminder */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reminder Lead Time</label>
                      <select 
                        value={formData.reminder_minutes_before} 
                        onChange={(e) => setFormData({...formData, reminder_minutes_before: e.target.value})} 
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm appearance-none"
                      >
                        <option value="" className="bg-[#13141f]">None (No reminder)</option>
                        <option value="15" className="bg-[#13141f]">15 minutes before</option>
                        <option value="60" className="bg-[#13141f]">1 hour before</option>
                        <option value="1440" className="bg-[#13141f]">1 day before</option>
                        <option value="10080" className="bg-[#13141f]">1 week before</option>
                      </select>
                    </div>

                    {/* Recurrence Setup (only show for manual/create event or non-synced edit) */}
                    {(!selectedEvent || selectedEvent.source === 'manual') && (
                      <div className="border border-white/5 rounded-2xl p-4 bg-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-semibold text-white block">Recurring Event</label>
                            <p className="text-xs text-slate-500">Repeat this event on a schedule</p>
                          </div>
                          <input 
                            type="checkbox" 
                            checked={formData.is_recurring} 
                            onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})} 
                            className="w-5 h-5 rounded border-white/20 bg-[#13141f] text-[#ff6b00] focus:ring-[#ff6b00] focus:ring-offset-[#13141f]"
                          />
                        </div>

                        {formData.is_recurring && (
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Repeat Frequency</label>
                              <select 
                                value={formData.recurrence_pattern} 
                                onChange={(e) => setFormData({...formData, recurrence_pattern: e.target.value})} 
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm appearance-none"
                              >
                                <option value="daily" className="bg-[#13141f]">Daily</option>
                                <option value="weekly" className="bg-[#13141f]">Weekly</option>
                                <option value="biweekly" className="bg-[#13141f]">Bi-weekly</option>
                                <option value="monthly" className="bg-[#13141f]">Monthly</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">End Date</label>
                              <input 
                                type="date" 
                                required={formData.is_recurring}
                                value={formData.recurrence_end_date} 
                                onChange={(e) => setFormData({...formData, recurrence_end_date: e.target.value})} 
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm [color-scheme:dark]" 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Conflicts warnings displaying */}
                    {conflictsInfo.conflicts.length > 0 && (
                      <div className="space-y-3">
                        {conflictsInfo.hasHard && (
                          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl space-y-3">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Hard Conflict Detected</p>
                                <div className="text-xs text-red-300/80 mt-1 space-y-1">
                                  {conflictsInfo.conflicts.filter(c => c.type === 'hard').map((c, idx) => (
                                    <p key={idx}>• {c.message}</p>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2 border-t border-red-500/10">
                              <input 
                                type="checkbox"
                                id="ignoreConflictCheckbox"
                                checked={formData.ignoreConflict || false}
                                onChange={(e) => setFormData({ ...formData, ignoreConflict: e.target.checked })}
                                className="w-4 h-4 rounded border-red-500/30 bg-[#13141f] text-red-500 focus:ring-red-500 focus:ring-offset-[#13141f]"
                              />
                              <label htmlFor="ignoreConflictCheckbox" className="text-xs font-semibold text-red-300 cursor-pointer select-none">
                                Ignore conflict and save anyway
                              </label>
                            </div>
                          </div>
                        )}
                        {conflictsInfo.hasSoft && (
                          <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">Soft Conflict Warning</p>
                              <div className="text-xs text-orange-300/80 mt-1 space-y-1">
                                {conflictsInfo.conflicts.filter(c => c.type === 'soft').map((c, idx) => (
                                  <p key={idx}>• {c.message}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="pt-6 border-t border-white/5 flex gap-3">
                      <button 
                        type="button" 
                        onClick={() => setActiveView(activeView === 'edit' ? 'detail' : 'list')} 
                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="flex-1 py-3 bg-[#ff6b00] hover:bg-[#ff8c33] disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" /> Save
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Recurrence Action Confirmation Dialog */}
      {showRecurrenceModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
          <div className="bg-[#181926] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Recurring Event</h3>
            <p className="text-slate-400 text-sm mb-6">
              This is a recurring event. Do you want to {recurrenceAction === 'edit' ? 'edit' : 'delete'} only this occurrence, or this and all future occurrences?
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleRecurrenceActionConfirm('single')}
                className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Only this event
              </button>
              <button
                type="button"
                onClick={() => handleRecurrenceActionConfirm('future')}
                className="w-full py-2.5 bg-[#ff6b00] hover:bg-[#ff8c33] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                This and future events
              </button>
              <button
                type="button"
                onClick={() => setShowRecurrenceModal(false)}
                className="w-full py-2.5 bg-transparent text-slate-400 hover:text-white rounded-xl text-sm transition-colors mt-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Server Conflict Dialog */}
      {showServerConflictModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
          <div className="bg-[#181926] border border-white/10 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-2 text-red-400 mb-3">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Scheduling Conflict</h3>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              The server detected the following time overlaps:
            </p>
            <div className="text-xs text-red-300 bg-red-500/10 p-3 rounded-xl border border-red-500/20 mb-6 space-y-1 max-h-[150px] overflow-y-auto custom-scrollbar">
              {serverConflicts.map((c, idx) => (
                <p key={idx}>• {c.message}</p>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirmServerConflict}
                className="w-full py-2.5 bg-[#ff6b00] hover:bg-[#ff8c33] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Save anyway
              </button>
              <button
                type="button"
                onClick={() => setShowServerConflictModal(false)}
                className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CalendarPage;
