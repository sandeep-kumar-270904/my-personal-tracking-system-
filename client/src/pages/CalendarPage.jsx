import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const fetchCalendarData = async () => {
  const [apps, ints, evs] = await Promise.all([
    api.get('/applications'),
    api.get('/interviews'),
    api.get('/events')
  ]);

  const formattedEvents = [];

  apps.data.forEach(app => {
    if (app.appliedDate) {
      formattedEvents.push({ id: `app-${app._id}`, title: `${app.company} (${app.role})`, date: new Date(app.appliedDate), type: 'application', status: app.status });
    }
  });

  ints.data.forEach(interview => {
    if (interview.interviewDate) {
      formattedEvents.push({ id: `int-${interview._id}`, title: `${interview.company} Interview`, date: new Date(interview.interviewDate), type: 'interview', status: interview.status });
    }
    if (interview.followUpDate) {
      formattedEvents.push({ id: `int-fu-${interview._id}`, title: `${interview.company} Follow-up`, date: new Date(interview.followUpDate), type: 'event', status: 'Follow-up' });
    }
  });

  evs.data.forEach(ev => {
    formattedEvents.push({ id: `ev-${ev._id}`, title: ev.title, date: new Date(ev.date), type: ev.type.toLowerCase() === 'deadline' ? 'deadline' : 'event', status: 'Event', isCustom: true, originalId: ev._id });
  });

  return formattedEvents;
};

const CalendarPage = () => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);

  const [formData, setFormData] = useState({
    title: '', type: 'Event', description: '', date: '', emailReminder: true
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar'], queryFn: fetchCalendarData
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => await api.post('/events', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar']);
      toast.success('Event added');
      setIsDrawerOpen(false);
      setFormData({ title: '', type: 'Event', description: '', date: '', emailReminder: true });
    },
    onError: () => toast.error('Failed to create event')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/events/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar']);
      toast.success('Event deleted');
      setEventToDelete(null);
    },
    onError: () => toast.error('Failed to delete event')
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setFormData({ ...formData, date: format(day, "yyyy-MM-dd'T'HH:mm") });
    setIsDrawerOpen(true);
  };

  const handleEventSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <CalendarIcon className="text-[#00f0ff] w-6 h-6" />
        {format(currentDate, 'MMMM yyyy')}
      </h2>
      <div className="flex space-x-2">
        <button onClick={prevMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={nextMonth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );

  const getEventColor = (event) => {
    if (event.type === 'interview') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (event.type === 'deadline') return 'bg-red-500/20 text-red-300 border-red-500/30';
    if (event.type === 'event') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (event.status === 'Rejected') return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (event.status === 'Selected') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayEvents = events.filter(e => isSameDay(e.date, day));

        days.push(
          <div
            key={day}
            onClick={() => handleDateClick(cloneDay)}
            className={`min-h-[120px] p-2 cursor-pointer border border-white/5 transition-colors hover:bg-white/5 ${
              !isSameMonth(day, monthStart) ? 'text-slate-600 bg-black/20' : 'text-slate-300 bg-[#13141f]'
            } ${isSameDay(day, new Date()) ? 'ring-2 ring-[#00f0ff] ring-inset' : ''}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-[#00f0ff] text-[#13141f]' : ''}`}>
                {format(day, 'd')}
              </span>
            </div>
            
            <div className="space-y-1">
              {dayEvents.map(event => (
                <div 
                  key={event.id}
                  className={`text-xs px-2 py-1 flex justify-between items-center rounded truncate border ${getEventColor(event)} group`}
                  title={`${event.title} - ${event.status}`}
                  onClick={(e) => {
                    if (event.isCustom) {
                      e.stopPropagation();
                      setEventToDelete(event.originalId);
                    }
                  }}
                >
                  <span className="truncate">
                    {event.type === 'interview' && '🎯 '}
                    {event.type === 'deadline' && '⏳ '}
                    {event.type === 'event' && '🗓️ '}
                    {event.title}
                  </span>
                  {event.isCustom && (
                    <X className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity hover:text-white" />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7" key={day}>{days}</div>);
      days = [];
    }
    return <div>{rows}</div>;
  };

  if (isLoading) {
    return <div className="p-8 w-full max-w-6xl mx-auto"><div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
          <p className="text-slate-400">Track all your interview dates, follow-ups, and application timelines.</p>
        </div>
      </header>

      <div className="glass-card p-6 border border-white/5 rounded-2xl flex-1 overflow-hidden flex flex-col">
        {renderHeader()}
        
        <div className="grid grid-cols-7 border-b border-white/5 mb-2 shrink-0">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center font-bold text-xs text-slate-400 py-3 uppercase tracking-wider">{day}</div>
          ))}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {renderCells()}
        </div>
      </div>
      
      <div className="mt-6 flex flex-wrap items-center gap-6 justify-center text-sm text-slate-400 font-medium">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30"></div><span>Interviews</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30"></div><span>Applications</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/20"></div><span>Offers</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/30"></div><span>Events</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></div><span>Deadlines</span></div>
      </div>

      <ConfirmModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={() => deleteMutation.mutate(eventToDelete)}
        title="Delete Event"
        message="Are you sure you want to delete this custom event?"
      />

      {/* Slide-in Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-[#13141f] border-l border-white/10 shadow-2xl z-50 flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#13141f]/80 backdrop-blur sticky top-0 z-10">
                <h2 className="text-xl font-bold text-white">Add Event</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleEventSubmit} className="space-y-5">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Selected Date</span>
                    <span className="text-white font-bold">{selectedDate && format(selectedDate, 'MMMM do, yyyy')}</span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Event Title</label>
                    <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff]" placeholder="e.g. Call with Recruiter" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
                      <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff] appearance-none">
                        <option value="Event" className="bg-[#13141f]">Event</option>
                        <option value="Reminder" className="bg-[#13141f]">Reminder</option>
                        <option value="Deadline" className="bg-[#13141f]">Deadline</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Time</label>
                      <input type="datetime-local" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff] [color-scheme:dark]" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
                    <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00f0ff] min-h-[100px] resize-y" placeholder="Add any details or links..." />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <input type="checkbox" id="emailReminder" checked={formData.emailReminder} onChange={(e) => setFormData({...formData, emailReminder: e.target.checked})} className="w-5 h-5 rounded border-white/20 bg-[#13141f] text-[#00f0ff] focus:ring-[#00f0ff] focus:ring-offset-[#13141f]" />
                    <div>
                      <label htmlFor="emailReminder" className="text-sm font-medium text-white block">Email Reminder</label>
                      <p className="text-xs text-slate-400">Get notified 24h before</p>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-3">
                    <button type="button" onClick={() => setIsDrawerOpen(false)} className="flex-1 py-3 rounded-xl text-slate-300 hover:bg-white/5 transition-colors font-bold">Cancel</button>
                    <button type="submit" disabled={saveMutation.isPending} className="flex-1 py-3 rounded-xl bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-[#13141f] font-bold shadow-lg shadow-[#00f0ff]/20 transition-all disabled:opacity-50">Save Event</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarPage;
