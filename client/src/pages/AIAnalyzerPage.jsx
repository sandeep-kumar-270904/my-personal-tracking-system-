import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Loader2, Sparkles, AlertCircle, FileText, CheckCircle2, ChevronRight, ExternalLink, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const CircularProgress = ({ score }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  // Determine color based on score
  let colorClass = "text-red-500";
  if (score >= 75) colorClass = "text-emerald-500";
  else if (score >= 50) colorClass = "text-[#ff6b00]";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle cx="48" cy="48" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">ATS</span>
      </div>
    </div>
  );
};

const AIAnalyzerPage = () => {
  const [jdText, setJdText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [activeTab, setActiveTab] = useState('jd'); // 'jd', 'resume', 'resources'

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
    setActiveTab('resume');
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

  const atsResources = [
    { name: "ResumeWorded", desc: "AI-powered resume & LinkedIn checker", link: "https://resumeworded.com/" },
    { name: "Jobscan", desc: "Optimize your resume against ATS", link: "https://www.jobscan.co/" },
    { name: "Novorésumé", desc: "Professional ATS-friendly builder", link: "https://novoresume.com/" },
    { name: "Jake's Resume", desc: "The gold-standard LaTeX ATS format", link: "https://www.overleaf.com/latex/templates/jakes-resume/syzfjbptlwkg" },
    { name: "VMock", desc: "Smart resume platform used by top universities", link: "https://www.vmock.com/" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Zap className="w-8 h-8 text-[#ff6b00]" />
            ATS Resume Engine
          </h1>
          <p className="text-slate-400">Decode job descriptions and get an ultra-accurate ATS parsing score.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
        {/* Left Column: Input (Col Span 5) */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col gap-4 overflow-hidden">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#ff007b]" />
            Job Description
          </h2>
          <p className="text-sm text-slate-400">Paste the target JD to extract skills and score your resume.</p>
          
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste Job Description here..."
            className="w-full flex-1 bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#ff6b00] resize-none custom-scrollbar"
          />

          <div className="flex flex-col gap-3 mt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyzeJD}
              disabled={isAnalyzing || !jdText}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl py-3 px-4 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
            >
              {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : '1. Analyze JD'}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMatchResume}
              disabled={isMatching || !jdText}
              className="w-full bg-gradient-to-r from-[#ff6b00] to-[#ff007b] hover:from-[#ff6b00]/90 hover:to-[#ff007b]/90 text-white font-bold rounded-xl py-3 px-4 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,107,0,0.3)]"
            >
              {isMatching ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5" /> 2. Generate ATS Score
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Right Column: Results (Col Span 7) */}
        <div className="lg:col-span-7 glass-card flex flex-col overflow-hidden">
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
              ATS Match & Score
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'resources' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              ATS Resources
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'jd' && (
              <div className="space-y-6">
                {!analysis && !isAnalyzing && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                    <Zap className="w-16 h-16 mb-4 opacity-20" />
                    <p>Paste a JD and click "Analyze JD" to extract skills.</p>
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
                    <p>Click "Generate ATS Score" to parse your Primary Resume against the JD.</p>
                  </div>
                )}

                {isMatching && (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-[#ff007b] mb-4" />
                    <p>AI is parsing your resume like an ATS...</p>
                  </div>
                )}

                {matchResult && !isMatching && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                    <div className="flex items-center justify-between bg-[#13141f] p-6 rounded-xl border border-white/10 shadow-lg">
                      <div className="flex-1">
                        <p className="text-sm text-slate-400 mb-1">ATS Parsed Resume</p>
                        <p className="font-bold text-white text-lg">{matchResult.resumeName}</p>
                        <div className="mt-4 flex items-center gap-2">
                           <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">Primary Resume Selected</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <CircularProgress score={matchResult.analysis?.matchScore || 0} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
                        <h4 className="text-emerald-400 text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                          <CheckCircle2 className="w-5 h-5" /> Matched Things
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {matchResult.analysis?.matchedSkills?.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-sm font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                        <h4 className="text-red-400 text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                          <AlertCircle className="w-5 h-5" /> Key Things To Add
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {matchResult.analysis?.missingSkills?.map((skill, i) => (
                            <span key={i} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-bold mb-4 flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-[#ff6b00]" /> ATS Tailoring Suggestions
                      </h4>
                      <div className="space-y-3">
                        {matchResult.analysis?.tailoringSuggestions?.map((suggestion, i) => (
                          <div key={i} className="bg-[#13141f] border border-white/5 rounded-xl p-4 flex gap-3 hover:border-white/10 transition-colors">
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

            {activeTab === 'resources' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">ATS Software & Parsers</h3>
                  <p className="text-slate-400 text-sm mb-6">Use these real-world tools to check how actual software parses your resume before applying.</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {atsResources.map((resource, i) => (
                    <a 
                      key={i} 
                      href={resource.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group bg-[#13141f] border border-white/5 hover:border-[#ff6b00]/50 rounded-xl p-5 flex items-center justify-between transition-all"
                    >
                      <div>
                        <h4 className="text-white font-bold mb-1 flex items-center gap-2">
                          {resource.name}
                        </h4>
                        <p className="text-slate-400 text-sm">{resource.desc}</p>
                      </div>
                      <ExternalLink className="w-5 h-5 text-slate-500 group-hover:text-[#ff6b00] transition-colors" />
                    </a>
                  ))}
                </div>

                <div className="mt-8 p-5 rounded-xl bg-[#ff6b00]/10 border border-[#ff6b00]/20">
                  <h4 className="text-[#ff6b00] font-bold mb-2 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Pro Tip: The ATS "Black Hole"
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Most ATS software (like Workday, Taleo, Greenhouse) cannot read complex formatting, columns, or graphics. Always use a single-column, plain-text compatible format like Jake's Resume (LaTeX) or a simple Word doc. Do not use Canva templates!
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalyzerPage;
