import { useState, useMemo, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
  parseISO
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Plus, Search, Filter, Settings, 
  MapPin, Clock, Video, Globe, FileText, Check, Trash2, Edit3, X,
  Calendar as CalendarIcon, Briefcase, Zap, Brain, Target, MessageSquare, AlertTriangle, Link, Bell, Download, RefreshCw, LogOut, CheckCircle2, ChevronDown, List as ListIcon, CalendarDays, Maximize2, Share2, Star, GitCommit, CheckSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import DecisionTracker from '../components/calendar/DecisionTracker';
import BulkAcademicAddModal from '../components/calendar/BulkAcademicAddModal';

export function localTimeToUTC(dateStr, timeStr, timezone) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = (timeStr || '00:00').split(':').map(Number);
  
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  
  const getOffsetMinutes = (tz, dateVal) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz || 'UTC',
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
      });
      const parts = formatter.formatToParts(dateVal);
      const map = {};
      parts.forEach(p => map[p.type] = p.value);
      
      const localInUTC = Date.UTC(
        parseInt(map.year),
        parseInt(map.month) - 1,
        parseInt(map.day),
        parseInt(map.hour) === 24 ? 0 : parseInt(map.hour),
        parseInt(map.minute),
        parseInt(map.second)
      );
      return Math.round((localInUTC - dateVal.getTime()) / 60000);
    } catch (err) {
      return 0;
    }
  };

  for (let i = 0; i < 3; i++) {
    const dateVal = new Date(utcMs);
    const offsetMinutes = getOffsetMinutes(timezone, dateVal);
    utcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0) - offsetMinutes * 60000;
  }
  return new Date(utcMs);
}

export function utcToLocalTime(utcDateInput, timezone) {
  const utcDate = new Date(utcDateInput);
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    });
    const parts = formatter.formatToParts(utcDate);
    const map = {};
    parts.forEach(p => map[p.type] = p.value);
    
    const hour = map.hour === '24' ? '00' : map.hour;
    
    return {
      dateStr: `${map.year}-${map.month}-${map.day}`,
      timeStr: `${hour}:${map.minute}`
    };
  } catch (err) {
    console.warn(`Timezone formatting failed for ${timezone}`, err);
    const pad = (n) => String(n).padStart(2, '0');
    return {
      dateStr: `${utcDate.getUTCFullYear()}-${pad(utcDate.getUTCMonth() + 1)}-${pad(utcDate.getUTCDate())}`,
      timeStr: `${pad(utcDate.getUTCHours())}:${pad(utcDate.getUTCMinutes())}`
    };
  }
}

