import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Code2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function DSASkillSuggestionPanel() {
  const queryClient = useQueryClient();

  const { data: suggestions = [] } = useQuery({
    queryKey: ['dsaSyncSuggestions'],
    queryFn: async () => {
      const { data } = await api.get('/resumes/dsa-sync-suggestions');
      return data;
    },
    refetchInterval: 10000 // poll every 10s
  });

  const acceptMutation = useMutation({
    mutationFn: async (id) => {
      await api.post(`/resumes/dsa-sync-suggestions/${id}/accept`);
    },
    onSuccess: () => {
      toast.success("Skill added to your resume!");
      queryClient.invalidateQueries(['dsaSyncSuggestions']);
      queryClient.invalidateQueries(['resumes']); // Refresh resumes to see new sections/scores
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (id) => {
      await api.post(`/resumes/dsa-sync-suggestions/${id}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dsaSyncSuggestions']);
    }
  });

  if (suggestions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 max-w-sm w-full">
      {suggestions.map((suggestion) => (
        <div key={suggestion._id} className="bg-slate-900 border border-indigo-500/30 rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex gap-3">
            <div className="mt-1 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">DSA Skill Unlocked</h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                You've solved {suggestion.problemCountAtSync}+ {suggestion.skillAdded} problems. 
                Want to add <span className="font-semibold text-indigo-300">{suggestion.skillAdded} ({suggestion.proficiencyLevel})</span> to your <span className="text-white">{suggestion.resumeId?.name || 'Resume'}</span> Skills section?
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => acceptMutation.mutate(suggestion._id)}
                  disabled={acceptMutation.isLoading || dismissMutation.isLoading}
                  className="flex-1 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3" /> Accept
                </button>
                <button 
                  onClick={() => dismissMutation.mutate(suggestion._id)}
                  disabled={acceptMutation.isLoading || dismissMutation.isLoading}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" /> Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
