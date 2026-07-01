import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InterviewPrepSidebar = () => {
  const navigate = useNavigate();

  const { data: prepResources = [], isLoading } = useQuery({
    queryKey: ['interview_prep_checklist'],
    queryFn: async () => {
      // Fetch resources and completions
      const [resReq, compReq] = await Promise.all([
        api.get('/resources'),
        api.get('/resources/completed/me') // Assuming we have this endpoint, or we can just fetch all resources and map the user's completions. 
        // Wait, the /resources endpoint actually returns `hasCompleted` boolean directly per resource!
      ]);
      
      const resources = resReq.data.filter(r => r.category === 'Interview Prep');
      return resources;
    }
  });

  if (isLoading) {
    return <div className="h-48 bg-white/5 animate-pulse rounded-xl mt-6"></div>;
  }

  if (prepResources.length === 0) return null;

  const completedCount = prepResources.filter(r => r.hasCompleted).length;
  const progress = Math.round((completedCount / prepResources.length) * 100);

  // Take top 3 incomplete for recommendations
  const incomplete = prepResources.filter(r => !r.hasCompleted).slice(0, 3);

  return (
    <div className="bg-[#1a1b26] border border-white/5 rounded-xl p-5 mt-6">
      <h3 className="text-white font-bold mb-4 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-[#ff6b00]" />
        PrepHub Checklist
      </h3>

      <div className="mb-4">
        <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
          <span>{progress}% Completed</span>
          <span>{completedCount}/{prepResources.length} Resources</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#ff6b00] to-rose-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 mb-6 max-h-48 overflow-y-auto custom-scrollbar pr-2">
        {prepResources.map(res => (
          <div key={res._id} className="flex items-start gap-3">
            {res.hasCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm ${res.hasCompleted ? 'text-emerald-500 line-through opacity-70' : 'text-slate-300'}`}>
                {res.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {incomplete.length > 0 && (
        <div className="border-t border-white/5 pt-4">
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Before Next Interview</p>
          <div className="space-y-2">
            {incomplete.map(res => (
              <button 
                key={res._id}
                onClick={() => navigate(`/resources?preview=${res._id}`)}
                className="w-full text-left p-2 bg-[#13141f] hover:bg-white/5 border border-white/5 hover:border-[#ff6b00]/30 rounded-lg transition-colors text-sm text-slate-300 group"
              >
                <span className="group-hover:text-[#ff6b00] transition-colors line-clamp-1">{res.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrepSidebar;
