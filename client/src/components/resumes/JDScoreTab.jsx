import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Award, AlertTriangle, MessageSquare, Briefcase, TrendingUp, ChevronDown, ChevronUp, CheckCircle2, AlertOctagon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function JDScoreTab({ resumeId }) {
  const queryClient = useQueryClient();
  const [jdText, setJdText] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Fetch score history
  const { data: scores = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['jdScores', resumeId],
    queryFn: async () => {
      const { data } = await api.get(`/resumes/${resumeId}/jd-scores`);
      return data;
    },
    enabled: !!resumeId
  });

  const currentScore = scores[0];

  const scoreMutation = useMutation({
    mutationFn: async (text) => {
      const { data } = await api.post(`/resumes/${resumeId}/jd-score`, { jdText: text });
      return data;
    },
    onSuccess: () => {
      toast.success("Resume scored successfully!");
      queryClient.invalidateQueries(['jdScores', resumeId]);
      setJdText('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to score resume against JD');
    }
  });

  const handleScore = () => {
    if (!jdText.trim()) return toast.error("Please paste a Job Description");
    scoreMutation.mutate(jdText);
  };

  const getVerdictColor = (verdict) => {
    switch(verdict) {
      case 'STRONG PASS': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PASS': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'BORDERLINE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'REJECT': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const DimensionBar = ({ label, score, icon: Icon, colorClass }) => (
    <div className="mb-4">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" /> {label}
        </span>
        <span className="text-sm font-bold text-white">{score}/10</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${colorClass}`}
        />
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">Score against JD</h3>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-xl p-4 mb-8">
        <label className="block text-sm font-medium text-slate-300 mb-2">Paste Job Description</label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste the full job description here to see how well this resume matches..."
          className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none mb-3"
        />
        <button
          onClick={handleScore}
          disabled={scoreMutation.isLoading || !jdText.trim()}
          className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
        >
          {scoreMutation.isLoading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Scoring...</>
          ) : (
            <><Target className="w-4 h-4"/> Analyze Fit</>
          )}
        </button>
      </div>

      {currentScore && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header Verdict */}
            <div className={`p-6 rounded-2xl border ${getVerdictColor(currentScore.verdict)} flex items-start justify-between`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">Final Verdict</p>
                <h4 className="text-2xl font-bold mb-1">{currentScore.verdict}</h4>
                <p className="text-sm opacity-90">{currentScore.companyName} • {currentScore.jobTitle}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">Overall Fit</p>
                <span className="text-3xl font-black">{currentScore.overallScore}%</span>
              </div>
            </div>

            {/* Assessment Blockquote */}
            <div className="bg-slate-800/30 border-l-4 border-indigo-500 p-4 rounded-r-xl">
               <div className="flex items-start gap-3">
                 <MessageSquare className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0"/>
                 <div>
                   <p className="text-sm font-medium text-slate-200 mb-1">Hiring Manager Assessment</p>
                   <p className="text-sm text-slate-400 leading-relaxed italic">"{currentScore.assessment}"</p>
                 </div>
               </div>
            </div>

            {/* Dimensions Grid */}
            <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-slate-200 mb-5">Scoring Breakdown</h4>
              <DimensionBar label="Technical Fit" score={currentScore.dimensions.technicalFit} icon={Briefcase} colorClass="bg-blue-500" />
              <DimensionBar label="Experience Relevance" score={currentScore.dimensions.experienceRelevance} icon={TrendingUp} colorClass="bg-indigo-500" />
              <DimensionBar label="Communication Quality" score={currentScore.dimensions.communicationQuality} icon={MessageSquare} colorClass="bg-purple-500" />
              <DimensionBar label="Standout Factor" score={currentScore.dimensions.standoutFactor} icon={Award} colorClass="bg-amber-500" />
              <DimensionBar label="Red Flags (10 = None)" score={currentScore.dimensions.redFlags} icon={AlertOctagon} colorClass={currentScore.dimensions.redFlags < 5 ? 'bg-red-500' : 'bg-emerald-500'} />
              <DimensionBar label="Hire Likelihood" score={currentScore.dimensions.overallHireLikelihood} icon={CheckCircle2} colorClass="bg-emerald-500" />
            </div>

            {/* Improvement Points */}
            <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> To make this a Strong Pass:
              </h4>
              <ul className="space-y-3">
                {currentScore.improvementPoints.map((point, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <span className="text-indigo-400 font-bold mt-0.5">{i+1}.</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

          </motion.div>
        </AnimatePresence>
      )}

      {/* Score History */}
      {scores.length > 1 && (
        <div className="mt-8 border-t border-white/10 pt-6">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full text-sm font-medium text-slate-300 hover:text-white transition-colors mb-4"
          >
            <span>Score History ({scores.length - 1} previous)</span>
            {showHistory ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
          </button>
          
          <AnimatePresence>
            {showHistory && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-3"
              >
                {scores.slice(1).map(score => (
                  <div key={score._id} className="bg-slate-900 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{score.companyName} - {score.jobTitle}</p>
                      <p className="text-xs text-slate-500">{new Date(score.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getVerdictColor(score.verdict)}`}>
                        {score.verdict}
                      </span>
                      <p className="text-lg font-black text-white mt-1">{score.overallScore}%</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </div>
  );
}
