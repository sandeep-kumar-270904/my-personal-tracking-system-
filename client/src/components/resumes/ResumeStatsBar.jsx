import { motion } from 'framer-motion';
import { FileText, Layers, Award, Target, CheckCircle2 } from 'lucide-react';

export default function ResumeStatsBar({ stats, isLoading }) {
  const cards = [
    { label: 'Total Resumes', value: stats?.totalResumes || 0, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Versions', value: stats?.totalVersions || 0, icon: Layers, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { 
      label: 'Most Used', 
      value: stats?.mostUsedResume?.name || 'N/A', 
      subValue: stats?.mostUsedResume ? `${stats.mostUsedResume.count} apps` : '',
      icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/10' 
    },
    { 
      label: 'Best Performer', 
      value: stats?.bestPerformingResume?.name || 'N/A', 
      subValue: stats?.bestPerformingResume ? `${Math.round(stats.bestPerformingResume.rate * 100)}% rate` : '',
      icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' 
    },
    { label: 'Avg ATS Score', value: stats?.avgATSScore || 0, icon: CheckCircle2, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center relative overflow-hidden group"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-xl ${c.bg} ${c.color}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-400">{c.label}</span>
          </div>
          
          <div className="mt-1 flex flex-col">
            {isLoading ? (
              <div className="h-8 w-16 bg-white/10 animate-pulse rounded"></div>
            ) : (
              <span className="text-2xl font-bold text-white truncate" title={String(c.value)}>
                {c.value}
              </span>
            )}
            {!isLoading && c.subValue && (
               <span className="text-xs text-slate-400 mt-1">{c.subValue}</span>
            )}
          </div>

          <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <c.icon className={`w-24 h-24 ${c.color}`} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
