import { useQuery } from '@tanstack/react-query';
import { BookOpen, ArrowRight } from 'lucide-react';
import api from '../../services/api';

export default function PrepHubGapsSection({ resumeId }) {
  const { data: gapData, isLoading } = useQuery({
    queryKey: ['prephub-gaps', resumeId],
    queryFn: async () => {
      const { data } = await api.get(`/resumes/${resumeId}/prephub-gaps`);
      return data;
    },
    enabled: !!resumeId
  });

  if (isLoading || !gapData || !gapData.gaps || gapData.gaps.length === 0) return null;

  return (
    <div className="mt-6 border-t border-white/5 pt-6">
      <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-emerald-400" /> Learning Gaps & Recommendations
      </h4>
      <div className="space-y-3">
        {gapData.gaps.map((gap, idx) => (
          <div key={idx} className="bg-slate-900 border border-emerald-500/20 p-4 rounded-xl relative group overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 group-hover:bg-emerald-400 transition-colors" />
            <div className="pl-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-emerald-400 font-bold text-sm">{gap.skill}</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-white text-sm font-medium">{gap.moduleName}</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">{gap.actionItem}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
