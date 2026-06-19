import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Target, Clock, ArrowRight, Brain, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import AdaptiveDifficultyBadge from './AdaptiveDifficultyBadge';

const TodaysMission = ({ onLogProblem, onReviewProblem, onStartSession }) => {
  const { data: recommendations, isLoading: recsLoading } = useQuery({
    queryKey: ['dsa', 'recommendations'],
    queryFn: async () => {
      const res = await api.get('/dsa/recommendations');
      return res.data;
    }
  });

  const { data: spacedRep, isLoading: spacedLoading } = useQuery({
    queryKey: ['dsa', 'spaced-repetition'],
    queryFn: async () => {
      const res = await api.get('/dsa/spaced-repetition');
      return res.data;
    }
  });

  const { data: overview } = useQuery({
    queryKey: ['dsa', 'overview'],
    queryFn: async () => {
      const res = await api.get('/dsa/overview');
      return res.data;
    }
  });

  const dailyTarget = 3; // Ideally fetched from goals
  const todayCount = overview?.todayCount || 0;
  const progress = Math.min(100, Math.round((todayCount / dailyTarget) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* Recommendations */}
      <div className="lg:col-span-5 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-cyan-500" />
          <h2 className="text-lg font-bold text-white">Suggested for You</h2>
        </div>
        <div className="space-y-4">
          {recsLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl"></div>)}
            </div>
          ) : recommendations?.length > 0 ? (
            recommendations.map((rec, idx) => (
              <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                      {rec.type.replace('_', ' ')}
                    </span>
                    {rec.difficulty && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                        {rec.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="mb-2">
                    <AdaptiveDifficultyBadge topic={rec.topic || 'Arrays'} />
                  </div>
                  <p className="text-sm text-gray-300 mb-3">{rec.reason}</p>
                </div>
                <button 
                  onClick={() => onLogProblem(rec)}
                  className="text-sm text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 self-start"
                >
                  Log problem <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No recommendations right now.</p>
          )}
        </div>
      </div>

      {/* Spaced Repetition */}
      <div className="lg:col-span-4 bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-bold text-white">Review Due Today</h2>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
          {spacedLoading ? (
             <div className="animate-pulse space-y-3">
               {[1, 2].map(i => <div key={i} className="h-14 bg-gray-800 rounded-xl"></div>)}
             </div>
          ) : spacedRep?.length > 0 ? (
            spacedRep.map(prob => (
              <div key={prob._id} className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white truncate w-40" title={prob.title}>{prob.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {prob.daysOverdue > 0 && (
                      <span className="text-xs flex items-center gap-1 text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> {prob.daysOverdue}d overdue
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{prob.confidenceLevel}</span>
                  </div>
                </div>
                <button 
                  onClick={() => onReviewProblem(prob)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors font-medium"
                >
                  Review
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">You're all caught up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Goal Progress */}
      <div className="lg:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-sm font-semibold text-gray-400 mb-6">TODAY'S TARGET</h2>
        
        <div className="relative w-32 h-32 mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="64" cy="64" r="56" className="stroke-gray-800" strokeWidth="12" fill="none" />
            <motion.circle 
              cx="64" cy="64" r="56" 
              className="stroke-cyan-500" 
              strokeWidth="12" 
              fill="none" 
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 1000" }}
              animate={{ strokeDasharray: `${(progress / 100) * 351.8} 1000` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{todayCount}</span>
            <span className="text-xs text-gray-500">of {dailyTarget}</span>
          </div>
        </div>

        <button 
          onClick={onStartSession}
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Clock className="w-4 h-4" /> Start focus session
        </button>
      </div>
    </div>
  );
};

export default TodaysMission;
