import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Bookmark, Code, Database, Monitor, Server, Briefcase, BookOpen, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const getIconComponent = (iconName) => {
  switch(iconName) {
    case 'Code': return Code;
    case 'Monitor': return Monitor;
    case 'Server': return Server;
    case 'Database': return Database;
    case 'Briefcase': return Briefcase;
    default: return BookOpen;
  }
};

const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Beginner': return 'bg-[#22c55e] text-white';
    case 'Intermediate': return 'bg-[#eab308] text-gray-900';
    case 'Advanced': return 'bg-[#ef4444] text-white';
    default: return 'bg-gray-500 text-white';
  }
};

const DailySpotlight = () => {
  const queryClient = useQueryClient();
  const [isDismissed, setIsDismissed] = useState(true);

  // Check sessionStorage on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem('spotlight_dismissed');
    setIsDismissed(dismissed === 'true');
  }, []);

  const { data: spotlight, isLoading } = useQuery({
    queryKey: ['spotlight'],
    queryFn: async () => {
      const res = await api.get('/resources/spotlight');
      return res.data;
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/resources/${id}/bookmark`);
      return { id, data: res.data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['spotlight']);
      queryClient.invalidateQueries(['resources']);
    }
  });

  const handleDismiss = () => {
    sessionStorage.setItem('spotlight_dismissed', 'true');
    setIsDismissed(true);
  };

  if (isLoading || !spotlight || isDismissed) return null;

  const Icon = getIconComponent(spotlight.icon);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, height: 0, marginTop: 0 }}
        className="w-full relative mb-8 rounded-2xl overflow-hidden shadow-2xl border border-indigo-500/20"
      >
        {/* Background Gradient & Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] z-0"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(99,102,241,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_linear_infinite] z-0 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6">
          <button 
            onClick={handleDismiss} 
            className="absolute top-3 right-3 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors z-20"
            title="Dismiss for today"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Left Side: Icon */}
          <div className="shrink-0 flex items-center justify-center w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
            <Icon className="w-10 h-10 text-indigo-400" />
          </div>

          {/* Center: Info */}
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                ⚡ TODAY'S SPOTLIGHT
              </span>
              <span className="px-2 py-0.5 bg-white/5 text-slate-300 rounded text-[10px] font-bold border border-white/10 uppercase tracking-wider">
                {spotlight.category}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(spotlight.difficulty)}`}>
                {spotlight.difficulty}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1.5 truncate">
              {spotlight.title}
            </h2>
            <p className="text-sm text-indigo-200/70 truncate w-full max-w-3xl">
              {spotlight.description}
            </p>
          </div>

          {/* Right Side: Actions & Stats */}
          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-4">
            <div className="hidden lg:flex items-center gap-3 text-xs font-bold text-slate-400 bg-black/20 px-3 py-2 rounded-xl border border-white/5">
              <span className="flex items-center gap-1.5"><ThumbsUp className="w-3.5 h-3.5 text-indigo-400" /> {spotlight.upvoteCount}</span>
              <span className="w-1 h-1 rounded-full bg-white/20"></span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {spotlight.completionCount}</span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => bookmarkMutation.mutate(spotlight._id)}
                className={`p-3 rounded-xl transition-all border ${
                  spotlight.hasBookmarked ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:bg-white/10'
                }`}
                title={spotlight.hasBookmarked ? "Saved" : "Save for Later"}
              >
                <Bookmark className="w-5 h-5" fill={spotlight.hasBookmarked ? "currentColor" : "none"} />
              </button>
              
              <a 
                href={spotlight.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all border border-indigo-400/20"
              >
                Open Resource <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailySpotlight;
