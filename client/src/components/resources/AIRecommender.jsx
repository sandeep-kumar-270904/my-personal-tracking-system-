import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, BookOpen, Code, Database, Monitor, Server, Briefcase } from 'lucide-react';
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

const AIRecommender = ({ onPreview }) => {
  const { data: recommendations, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['resources', 'recommend'],
    queryFn: async () => {
      const res = await api.get('/resources/recommend');
      return res.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="mb-10 shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="relative">
              ✨ Recommended For You
              <span className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full z-[-1]" />
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">Based on your DSA gaps and interview performance</p>
        </div>
        <button 
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex overflow-x-auto gap-6 pb-4 -mx-8 px-8 custom-scrollbar hide-scrollbar snap-x">
        {isLoading || isFetching ? (
          [1,2,3,4].map(i => (
            <div key={i} className="min-w-[280px] md:min-w-[320px] h-48 bg-white/5 animate-pulse rounded-2xl border border-white/5 shrink-0 snap-start"></div>
          ))
        ) : isError ? (
          <div className="w-full py-8 text-center bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
            <p className="text-slate-400 mb-3">Complete some DSA problems or interviews to get personalized picks</p>
            <button onClick={() => refetch()} className="text-xs bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors">Try Again</button>
          </div>
        ) : recommendations?.length > 0 ? (
          recommendations.map(res => {
            const Icon = getIconComponent(res.icon);
            return (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="min-w-[280px] md:min-w-[320px] shrink-0 snap-start glass-card p-5 rounded-2xl border-y border-r border-white/5 border-l-[3px] border-l-indigo-500 hover:bg-white/[0.02] transition-all cursor-pointer flex flex-col relative"
                onClick={() => onPreview(res)}
              >
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-md text-[10px] font-bold uppercase border border-indigo-500/30">
                  <Sparkles className="w-3 h-3" /> AI Pick
                </div>

                <div className="flex items-center justify-end mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10`}>
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>

                <div className="mb-2 mt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getDifficultyColor(res.difficulty)}`}>
                    {res.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{res.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{res.description}</p>
              </motion.div>
            )
          })
        ) : (
          <div className="w-full py-8 text-center bg-white/5 rounded-2xl border border-white/10">
            <p className="text-slate-400">Complete some DSA problems or interviews to get personalized picks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommender;
