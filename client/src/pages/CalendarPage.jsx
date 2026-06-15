import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Briefcase, Plus, X } from 'lucide-react';
import api from '../services/api';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Event',
    description: '',
    date: '',
    emailReminder: true
  });

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [applicationsRes, interviewsRes, eventsRes] = await Promise.all([
        api.get('/applications'),
        api.get('/interviews'),
        api.get('/events')
      ]);

      const formattedEvents = [];

      applicationsRes.data.forEach(app => {
        if (app.appliedDate) {
          formattedEvents.push({
            id: `app-${app._id}`,
            title: `${app.company} (${app.role})`,
            date: new Date(app.appliedDate),
            type: 'application',
            status: app.status
          });
        }
      });

      interviewsRes.data.forEach(interview => {
        if (interview.interviewDate) {
          formattedEvents.push({
            id: `int-${interview._id}`,
            title: `${interview.company} Interview`,
            date: new Date(interview.interviewDate),
            type: 'interview',
            status: interview.status
          });
        }
      });

      eventsRes.data.forEach(ev => {
        formattedEvents.push({
          id: `ev-${ev._id}`,
          title: ev.title,
          date: new Date(ev.date),
          type: ev.type.toLowerCase() === 'deadline' ? 'deadline' : 'event',
          status: 'Event',
          isCustom: true,
          originalId: ev._id
        });
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to fetch calendar data', error);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setFormData({ ...formData, date: format(day, "yyyy-MM-dd'T'HH:mm") });
    setIsModalOpen(true);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', formData);
      setIsModalOpen(false);
      setFormData({ title: '', type: 'Event', description: '', date: '', emailReminder: true });
      fetchData();
    } catch (error) {
      console.error('Failed to create event', error);
    }
  };

  const deleteEvent = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/events/${id}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete event', error);
    }
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarIcon className="text-[#ff6b00] w-6 h-6" />
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="p-2 rounded-lg bg-[#13141f] hover:bg-white/[0.05] text-slate-300 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg bg-[#13141f] hover:bg-white/[0.05] text-slate-300 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-semibold text-sm text-slate-400 py-3 uppercase tracking-wider">
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-white/5 mb-2">{days}</div>;
  };

  const getEventsForDay = (day) => {
    return events.filter(event => isSameDay(event.date, day));
  };

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
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const dayEvents = getEventsForDay(day);

        days.push(
          <div
            key={day}
            onClick={() => handleDateClick(cloneDay)}
            className={`min-h-[120px] p-2 cursor-pointer border border-slate-800/50 transition-colors hover:bg-[#13141f]/80 ${
              !isSameMonth(day, monthStart) ? 'text-slate-600 bg-[#0a0a0f]/50' : 'text-slate-300 bg-[#13141f]/10'
            } ${isSameDay(day, new Date()) ? 'ring-2 ring-blue-500 ring-inset bg-blue-500/5' : ''}`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-blue-500 text-white' : ''}`}>
                {formattedDate}
              </span>
            </div>
            
            <div className="mt-2 space-y-1">
              {dayEvents.map(event => (
                <div 
                  key={event.id}
                  className={`text-xs px-2 py-1 flex justify-between items-center rounded truncate border ${getEventColor(event)} cursor-pointer hover:opacity-80 transition-opacity`}
                  title={`${event.title} - ${event.status}`}
                >
                  <span className="truncate">
                    {event.type === 'interview' && '🎯 '}
                    {event.type === 'deadline' && '⏳ '}
                    {event.type === 'event' && '🗓️ '}
                    {event.title}
                  </span>
                  {event.isCustom && (
                    <button 
                      onClick={(e) => deleteEvent(event.originalId, e)}
                      className="ml-1 opacity-50 hover:opacity-100 text-slate-300 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div>{rows}</div>;
  };

  return (
    <>
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Interactive Calendar</h1>
            <p className="text-slate-400">Track all your interview dates and application timelines in one view.</p>
          </header>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card-card p-6 border border-white/5 rounded-2xl"
          >
            {renderHeader()}
            {renderDays()}
            {loading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              renderCells()
            )}
          </motion.div>
          
          <div className="mt-6 flex flex-wrap items-center gap-6 justify-center text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30"></div>
              <span>Interviews</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30"></div>
              <span>Applications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/20"></div>
              <span>Offers/Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/30"></div>
              <span>Events</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></div>
              <span>Deadlines</span>
            </div>
          </div>

        </div>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-md p-6 relative"
              >
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-6">Add Event on {selectedDate && format(selectedDate, 'MMM do')}</h2>

                <form onSubmit={handleEventSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-[#13141f] border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500" 
                      placeholder="e.g. OA Deadline"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Type</label>
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-[#13141f] border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      >
                        <option value="Event">Event</option>
                        <option value="Reminder">Reminder</option>
                        <option value="Deadline">Deadline</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Time</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-[#13141f] border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-[#13141f] border border-white/10 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:border-blue-500 min-h-[80px]"
                      placeholder="Add any notes..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="emailReminder" 
                      checked={formData.emailReminder}
                      onChange={(e) => setFormData({...formData, emailReminder: e.target.checked})}
                      className="w-4 h-4 rounded border-white/20 bg-[#13141f] text-blue-500"
                    />
                    <label htmlFor="emailReminder" className="text-sm text-slate-300">
                      Send me email reminders for this event
                    </label>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-2.5 rounded-lg text-slate-300 hover:bg-[#13141f] transition-colors border border-white/5"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="flex-1 btn-primary py-2.5">
                      Save Event
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </>
  );
};

export default CalendarPage;
