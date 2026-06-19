import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, ChevronRight, TrendingDown, Target, Zap } from 'lucide-react';
import api from '../../services/api';

const BehavioralInsightsCard = () => {
  // Normally this would be a GET endpoint that fetches the latest analysis
  // For the sake of UI, let's assume we can trigger/get it via POST or GET.
  // I'll use a GET here and assume the backend can return the latest or trigger one.
  // Actually, let's just trigger it once and cache it.
  const { data, isLoading } = useQuery({
    queryKey: ['dsa', 'behavior-analysis'],
    queryFn: async () => {
      const res = await api.post('/dsa/analyze-behavior');
      return res.data;
    },
    staleTime: 1000 * 60 * 60 * 24 // 24 hours
  });

  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-64 animate-pulse flex flex-col items-center justify-center">
        <Activity className="w-8 h-8 text-gray-700 mb-2" />
        <span className="text-gray-600 text-sm">Analyzing behavior patterns...</span>
      </div>
    );
  }

  if (!data || !data.behaviorPatterns || data.behaviorPatterns.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-indigo-400" />
          <h2 className="text-lg font-bold text-white">Behavioral Insights</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">No specific behavioral anti-patterns detected.</p>
          <p className="text-gray-500 text-xs mt-1">Keep up the consistent practice!</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'MEDIUM': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'LOW': return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
      default: return 'border-gray-500/30 bg-gray-500/10 text-gray-400';
    }
  };

  const getIcon = (pattern) => {
    switch (pattern) {
      case 'AVOIDANCE': return <AlertTriangle className="w-4 h-4" />;
      case 'PLATEAU': return <TrendingDown className="w-4 h-4" />;
      case 'EASY_GRINDING': return <Target className="w-4 h-4" />;
      case 'SPEED_RUSHING': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Behavioral Insights</h2>
      </div>

      <div className="space-y-4">
        {data.behaviorPatterns.map((pattern, idx) => (
          <div key={idx} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${getSeverityColor(pattern.severity)}`}>
                  {getIcon(pattern.patternName)}
                  {pattern.patternName.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <p className="text-white text-sm font-medium mb-1">{pattern.insight}</p>
            <p className="text-gray-400 text-xs mb-3">{pattern.description}</p>
            
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 flex gap-2">
              <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-indigo-300 text-sm font-medium">{pattern.actionableAdvice}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BehavioralInsightsCard;
