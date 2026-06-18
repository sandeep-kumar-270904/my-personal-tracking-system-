import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Brain, ThumbsUp, ThumbsDown, Zap } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const PredictionTab = ({ applicationId, currentStatus }) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const { data: prediction, isLoading, isError } = useQuery({
    queryKey: ['prediction', applicationId],
    queryFn: async () => {
      const res = await api.post(`/applications/${applicationId}/predict-outcome`);
      return res.data;
    },
    enabled: !!applicationId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const feedbackMutation = useMutation({
    mutationFn: async (wasCorrect) => {
      await api.post(`/applications/${applicationId}/prediction-feedback`, {
        predictedOutcome: prediction.predictedOutcome,
        actualOutcome: currentStatus,
        wasCorrect
      });
    },
    onSuccess: () => {
      setFeedbackGiven(true);
      toast.success('Feedback recorded. Model will improve!');
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Brain className="w-12 h-12 text-[#ff6b00] animate-pulse" />
        <p className="text-slate-400 font-medium animate-pulse">Consulting the oracle...</p>
      </div>
    );
  }

  if (isError || !prediction) {
    return <div className="text-red-400 p-4 bg-red-500/10 rounded-xl">Failed to load prediction.</div>;
  }

  if (prediction.notEnoughData) {
    return (
      <div className="text-slate-300 p-6 bg-white/5 rounded-xl text-center border border-white/10">
        <Brain className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <h3 className="font-bold text-lg mb-2">Not Enough Data</h3>
        <p className="text-sm text-slate-400">{prediction.message}</p>
      </div>
    );
  }

  const outcomeColors = {
    'LIKELY_POSITIVE': 'text-emerald-400',
    'UNCERTAIN': 'text-amber-400',
    'LIKELY_REJECTION': 'text-red-400'
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#1a1b26] to-[#13141f] border border-[#ff6b00]/20 p-6 rounded-2xl shadow-[0_0_20px_rgba(255,107,0,0.1)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff6b00]/10 blur-[40px] rounded-full mix-blend-screen pointer-events-none"></div>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#ff6b00]/20 rounded-xl text-[#ff6b00]">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">AI Prediction</h3>
            <p className="text-xs text-[#ff6b00] font-medium tracking-wider uppercase">Confidence: {prediction.confidence}%</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Expected Outcome</p>
            <p className={`text-xl font-bold ${outcomeColors[prediction.predictedOutcome] || 'text-slate-200'}`}>
              {prediction.predictedOutcome.replace('_', ' ')}
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Key Factor</p>
            <p className="text-sm text-slate-300 leading-relaxed">{prediction.keyFactor}</p>
          </div>

          <div className="bg-[#ff6b00]/10 p-4 rounded-xl border border-[#ff6b00]/20">
            <p className="text-xs text-[#ff6b00] uppercase tracking-wider font-bold flex items-center gap-1 mb-1">
              <Zap className="w-3 h-3" /> Recommendation
            </p>
            <p className="text-sm text-slate-200 font-medium">{prediction.recommendation}</p>
          </div>
        </div>
      </div>

      {(currentStatus === 'OFFER' || currentStatus === 'REJECTED') && !feedbackGiven && (
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
          <p className="text-sm text-slate-300 mb-3">Application is concluded. Was this prediction correct?</p>
          <div className="flex justify-center gap-3">
            <button 
              onClick={() => feedbackMutation.mutate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium"
            >
              <ThumbsUp className="w-4 h-4" /> Yes
            </button>
            <button 
              onClick={() => feedbackMutation.mutate(false)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
            >
              <ThumbsDown className="w-4 h-4" /> No
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionTab;
