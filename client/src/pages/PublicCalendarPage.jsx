import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock, MapPin, ChevronRight as ChevronRightIcon, X, 
  Target, TrendingUp 
} from 'lucide-react';
import api from '../services/api';

// Helper timezone conversions (identical to main page for consistency)
function utcToLocalTime(utcDateInput, timezone) {
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
    const pad = (n) => String(n).padStart(2, '0');
    return {
      dateStr: `${utcDate.getUTCFullYear()}-${pad(utcDate.getUTCMonth() + 1)}-${pad(utcDate.getUTCDate())}`,
      timeStr: `${pad(utcDate.getUTCHours())}:${pad(utcDate.getUTCMinutes())}`
    };
  }
}

const computeEventLayout = (dayEvents) => {
  const DEFAULT_DURATIONS = { interview: 60, event: 60, follow_up: 30, deadline: 0, application_deadline: 0, offer_deadline: 0 };
  
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
    default:
      return {
        chip: `bg-purple-500/10 text-[#bc7dff] border-purple-500/20 hover:bg-purple-500/20 ${opacityClass}`,
        badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
        indicator: 'bg-purple-500'
      };
  }
};

const PublicCalendarPage = () => {
  const { token } = useParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month');
  const [displayTimezone, setDisplayTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [listFilter, setListFilter] = useState('all');

  const { data = {}, isLoading } = useQuery({
    queryKey: ['publicCalendar', token],
    queryFn: async () => {
      const res = await api.get(`/public/calendar/${token}`);
      return res.data;
    },
    enabled: !!token
  });

  const userName = data.userName || 'Student';
  const events = data.events || [];

  // Convert UTC event times into selected display timezone
  const processedEvents = useMemo(() => {
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

      const startLocal = utcToLocalTime(eventStartUTCDate, displayTimezone);

      let endLocal = { dateStr: startLocal.dateStr, timeStr: '' };
      if (event.end_time) {
        const [eh, emin] = event.end_time.split(':').map(Number);
        let eventEndUTCDate;
        if (eh < sh || (eh === sh && emin < smin)) {
          eventEndUTCDate = new Date(Date.UTC(sy, sm - 1, sd + 1, eh, emin));
        } else {
          eventEndUTCDate = new Date(Date.UTC(sy, sm - 1, sd, eh, emin));
        }
        endLocal = utcToLocalTime(eventEndUTCDate, displayTimezone);
      }

      return {
        ...event,
        localDateStr: startLocal.dateStr,
        localEndDateStr: endLocal.dateStr,
        localStartTime: startLocal.timeStr,
        localEndTime: endLocal.timeStr
      };
    });
  }, [events, displayTimezone]);

  const isEventOnDay = (event, day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    if (event.localEndDateStr && event.localEndDateStr !== event.localDateStr) {
      return dayStr >= event.localDateStr && dayStr <= event.localEndDateStr;
    }
    return dayStr === event.localDateStr;
  };

  const sortEvents = (a, b) => {
    if (a.is_all_day && !b.is_all_day) return -1;
    if (!a.is_all_day && b.is_all_day) return 1;
    const aDuration = a.localEndDateStr ? (new Date(a.localEndDateStr) - new Date(a.localDateStr)) : 0;
    const bDuration = b.localEndDateStr ? (new Date(b.localEndDateStr) - new Date(b.localDateStr)) : 0;
    if (aDuration !== bDuration) return bDuration - aDuration;
    if (a.localStartTime && b.localStartTime) return a.localStartTime.localeCompare(b.localStartTime);
    if (a.localStartTime) return 1;
    if (b.localStartTime) return -1;
    return String(a._id).localeCompare(String(b._id));
  };

  const gridCells = useMemo(() => {
    const startM = startOfMonth(currentDate);
    const endM = endOfMonth(startM);
    const startW = startOfWeek(startM, { weekStartsOn: 1 });
    const endW = endOfWeek(endM, { weekStartsOn: 1 });
    const cells = [];
    let day = startW;
    while (day <= endW) {
      cells.push(day);
      day = addDays(day, 1);
    }
    return cells;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const hours = useMemo(() => Array.from({ length: 16 }, (_, i) => 7 + i), []);

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

  const getHeaderTitle = () => {
    if (calendarView === 'month' || calendarView === 'list') {
      return format(currentDate, 'MMMM yyyy');
    } else if (calendarView === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else if (calendarView === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    }
    return '';
  };

  const handleEventClick = (event, e) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto min-h-[calc(100vh-100px)] flex flex-col pb-10 px-4 sm:px-6 pt-6">
      
      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-white mb-1 flex items-center gap-2">
            <CalendarIcon className="text-[#00f0ff] w-8 h-8" />
            {userName}'s Placement Calendar
          </h1>
          <p className="text-[14px] text-slate-400">Public read-only placement calendar view.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Timezone Switcher */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase">View Tz:</span>
            <select 
              value={displayTimezone}
              onChange={(e) => setDisplayTimezone(e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Asia/Kolkata" className="bg-[#13141f]">Asia/Kolkata</option>
              <option value="America/New_York" className="bg-[#13141f]">America/New_York</option>
              <option value="America/Los_Angeles" className="bg-[#13141f]">America/Los_Angeles</option>
              <option value="Europe/London" className="bg-[#13141f]">Europe/London</option>
              <option value="Asia/Singapore" className="bg-[#13141f]">Asia/Singapore</option>
              <option value="UTC" className="bg-[#13141f]">UTC</option>
            </select>
          </div>

          {/* View Mode Selector */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
            {['month', 'week', 'day', 'list'].map((view) => (
              <button
                key={view}
                onClick={() => setCalendarView(view)}
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

      {/* Summary View Mode */}
      {data.mode === 'summary' ? (
        <div className="flex-1 flex flex-col justify-center max-w-3xl mx-auto w-full mt-8">
          <div className="glass-card rounded-2xl border border-white/5 bg-[#13141f] p-8 space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white mb-2">Weekly Summary</h2>
              <p className="text-slate-400">Here's what {userName} has coming up this week.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 border border-white/5 rounded-xl text-center">
                <div className="text-4xl font-black text-amber-400">{processedEvents.length}</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Upcoming Events</div>
              </div>
              <div className="p-6 bg-white/5 border border-white/5 rounded-xl text-center">
                <div className="text-4xl font-black text-emerald-400">{processedEvents.filter(e => e.type === 'interview').length}</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Interviews</div>
              </div>
            </div>

            {data.seasonSummary && (
              <div className="pt-6 border-t border-white/5">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#00f0ff]" />
                  Season Progress
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                    <div className="text-2xl font-black text-white">{data.seasonSummary.successRate}%</div>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">Success Rate</div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                    <div className="text-2xl font-black text-white">{data.seasonSummary.totalCompaniesApplied}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">Companies</div>
                  </div>
                  <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                    <div className="text-2xl font-black text-white">{data.seasonSummary.offers}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">Offers</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
      /* Views Container */
      <div className="flex-1 flex flex-col min-h-[500px] bg-[#0b0c15] border border-white/5 rounded-2xl overflow-hidden">
        
        {/* MONTH VIEW */}
        {calendarView === 'month' && (
          <div className="flex flex-col flex-1">
            <div className="grid grid-cols-7 border-b border-white/5 bg-[#13141f]/30 shrink-0">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center font-bold text-xs text-slate-400 py-3 uppercase tracking-wider">{day}</div>
              ))}
            </div>
            
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
                      className={`min-h-[110px] p-2 border border-white/5 transition-all flex flex-col justify-between hover:bg-white/5 overflow-hidden ${
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
                      
                      <div className="flex-1 flex flex-col gap-1 overflow-hidden justify-start w-full">
                        {displayEvents.map(event => {
                          const colors = getEventColors(event.type, event.status);
                          return (
                            <div 
                              key={event._id}
                              onClick={(e) => handleEventClick(event, e)}
                              className={`text-[10px] px-1.5 py-0.5 truncate cursor-pointer rounded border ${colors.chip}`}
                              title={event.title}
                            >
                              <span className="font-medium">{event.title}</span>
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
            <div className="grid grid-cols-7 border-b border-white/5 bg-[#13141f]/95 sticky top-0 z-20 shrink-0 pl-16">
              {weekDays.map((day, dayIdx) => {
                const isToday = isSameDay(day, new Date());
                const allDayForDay = processedEvents.filter(e => isEventOnDay(e, day) && (e.is_all_day || (e.localEndDateStr && e.localEndDateStr !== e.localDateStr)));
                return (
                  <div key={dayIdx} className="text-center py-2 border-r border-white/5 flex flex-col items-center min-h-[70px]">
                    <span className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">{format(day, 'EEE')}</span>
                    <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full mt-1 ${
                      isToday ? 'bg-[#00f0ff] text-[#13141f]' : 'text-slate-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    <div className="w-full px-1 mt-1.5 space-y-1">
                      {allDayForDay.map(event => {
                        const colors = getEventColors(event.type, event.status);
                        return (
                          <div
                            key={event._id}
                            onClick={(e) => handleEventClick(event, e)}
                            className={`text-[8px] px-1 py-0.5 rounded truncate font-bold text-center cursor-pointer border ${colors.chip}`}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-1 relative bg-[#13141f] min-h-[980px]">
              <div className="w-16 flex-shrink-0 border-r border-white/5 bg-[#13141f]/80 sticky left-0 z-10 select-none">
                <div className="h-[20px]" />
                {hours.map(hour => (
                  <div key={hour} className="h-[60px] text-[10px] font-bold text-slate-550 pr-3 flex items-center justify-end">
                    {hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}
                  </div>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-7 relative">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-[20px]" />
                  {hours.map((_, idx) => (
                    <div key={idx} className="h-[60px] border-b border-white/5 w-full" />
                  ))}
                </div>

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
                          const top = Math.max(0, startM - 420);
                          const height = Math.max(25, endM - startM);
                          
                          const left = event.columnIndex * (100 / event.totalColumns);
                          const width = (100 / event.totalColumns) - 1;

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
                              className={`absolute p-1.5 rounded-lg border text-[9px] leading-tight cursor-pointer overflow-hidden transition-all hover:brightness-110 flex flex-col justify-between ${colors.chip}`}
                            >
                              <div className="w-full overflow-hidden">
                                <div className="font-bold truncate text-white mb-0.5">{event.title}</div>
                                <div className="opacity-80 truncate text-[8px]">{event.localStartTime} - {event.localEndTime}</div>
                              </div>
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
            <div className="border-b border-white/5 bg-[#13141f]/95 p-4 sticky top-0 z-20 shrink-0 flex flex-col items-center">
              <span className="text-xs font-bold text-[#00f0ff] uppercase tracking-wider">{format(currentDate, 'EEEE')}</span>
              <span className="text-xl font-bold text-white mt-1">{format(currentDate, 'MMMM d, yyyy')}</span>
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

            <div className="flex flex-1 relative bg-[#13141f] min-h-[980px]">
              <div className="w-20 flex-shrink-0 border-r border-white/5 bg-[#13141f]/80 sticky left-0 z-10 select-none">
                <div className="h-[20px]" />
                {hours.map(hour => (
                  <div key={hour} className="h-[60px] text-xs font-bold text-slate-505 pr-4 flex items-center justify-end">
                    {hour % 12 || 12} {hour >= 12 ? 'PM' : 'AM'}
                  </div>
                ))}
              </div>

              <div className="flex-1 relative">
                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-[20px]" />
                  {hours.map((_, idx) => (
                    <div key={idx} className="h-[60px] border-b border-white/5 w-full" />
                  ))}
                </div>

                <div className="absolute inset-0 top-[20px] bottom-0 left-2 right-4">
                  {computeEventLayout(processedEvents.filter(e => isEventOnDay(e, currentDate))).map(event => {
                    const colors = getEventColors(event.type, event.status);
                    const startM = event.startMinutes;
                    const endM = event.endMinutes;
                    const top = Math.max(0, startM - 420);
                    const height = Math.max(40, endM - startM);
                    
                    const left = event.columnIndex * (100 / event.totalColumns);
                    const width = (100 / event.totalColumns) - 2;

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
                        className={`absolute p-3 rounded-xl border text-xs leading-tight cursor-pointer overflow-hidden transition-all hover:brightness-110 flex flex-col justify-between ${colors.chip}`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1.5">
                            <span className="font-bold text-white text-sm truncate">{event.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${colors.badge}`}>
                              {event.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="opacity-85 text-xs">{event.localStartTime} - {event.localEndTime}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {calendarView === 'list' && (
          <div className="flex flex-col flex-1 p-6 overflow-y-auto">
            <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
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
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'text-slate-400 hover:text-white border-transparent bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

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
                        return (
                          <div
                            key={event._id}
                            onClick={(e) => handleEventClick(event, e)}
                            className="p-4 rounded-xl border border-white/5 bg-[#181926]/50 hover:bg-white/5 hover:border-white/10 transition-all cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2.5 h-2.5 rounded-full ${colors.indicator}`} />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider capitalize">
                                  {event.type.replace('_', ' ')}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mb-0.5">{event.title}</h4>
                              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                {event.is_all_day ? 'All Day' : `${event.localStartTime} - ${event.localEndTime || 'None'}`}
                              </p>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Read-only slideover panel for details */}
      {isDetailOpen && selectedEvent && (
        <>
          <div onClick={() => setIsDetailOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-[#13141f] border-l border-white/10 shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#13141f]/80 backdrop-blur-md">
              <h3 className="text-lg font-bold text-white">Event Details</h3>
              <button onClick={() => setIsDetailOpen(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getEventColors(selectedEvent.type, selectedEvent.status).badge}`}>
                  {selectedEvent.type.replace('_', ' ')}
                </span>
                <h3 className="text-xl font-bold text-white leading-tight mt-3">{selectedEvent.title}</h3>
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-slate-500 shrink-0" />
                  <span>
                    {format(new Date(selectedEvent.date), 'MMMM do, yyyy')}
                    {selectedEvent.end_date && ` - ${format(new Date(selectedEvent.end_date), 'MMMM do, yyyy')}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-500 shrink-0" />
                  <span>{selectedEvent.is_all_day ? 'All Day' : `${selectedEvent.localStartTime} - ${selectedEvent.localEndTime || 'None'}`}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PublicCalendarPage;
