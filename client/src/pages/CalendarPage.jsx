import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [applicationsRes, interviewsRes] = await Promise.all([
        api.get('/applications'),
        api.get('/interviews')
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

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to fetch calendar data', error);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarIcon className="text-blue-500 w-6 h-6" />
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex space-x-2">
          <button onClick={prevMonth} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
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
    return <div className="grid grid-cols-7 border-b border-slate-700/50 mb-2">{days}</div>;
  };

  const getEventsForDay = (day) => {
    return events.filter(event => isSameDay(event.date, day));
  };

  const getEventColor = (event) => {
    if (event.type === 'interview') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
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
            className={`min-h-[120px] p-2 border border-slate-800/50 transition-colors hover:bg-slate-800/30 ${
              !isSameMonth(day, monthStart) ? 'text-slate-600 bg-slate-900/50' : 'text-slate-300 bg-slate-800/10'
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
                  className={`text-xs px-2 py-1 rounded truncate border ${getEventColor(event)} cursor-pointer hover:opacity-80 transition-opacity`}
                  title={`${event.title} - ${event.status}`}
                >
                  {event.type === 'interview' && '🎯 '}
                  {event.title}
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
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Interactive Calendar</h1>
            <p className="text-slate-400">Track all your interview dates and application timelines in one view.</p>
          </header>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 border border-slate-700/50 rounded-2xl"
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
          
          <div className="mt-6 flex items-center gap-6 justify-center text-sm text-slate-400">
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
          </div>

        </div>
      </main>
    </div>
  );
};

export default CalendarPage;
