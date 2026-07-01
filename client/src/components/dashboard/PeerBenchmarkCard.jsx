import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, Activity, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

const fetchBenchmarks = async () => {
  const { data } = await api.get('/benchmarks');
  return data;
};

const PeerBenchmarkCard = ({ user }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: fetchBenchmarks,
    retry: 1,
    enabled: !!user?.gradYear && !!user?.benchmarkOptIn
  });

  if (!user?.gradYear) {
    return (
      <div className="glass-card p-5 border border-white/5 bg-[#13141f]">
        <h3 className="font-bold text-white flex items-center gap-2 mb-2 text-sm">
          <Activity className="w-4 h-4 text-[#00f0ff]" /> How You Compare
        </h3>
        <p className="text-xs text-slate-400 mb-3">Set your graduation year in settings to see how you compare to your peers.</p>
      </div>
    );
  }

  if (!user?.benchmarkOptIn) {
    return (
      <div className="glass-card p-5 border border-white/5 bg-[#13141f]">
        <h3 className="font-bold text-white flex items-center gap-2 mb-2 text-sm">
          <Activity className="w-4 h-4 text-[#00f0ff]" /> How You Compare
        </h3>
        <p className="text-xs text-slate-400">You must opt-in to peer benchmarking in Settings (Data & Privacy) to view these insights.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-card p-5 border border-white/5 bg-[#13141f] animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-white/5 rounded"></div>
          <div className="h-10 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card p-5 border border-white/5 bg-[#13141f]">
        <h3 className="font-bold text-white flex items-center gap-2 mb-2 text-sm">
          <Activity className="w-4 h-4 text-[#00f0ff]" /> How You Compare
        </h3>
        <div className="text-xs text-amber-400 flex items-start gap-1.5 mt-2 bg-amber-500/10 p-2 rounded border border-amber-500/20">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error.response?.data?.message || 'Data not available yet.'}</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { deltas } = data;

  const renderDelta = (delta, label) => {
    const isPositive = delta > 0;
    const isNeutral = delta === 0;

    return (
      <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
        <span className="text-xs text-slate-400">{label}</span>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-emerald-400' : isNeutral ? 'text-slate-500' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : isNeutral ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {isPositive ? '+' : ''}{delta} {isNeutral && 'Average'}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-5 border border-[#00f0ff]/10 bg-[#13141f] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-[#00f0ff]/5 rounded-bl-full blur-xl group-hover:bg-[#00f0ff]/10 transition-colors"></div>
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
          <Activity className="w-4 h-4 text-[#00f0ff]" /> How You Compare
        </h3>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold bg-white/5 px-2 py-0.5 rounded">Class of '{data.cohortStats.year.slice(-2)}</span>
      </div>

      <div className="space-y-1 relative z-10">
        {renderDelta(deltas.applications, "Apps this month")}
        {renderDelta(deltas.dsaSolved, "DSA Solved")}
        {renderDelta(deltas.interviewConversion, "Interview Conv. %")}
      </div>
      
      <p className="text-[10px] text-slate-600 mt-3 text-center">
        Based on anonymized aggregated data.
      </p>
    </div>
  );
};

export default PeerBenchmarkCard;
