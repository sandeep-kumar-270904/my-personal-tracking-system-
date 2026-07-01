import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const PipelineKanban = ({ pipeline }) => {
  const columns = [
    { id: 'APPLIED', label: 'Applied', color: 'bg-blue-500', text: 'text-blue-500' },
    { id: 'OA_PENDING', label: 'OA Pending', color: 'bg-amber-500', text: 'text-amber-500' },
    { id: 'OA_DONE', label: 'OA Done', color: 'bg-indigo-500', text: 'text-indigo-500' },
    { id: 'INTERVIEW_SCHEDULED', label: 'Interview', color: 'bg-purple-500', text: 'text-purple-500' },
    { id: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-pink-500', text: 'text-pink-500' },
    { id: 'OFFER', label: 'Offer', color: 'bg-emerald-500', text: 'text-emerald-500' },
    { id: 'REJECTED', label: 'Rejected', color: 'bg-red-500', text: 'text-red-500' },
  ];

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-white mb-4">Application Pipeline</h3>
      
      {/* Custom horizontal scroll container */}
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'thin' }}>
        {columns.map((col, idx) => {
          const apps = pipeline?.[col.id] || [];
          const count = apps.length;
          
          return (
            <motion.div 
              key={col.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex-shrink-0 w-72 glass-card rounded-2xl border border-white/5 bg-[#111111] flex flex-col snap-start"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.color}`} />
                  <h4 className="font-bold text-white tracking-wide text-sm uppercase">{col.label}</h4>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-xs font-black ${col.color}/20 ${col.text}`}>
                  {count}
                </div>
              </div>
              
              {/* Cards */}
              <div className="p-3 flex flex-col gap-3 flex-1">
                {apps.slice(0, 3).map((app) => (
                  <Link to={`/applications?status=${col.id}`} key={app.id}>
                    <div className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group cursor-pointer">
                      <h5 className="font-bold text-slate-200 text-sm truncate">{app.company}</h5>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{app.role}</p>
                    </div>
                  </Link>
                ))}

                {count === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-6">
                    <p className="text-slate-500 text-xs italic">No applications</p>
                  </div>
                )}
                
                {count > 3 && (
                  <Link to={`/applications?status=${col.id}`} className="mt-auto pt-2">
                    <button className="w-full py-2 flex items-center justify-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                      View all {count} <ChevronRight className="w-3 h-3" />
                    </button>
                  </Link>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineKanban;
