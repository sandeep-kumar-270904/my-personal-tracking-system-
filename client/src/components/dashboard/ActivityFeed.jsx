import { motion } from 'framer-motion';
import { Briefcase, Code, Calendar, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ feed, isCompact }) => {
  if (!feed || feed.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'APPLICATION_ADDED': return <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30"><Briefcase className="w-4 h-4 text-blue-400" /></div>;
      case 'INTERVIEW_SCHEDULED': return <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30"><Calendar className="w-4 h-4 text-amber-400" /></div>;
      case 'DSA_SOLVED': return <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30"><Code className="w-4 h-4 text-purple-400" /></div>;
      case 'OFFER_RECEIVED': return <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>;
      default: return <div className="w-8 h-8 rounded-full bg-slate-500/20 flex items-center justify-center border border-slate-500/30"><Activity className="w-4 h-4 text-slate-400" /></div>;
    }
  };

  const visibleFeed = isCompact ? feed.slice(0, 5) : feed;

  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden sticky top-6">
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" /> Activity Feed
        </h3>
      </div>
      
      <div className="p-2">
        {visibleFeed.map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Link to={item.linkTo} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors group">
              <div className="flex-shrink-0 mt-1">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 leading-snug group-hover:text-[#ff6b00] transition-colors truncate">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      
      {isCompact && feed.length > 5 && (
        <div className="p-4 border-t border-white/5 text-center">
          <button className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
