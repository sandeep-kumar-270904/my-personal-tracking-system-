import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Crown, AlertTriangle, Layers, Play } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function BatchScoreModal({ isOpen, onClose, resumes, onTailorRequest }) {
  const queryClient = useQueryClient();
  const [jds, setJds] = useState(['', '', '', '', '']);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedResume, setSelectedResume] = useState('');
  const [results, setResults] = useState(null);

  const batchScoreMutation = useMutation({
    mutationFn: async () => {
      const payload = jds.filter(jd => jd.trim().length > 0);
      if (payload.length === 0) throw new Error("Please enter at least one JD");
      if (!selectedResume) throw new Error("Please select a resume");
      
      const { data } = await api.post(`/resumes/${selectedResume}/batch-jd-score`, { jds: payload });
      return data;
    },
    onSuccess: (data) => {
      toast.success("Batch scoring completed!");
      setResults(data);
      queryClient.invalidateQueries(['jdScores']);
    },
    onError: (err) => toast.error(err.message || err.response?.data?.message || 'Failed to batch score')
  });

  const handleSubmit = () => {
    batchScoreMutation.mutate();
  };

  const updateJd = (idx, value) => {
    const newJds = [...jds];
    newJds[idx] = value;
    setJds(newJds);
  };

  const getVerdictColor = (verdict) => {
    switch(verdict) {
      case 'STRONG PASS': return 'bg-emerald-500/20 text-emerald-400';
      case 'PASS': return 'bg-green-500/20 text-green-400';
      case 'BORDERLINE': return 'bg-amber-500/20 text-amber-400';
      case 'REJECT': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const handleTailorWeakest = () => {
    if (!results || results.length === 0) return;
    const weakest = [...results].sort((a, b) => a.overallScore - b.overallScore)[0];
    onClose();
    onTailorRequest(selectedResume, weakest.companyName, weakest.jobTitle);
  };

  if (!isOpen) return null;

  const bestMatch = results ? [...results].sort((a, b) => b.overallScore - a.overallScore)[0] : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 flex flex-col"
        >
          <div className="flex justify-between items-center border-b border-white/5 p-6 bg-slate-900">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <Layers className="text-blue-400"/> Batch JD Scoring
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex gap-6">
            {!results ? (
              <>
                <div className="w-1/3 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">1. Select Resume</label>
                    <select 
                      value={selectedResume} 
                      onChange={e => setSelectedResume(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white outline-none"
                    >
                      <option value="">Select a resume to score...</option>
                      {resumes.map(r => <option key={r._id} value={r._id}>{r.name || r.originalName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">2. Enter up to 5 JDs</label>
                    <div className="flex gap-2 mb-2">
                      {[0, 1, 2, 3, 4].map(i => (
                        <button 
                          key={i}
                          onClick={() => setActiveTab(i)}
                          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === i ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                          JD {i+1} {jds[i] ? '✓' : ''}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={jds[activeTab]}
                      onChange={(e) => updateJd(activeTab, e.target.value)}
                      placeholder={`Paste Job Description ${activeTab + 1} here...`}
                      className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={batchScoreMutation.isLoading}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    {batchScoreMutation.isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Play className="w-4 h-4"/>}
                    {batchScoreMutation.isLoading ? 'Scoring all JDs in parallel...' : 'Run Batch Score'}
                  </button>
                </div>
                <div className="w-2/3 bg-slate-800/30 rounded-2xl border border-white/5 p-8 flex items-center justify-center text-center">
                  <div>
                    <Layers className="w-16 h-16 text-slate-700 mx-auto mb-4"/>
                    <h3 className="text-xl font-bold text-slate-400 mb-2">Parallel Analysis</h3>
                    <p className="text-slate-500 max-w-sm">Paste multiple job descriptions to see exactly which companies your resume is best aligned for right now.</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Comparison Matrix</h3>
                  <div className="flex gap-3">
                    <button onClick={() => setResults(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors">
                      New Batch
                    </button>
                    <button onClick={handleTailorWeakest} className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4"/> Tailor for Weakest
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr>
                        <th className="p-4 border-b border-white/10 text-slate-400 font-medium text-sm">Dimension</th>
                        {results.map((r, i) => (
                          <th key={i} className="p-4 border-b border-white/10 text-center relative min-w-[150px]">
                            {r._id === bestMatch?._id && (
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Crown className="w-3 h-3"/> BEST MATCH
                              </div>
                            )}
                            <div className="text-white font-bold text-sm truncate" title={r.companyName}>{r.companyName !== 'Unknown Company' ? r.companyName : `JD ${i+1}`}</div>
                            <div className="text-slate-500 text-xs truncate mt-0.5">{r.jobTitle}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-white/5">
                        <td className="p-4 text-slate-300">Technical Fit</td>
                        {results.map((r, i) => <td key={i} className="p-4 text-center font-semibold text-white">{r.dimensions.technicalFit}/10</td>)}
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="p-4 text-slate-300">Experience Relevance</td>
                        {results.map((r, i) => <td key={i} className="p-4 text-center font-semibold text-white">{r.dimensions.experienceRelevance}/10</td>)}
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="p-4 text-slate-300">Communication Quality</td>
                        {results.map((r, i) => <td key={i} className="p-4 text-center font-semibold text-white">{r.dimensions.communicationQuality}/10</td>)}
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="p-4 text-slate-300">Standout Factor</td>
                        {results.map((r, i) => <td key={i} className="p-4 text-center font-semibold text-white">{r.dimensions.standoutFactor}/10</td>)}
                      </tr>
                      <tr className="border-b border-white/5">
                        <td className="p-4 text-slate-300">Red Flags (10=None)</td>
                        {results.map((r, i) => <td key={i} className="p-4 text-center font-semibold text-white">{r.dimensions.redFlags}/10</td>)}
                      </tr>
                      <tr className="border-b border-white/10">
                        <td className="p-4 text-slate-300 font-semibold">Overall Score</td>
                        {results.map((r, i) => <td key={i} className="p-4 text-center font-bold text-lg text-white">{r.overallScore}%</td>)}
                      </tr>
                      <tr>
                        <td className="p-4 text-slate-300 font-semibold">Final Verdict</td>
                        {results.map((r, i) => (
                          <td key={i} className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getVerdictColor(r.verdict)}`}>
                              {r.verdict}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
