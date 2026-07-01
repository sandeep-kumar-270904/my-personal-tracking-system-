import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Trophy, AlertCircle, Percent, Hash } from 'lucide-react';
import api from '../../services/api';

export default function PeerBenchmarkSection({ resumeId }) {
  const { data: benchmark, isLoading, error } = useQuery({
    queryKey: ['benchmark', resumeId],
    queryFn: async () => {
      const { data } = await api.get(`/resumes/${resumeId}/benchmark`);
      return data;
    },
    enabled: !!resumeId,
    retry: false
  });

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mt-6 animate-pulse">
        <div className="h-6 bg-slate-800 w-1/3 rounded mb-4"></div>
        <div className="h-32 bg-slate-800 rounded-xl mb-4"></div>
      </div>
    );
  }

  if (error || !benchmark) {
    return (
      <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white">Peer Benchmarking</h3>
        </div>
        <p className="text-sm text-slate-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          {error?.response?.data?.message || 'Benchmarking data not available yet.'}
        </p>
      </div>
    );
  }

  const ComparisonBar = ({ label, userValue, peerValue, format = val => val, icon: Icon, inverse = false }) => {
    // Determine max value for the bar scale
    const max = Math.max(userValue, peerValue) * 1.2 || 10;
    const userPct = (userValue / max) * 100;
    const peerPct = (peerValue / max) * 100;
    
    // If inverse, lower is better (not used here, but good pattern)
    const isUserBetter = inverse ? userValue <= peerValue : userValue >= peerValue;

    return (
      <div className="mb-5">
        <div className="flex justify-between items-end mb-2">
          <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Icon className="w-4 h-4 text-slate-400" /> {label}
          </span>
        </div>
        <div className="space-y-2 relative">
          {/* User Bar */}
          <div className="flex items-center gap-3">
            <div className="w-16 text-right text-xs font-bold text-white">You ({format(userValue)})</div>
            <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${userPct}%` }}
                className={`h-full rounded-full ${isUserBetter ? 'bg-indigo-500' : 'bg-slate-500'}`}
              />
            </div>
          </div>
          {/* Peer Bar */}
          <div className="flex items-center gap-3">
            <div className="w-16 text-right text-xs font-medium text-slate-400">Avg ({format(peerValue)})</div>
            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden opacity-70">
              <motion.div 
                initial={{ width: 0 }} animate={{ width: `${peerPct}%` }}
                className="h-full bg-slate-600 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Peer Benchmarking</h3>
            <p className="text-sm text-slate-400">Comparing your resume against the Class of {benchmark.cohortYear}</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">Percentile Rank</p>
          <div className="flex items-center justify-end gap-2">
            <Trophy className={`w-5 h-5 ${benchmark.percentileRank >= 80 ? 'text-amber-400' : 'text-slate-400'}`} />
            <span className="text-2xl font-black text-white">{benchmark.percentileRank}th</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <ComparisonBar 
            label="Overall ATS Score" 
            userValue={benchmark.userATSScore} 
            peerValue={benchmark.peerMedianATSScore} 
            icon={TrendingUp}
          />
          <ComparisonBar 
            label="Section Completeness" 
            userValue={benchmark.userSectionCompleteness} 
            peerValue={benchmark.peerMedianSectionCompleteness} 
            format={v => Math.round(v)}
            icon={Percent}
          />
        </div>
        <div className="space-y-4">
          <ComparisonBar 
            label="Skills Detected" 
            userValue={benchmark.userSkillsCount} 
            peerValue={benchmark.peerMedianSkillsCount} 
            format={v => Math.round(v)}
            icon={Hash}
          />
          <ComparisonBar 
            label="Quantified Metrics" 
            userValue={benchmark.userQuantifiedAchievements} 
            peerValue={benchmark.peerMedianQuantifiedAchievements} 
            format={v => Math.round(v * 10) / 10}
            icon={Percent}
          />
        </div>
      </div>

      {benchmark.insights && benchmark.insights.length > 0 && (
        <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
          <h4 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Cohort Insights
          </h4>
          <ul className="space-y-2">
            {benchmark.insights.map((insight, idx) => (
              <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                <span className="text-indigo-500 mt-1">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
