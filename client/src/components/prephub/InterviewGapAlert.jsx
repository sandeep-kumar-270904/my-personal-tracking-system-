import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InterviewGapAlert = ({ activeCategory }) => {
  const navigate = useNavigate();

  const { data: rejectedInterviews = [] } = useQuery({
    queryKey: ['rejected_interviews_gap'],
    queryFn: async () => {
      const res = await api.get('/interviews');
      // Filter for rejected within the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      return res.data.filter(inv => 
        inv.status === 'rejected' && 
        new Date(inv.date) > thirtyDaysAgo &&
        inv.feedback && inv.feedback.length > 5
      );
    },
    // Only fetch if they are looking at "Interview Prep" or "All" tab
    enabled: activeCategory === 'All' || activeCategory === 'Interview Prep'
  });

  if (rejectedInterviews.length === 0) return null;

  // Just grab the most recent rejection
  const recentRejection = rejectedInterviews[0];

  return (
    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-6 flex items-start gap-4">
      <div className="bg-rose-500/20 p-2 rounded-lg shrink-0 mt-1">
        <ShieldAlert className="w-5 h-5 text-rose-400" />
      </div>
      <div className="flex-1">
        <h3 className="text-rose-400 font-bold mb-1">Interview Gap Detected: {recentRejection.company}</h3>
        <p className="text-slate-300 text-sm mb-3">
          Your recent feedback noted: "<span className="italic opacity-80">{recentRejection.feedback.substring(0, 100)}...</span>"
          <br/>
          We've adjusted your PrepHub recommendations to target these areas.
        </p>
        <button 
          onClick={() => {
            // navigate to AI recommender section or interview prep category
            if (activeCategory !== 'Interview Prep') {
              // Note: the parent component manages the active tab. So we can't switch it easily from here unless we pass a setter.
              // For now, let's just navigate to the interviews page to review it
              navigate('/interviews');
            }
          }}
          className="text-xs font-bold text-rose-400 bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 w-max"
        >
          Review Interview <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default InterviewGapAlert;
