import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Check, X, Bell } from 'lucide-react';
import api from '../../services/api';

const SuggestionsPanel = () => {
  const queryClient = useQueryClient();
  
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const res = await api.get('/applications/suggestions');
      return res.data;
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (id) => {
      await api.put(`/applications/suggestions/${id}`, { isDismissed: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suggestions']);
    }
  });

  if (isLoading) return <div className="p-4 text-center text-slate-400">Loading suggestions...</div>;
  
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
        No active suggestions.
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <h3 className="font-bold text-white mb-2 flex items-center gap-2"><Bell className="w-4 h-4 text-[#ff6b00]" /> Smart Suggestions</h3>
      {suggestions.map(s => (
        <div key={s._id} className="bg-[#1a1b26] border border-white/10 rounded-xl p-3 shadow-lg flex gap-3 relative">
          <div className="mt-1">
            {s.suggestionType === 'FOLLOW_UP' ? <span className="text-amber-400">⏰</span> :
             s.suggestionType === 'ARCHIVE' ? <span className="text-slate-400">📦</span> :
             <span className="text-emerald-400">💡</span>}
          </div>
          <div>
            <p className="text-sm text-slate-200">{s.message}</p>
            <div className="flex gap-2 mt-2">
              {s.actionEndpoint && (
                <button className="text-xs font-semibold text-[#ff6b00] hover:underline flex items-center gap-1">
                  <Check className="w-3 h-3" /> Take Action
                </button>
              )}
              <button onClick={() => dismissMutation.mutate(s._id)} className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
                <X className="w-3 h-3" /> Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SuggestionsPanel;
