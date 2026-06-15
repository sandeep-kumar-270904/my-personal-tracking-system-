import { motion } from 'framer-motion';
import { Building2, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Code } from 'lucide-react';

const TimelineView = ({ applications, onAppClick }) => {
  // Sort chronologically (newest first)
  const sortedApps = [...applications].sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Applied': return <Clock className="w-5 h-5 text-blue-400" />;
      case 'OA': return <Code className="w-5 h-5 text-violet-400" />;
      case 'Interview': return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'Selected': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'Rejected': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Building2 className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Applied': return 'bg-blue-500/10 border-blue-500/20';
      case 'OA': return 'bg-violet-500/10 border-violet-500/20';
      case 'Interview': return 'bg-amber-500/10 border-amber-500/20';
      case 'Selected': return 'bg-emerald-500/10 border-emerald-500/20';
      case 'Rejected': return 'bg-red-500/10 border-red-500/20';
      default: return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="relative border-l border-white/10 ml-6 md:ml-8 space-y-8">
        {sortedApps.map((app, idx) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={app._id} 
            className="relative pl-8 md:pl-10 group cursor-pointer"
            onClick={() => onAppClick(app)}
          >
            {/* Timeline Dot */}
            <div className={`absolute -left-[21px] top-1 w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#13141f] ${getStatusColor(app.status)} transition-transform group-hover:scale-110`}>
              {getStatusIcon(app.status)}
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 group-hover:border-white/20 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#00f0ff] transition-colors">{app.company}</h3>
                  <p className="text-slate-300 font-medium">{app.role}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 px-3 py-1 rounded-full whitespace-nowrap w-fit">
                  <Clock className="w-4 h-4" />
                  {new Date(app.appliedDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-slate-400">Current Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                  {app.status}
                </span>
              </div>

              {app.notes && (
                <div className="bg-[#13141f]/50 p-3 rounded-lg border border-white/5 text-sm text-slate-400 line-clamp-2">
                  {app.notes}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {applications.length === 0 && (
          <div className="pl-10 text-slate-500 py-8">No applications to show in timeline.</div>
        )}
      </div>
    </div>
  );
};

export default TimelineView;
