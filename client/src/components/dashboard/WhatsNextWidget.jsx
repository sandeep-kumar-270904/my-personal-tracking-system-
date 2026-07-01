import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const target = new Date(targetDate);
      if (target < now) {
        setTimeLeft('Started');
        return;
      }
      
      const mins = differenceInMinutes(target, now);
      if (mins < 60) {
        setTimeLeft(`In ${mins} min${mins !== 1 ? 's' : ''}`);
        return;
      }
      
      const hours = differenceInHours(target, now);
      if (hours < 24) {
        const remainingMins = mins % 60;
        setTimeLeft(`In ${hours}h ${remainingMins}m`);
        return;
      }
      
      const days = differenceInDays(target, now);
      setTimeLeft(`In ${days} day${days !== 1 ? 's' : ''}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded-md border border-white/10 shrink-0">
      <Clock className="w-3.5 h-3.5 text-blue-400" />
      <span className="text-[11px] font-bold text-blue-300 whitespace-nowrap">{timeLeft}</span>
    </div>
  );
};

const WhatsNextWidget = ({ upcoming }) => {
  if (!upcoming || upcoming.length === 0) return null;

  // Filter to only show top 3 closest items
  const displayItems = upcoming.slice(0, 3);

  const getUrgencyClasses = (urgency, type) => {
    if (urgency === 'HIGH') return 'bg-red-500/10 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/20';
    if (urgency === 'MEDIUM') return 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/20';
    return 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10';
  };

  const getIndicatorColor = (type) => {
    switch (type) {
      case 'INTERVIEW': return 'bg-amber-400';
      case 'OFFER_DEADLINE': return 'bg-emerald-400';
      case 'CONTEST': return 'bg-blue-400';
      case 'DEADLINE':
      case 'APPLICATION_DEADLINE': return 'bg-red-400';
      default: return 'bg-purple-400';
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#00f0ff]" /> 
        What's Next
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayItems.map((item, idx) => {
          const dateObj = new Date(item.date);
          const dateStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
          const timeStr = !['OFFER_DEADLINE', 'DEADLINE'].includes(item.type) ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          
          const isInterview = item.type === 'INTERVIEW';
          const needsPrep = isInterview && item.isCalendarEvent && !item.hasPrep && item.urgency !== 'LOW';

          return (
            <Link key={`${item.type}-${idx}`} to={item.linkTo}>
              <div className={`h-full p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${getUrgencyClasses(item.urgency, item.type)}`}>
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-full ${getIndicatorColor(item.type)}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <CountdownTimer targetDate={item.date} />
                  </div>
                  
                  <h4 className="text-base font-bold text-white mb-1 leading-snug group-hover:text-[#00f0ff] transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  {item.subtitle && <p className="text-xs text-slate-400 font-medium mb-3">{item.subtitle}</p>}
                  
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    {dateStr} {timeStr && `• ${timeStr}`}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-2">
                  {needsPrep && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[10px] text-amber-300 font-bold">Prep not logged yet</span>
                    </div>
                  )}
                  <div className="flex items-center text-[10px] font-bold text-slate-500 group-hover:text-white transition-colors self-end mt-auto pt-2">
                    View Details <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default WhatsNextWidget;
