import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History, RotateCcw, Clock, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function VersionsTab({ resumeId, onPreviewVersion }) {
  const queryClient = useQueryClient();

  const { data: checkpoints = [], isLoading } = useQuery({
    queryKey: ['resumeCheckpoints', resumeId],
    queryFn: async () => {
      const { data } = await api.get(`/resumes/${resumeId}/checkpoints`);
      return data;
    },
    enabled: !!resumeId
  });

  const restoreMutation = useMutation({
    mutationFn: async (checkpointId) => {
      await api.post(`/resumes/${resumeId}/restore/${checkpointId}`);
    },
    onSuccess: () => {
      toast.success("Resume restored successfully!");
      queryClient.invalidateQueries(['resumeCheckpoints', resumeId]);
      queryClient.invalidateQueries(['resume', resumeId]);
      queryClient.invalidateQueries(['resumes']);
    },
    onError: () => toast.error("Failed to restore checkpoint")
  });

  const handleRestore = (checkpoint) => {
    if (window.confirm("Are you sure you want to restore this version? This will overwrite your current resume.")) {
      restoreMutation.mutate(checkpoint._id);
    }
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">Version History</h3>
      </div>

      <div className="bg-slate-900 border border-indigo-500/20 rounded-xl p-4 mb-6">
        <p className="text-sm text-slate-300 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-indigo-400" />
          Auto-save checkpoints are created every time you edit your resume sections.
        </p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-900 rounded-xl border border-white/5"></div>)}
        </div>
      ) : checkpoints.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-white/5">
          <History className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No versions yet</p>
          <p className="text-slate-500 text-sm mt-1">Start editing your resume to automatically save versions.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-indigo-500/20 ml-3 space-y-6">
          {checkpoints.map((cp, idx) => (
            <div key={cp._id} className="relative pl-6">
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500"></div>
              
              <div className="bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-colors rounded-xl p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{cp.commitMessage}</h4>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(cp.createdAt).toLocaleString()}
                      {idx === 0 && <span className="ml-2 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[10px] uppercase font-bold tracking-wider">Latest</span>}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => onPreviewVersion(JSON.parse(cp.sectionsSnapshot))}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Preview
                    </button>
                    {idx !== 0 && (
                      <button 
                        onClick={() => handleRestore(cp)}
                        disabled={restoreMutation.isLoading}
                        className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