export const computeEventLayout = (dayEvents) => {
  const DEFAULT_DURATIONS = { interview: 60, event: 60, follow_up: 30, deadline: 0, application_deadline: 0, offer_deadline: 0, academic: 60 };
  
  const timedEvents = dayEvents.filter(e => !e.is_all_day && e.localStartTime).map(e => {
    const [sh, sm] = e.localStartTime.split(':').map(Number);
    const startMinutes = sh * 60 + sm;
    
    let eh = sh + 1, em = sm;
    if (e.localEndTime) {
      [eh, em] = e.localEndTime.split(':').map(Number);
    }
    const endMinutes = eh * 60 + em;
    return {
      ...e,
      startMinutes,
      endMinutes: endMinutes > startMinutes ? endMinutes : startMinutes + (DEFAULT_DURATIONS[e.type] || 60)
    };
  });

  timedEvents.sort((a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes);

  const groups = [];
  let currentGroup = [];
  let maxEnd = 0;

  for (const event of timedEvents) {
    if (currentGroup.length === 0 || event.startMinutes < maxEnd) {
      currentGroup.push(event);
      maxEnd = Math.max(maxEnd, event.endMinutes);
    } else {
      groups.push(currentGroup);
      currentGroup = [event];
      maxEnd = event.endMinutes;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  const laidOutEvents = [];
  for (const group of groups) {
    const columns = [];
    for (const event of group) {
      let placed = false;
      for (let i = 0; i < columns.length; i++) {
        const lastEvent = columns[i][columns[i].length - 1];
        if (event.startMinutes >= lastEvent.endMinutes) {
          columns[i].push(event);
          event.columnIndex = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        columns.push([event]);
        event.columnIndex = columns.length - 1;
      }
    }
    for (const event of group) {
      event.totalColumns = columns.length;
      laidOutEvents.push(event);
    }
  }

  return laidOutEvents;
};


const fetchCalendarData = async ({ queryKey }) => {
  const [_, start, end] = queryKey;
  const res = await api.get(`/events?start=${start}&end=${end}`);
  return res.data;
};

const CalendarPage = () => {
  const { user, setUser } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [listFilter, setListFilter] = useState('all');
  const [prepSuggestion, setPrepSuggestion] = useState(null);
  const [suggestPrepBlock, setSuggestPrepBlock] = useState(false);
  const [dismissedDeadlines, setDismissedDeadlines] = useState(() => {
    const saved = localStorage.getItem('dismissedDeadlines');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDeadlineStripExpanded, setIsDeadlineStripExpanded] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [isLoggingReflection, setLoggingReflection] = useState(false);
  const [reflectionData, setReflectionData] = useState({ confidence: 0, note: '', outcome: 'none' });
  const [showBulkAcademicAdd, setShowBulkAcademicAdd] = useState(false);

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
    is_official_drive: false,
    expected_response_date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    reminder_minutes_before: '',
    is_recurring: false,
    recurrence_pattern: 'none',
    recurrence_end_date: '',
    end_date: '',
    ignoreConflict: false,
    timezone: ''
  });

  useEffect(() => {
    if (user?.calendarSettings?.preferredView) {
      setCalendarView(user.calendarSettings.preferredView);
    }
  }, [user]);

  const handleViewChange = async (newView) => {
    setCalendarView(newView);
    try {
      await api.put('/auth/calendar-settings', { preferredView: newView });
      setUser(prev => ({
        ...prev,
        calendarSettings: {
          ...prev.calendarSettings,
          preferredView: newView
        }
      }));
    } catch (err) {
      console.error('Failed to save preferred view settings', err);
    }
  };

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

  useEffect(() => {
    if (formData.type !== 'interview' || !formData.date || !formData.start_time || user?.calendarSettings?.disablePrepSuggestions) {
      setPrepSuggestion(null);
      setSuggestPrepBlock(false);
      return;
    }

    const fetchPrepBlockSuggestion = async () => {
      try {
        const interviewDate = new Date(formData.date);
        const dayBefore = format(addDays(interviewDate, -1), 'yyyy-MM-dd');
        
        // Find free slots for the day before and same day
        const res = await api.get('/events/slots/find', {
          params: {
            dateStart: dayBefore,
            dateEnd: formData.date,
            duration: 60
          }
        });
        
        const slots = res.data;
        if (slots && slots.length > 0) {
          // Prioritize evening before (6 PM - 8 PM, i.e., 18:00 - 20:00)
          const eveningBefore = slots.find(s => {
            const sDate = s.start.split('T')[0];
            if (sDate !== dayBefore) return false;
            const [h] = s.start_time.split(':').map(Number);
            return h >= 18 && h <= 20;
          });

          if (eveningBefore) {
            setPrepSuggestion(eveningBefore);
            setSuggestPrepBlock(true);
            return;
          }

          // Next prioritize any slot the day before
          const anyDayBefore = slots.find(s => s.start.split('T')[0] === dayBefore);
          if (anyDayBefore) {
            setPrepSuggestion(anyDayBefore);
            setSuggestPrepBlock(true);
            return;
          }

          // Next prioritize slot same day earlier than start_time
          const [ih, im] = formData.start_time.split(':').map(Number);
          const interviewMin = ih * 60 + im;
          
          const earlierSameDay = slots.find(s => {
            const sDate = s.start.split('T')[0];
            if (sDate !== formData.date) return false;
            const [sh, sm] = s.start_time.split(':').map(Number);
            const slotMin = sh * 60 + sm;
            return slotMin < interviewMin;
          });

          if (earlierSameDay) {
            setPrepSuggestion(earlierSameDay);
            setSuggestPrepBlock(true);
            return;
          }
        }
        setPrepSuggestion(null);
        setSuggestPrepBlock(false);
      } catch (err) {
        console.error('Failed to fetch prep suggestion', err);
        setPrepSuggestion(null);
        setSuggestPrepBlock(false);
      }
    };

    fetchPrepBlockSuggestion();
  }, [formData.type, formData.date, formData.start_time, user]);


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

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const hours = useMemo(() => Array.from({ length: 16 }, (_, i) => 7 + i), []);

  // Fetch events for the visible month grid
  const { data: events = [], isLoading, isError } = useQuery({
    queryKey: ['events', startDateStr, endDateStr],
    queryFn: fetchCalendarData
  });

  // Process events into display timezone
  const processedEvents = useMemo(() => {
    const userTimezone = user?.calendarSettings?.timezone || 'Asia/Kolkata';
    return events.map(event => {
      if (event.is_all_day) {
        const startUtc = new Date(event.date);
        const startLocalDateStr = `${startUtc.getUTCFullYear()}-${String(startUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(startUtc.getUTCDate()).padStart(2, '0')}`;
        let endLocalDateStr = '';
        if (event.end_date) {
          const endUtc = new Date(event.end_date);
          endLocalDateStr = `${endUtc.getUTCFullYear()}-${String(endUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(endUtc.getUTCDate()).padStart(2, '0')}`;
        }
        return {
          ...event,
          localDateStr: startLocalDateStr,
          localEndDateStr: endLocalDateStr,
          localStartTime: '',
          localEndTime: ''
        };
      }

      const startUtc = new Date(event.date);
      const startUtcDateStr = `${startUtc.getUTCFullYear()}-${String(startUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(startUtc.getUTCDate()).padStart(2, '0')}`;
      const [sy, sm, sd] = startUtcDateStr.split('-').map(Number);
      const [sh, smin] = (event.start_time || '00:00').split(':').map(Number);
      const eventStartUTCDate = new Date(Date.UTC(sy, sm - 1, sd, sh, smin));

      const startLocal = utcToLocalTime(eventStartUTCDate, userTimezone);

      let endLocal = { dateStr: startLocal.dateStr, timeStr: '' };
      if (event.end_time) {
        const [eh, emin] = event.end_time.split(':').map(Number);
        let eventEndUTCDate;
        if (eh < sh || (eh === sh && emin < smin)) {
          eventEndUTCDate = new Date(Date.UTC(sy, sm - 1, sd + 1, eh, emin));
        } else {
          eventEndUTCDate = new Date(Date.UTC(sy, sm - 1, sd, eh, emin));
        }
        endLocal = utcToLocalTime(eventEndUTCDate, userTimezone);
      }

      return {
        ...event,
        localDateStr: startLocal.dateStr,
        localEndDateStr: endLocal.dateStr,
        localStartTime: startLocal.timeStr,
        localEndTime: endLocal.timeStr
      };
    });
  }, [events, user]);

  // Helper: check if event falls on a specific day (handles multi-day ranges)
  const isEventOnDay = (event, day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    if (event.localEndDateStr && event.localEndDateStr !== event.localDateStr) {
      return dayStr >= event.localDateStr && dayStr <= event.localEndDateStr;
    }
    return dayStr === event.localDateStr;
  };

  // Helper: Sort events consistently to align multi-day spans
  const sortEvents = (a, b) => {
    if (a.is_all_day && !b.is_all_day) return -1;
    if (!a.is_all_day && b.is_all_day) return 1;
    
    const aDuration = a.localEndDateStr ? (new Date(a.localEndDateStr) - new Date(a.localDateStr)) : 0;
    const bDuration = b.localEndDateStr ? (new Date(b.localEndDateStr) - new Date(b.localDateStr)) : 0;
    if (aDuration !== bDuration) {
      return bDuration - aDuration; // Longer durations first
    }
    
    if (a.localStartTime && b.localStartTime) {
      return a.localStartTime.localeCompare(b.localStartTime);
    }
    if (a.localStartTime) return 1;
    if (b.localStartTime) return -1;
    
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

  const getConvertedDisplayTime = () => {
    if (!formData.date || !formData.start_time || !formData.timezone || !user?.calendarSettings?.timezone) return '';
    try {
      const utcDate = localTimeToUTC(formData.date, formData.start_time, formData.timezone);
      const userLocal = utcToLocalTime(utcDate, user.calendarSettings.timezone);
      return userLocal.timeStr;
    } catch (err) {
      return '';
    }
  };

  const getPrepSuggestionLabel = () => {
    if (!prepSuggestion) return '';
    try {
      const d = new Date(prepSuggestion.start.split('T')[0] + 'T00:00:00');
      return `${format(d, 'MMM d')}, ${prepSuggestion.start_time} - ${prepSuggestion.end_time}`;
    } catch (err) {
      return '';
    }
  };

  // Helper: Generate textual label for days of a multi-day span
  const getMultiDaySpanText = (event, day) => {
    if (!event.localEndDateStr) return '';
    const start = new Date(event.localDateStr);
    const end = new Date(event.localEndDateStr);
    const current = new Date(day);
    
    const totalDays = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const currentDay = Math.round((current - start) / (1000 * 60 * 60 * 24)) + 1;
    
    const label = event.type === 'application_deadline' ? 'Application Window' : 'Program Duration';
    return `Day ${currentDay} of ${totalDays} — ${label}`;
  };

  // Helper: Client-side conflict detection
  const checkConflictsClient = (formValues, allEvents, currentEventId) => {
    if (formValues.is_all_day) return { hasHard: false, hasSoft: false, conflicts: [] };
    if (!formValues.date || !formValues.start_time) return { hasHard: false, hasSoft: false, conflicts: [] };

    const userTimezone = user?.calendarSettings?.timezone || 'Asia/Kolkata';
    const startD = localTimeToUTC(formValues.date, formValues.start_time, userTimezone);

    const DEFAULT_DURATIONS = { interview: 60, event: 60, follow_up: 30, deadline: 0, application_deadline: 0, offer_deadline: 0, academic: 60 };
    const duration = formValues.end_time ? 0 : (DEFAULT_DURATIONS[formValues.type] || 60);
    
    const endD = new Date(startD.getTime());
    if (formValues.end_time) {
      const endDLocal = localTimeToUTC(formValues.date, formValues.end_time, userTimezone);
      endD.setTime(endDLocal.getTime());
    } else {
      endD.setMinutes(endD.getMinutes() + duration);
    }

    const conflicts = [];

    for (const event of allEvents) {
      if (String(event._id) === String(currentEventId)) continue;
      if (event.status === 'cancelled') continue;
      if (event.is_all_day) continue;

      const startUtc = new Date(event.date);
      const startUtcDateStr = `${startUtc.getUTCFullYear()}-${String(startUtc.getUTCMonth() + 1).padStart(2, '0')}-${String(startUtc.getUTCDate()).padStart(2, '0')}`;
      const [sy, sm, sd] = startUtcDateStr.split('-').map(Number);
      const [sh, smin] = (event.start_time || '00:00').split(':').map(Number);
      const evStart = new Date(Date.UTC(sy, sm - 1, sd, sh, smin));

      let evEnd = new Date(evStart.getTime());
      if (event.end_time) {
        const [eh, emin] = event.end_time.split(':').map(Number);
        if (eh < sh || (eh === sh && emin < smin)) {
          evEnd = new Date(Date.UTC(sy, sm - 1, sd + 1, eh, emin));
        } else {
          evEnd = new Date(Date.UTC(sy, sm - 1, sd, eh, emin));
        }
      } else {
        const evDuration = DEFAULT_DURATIONS[event.type] || 60;
        evEnd.setMinutes(evEnd.getMinutes() + evDuration);
      }

      if (startD < evEnd && evStart < endD) {
        const evLocal = utcToLocalTime(evStart, userTimezone);
        conflicts.push({
          type: 'hard',
          title: event.title,
          message: `Time overlap with "${event.title}" (${evLocal.timeStr})`
        });
        continue;
      }

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
    return checkConflictsClient(formData, processedEvents, selectedEvent?._id);
  }, [formData, processedEvents, selectedEvent]);

  // Next 7 Days Strip selector
  const next7DaysEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = addDays(today, 7);
    sevenDaysFromNow.setHours(23, 59, 59, 999);

    return processedEvents.filter(event => {
      const eventDate = new Date(event.localDateStr);
      return eventDate >= today && eventDate <= sevenDaysFromNow;
    }).sort((a, b) => new Date(a.localDateStr) - new Date(b.localDateStr));
  }, [processedEvents]);

  // Upcoming Deadlines (14 days)
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const fourteenDays = addDays(today, 14);
    fourteenDays.setHours(23, 59, 59, 999);
    
    return processedEvents.filter(ev => {
      if (!['deadline', 'application_deadline', 'offer_deadline'].includes(ev.type)) return false;
      if (dismissedDeadlines.includes(ev._id)) return false;
      if (ev.status === 'completed' || ev.status === 'cancelled') return false;
      const d = new Date(ev.localDateStr);
      return d >= today && d <= fourteenDays;
    }).sort((a, b) => new Date(a.localDateStr) - new Date(b.localDateStr));
  }, [processedEvents, dismissedDeadlines]);

  const handleDismissDeadline = (e, id) => {
    e.stopPropagation();
    const updated = [...dismissedDeadlines, id];
    setDismissedDeadlines(updated);
    localStorage.setItem('dismissedDeadlines', JSON.stringify(updated));
  };

  // Pipeline View Groups
  const pipelineGroups = useMemo(() => {
    const groups = {};

    processedEvents.forEach(ev => {
      if (ev.status === 'cancelled') return;
      const company = ev.company_name || 'Other';
      if (!groups[company]) {
        groups[company] = { company, events: [], nextAction: null, currentStage: 'Applied' };
      }
      groups[company].events.push(ev);
    });

    Object.values(groups).forEach(g => {
      g.events.sort((a, b) => new Date(a.date) - new Date(b.date));
      // Determine nextAction and currentStage
      const futureEvents = g.events.filter(e => new Date(e.date) >= new Date() && e.status !== 'completed');
      if (futureEvents.length > 0) {
        g.nextAction = futureEvents[0];
      }
      const pastEvents = g.events.filter(e => e.status === 'completed' || new Date(e.date) < new Date());
      if (pastEvents.length > 0) {
        const last = pastEvents[pastEvents.length - 1];
        g.currentStage = last.type === 'interview' ? 'Awaiting Response' : last.type;
      }
    });

    return Object.values(groups).sort((a, b) => {
      if (a.nextAction && !b.nextAction) return -1;
      if (!a.nextAction && b.nextAction) return 1;
      if (a.nextAction && b.nextAction) return new Date(a.nextAction.date) - new Date(b.nextAction.date);
      return 0;
    });
  }, [processedEvents]);

  // Heat Map / Density Data
  const densityData = useMemo(() => {
    const data = {};
    const DEFAULT_DURATIONS = { interview: 60, event: 60, follow_up: 30, deadline: 0, application_deadline: 0, offer_deadline: 0 };
    processedEvents.forEach(event => {
      if (event.status === 'cancelled') return;
      let duration = 0;
      if (!event.is_all_day && event.localStartTime) {
        const [sh, sm] = event.localStartTime.split(':').map(Number);
        let eh = sh, em = sm;
        if (event.localEndTime) {
          [eh, em] = event.localEndTime.split(':').map(Number);
        } else {
          const d = DEFAULT_DURATIONS[event.type] || 60;
          em += d;
        }
        duration = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
        if (duration < 0) duration += 24;
      }
      
      const dateStr = event.localDateStr;
      if (!data[dateStr]) data[dateStr] = { hours: 0, interviews: 0, totalEvents: 0 };
      data[dateStr].hours += duration;
      data[dateStr].totalEvents += 1;
      if (event.type === 'interview') data[dateStr].interviews += 1;
    });
    return data;
  }, [processedEvents]);

  // Mutations
  const { data: eventRoundsData, isLoading: isLoadingRounds } = useQuery({
    queryKey: ['eventRounds', selectedEvent?._id],
    queryFn: async () => {
      const res = await api.get(`/events/${selectedEvent._id}/rounds`);
      return res.data;
    },
    enabled: !!selectedEvent && activeView === 'detail',
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => await api.post('/events', data),
    onSuccess: async (res) => {
      if (res.data?.hasConflict) {
        setServerConflicts(res.data.conflicts);
        setShowServerConflictModal(true);
      } else {
        queryClient.invalidateQueries(['events']);
        
        // Auto prep block creation
        if (suggestPrepBlock && prepSuggestion && res.data?._id) {
          try {
            const prepEventData = {
              title: `Prep: ${formData.title}`,
              type: 'event',
              date: prepSuggestion.start.split('T')[0],
              start_time: prepSuggestion.start_time,
              end_time: prepSuggestion.end_time,
              is_all_day: false,
              description: `Preparation time for interview "${formData.title}"`,
              source: 'interview',
              source_ref_id: res.data._id,
              timezone: formData.timezone || user?.calendarSettings?.timezone || 'Asia/Kolkata'
            };
            await api.post('/events', prepEventData);
            toast.success('Prep block scheduled successfully!');
          } catch (err) {
            console.error('Failed to create prep block', err);
          }
        }

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
    mutationFn: async ({ action, activeEvent, isSeries }) => {
      if (action === 'delete') {
        await api.delete(`/events/${activeEvent._id}${isSeries ? '?recurrenceEditMode=future' : ''}`);
      } else if (action === 'status') {
        const newStatus = activeEvent.status === 'completed' ? 'upcoming' : 'completed';
        await api.put(`/events/${activeEvent._id}`, { status: newStatus, recurrenceEditMode: isSeries ? 'future' : 'single' });
      }
      queryClient.invalidateQueries(['events']);
      setIsPanelOpen(false);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to remove event';
      toast.error(msg);
    }
  });

  // Navigation handlers
  const handleNext = () => {
    if (calendarView === 'month' || calendarView === 'list') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (calendarView === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else if (calendarView === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handlePrev = () => {
    if (calendarView === 'month' || calendarView === 'list') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (calendarView === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else if (calendarView === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const jumpToToday = () => setCurrentDate(new Date());

  const getHeaderTitle = () => {
    if (calendarView === 'month' || calendarView === 'list') {
      return format(currentDate, 'MMMM yyyy');
    } else if (calendarView === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else if (calendarView === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (calendarView === 'pipeline') {
      return 'Event Pipeline';
    }
    return '';
  };

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
      ignoreConflict: false,
      timezone: user?.calendarSettings?.timezone || 'Asia/Kolkata'
    });
    setPrepSuggestion(null);
    setSuggestPrepBlock(false);
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
      date: event.localDateStr,
      is_all_day: event.is_all_day,
      is_official_drive: event.is_official_drive || false,
      expected_response_date: event.expected_response_date ? format(new Date(event.expected_response_date), 'yyyy-MM-dd') : '',
      start_time: event.localStartTime || '09:00',
      end_time: event.localEndTime || '10:00',
      location: event.location || '',
      description: event.description || '',
      reminder_minutes_before: event.reminder_minutes_before !== null ? String(event.reminder_minutes_before) : '',
      is_recurring: event.is_recurring,
      recurrence_pattern: event.recurrence_pattern || 'none',
      recurrence_end_date: event.recurrence_end_date ? format(new Date(event.recurrence_end_date), 'yyyy-MM-dd') : '',
      end_date: event.localEndDateStr || '',
      ignoreConflict: false,
      timezone: event.timezone || user?.calendarSettings?.timezone || 'Asia/Kolkata'
    });
    setPrepSuggestion(null);
    setSuggestPrepBlock(false);
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

    if (submitData.type !== 'interview') {
      submitData.expected_response_date = null;
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

  // Today's Mission Control
  const eventsToday = useMemo(() => {
    const today = new Date();
    return events.filter(e => isEventOnDay(e, today) && e.status !== 'completed').sort(sortEvents);
  }, [events]);

  const incompleteLogisticsCount = useMemo(() => {
    return eventsToday.reduce((acc, event) => {
      if (event.type === 'interview' && event.logistics) {
        const unchecked = Object.values(event.logistics).filter(v => v === false).length;
        return acc + unchecked;
      }
      return acc;
    }, 0);
  }, [eventsToday]);

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
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-white mb-1 flex items-center gap-2">
            <CalendarIcon className="text-[#00f0ff] w-8 h-8" />
            Calendar Hub
          </h1>
          <p className="text-[14px] text-slate-400">Manage interviews, deadlines, offers, and schedule custom reminders.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
            {['month', 'week', 'day', 'list', 'pipeline'].map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`px-3 py-1 text-xs font-semibold capitalize rounded-lg transition-all ${
                  calendarView === view 
                    ? 'bg-[#00f0ff] text-[#13141f] shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <button 
            onClick={jumpToToday} 
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
          >
            Today
          </button>
          
          <button
            onClick={() => setShowBulkAcademicAdd(true)}
            className="px-4 py-2 text-xs font-semibold bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20 border border-[#00f0ff]/30 rounded-xl transition-all flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5" /> Smart Paste
          </button>

          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
            <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-1.5 text-sm font-semibold text-white min-w-[120px] text-center">
              {getHeaderTitle()}
            </span>
            <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Morning Agenda / Mission Control */}
      {eventsToday.length > 0 && (
        <section className="mb-6 bg-gradient-to-r from-[#00f0ff]/20 to-[#00f0ff]/5 border border-[#00f0ff]/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
          <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#00f0ff]/20 p-3 rounded-xl border border-[#00f0ff]/40">
                <Target className="w-6 h-6 text-[#00f0ff]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1">Today's Mission Control</h2>
                <p className="text-sm text-[#00f0ff]/80">
                  You have <strong className="text-white">{eventsToday.length}</strong> action item{eventsToday.length !== 1 ? 's' : ''} scheduled for today.
                  {incompleteLogisticsCount > 0 && (
                    <span className="ml-2 text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      {incompleteLogisticsCount} checklist item{incompleteLogisticsCount !== 1 ? 's' : ''} still pending!
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                jumpToToday();
                if (calendarView !== 'day') handleViewChange('day');
              }}
              className="px-5 py-2 bg-[#00f0ff] hover:bg-[#00d0e0] text-[#13141f] font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Focus Today
            </button>
          </div>
        </section>
      )}

      {/* Deadline Countdown Strip */}
      {upcomingDeadlines.length > 0 && (
        <section className="mb-6 bg-white/5 border border-red-500/20 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xs font-bold text-red-400 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Upcoming Deadlines
            </h2>
            <button 
              onClick={() => setIsDeadlineStripExpanded(!isDeadlineStripExpanded)}
              className="text-slate-400 hover:text-white text-xs font-semibold"
            >
              {isDeadlineStripExpanded ? 'Collapse' : `Expand (${upcomingDeadlines.length})`}
            </button>
          </div>
          
          <AnimatePresence>
            {isDeadlineStripExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar pt-1">
                  {upcomingDeadlines.map(event => {
                    const eventDate = new Date(event.localDateStr);
                    const now = new Date();
                    const hoursLeft = (eventDate - now) / (1000 * 60 * 60);
                    const urgencyClass = hoursLeft < 48 ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30';
                    const iconClass = hoursLeft < 48 ? 'text-red-400' : 'text-amber-400';

                    return (
                      <div 
                        key={event._id}
                        onClick={(e) => handleEventClick(event, e)}
                        className={`flex-shrink-0 min-w-[240px] max-w-[280px] p-3 border rounded-xl cursor-pointer hover:brightness-110 transition-all ${urgencyClass}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold uppercase ${iconClass}`}>
                            {hoursLeft < 24 ? 'Ends Today/Tomorrow' : `In ${Math.ceil(hoursLeft / 24)} Days`}
                          </span>
                          <button 
                            onClick={(e) => handleDismissDeadline(e, event._id)}
                            className="text-slate-500 hover:text-white p-0.5 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-white line-clamp-1">{event.title}</h4>
                        <div className="mt-1 text-xs text-slate-400 font-medium">
                          {format(eventDate, 'MMM d, yyyy')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

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
                      {format(new Date(event.localDateStr), 'EEE, MMM d')}
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

      {/* Time Commitment Density Strip */}
      <section className="mb-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" /> Time Commitment Density (Visible Range)
        </h2>
        <div className="flex bg-[#13141f] border border-white/5 rounded-2xl p-3 gap-1.5 overflow-x-auto custom-scrollbar">
          {gridCells.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const stats = densityData[dateStr] || { hours: 0, interviews: 0 };
            
            let colorClass = 'bg-white/5 text-slate-500'; // low/no load
            let dotClass = 'hidden';
            if (stats.interviews >= 3 || stats.hours >= 4) {
              colorClass = 'bg-red-500/20 border border-red-500/30 text-red-300';
              dotClass = 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]';
            } else if (stats.interviews >= 2 || stats.hours >= 2) {
              colorClass = 'bg-amber-500/20 border border-amber-500/30 text-amber-300';
              dotClass = 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]';
            } else if (stats.hours > 0 || stats.interviews > 0) {
              colorClass = 'bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff]';
              dotClass = 'bg-[#00f0ff]';
            }

            return (
              <div 
                key={dateStr}
                onClick={() => handleDateClick(day)}
                className={`flex-shrink-0 w-[42px] h-[52px] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:brightness-125 transition-all relative ${colorClass}`}
                title={`${format(day, 'MMM d')}: ${stats.interviews} Interviews, ${Math.round(stats.hours)}h total`}
              >
                <span className="text-[10px] font-bold opacity-80 mb-0.5">{format(day, 'EEE')}</span>
                <span className="text-[13px] font-extrabold">{format(day, 'd')}</span>
                {stats.hours > 0 && (
                  <span className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-[#13141f] ${dotClass}`} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Views Container */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#0b0c15] border border-white/5 rounded-2xl overflow-hidden">
        
        {/* MONTH VIEW */}
        {calendarView === 'month' && (
          <div className="flex flex-col flex-1">
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
                  const dayEvents = processedEvents.filter(e => isEventOnDay(e, day)).sort(sortEvents);
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
                          const isMultiDay = event.localEndDateStr && event.localEndDateStr !== event.localDateStr;
                          
                          let roundedClass = 'rounded';
                          let marginClass = '';
                          let borderClass = 'border';
                          let prefix = null;
                          let suffix = null;
                          let showText = true;

                          if (isMultiDay) {
                            const isStart = isSameDay(new Date(event.localDateStr + 'T00:00:00'), day);
                            const isEnd = isSameDay(new Date(event.localEndDateStr + 'T00:00:00'), day);
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
                              className={`text-[10px] px-1.5 py-0.5 truncate flex items-center justify-between cursor-pointer ${roundedClass} ${borderClass} ${marginClass} ${colors.chip} ${
                                event.pendingSync ? 'border-dashed border-white/30' : ''
                              }`}
                              title={`${event.title} ${event.localEndDateStr ? `(${format(new Date(event.localDateStr + 'T00:00:00'), 'MMM d')} - ${format(new Date(event.localEndDateStr + 'T00:00:00'), 'MMM d')})` : ''}`}
                            >
                              <div className="flex items-center truncate flex-1 font-medium">
                                {hasPrepWarning && (
                                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 mr-1.5 animate-pulse" title="No prep logged yet" />
                                )}
                                {prefix}
                                <span className="truncate">
                                  {showText ? event.title : '\u00A0'}
                                </span>
                                {showText && event.is_official_drive && <Star className="w-2 h-2 inline-block ml-1 text-white shrink-0" />}
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
        )}

        {/* WEEK VIEW */}
        {calendarView === 'week' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            {/* Week Sticky Day Headers */}
            <div className="grid grid-cols-7 border-b border-white/5 bg-[#13141f]/95 sticky top-0 z-20 shrink-0 pl-16">
              {weekDays.map((day, dayIdx) => {
                const isToday = isSameDay(day, new Date());
                const allDayForDay = processedEvents.filter(e => isEventOnDay(e, day) && (e.is_all_day || (e.localEndDateStr && e.localEndDateStr !== e.localDateStr)));
                return (
                  <div key={dayIdx} className="text-center py-2 border-r border-white/5 flex flex-col items-center min-h-[70px]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{format(day, 'EEE')}</span>
                    <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full mt-1 ${
                      isToday ? 'bg-[#00f0ff] text-[#13141f]' : 'text-slate-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    
                    {/* Week All-Day chips */}
                    <div className="w-full px-1 mt-1.5 space-y-1">
                      {allDayForDay.map(event => {
                        const colors = getEventColors(event.type, event.status);
                        return (
                          <div
                            key={event._id}
                            onClick={(e) => handleEventClick(event, e)}
                            className={`text-[8px] px-1 py-0.5 rounded truncate font-bold text-center cursor-pointer border ${colors.chip}`}
                          >
                            <span className="truncate">{event.title}</span>
                            {event.is_official_drive && <Star className="w-2 h-2 inline-block ml-0.5 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hourly Grid Rows */}
            <div className="flex flex-1 relative bg-[#13141f] min-h-[980px]">
              {/* Hour Labels */}
              <div className="w-16 flex-shrink-0 border-r border-white/5 bg-[#13141f]/80 sticky left-0 z-10 select-none">
                <div className="h-[20px]" />
                {hours.map(hour => (
                  <div key={hour} className="h-[60px] text-[10px] font-bold text-slate-500 text-right pr-3 flex items-center justify-end">
                    {hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}
                  </div>
                ))}
              </div>

              {/* Grid Cells Columns */}
              <div className="flex-1 grid grid-cols-7 relative">
                {/* Horizontal Dividers */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-[20px]" />
                  {hours.map((_, idx) => (
                    <div key={idx} className="h-[60px] border-b border-white/5 w-full" />
                  ))}
                </div>

                {/* Day Columns */}
                {weekDays.map((day, dayIdx) => {
                  const dayEvents = processedEvents.filter(e => isEventOnDay(e, day));
                  const timedEvents = computeEventLayout(dayEvents);
                  return (
                    <div key={dayIdx} className="border-r border-white/5 relative h-full min-h-[980px]">
                      <div className="absolute inset-0 top-[20px] bottom-0 left-0.5 right-0.5">
                        {timedEvents.map(event => {
                          const colors = getEventColors(event.type, event.status);
                          const startM = event.startMinutes;
                          const endM = event.endMinutes;
                          const top = Math.max(0, startM - 420); // offset 7 AM
                          const height = Math.max(25, endM - startM);
                          
                          const left = event.columnIndex * (100 / event.totalColumns);
                          const width = (100 / event.totalColumns) - 1;

                          const hasPrepWarning = isUpcomingInterviewWithoutPrep(event);

                          return (
                            <div
                              key={event._id}
                              onClick={(e) => handleEventClick(event, e)}
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                left: `${left}%`,
                                width: `${width}%`
                              }}
                              className={`absolute p-1.5 rounded-lg border text-[9px] leading-tight cursor-pointer overflow-hidden transition-all hover:brightness-110 flex flex-col justify-between ${colors.chip} ${
                                event.pendingSync ? 'border-dashed border-white/30' : ''
                              }`}
                            >
                              <div className="w-full overflow-hidden">
                                <div className="font-bold truncate text-white mb-0.5 flex items-center gap-1">
                                  {event.title}
                                  {event.is_official_drive && <Star className="w-2 h-2 shrink-0 text-white" />}
                                </div>
                                <div className="opacity-80 truncate text-[8px]">{event.localStartTime} - {event.localEndTime}</div>
                              </div>
                              {hasPrepWarning && (
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 mr-1.5 animate-pulse self-end" title="No prep logged yet" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* DAY VIEW */}
        {calendarView === 'day' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            {/* Day Header */}
            <div className="border-b border-white/5 bg-[#13141f]/95 p-4 sticky top-0 z-20 shrink-0 flex flex-col items-center">
              <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">{format(currentDate, 'EEEE')}</span>
              <span className="text-xl font-bold text-white mt-1">{format(currentDate, 'MMMM d, yyyy')}</span>
              
              {/* Day All-Day chips */}
              <div className="w-full max-w-md mt-3 space-y-1">
                {processedEvents.filter(e => isEventOnDay(e, currentDate) && (e.is_all_day || (e.localEndDateStr && e.localEndDateStr !== e.localDateStr))).map(event => {
                  const colors = getEventColors(event.type, event.status);
                  return (
                    <div
                      key={event._id}
                      onClick={(e) => handleEventClick(event, e)}
                      className={`text-xs px-3 py-1.5 rounded-xl border text-center font-semibold cursor-pointer ${colors.chip}`}
                    >
                      {event.title} (All Day)
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hourly Grid Rows */}
            <div className="flex flex-1 relative bg-[#13141f] min-h-[980px]">
              {/* Hour Labels */}
              <div className="w-20 flex-shrink-0 border-r border-white/5 bg-[#13141f]/80 sticky left-0 z-10 select-none">
                <div className="h-[20px]" />
                {hours.map(hour => (
                  <div key={hour} className="h-[60px] text-xs font-bold text-slate-500 text-right pr-4 flex items-center justify-end">
                    {hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}
                  </div>
                ))}
              </div>

              {/* Grid Column */}
              <div className="flex-1 relative">
                {/* Horizontal Dividers */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-[20px]" />
                  {hours.map((_, idx) => (
                    <div key={idx} className="h-[60px] border-b border-white/5 w-full" />
                  ))}
                </div>

                {/* Event Column */}
                <div className="absolute inset-0 top-[20px] bottom-0 left-2 right-4">
                  {computeEventLayout(processedEvents.filter(e => isEventOnDay(e, currentDate))).map(event => {
                    const colors = getEventColors(event.type, event.status);
                    const startM = event.startMinutes;
                    const endM = event.endMinutes;
                    const top = Math.max(0, startM - 420); // offset 7 AM
                    const height = Math.max(40, endM - startM);
                    
                    const left = event.columnIndex * (100 / event.totalColumns);
                    const width = (100 / event.totalColumns) - 2;

                    const hasPrepWarning = isUpcomingInterviewWithoutPrep(event);

                    return (
                      <div
                        key={event._id}
                        onClick={(e) => handleEventClick(event, e)}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          left: `${left}%`,
                          width: `${width}%`
                        }}
                        className={`absolute p-3 rounded-xl border text-xs leading-tight cursor-pointer overflow-hidden transition-all hover:brightness-110 flex flex-col justify-between ${colors.chip} ${
                          event.pendingSync ? 'border-dashed border-white/30' : ''
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                              {event.title}
                              {event.is_official_drive && <Star className="w-3 h-3 shrink-0 text-white" />}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${colors.badge}`}>
                              {event.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="opacity-80 text-xs">{event.localStartTime} - {event.localEndTime}</div>
                          {event.location && (
                            <div className="opacity-60 text-[10px] mt-1.5 truncate">📍 {event.location}</div>
                          )}
                        </div>

                        {hasPrepWarning && (
                          <div className="mt-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-center gap-2 self-start">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="text-[10px] text-amber-300 font-bold">No preparation notes logged yet!</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIST / AGENDA VIEW */}
        {calendarView === 'list' && (
          <div className="flex flex-col flex-1 p-6 overflow-y-auto">
            {/* Filter controls */}
            <div className="flex gap-2 mb-6 border-b border-white/5 pb-4 justify-between items-center">
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All Events' },
                  { value: 'interview', label: 'Interviews Only' },
                  { value: 'deadline', label: 'Deadlines Only' }
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setListFilter(f.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                      listFilter === f.value
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-inner'
                        : 'text-slate-400 hover:text-white border-transparent bg-white/5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              
              {selectedEvents.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-white/10 px-2 py-1 rounded">
                    {selectedEvents.length} selected
                  </span>
                  <button 
                    onClick={() => setSelectedEvents([])}
                    className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* List group */}
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl" />)}
              </div>
            ) : Object.keys(
              processedEvents.filter(e => {
                if (listFilter === 'interview') return e.type === 'interview';
                if (listFilter === 'deadline') return ['deadline', 'application_deadline', 'offer_deadline'].includes(e.type);
                return true;
              }).reduce((acc, curr) => {
                if (!acc[curr.localDateStr]) acc[curr.localDateStr] = [];
                acc[curr.localDateStr].push(curr);
                return acc;
              }, {})
            ).length === 0 ? (
              <div className="text-center py-20 bg-white/5 border border-white/5 border-dashed rounded-2xl">
                <p className="text-sm text-slate-500">No events found matching current criteria.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(
                  processedEvents.filter(e => {
                    if (listFilter === 'interview') return e.type === 'interview';
                    if (listFilter === 'deadline') return ['deadline', 'application_deadline', 'offer_deadline'].includes(e.type);
                    return true;
                  }).reduce((acc, curr) => {
                    if (!acc[curr.localDateStr]) acc[curr.localDateStr] = [];
                    acc[curr.localDateStr].push(curr);
                    return acc;
                  }, {})
                ).sort((a,b) => a[0].localeCompare(b[0])).map(([dateKey, dayEvs]) => (
                  <div key={dateKey} className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-l-2 border-[#00f0ff] pl-2.5">
                      {format(new Date(dateKey + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <div className="space-y-2 pl-3">
                      {dayEvs.sort(sortEvents).map(event => {
                        const colors = getEventColors(event.type, event.status);
                        const hasPrepWarning = isUpcomingInterviewWithoutPrep(event);
                        return (
                          <div
                            key={event._id}
                            onClick={(e) => handleEventClick(event, e)}
                            className="p-4 rounded-xl border border-white/5 bg-[#181926]/50 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-start gap-4">
                                <input 
                                  type="checkbox" 
                                  className="mt-1 w-4 h-4 rounded border-white/20 bg-black/20 accent-[#00f0ff] cursor-pointer"
                                  checked={selectedEvents.includes(event._id)}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (e.target.checked) {
                                      setSelectedEvents(prev => [...prev, event._id]);
                                    } else {
                                      setSelectedEvents(prev => prev.filter(id => id !== event._id));
                                    }
                                  }}
                                />
                                <div>
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className={`w-2.5 h-2.5 rounded-full ${colors.indicator}`} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider capitalize">
                                      {event.type.replace('_', ' ')}
                                    </span>
                                    {event.is_official_drive && (
                                      <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30 text-[9px] flex items-center gap-1 font-bold">
                                        <Star className="w-2.5 h-2.5" /> Official
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white mb-0.5">{event.title}</h4>
                                  <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                                    {event.is_all_day ? 'All Day' : `${event.localStartTime} - ${event.localEndTime || 'None'}`}
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-600" />
                            </div>

                            {hasPrepWarning && (
                              <div className="mt-1 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="text-xs text-amber-300 font-medium">No prep logged yet</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PIPELINE VIEW */}
            {calendarView === 'pipeline' && (
              <div className="flex-1 overflow-y-auto p-6 bg-[#0b0c15]">
                <div className="max-w-4xl mx-auto space-y-12">
                  {pipelineGroups.map(group => {
                    return (
                      <div key={group.company} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#13141f]">
                          <div>
                            <h3 className="text-lg font-bold text-white">{group.company}</h3>
                            <p className="text-xs text-[#00f0ff] uppercase tracking-wider font-bold mt-0.5">{group.currentStage.replace('_', ' ')}</p>
                          </div>
                          <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-bold text-slate-300">
                            {group.events.length} items
                          </span>
                        </div>
                        
                        <div className="p-4 bg-[#0b0c15]">
                          <div className="space-y-2">
                            {group.events.map(event => {
                              const colors = getEventColors(event.type, event.status);
                              const isNextAction = group.nextAction?._id === event._id;
                              return (
                                <div
                                  key={event._id}
                                  onClick={(e) => handleEventClick(event, e)}
                                  className={`p-3 rounded-lg border ${isNextAction ? 'border-[#00f0ff]/50 bg-[#00f0ff]/5' : 'border-white/5 bg-[#13141f]'} hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between gap-4`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${colors.indicator}`} />
                                    <div>
                                      <h4 className="text-sm font-bold text-white">{event.title}</h4>
                                      <p className="text-xs text-slate-400 mt-0.5">
                                        {format(new Date(event.date), 'MMM d, yyyy')} • {event.is_all_day ? 'All Day' : event.start_time}
                                      </p>
                                    </div>
                                  </div>
                                  {event.status === 'completed' && (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                  )}
                                  {isNextAction && (
                                    <span className="text-[10px] bg-[#00f0ff]/20 text-[#00f0ff] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                                      Next Up
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Floating Action Bar */}
            <AnimatePresence>
              {selectedEvents.length > 0 && (
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1a1b26] border border-white/10 rounded-full px-6 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-4 z-[60]"
                >
                  <span className="text-sm font-bold text-white bg-white/10 px-2.5 py-1 rounded-full">
                    {selectedEvents.length} selected
                  </span>
                  <div className="w-px h-5 bg-white/10" />
                  <button 
                    onClick={handleBatchComplete}
                    className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors whitespace-nowrap"
                  >
                    Mark Completed
                  </button>
                  <button 
                    onClick={handleBatchDelete}
                    className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors whitespace-nowrap"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => setSelectedEvents([])}
                    className="text-sm font-medium text-slate-400 hover:text-white transition-colors ml-2"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
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
                
                {/* Density Warning in Day List View */}
                {activeView === 'list' && selectedDate && densityData[format(selectedDate, 'yyyy-MM-dd')] && (
                  (densityData[format(selectedDate, 'yyyy-MM-dd')].interviews >= 3 || densityData[format(selectedDate, 'yyyy-MM-dd')].hours >= 4) && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-red-400">High Load Warning</h4>
                        <p className="text-xs text-red-300 mt-1 leading-relaxed">
                          You have <strong>{densityData[format(selectedDate, 'yyyy-MM-dd')].interviews} interviews</strong> and approximately <strong>{Math.round(densityData[format(selectedDate, 'yyyy-MM-dd')].hours)} hours</strong> of commitments. Please ensure you have adequate preparation time.
                        </p>
                      </div>
                    </div>
                  )
                )}

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
                                    {event.is_official_drive && (
                                      <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/30 text-[9px] flex items-center gap-1 font-bold">
                                        <Star className="w-2.5 h-2.5" /> Official
                                      </span>
                                    )}
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
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getEventColors(selectedEvent.type, selectedEvent.status).badge}`}>
                          {selectedEvent.type.replace('_', ' ')}
                        </span>
                        {selectedEvent.is_official_drive && (
                          <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5" /> Official Drive
                          </span>
                        )}
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
                      {selectedEvent.meeting_link && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Link2 className="w-5 h-5 text-indigo-400 shrink-0" />
                            <span className="truncate text-indigo-300">{selectedEvent.meeting_link}</span>
                          </div>
                          <a 
                            href={selectedEvent.meeting_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                          >
                            Join
                          </a>
                        </div>
                      )}
                      {selectedEvent.location && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-5 h-5 text-slate-500 shrink-0" />
                            <span className="truncate">{selectedEvent.location}</span>
                          </div>
                          <a 
                            href={`https://maps.google.com/?q=${encodeURIComponent(selectedEvent.location)}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                          >
                            Map
                          </a>
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
                    {/* Logistics Checklist */}
                    {(selectedEvent.type === 'interview' || selectedEvent.type === 'event' || selectedEvent.is_official_drive) && (
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-slate-500" /> Logistics Checklist
                        </h4>
                        <div className="space-y-2 bg-white/5 p-4 rounded-xl border border-white/5">
                          {[
                            { key: 'travel_booked', label: 'Travel Booked' },
                            { key: 'accommodation_booked', label: 'Accommodation Booked' },
                            { key: 'documents_printed', label: 'Documents Printed (Resume, ID)' }
                          ].map(item => {
                            const isChecked = selectedEvent.logistics?.[item.key] || false;
                            return (
                              <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-[#13141f] border-white/20 group-hover:border-white/40'}`}>
                                  {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className={`text-sm ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200 group-hover:text-white transition-colors'}`}>
                                  {item.label}
                                </span>
                                <input 
                                  type="checkbox"
                                  className="hidden"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const updatedLogistics = {
                                      ...(selectedEvent.logistics || {}),
                                      [item.key]: e.target.checked
                                    };
                                    // Optimistic update locally
                                    setSelectedEvent({ ...selectedEvent, logistics: updatedLogistics });
                                    // Send to server
                                    updateMutation.mutate({ 
                                      id: selectedEvent._id, 
                                      data: { logistics: updatedLogistics, recurrenceEditMode: 'single' } 
                                    });
                                  }}
                                />
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}


                    {selectedEvent.type === 'interview' && selectedEvent.status === 'completed' && (
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Star className="w-4 h-4 text-emerald-400" /> Interview Reflection
                        </h4>
                        {!selectedEvent.reflection?.note && !selectedEvent.reflection?.confidence ? (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                            <p className="text-sm text-emerald-300 mb-3">How did the interview go? Log your reflection while it's fresh.</p>
                            {!isLoggingReflection && (
                              <button 
                                onClick={() => setLoggingReflection(true)}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors hover:bg-emerald-600"
                              >
                                Log Reflection
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                            {selectedEvent.reflection.confidence > 0 && (
                              <div className="flex gap-1 mb-2">
                                {[1,2,3,4,5].map(star => (
                                  <Star key={star} className={`w-4 h-4 ${star <= selectedEvent.reflection.confidence ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                                ))}
                              </div>
                            )}
                            {selectedEvent.reflection.outcome && selectedEvent.reflection.outcome !== 'none' && (
                              <span className="inline-block mb-2 px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 capitalize">
                                Outcome: {selectedEvent.reflection.outcome.replace('_', ' ')}
                              </span>
                            )}
                            <p className="text-sm text-slate-300 whitespace-pre-line">
                              {selectedEvent.reflection.note}
                            </p>
                          </div>
                        )}
                        
                        {/* Inline Reflection Form */}
                        {isLoggingReflection && (
                          <div className="mt-3 bg-[#13141f] border border-white/10 p-4 rounded-xl space-y-4">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Confidence (1-5)</label>
                              <div className="flex gap-2">
                                {[1,2,3,4,5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReflectionData({...reflectionData, confidence: star})}
                                    className="p-1"
                                  >
                                    <Star className={`w-6 h-6 ${star <= reflectionData.confidence ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-amber-400/50'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Outcome</label>
                              <select 
                                value={reflectionData.outcome}
                                onChange={(e) => setReflectionData({...reflectionData, outcome: e.target.value})}
                                className="w-full px-3 py-2 bg-[#1a1b26] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 appearance-none"
                              >
                                <option value="none">Not decided yet</option>
                                <option value="cleared">Cleared / Passed</option>
                                <option value="rejected">Rejected</option>
                                <option value="awaiting_result">Awaiting Result</option>
                                <option value="withdrew">Withdrew</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
                              <textarea 
                                value={reflectionData.note}
                                onChange={(e) => setReflectionData({...reflectionData, note: e.target.value})}
                                className="w-full px-3 py-2 bg-[#1a1b26] border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500 text-sm min-h-[80px]"
                                placeholder="What went well? What questions did they ask?"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setLoggingReflection(false)}
                                className="px-3 py-1.5 text-slate-400 hover:text-white text-sm font-medium"
                              >
                                Cancel
                              </button>
                              <button 
                                onClick={handleSaveReflection}
                                disabled={!reflectionData.confidence || !reflectionData.note}
                                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Stepper Round-Sequence View */}
                    {eventRoundsData && eventRoundsData.rounds.length > 0 && (
                      <div className="border-t border-white/5 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <GitCommit className="w-4 h-4 text-purple-400" /> {eventRoundsData.company} Process
                        </h4>
                        <div className="relative pl-3 space-y-4">
                          <div className="absolute top-2 bottom-2 left-[15px] w-px bg-white/10" />
                          {eventRoundsData.rounds.map((round) => (
                            <div key={round.id} className="relative flex items-start gap-4">
                              <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 z-10 ${
                                round.isCurrentEvent ? 'bg-[#00f0ff] ring-4 ring-[#00f0ff]/20' : 
                                round.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-slate-600'
                              }`} />
                              <div className={`flex-1 p-3 rounded-xl border ${
                                round.isCurrentEvent ? 'bg-[#00f0ff]/10 border-[#00f0ff]/30' : 'bg-white/5 border-white/5'
                              }`}>
                                <p className={`text-sm font-bold ${round.isCurrentEvent ? 'text-[#00f0ff]' : 'text-slate-300'}`}>
                                  {round.round}
                                </p>
                                <p className="text-xs text-slate-500 mt-1 capitalize">
                                  {round.roundType?.replace('_', ' ')} • {format(new Date(round.date), 'MMM d')}
                                </p>
                                {round.outcome && round.outcome !== 'PENDING' && (
                                  <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    round.outcome === 'PASSED' ? 'bg-emerald-500/20 text-emerald-400' :
                                    round.outcome === 'FAILED' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-slate-300'
                                  }`}>
                                    {round.outcome}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEvent.type === 'offer_deadline' && (
                      <DecisionTracker selectedEvent={selectedEvent} allEvents={eventsQuery.data || []} />
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
                          <option value="academic" className="bg-[#13141f]">Academic</option>
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

                    {formData.type === 'interview' && prepSuggestion && (
                      <div className="flex items-center justify-between p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                        <div className="pr-3">
                          <label className="text-sm font-bold text-amber-400 block flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-505" /> Block Prep Time
                          </label>
                          <p className="text-xs text-amber-300/80 mt-1">
                            Suggested slot: <span className="font-semibold text-amber-200">{getPrepSuggestionLabel()}</span>
                          </p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={suggestPrepBlock} 
                          onChange={(e) => setSuggestPrepBlock(e.target.checked)} 
                          className="w-5 h-5 rounded border-amber-500/30 bg-[#13141f] text-amber-500 focus:ring-amber-500 focus:ring-offset-[#13141f]"
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

                    {/* Official Drive toggle */}
                    {(formData.type === 'event' || formData.type === 'interview') && (
                      <div className="flex items-center justify-between p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <div>
                          <label className="text-sm font-semibold text-indigo-400 block flex items-center gap-1.5">
                            <Star className="w-4 h-4" /> Official College Drive
                          </label>
                          <p className="text-xs text-indigo-300/80">Triggers special reschedule alerts</p>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={formData.is_official_drive} 
                          onChange={(e) => setFormData({...formData, is_official_drive: e.target.checked})} 
                          className="w-5 h-5 rounded border-indigo-500/30 bg-[#13141f] text-indigo-500 focus:ring-indigo-500 focus:ring-offset-[#13141f]"
                        />
                      </div>
                    )}
                    
                    {/* Expected Response Date (for Interviews) */}
                    {formData.type === 'interview' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Expected Response Date</label>
                        <input 
                          type="date" 
                          value={formData.expected_response_date} 
                          onChange={(e) => setFormData({...formData, expected_response_date: e.target.value})} 
                          className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm [color-scheme:dark]" 
                        />
                        <p className="text-[10px] text-slate-500 mt-1">We'll remind you to follow up if you haven't heard back by this date.</p>
                      </div>
                    )}

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

                        {/* Timezone dropdown selector */}
                        <div className="mt-4">
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Timezone</label>
                          <select 
                            value={formData.timezone || 'Asia/Kolkata'} 
                            onChange={(e) => setFormData({...formData, timezone: e.target.value})} 
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] text-sm appearance-none"
                          >
                            <option value="Asia/Kolkata" className="bg-[#13141f]">Asia/Kolkata</option>
                            <option value="America/New_York" className="bg-[#13141f]">America/New_York</option>
                            <option value="America/Los_Angeles" className="bg-[#13141f]">America/Los_Angeles</option>
                            <option value="Europe/London" className="bg-[#13141f]">Europe/London</option>
                            <option value="Asia/Singapore" className="bg-[#13141f]">Asia/Singapore</option>
                            <option value="UTC" className="bg-[#13141f]">UTC</option>
                          </select>
                          {formData.timezone && user?.calendarSettings?.timezone && formData.timezone !== user.calendarSettings.timezone && formData.start_time && (
                            <div className="text-xs text-[#00f0ff] mt-2.5 flex items-center gap-1.5 font-medium bg-[#00f0ff]/5 p-2.5 rounded-lg border border-[#00f0ff]/10">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {formData.start_time} ({formData.timezone}) is {getConvertedDisplayTime()} ({user.calendarSettings.timezone}) for you
                              </span>
                            </div>
                          )}
                        </div>
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

      <BulkAcademicAddModal 
        isOpen={showBulkAcademicAdd} 
        onClose={() => setShowBulkAcademicAdd(false)} 
      />
    </div>
  );
};

export default CalendarPage;
