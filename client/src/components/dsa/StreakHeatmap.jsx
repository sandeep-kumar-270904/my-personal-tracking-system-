import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Activity, Users, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const StreakHeatmap = () => {
  const { data: heatmapData, isLoading } = useQuery({
    queryKey: ['dsa', 'heatmap'],
    queryFn: async () => {
      const res = await api.get('/dsa/heatmap');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="h-40 bg-gray-900 rounded-2xl animate-pulse"></div>;
  }

  // Generate last 365 days
  const today = new Date();
  const days = [];
  const map = {};
  if (heatmapData) {
    heatmapData.forEach(d => {
      map[d.date] = d.count;
    });
  }

  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: map[dateStr] || 0
    });
  }

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-800';
    if (count === 1) return 'bg-cyan-900';
    if (count <= 3) return 'bg-cyan-700';
    if (count <= 5) return 'bg-cyan-500';
    return 'bg-cyan-400';
  };

  // Group by weeks (cols of 7)
  const weeks = [];
  let currentWeek = [];
  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return (
    <div className="mb-10 bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-500" />
          <h2 className="text-xl font-bold text-white">Consistency Heatmap</h2>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar pb-4">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day, dIdx) => (
                <motion.div
                  key={dIdx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (wIdx * 0.01) }}
                  className={`w-3.5 h-3.5 rounded-sm ${getColor(day.count)} hover:ring-2 hover:ring-white transition-all`}
                  title={`${day.date}: ${day.count} problems`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {/* Networking V5: Streak Share Opportunity */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-gradient-to-r from-pink-500/10 to-indigo-500/10 border border-pink-500/20 rounded-lg flex items-center gap-2">
            <Users className="w-4 h-4 text-pink-400" />
            <span className="text-xs text-slate-300">
              <strong className="text-white">7-Day Streak!</strong> Share this with your network to show consistency.
            </span>
            <button 
              onClick={() => window.location.href = '/networking'}
              className="ml-2 flex items-center gap-1 px-2 py-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
            >
              <Share2 className="w-3 h-3" /> Share
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3.5 h-3.5 rounded-sm bg-gray-800" />
            <div className="w-3.5 h-3.5 rounded-sm bg-cyan-900" />
            <div className="w-3.5 h-3.5 rounded-sm bg-cyan-700" />
            <div className="w-3.5 h-3.5 rounded-sm bg-cyan-500" />
            <div className="w-3.5 h-3.5 rounded-sm bg-cyan-400" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

export default StreakHeatmap;
