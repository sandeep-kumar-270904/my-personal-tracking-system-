import { Calendar, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const UpcomingStrip = ({ upcoming }) => {
  if (!upcoming || upcoming.length === 0) return null;

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'HIGH': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-[#ff6b00]" /> 
        Upcoming Schedule
      </h3>
      <div className="flex flex-wrap gap-3">
        {upcoming.map((item, idx) => {
          const dateObj = new Date(item.date);
          const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
          const timeStr = item.type !== 'OFFER_DEADLINE' ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
          
          return (
            <Link key={idx} to={item.linkTo}>
              <div className={`px-4 py-3 rounded-xl border flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer ${getUrgencyColor(item.urgency)}`}>
                {item.urgency === 'HIGH' && <AlertCircle className="w-5 h-5 flex-shrink-0 animate-pulse" />}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide opacity-80">{item.type.replace('_', ' ')}</span>
                    <span className="text-xs font-medium opacity-80">&bull; {dateStr} {timeStr}</span>
                  </div>
                  <div className="font-bold text-white mt-0.5">{item.title}</div>
                  {item.subtitle && <div className="text-xs font-medium opacity-80">{item.subtitle}</div>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingStrip;
