import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2, Sparkles, AlertCircle, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AIAnalyzerPage = () => {
  const [jdText, setJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [activeTab, setActiveTab] = useState('jd'); // 'jd' or 'resume'

  const handleAnalyzeJD = async (e) => {
    e.preventDefault();
    if (!jdText.trim()) {
      toast.error('Please paste a job description');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data } = await api.post('/ai/analyze-jd', { jdText });
      setAnalysis(data);
      toast.success('Job Description analyzed!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to analyze JD');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMatchResume = async () => {
    if (!jdText.trim()) {
      toast.error('Please paste a job description first');
      return;
    }

    setIsMatching(true);
    try {
      const { data } = await api.post('/ai/match-resume', { jdText });
      setMatchResult(data);
      toast.success('Resume match complete!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to match resume. Ensure you have a Primary Resume uploaded.');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-[#ff6b00]" />
            AI JD Analyzer
          </h1>
          <p className="text-slate-400">Decode job descriptions and perfectly tailor your resume.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left Column: Input */}
        <div className="glass-card p-6 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#ff007b]" />
            Job Description
          </h2>
          <p className="text-sm text-slate-400">Paste the target Job Description below.</p>
          
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste Job Description here..."
            className="w-full flex-1 min-h-[300px] bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#ff6b00] resize-none custom-scrollbar"
          />

          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyzeJD}
              disabled={isAnalyzing || !jdText}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl py-3 px-4 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Analyze JD'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveTab('resume');
                handleMatchResume();
              }}
              disabled={isMatching || !jdText}
              className="flex-1 bg-gradient-to-r from-[#ff6b00] to-[#ff007b] hover:from-[#ff6b00]/90 hover:to-[#ff007b]/90 text-white font-bold rounded-xl py-3 px-4 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,107,0,0.3)]"
            >
              {isMatching ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Match Resume
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="glass-card flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/10 p-2 gap-2">
            <button
              onClick={() => setActiveTab('jd')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'jd' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              JD Breakdown
            </button>
            <button
              onClick={() => setActiveTab('resume')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'resume' ? 'bg-gradient-to-r from-[#ff6b00]/20 to-[#ff007b]/20 text-white border border-[#ff6b00]/30' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Resume Gap Analysis
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'jd' && (
              <div className="space-y-6">
                {!analysis && !isAnalyzing && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                    <Zap className="w-16 h-16 mb-4 opacity-20" />
                    <p>Paste a JD and click "Analyze JD" to see insights.</p>
                  </div>
                )}
                
                {isAnalyzing && (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ff6b00]" />
                  </div>
                )}

                {analysis && !isAnalyzing && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{analysis.role}</h3>
                      <p className="text-[#ff6b00] text-sm font-medium">{analysis.experienceLevel}</p>
                    </div>

                    <div className="bg-[#13141f] rounded-xl p-4 border border-white/5">
                      <h4 className="text-slate-400 text-sm mb-2 font-semibold">Summary</h4>
                      <p className="text-slate-200 text-sm leading-relaxed">{analysis.summary}</p>
                    </div>

                    <div className="bg-[#13141f] rounded-xl p-4 border border-white/5">
                      <h4 className="text-slate-400 text-sm mb-2 font-semibold">Company Focus</h4>
                      <p className="text-slate-200 text-sm leading-relaxed">{analysis.companyFocus}</p>
                    </div>

                    <div>
                      <h4 className="text-slate-400 text-sm mb-3 font-semibold">Key Required Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keySkills?.map((skill, i) => (
                          <span key={i} className="px-3 py-1.5 bg-[#ff6b00]/10 text-[#ff6b00] border border-[#ff6b00]/20 rounded-lg text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {analysis.niceToHaveSkills?.length > 0 && (
                      <div>
                        <h4 className="text-slate-400 text-sm mb-3 font-semibold">Nice to Have</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysis.niceToHaveSkills?.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-white/5 text-slate-300 border border-white/10 rounded-lg text-sm font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'resume' && (
              <div className="space-y-6">
                {!matchResult && !isMatching && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20 text-center px-4">
                    <Sparkles className="w-16 h-16 mb-4 opacity-20" />
                    <p>Click "Match Resume" to compare the JD against your Primary Resume.</p>
                  </div>
                )}

                {isMatching && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ff007b] mb-4" />
                    <p>AI is reading your resume...</p>
                  </div>
                )}

                {matchResult && !isMatching && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="flex items-center justify-between bg-[#13141f] p-4 rounded-xl border border-white/10">
                      <div>
                        <p className="text-sm text-slate-400">Comparing against</p>
                        <p className="font-bold text-white">{matchResult.resumeName}</p>
                      </div>
                      <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-[#13141f] shadow-[0_0_15px_rgba(255,107,0,0.2)] bg-gradient-to-br from-[#ff6b00] to-[#ff007b]">
                        <span className="text-xl font-bold text-white">{matchResult.analysis?.matchScore}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                        <h4 className="text-emerald-400 text-sm font-bold mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Matched Skills
                        </h4>
                        <ul className="space-y-2">
                          {matchResult.analysis?.matchedSkills?.map((skill, i) => (
                            <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                              <span className="text-emerald-500 mt-0.5">•</span> {skill}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                        <h4 className="text-red-400 text-sm font-bold mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Missing Skills
                        </h4>
                        <ul className="space-y-2">
                          {matchResult.analysis?.missingSkills?.map((skill, i) => (
                            <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                              <span className="text-red-500 mt-0.5">•</span> {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#ff6b00]" /> AI Tailoring Suggestions
                      </h4>
                      <div className="space-y-3">
                        {matchResult.analysis?.tailoringSuggestions?.map((suggestion, i) => (
                          <div key={i} className="bg-[#13141f] border border-white/5 rounded-xl p-4 flex gap-3">
                            <ChevronRight className="w-5 h-5 text-[#ff007b] shrink-0 mt-0.5" />
                            <p className="text-slate-300 text-sm leading-relaxed">{suggestion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyzerPage;
