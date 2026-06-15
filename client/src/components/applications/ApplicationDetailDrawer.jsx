import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit2, Trash2, ExternalLink, Clock, Building2, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

const ApplicationDetailDrawer = ({ isOpen, onClose, app, onEdit, onDelete }) => {
  if (!app) return null;

  const isGhosted = app.status === 'Applied' && (new Date() - new Date(app.appliedDate)) / (1000 * 60 * 60 * 24) > 14;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Applied': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'OA': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'Interview': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Selected': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/5 text-slate-300 border-white/10';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-[#13141f] border-l border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#13141f]/80 backdrop-blur sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-white">Application Details</h2>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onEdit(app)} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(app._id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              
              {/* Top Banner */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">{app.company}</h1>
                  <p className="text-[#00f0ff] font-medium text-lg">{app.role}</p>
                </div>
              </div>

              {/* Status Banner */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-8 flex justify-between items-center">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Current Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm mb-1">Date Applied</p>
                  <div className="flex items-center gap-1.5 text-white font-medium">
                    <Calendar className="w-4 h-4" />
                    {new Date(app.appliedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Anti-Ghosting Warning */}
              {isGhosted && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-500 mb-1">Anti-Ghosting Alert</h4>
                      <p className="text-amber-200/80 text-sm mb-3">
                        It's been over 14 days since you applied. Consider sending a follow-up email to reiterate your interest.
                      </p>
                      <button className="text-sm font-bold text-[#13141f] bg-amber-500 hover:bg-amber-400 px-4 py-2 rounded-lg transition-colors">
                        Generate Follow-up Email
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Details List */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Link
                  </h4>
                  {app.link ? (
                    <a href={app.link} target="_blank" rel="noopener noreferrer" className="text-[#00f0ff] hover:underline break-all">
                      {app.link}
                    </a>
                  ) : (
                    <p className="text-slate-500 italic">No link provided.</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Edit2 className="w-4 h-4" /> Notes
                  </h4>
                  {app.notes ? (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {app.notes}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No notes added.</p>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ApplicationDetailDrawer;
