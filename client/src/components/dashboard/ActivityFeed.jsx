import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Briefcase, Code, Clock, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ feed }) => {
  if (!feed || feed.length === 0) return (
    <div className="glass-card p-6 rounded-2xl border border-white/5 h-full flex flex-col items-center justify-center">
      <p className="text-slate-500 text-sm font-medium">No recent activity.</p>
    </div>
  );

  const getIconAndColor = (type) => {
    switch(type) {
      case 'APPLICATION_ADDED': return { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/20' };
      case 'INTERVIEW_SCHEDULED': return { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/20' };
      case 'DSA_SOLVED': return { icon: Code, color: 'text-amber-500', bg: 'bg-amber-500/20' };
      case 'OFFER_RECEIVED': return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/20' };
      default: return { icon: Briefcase, color: 'text-slate-500', bg: 'bg-slate-500/20' };
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/5 sticky top-24">
      <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
      <div className="space-y-6 relative">
        {/* Vertical line behind items */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/10 z-0" />
        
        {feed.map((item, idx) => {
          const { icon: Icon, color, bg } = getIconAndColor(item.type);
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-4 relative z-10"
            >
              <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border border-white/10 shadow-lg ${bg}`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 pt-1">
                <Link to={item.linkTo} className="hover:underline">
                  <p className="text-sm font-medium text-slate-200">{item.label}</p>
                </Link>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityFeed;
