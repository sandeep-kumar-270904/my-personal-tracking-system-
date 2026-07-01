import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { BookOpen, Users, Clock, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CollectionsGrid = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const res = await api.get('/collections');
      return res.data;
    }
  });

  const enrollMutation = useMutation({
    mutationFn: async (id) => await api.post(`/collections/${id}/enroll`),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'badges'] });
      if (data.data?.isEnrolled) {
        toast.success('Successfully enrolled in collection!', { icon: '🎉' });
      } else {
        toast('Unenrolled from collection.', { icon: '👋' });
      }
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
        <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-slate-300 mb-2">No collections available</h3>
        <p className="text-slate-500">Check back later for curated learning paths.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map(col => (
        <motion.div
          key={col.id}
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col relative overflow-hidden group cursor-pointer hover:border-white/20 transition-all duration-300"
          onClick={() => navigate(`/resources/collections/${col.id}`)}
        >
          {/* Subtle gradient background based on difficulty/category could be added here */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">{col.name}</h3>
          <p className="text-slate-400 text-sm mb-6 flex-grow">{col.tagline}</p>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex flex-col">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><BookOpen className="w-3 h-3"/> Resources</span>
              <span className="text-slate-200 font-medium">{col.resourceCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Est. Time</span>
              <span className="text-slate-200 font-medium">{col.estimatedTime}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> Enrolled</span>
              <span className="text-slate-200 font-medium">{col.enrolledCount} students</span>
            </div>
          </div>

          {col.isEnrolled && (
            <div className="mb-6">
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
                <span>{col.completedCount} of {col.resourceCount} completed</span>
                <span className="text-emerald-400">{col.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#1a1b26] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: \`\${col.progress}%\` }}
                />
              </div>
            </div>
          )}

          <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
            {col.isEnrolled ? (
              <button 
                onClick={() => navigate(`/resources/collections/${col.id}`)}
                className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold rounded-xl transition-all border border-emerald-500/30 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" /> Continue Learning
              </button>
            ) : (
              <button 
                onClick={() => enrollMutation.mutate(col.id)}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all border border-indigo-400/50 flex items-center justify-center gap-2"
              >
                Enroll Now
              </button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CollectionsGrid;
