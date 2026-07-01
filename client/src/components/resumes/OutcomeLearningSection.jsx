import { useQuery } from '@tanstack/react-query';
import { Target, TrendingUp, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export default function OutcomeLearningSection({ resumeId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['outcomeLearning', resumeId],
    queryFn: async () => {
      const res = await api.get(`/resumes/${resumeId}/outcome-learning`);
      return res.data;
    },
    enabled: !!resumeId
  });

  if (isLoading) return <div className="text-slate-500 animate-pulse mt-6">Loading Application Outcomes...</div>;
  if (!data || data.terminalApps === 0) return null;

  const winRate = data.terminalApps > 0 ? Math.round((data.offers / data.terminalApps) * 100) : 0;

  return (
    <div className="mt-8">
      <h4 className="text-lg font-semibold text-white mb-4">What works for this resume</h4>
      
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{data.totalApps}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total Uses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">{data.offers}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Offers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-400">{winRate}%</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Win Rate</p>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          {data.insights?.map(insight => (
            <div key={insight._id} className={`flex items-start gap-3 p-3 rounded-xl border ${insight.actionType === 'REINFORCE' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
              {insight.actionType === 'REINFORCE' ? (
                <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              )}
              <div>
                <p className={`text-sm ${insight.actionType === 'REINFORCE' ? 'text-emerald-200' : 'text-amber-200'}`}>{insight.insight}</p>
                {insight.applicationId?.company && (
                  <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">
                    {insight.actionType} • Based on {insight.applicationId.company} {insight.applicationId.role}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
