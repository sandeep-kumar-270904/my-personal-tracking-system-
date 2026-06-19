import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, ArrowUpCircle, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const AdaptiveDifficultyBadge = ({ topic }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['dsa', 'adaptive-difficulty'],
    queryFn: async () => {
      const res = await api.get('/dsa/adaptive-difficulty');
      return res.data;
    }
  });

  if (isLoading || !data || !data[topic]) return null;

  const rec = data[topic];

  const getStyle = () => {
    switch(rec.difficultyTrend) {
      case 'READY_TO_LEVEL_UP': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'STRUGGLING': return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  const getIcon = () => {
    switch(rec.difficultyTrend) {
      case 'READY_TO_LEVEL_UP': return <ArrowUpCircle className="w-4 h-4" />;
      case 'STRUGGLING': return <AlertCircle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getStyle()}`}>
      {getIcon()}
      <span>
        {rec.difficultyTrend === 'READY_TO_LEVEL_UP' && `Level Up to ${rec.currentRecommendedDifficulty}`}
        {rec.difficultyTrend === 'STRUGGLING' && `Step Back to ${rec.currentRecommendedDifficulty}`}
        {rec.difficultyTrend === 'AT_RIGHT_LEVEL' && `Stay at ${rec.currentRecommendedDifficulty}`}
      </span>
      {rec.readinessScore > 0 && (
        <span className="ml-1 pl-2 border-l border-current opacity-70">
          Score: {rec.readinessScore}
        </span>
      )}
    </div>
  );
};

export default AdaptiveDifficultyBadge;
