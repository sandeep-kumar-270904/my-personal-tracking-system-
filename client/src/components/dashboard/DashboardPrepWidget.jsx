import { useQuery } from '@tanstack/react-query';
import { BookOpen, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';

const fetchPrepRecommendations = async () => {
  const { data } = await api.get('/resources/recommend');
  return data;
};

const DashboardPrepWidget = () => {
  const navigate = useNavigate();

  const { data: recommendations = [], isLoading, isError } = useQuery({
    queryKey: ['prepRecommendations'],
    queryFn: fetchPrepRecommendations,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="bg-[#13141f] border border-white/5 rounded-2xl p-6 h-[200px] flex items-center justify-center animate-pulse">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-full"></div>
          <div className="w-32 h-4 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || recommendations.length === 0) {
    // If no specific recommendations, show a generic prompt
    return (
      <div className="bg-gradient-to-br from-[#13141f] to-[#1a1b26] border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
        <div className="relative z-10 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Daily Prep Focus</h3>
          </div>
          <p className="text-slate-400 text-sm">Start practicing coding problems or reviewing concepts to get personalized recommendations.</p>
        </div>
        <button
          onClick={() => navigate('/resources')}
          className="w-full relative z-10 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors text-sm font-medium border border-white/10"
        >
          Explore Resources
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const topResource = recommendations[0];

  return (
    <div className="bg-gradient-to-br from-[#13141f] to-[#1a1b26] border border-[#ff6b00]/20 rounded-2xl p-6 relative overflow-hidden group h-full flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6b00]/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ff6b00]/20 text-[#ff6b00] rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Recommended for You</h3>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-white/5 text-slate-300 rounded-md border border-white/10">
            Based on your gaps
          </span>
        </div>

        <div className="bg-black/20 border border-white/5 rounded-xl p-4 mb-4 backdrop-blur-sm">
          <h4 className="text-white font-semibold line-clamp-1 mb-1">{topResource.title}</h4>
          <p className="text-slate-400 text-xs line-clamp-2 mb-3">{topResource.description}</p>
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-[#ff6b00]/10 text-[#ff6b00] rounded-md">{topResource.category}</span>
            <span className="px-2 py-1 bg-white/5 text-slate-300 rounded-md">{topResource.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex gap-2">
        <button
          onClick={() => window.open(topResource.url, '_blank')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ff6b00] hover:bg-[#ff6b00]/90 text-white rounded-xl transition-colors text-sm font-medium shadow-lg shadow-[#ff6b00]/20"
        >
          <Play className="w-4 h-4 fill-current" />
          Study Now
        </button>
        <button
          onClick={() => navigate('/resources')}
          className="flex items-center justify-center p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors border border-white/10"
          title="See all recommendations"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DashboardPrepWidget;
