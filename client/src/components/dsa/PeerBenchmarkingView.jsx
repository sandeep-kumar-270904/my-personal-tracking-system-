import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Target, Trophy } from 'lucide-react';
import api from '../../services/api';

const PeerBenchmarkingView = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['dsa', 'benchmarks'],
    queryFn: async () => {
      const res = await api.get('/dsa/benchmarks');
      return res.data;
    }
  });

  if (isLoading) return <div className="h-48 bg-gray-900 rounded-2xl animate-pulse"></div>;
  if (!data) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
      
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 relative z-10">
        <Users className="w-5 h-5 text-cyan-400" />
        Cohort Benchmark (Class of {data.cohortYear})
      </h3>

      <div className="flex items-end gap-4 mb-8 relative z-10">
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-500">
          {data.percentileRank}
          <span className="text-2xl text-gray-400 font-bold ml-1">th</span>
        </div>
        <div className="text-gray-400 pb-1 font-medium">Percentile overall</div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Total Solved</span>
            <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">You: {data.userMetrics.totalProblems}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 rounded-full" 
                style={{ width: `${Math.min(100, (data.userMetrics.totalProblems / data.cohortMedians.medianProblemsPerWeek) * 20)}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">Med: {data.cohortMedians.medianProblemsPerWeek * 10}</span>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Patterns Mastered</span>
            <span className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">You: {data.userMetrics.patternsMastered}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-400 rounded-full" 
                style={{ width: `${Math.min(100, (data.userMetrics.patternsMastered / data.cohortMedians.medianPatternsMastered) * 50)}%` }}
              ></div>
            </div>
            <span className="text-xs text-gray-500">Med: {data.cohortMedians.medianPatternsMastered}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-sm">
          <Target className="w-4 h-4 text-emerald-400" />
          <span className="text-gray-300">Pace to top 10%:</span>
        </div>
        <span className="font-bold text-white">{data.paceToTarget} problems / day</span>
      </div>
    </div>
  );
};

export default PeerBenchmarkingView;
