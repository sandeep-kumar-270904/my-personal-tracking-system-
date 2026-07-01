import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Target, TrendingUp, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const formatBriefText = (text) => {
  // Simple markdown-to-html for bolding **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const WeeklyBriefBanner = () => {
  const queryClient = useQueryClient();

  const { data: brief, isLoading } = useQuery({
    queryKey: ['weeklyBrief'],
    queryFn: async () => {
      const res = await api.get('/networking/weekly-brief/current');
      return res.data;
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (id) => {
      await api.patch(`/networking/weekly-brief/${id}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['weeklyBrief']);
    }
  });

  if (isLoading || !brief) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="mb-6 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#ff6b00]/20 via-[#1a110b] to-orange-900/30 border border-[#ff6b00]/30 rounded-xl p-6 relative shadow-[0_0_40px_-10px_rgba(255,107,0,0.3)] backdrop-blur-xl">
          <button 
            onClick={() => dismissMutation.mutate(brief._id)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="bg-[#ff6b00]/20 p-3 rounded-xl shrink-0 mt-1 shadow-[0_0_20px_rgba(255,107,0,0.4)]">
              <Sparkles className="text-[#ff6b00]" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                Your AI Weekly Brief <span className="text-slate-400 font-normal text-sm ml-2">— Week of {new Date(brief.weekStartDate).toLocaleDateString()}</span>
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-4xl whitespace-pre-line mb-5">
                {formatBriefText(brief.briefContent)}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors border border-white/10 backdrop-blur-sm">
                  <Users size={14} /> Review contacts to follow up
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors border border-white/10 backdrop-blur-sm">
                  <TrendingUp size={14} /> See response rate trend
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-[#ff6b00]/20 hover:bg-[#ff6b00]/40 text-[#ffaa66] text-xs font-medium rounded-lg transition-colors border border-[#ff6b00]/40 shadow-[0_0_15px_rgba(255,107,0,0.2)]">
                  <Target size={14} /> Set this week's goals
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeeklyBriefBanner;
