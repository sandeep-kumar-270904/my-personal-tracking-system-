import { useQuery } from '@tanstack/react-query';
import { ThumbsUp, ThumbsDown, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export default function InterviewSignalsSection({ resumeId }) {
  const { data: signals = [], isLoading } = useQuery({
    queryKey: ['interviewResumeSignals', resumeId],
    queryFn: async () => {
      // Actually, wait, is there an endpoint to get the signals? I haven't written the GET endpoint for signals yet!
      const { data } = await api.get(`/resumes/${resumeId}/interview-signals`);
      return data;
    },
    enabled: !!resumeId
  });

  if (isLoading) return <div className="text-slate-500 animate-pulse mt-6">Loading Interview Signals...</div>;
  if (!signals || signals.length === 0) return null;

  return (
    <div className="mt-8">
      <h4 className="text-lg font-semibold text-white mb-4">Interview Feedback Signals</h4>
      <div className="space-y-3">
        {signals.map(signal => {
          let Icon = AlertCircle;
          let color = 'text-slate-400';
          let bg = 'bg-slate-500/10 border-slate-500/20';

          if (signal.signalType === 'POSITIVE') {
            Icon = ThumbsUp;
            color = 'text-emerald-400';
            bg = 'bg-emerald-500/10 border-emerald-500/20';
          } else if (signal.signalType === 'NEGATIVE') {
            Icon = ThumbsDown;
            color = 'text-red-400';
            bg = 'bg-red-500/10 border-red-500/20';
          } else if (signal.signalType === 'MISSING_SKILL') {
            Icon = AlertCircle;
            color = 'text-amber-400';
            bg = 'bg-amber-500/10 border-amber-500/20';
          } else if (signal.signalType === 'STRENGTH_CONFIRMED') {
            Icon = CheckCircle2;
            color = 'text-indigo-400';
            bg = 'bg-indigo-500/10 border-indigo-500/20';
          }

          return (
            <div key={signal._id} className={`flex items-start gap-3 p-3 rounded-xl border ${bg}`}>
              <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
              <div>
                <p className={`text-sm ${color}`}>{signal.content}</p>
                {signal.interviewId?.company && (
                  <p className="text-[10px] text-slate-500 uppercase mt-1 tracking-wider">
                    From {signal.interviewId.company} Interview
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
