import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Share2, CheckCircle2, MessageSquare, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function FeedbackTab({ resumeId }) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareLink, setShareLink] = useState('');

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['resumeFeedback', resumeId],
    queryFn: async () => {
      const { data } = await api.get(`/resumes/${resumeId}/feedback`);
      return data;
    },
    enabled: !!resumeId
  });

  const generateLinkMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/resumes/${resumeId}/review-link`);
      return data.link;
    },
    onSuccess: (link) => {
      const fullUrl = `${window.location.origin}${link}`;
      setShareLink(fullUrl);
      navigator.clipboard.writeText(fullUrl);
      toast.success("Link generated and copied!");
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ feedbackId, resolved }) => {
      await api.put(`/resumes/${resumeId}/feedback/${feedbackId}/resolve`, { resolved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['resumeFeedback', resumeId]);
      toast.success("Feedback marked as resolved");
    }
  });

  const pendingFeedback = feedbacks.filter(f => !f.resolved);
  const resolvedFeedback = feedbacks.filter(f => f.resolved);

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-white">Review Feedback</h3>
        </div>
        <button
          onClick={() => generateLinkMutation.mutate()}
          disabled={generateLinkMutation.isLoading}
          className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Share for Review
        </button>
      </div>

      {shareLink && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
          <p className="text-xs text-indigo-300 mb-2">Share this link with peers or mentors:</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={shareLink} 
              className="flex-1 bg-slate-900 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-sm text-indigo-200 focus:outline-none"
            />
            <button 
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast.success("Copied!");
              }}
              className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg text-sm font-medium transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-900 rounded-xl"></div>)}
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-white/5">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No feedback yet</p>
          <p className="text-slate-500 text-sm mt-1">Share your resume to get feedback from others.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingFeedback.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wider">Pending ({pendingFeedback.length})</h4>
              <div className="space-y-3">
                {pendingFeedback.map(fb => (
                  <div key={fb._id} className="bg-slate-900 border border-indigo-500/20 rounded-xl p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-indigo-400">{fb.reviewerName}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(fb.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{fb.comment}</p>
                      </div>
                      <button 
                        onClick={() => resolveMutation.mutate({ feedbackId: fb._id, resolved: true })}
                        className="p-1.5 hover:bg-emerald-500/20 text-emerald-500/50 hover:text-emerald-400 rounded-lg transition-colors tooltip tooltip-left"
                        data-tip="Mark as resolved"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolvedFeedback.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-500 mb-3 uppercase tracking-wider">Resolved ({resolvedFeedback.length})</h4>
              <div className="space-y-3 opacity-60">
                {resolvedFeedback.map(fb => (
                  <div key={fb._id} className="bg-slate-900 border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-400">{fb.reviewerName}</span>
                          <span className="text-xs text-slate-500">{new Date(fb.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-slate-400 line-through">{fb.comment}</p>
                      </div>
                      <button 
                        onClick={() => resolveMutation.mutate({ feedbackId: fb._id, resolved: false })}
                        className="text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Reopen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
