import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export default function OfferLeverageCard({ offer }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedResume, setSelectedResume] = useState('');

  // Fetch resumes for the user to select which one to use for leverage
  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await api.get('/resumes');
      return res.data;
    }
  });

  const analyzeMutation = useMutation({
    mutationFn: async (resumeId) => {
      const res = await api.post(`/offers/${offer._id}/resume-leverage`, { resumeId });
      return res.data.leveragePoints;
    }
  });

  const handleAnalyze = () => {
    if (!selectedResume) return;
    analyzeMutation.mutate(selectedResume);
  };

  return (
    <div className="mt-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors"
      >
        <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
          <Sparkles className="w-4 h-4" />
          AI Negotiation Leverage
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-400" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-indigo-500/10">
          {!analyzeMutation.data ? (
            <div className="space-y-3">
              <p className="text-xs text-indigo-200">
                Select the resume you used to apply for this role. AI will find areas where you overqualify, giving you leverage points for salary negotiation.
              </p>
              <div className="flex gap-2">
                <select 
                  value={selectedResume} 
                  onChange={(e) => setSelectedResume(e.target.value)}
                  className="flex-1 bg-slate-900 border border-indigo-500/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-400"
                >
                  <option value="" disabled>Select Resume</option>
                  {resumes.map(r => (
                    <option key={r._id} value={r._id}>{r.name || r.originalName}</option>
                  ))}
                </select>
                <button 
                  onClick={handleAnalyze}
                  disabled={!selectedResume || analyzeMutation.isLoading}
                  className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {analyzeMutation.isLoading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-indigo-300 font-medium uppercase tracking-wider mb-2">Your Leverage Points</p>
              {analyzeMutation.data.map((point, idx) => (
                <div key={idx} className="flex gap-2 text-sm text-indigo-100 bg-[#13141f] p-3 rounded-lg border border-indigo-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                  <p>{point}</p>
                </div>
              ))}
              <button 
                onClick={() => analyzeMutation.reset()}
                className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 underline"
              >
                Analyze a different resume
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
