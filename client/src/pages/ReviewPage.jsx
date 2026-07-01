import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

// Public page, so we don't necessarily use the auth api instance for GET if it's strictly public
const BASE_URL = 'http://localhost:5000/api/resumes/review';

export default function ReviewPage() {
  const { token } = useParams();
  const queryClient = useQueryClient();
  const containerRef = useRef(null);
  
  const [clickPos, setClickPos] = useState(null);
  const [draftComment, setDraftComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');

  // Fetch Resume Data
  const { data: resumeData, isLoading: isLoadingResume, isError } = useQuery({
    queryKey: ['reviewResume', token],
    queryFn: async () => {
      const { data } = await axios.get(`${BASE_URL}/${token}`);
      return data;
    },
    retry: false
  });

  // Fetch Existing Feedbacks
  const { data: feedbacks = [] } = useQuery({
    queryKey: ['reviewFeedbacks', token],
    queryFn: async () => {
      const { data } = await axios.get(`${BASE_URL}/${token}/feedbacks`);
      return data;
    },
    refetchInterval: 5000 // Poll for new comments
  });

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      await axios.post(`${BASE_URL}/${token}/feedback`, payload);
    },
    onSuccess: () => {
      toast.success('Feedback sent!');
      setClickPos(null);
      setDraftComment('');
      queryClient.invalidateQueries(['reviewFeedbacks', token]);
    },
    onError: () => toast.error('Failed to submit feedback')
  });

  const handleContainerClick = (e) => {
    // Ignore clicks on existing pins or the input form
    if (e.target.closest('.feedback-pin') || e.target.closest('.feedback-form')) return;
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setClickPos({ x, y });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draftComment.trim()) return;
    if (!clickPos) return;

    submitMutation.mutate({
      comment: draftComment,
      x: clickPos.x,
      y: clickPos.y,
      reviewerName: reviewerName.trim() || 'Anonymous'
    });
  };

  if (isLoadingResume) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Loading...</div>;
  if (isError) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">Invalid or expired link.</div>;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-10 relative overflow-x-hidden">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Reviewing {resumeData.userName}'s Resume</h1>
        <p className="text-slate-400">Click anywhere on the resume to leave a comment.</p>
      </div>

      <div 
        ref={containerRef}
        onClick={handleContainerClick}
        className="w-full max-w-[800px] min-h-[1056px] bg-white rounded-lg shadow-2xl relative cursor-crosshair mx-auto overflow-hidden border border-slate-800"
      >
        {/* Render PDF or plain text sections */}
        {resumeData.pdfUrl ? (
          <img src={resumeData.pdfUrl} alt="Resume" className="w-full h-auto pointer-events-none" />
        ) : (
          <div className="p-12 text-slate-900 pointer-events-none">
            <h1 className="text-4xl font-bold mb-8 text-center">{resumeData.name}</h1>
            {resumeData.sections?.map(s => (
              <div key={s._id} className="mb-6">
                <h2 className="text-xl font-semibold border-b border-slate-300 pb-2 mb-4 uppercase tracking-wider">{s.heading}</h2>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{s.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Existing Feedback Pins */}
        {feedbacks.map((fb, idx) => (
          <div 
            key={fb._id}
            className="feedback-pin absolute w-6 h-6 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${fb.coordinates.x}%`, top: `${fb.coordinates.y}%` }}
          >
            {idx + 1}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-slate-900 text-white p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">{fb.reviewerName}</span>
              <p className="text-sm leading-snug">{fb.comment}</p>
            </div>
          </div>
        ))}

        {/* New Feedback Form Popover */}
        {clickPos && (
          <div 
            className="feedback-form absolute bg-slate-900 p-4 rounded-xl shadow-2xl border border-white/10 w-72 z-50"
            style={{ 
              left: `${clickPos.x}%`, 
              top: `${clickPos.y}%`,
              transform: `translate(${clickPos.x > 80 ? '-100%' : '0'}, ${clickPos.y > 80 ? '-100%' : '0'})` // Prevent going off-screen
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-400"/> New Comment</h4>
              <button onClick={() => setClickPos(null)} className="text-slate-400 hover:text-white">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input 
                type="text" 
                placeholder="Your name (optional)" 
                value={reviewerName}
                onChange={e => setReviewerName(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <textarea 
                autoFocus
                placeholder="Leave your feedback..." 
                value={draftComment}
                onChange={e => setDraftComment(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 min-h-[80px] resize-none"
              />
              <button 
                type="submit" 
                disabled={submitMutation.isLoading || !draftComment.trim()}
                className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
              >
                <Send className="w-4 h-4" /> Post
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
