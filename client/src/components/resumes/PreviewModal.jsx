import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Activity, FileText, History, Download, Trash2, CheckCircle2, Sparkles, Target, Search, MessageSquare, BarChart2, FileDown, Users } from 'lucide-react';
import { useState } from 'react';
import AI_RewriteTab from './AI_RewriteTab';
import KeywordMatchTab from './KeywordMatchTab';
import InterviewPredictorTab from './InterviewPredictorTab';
import JDScoreTab from './JDScoreTab';
import TailoringModal from './TailoringModal';
import PeerBenchmarkSection from './PeerBenchmarkSection';
import ImpactTrackerTab from './ImpactTrackerTab';
import FeedbackTab from './FeedbackTab';
import IntelligenceReportTab from './IntelligenceReportTab';
import VersionsTab from './VersionsTab';
import InterviewSignalsSection from './InterviewSignalsSection';
import OutcomeLearningSection from './OutcomeLearningSection';
import PrepHubGapsSection from './PrepHubGapsSection';

export default function PreviewModal({ isOpen, onClose, resume, versions = [], onDownload, onDelete }) {
  const [activeTab, setActiveTab] = useState('analysis');
  const [showTailorModal, setShowTailorModal] = useState(false);

  if (!isOpen || !resume) return null;

  const analysis = resume.analysis || {};
  const sections = resume.sections || [];
  
  const atsScore = analysis.atsScore || 0;
  const atsColor = atsScore >= 80 ? 'text-emerald-400' : atsScore >= 60 ? 'text-amber-400' : 'text-red-400';
  const atsBg = atsScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20' : atsScore >= 60 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
  
  const fileUrl = resume.filePath ? (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000') + resume.filePath : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col md:flex-row shadow-2xl relative z-10 overflow-hidden"
        >
          {/* Left: PDF Viewer */}
          <div className="w-full md:w-1/2 bg-slate-950 flex flex-col border-r border-white/5 relative">
             <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
               <div>
                 <h3 className="font-semibold text-white truncate max-w-[250px]">{resume.name || resume.originalName}</h3>
                 <p className="text-xs text-slate-400">Version {resume.version || 1}</p>
               </div>
                 <div className="flex items-center gap-2">
                   <button onClick={() => setShowTailorModal(true)} className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 border border-indigo-500/20">
                     <Target className="w-4 h-4" /> Tailor for Role
                   </button>
                   <button onClick={() => onDownload(resume)} className="p-2 hover:bg-white/10 rounded-xl text-slate-300 transition-colors tooltip" data-tip="Download">
                     <Download className="w-4 h-4" />
                   </button>
                   {fileUrl && (
                     <a href={fileUrl} target="_blank" rel="noreferrer" className="p-2 hover:bg-white/10 rounded-xl text-slate-300 transition-colors tooltip" data-tip="Open in new tab">
                       <ExternalLink className="w-4 h-4" />
                     </a>
                   )}
                 </div>
             </div>
             
             <div className="flex-1 overflow-auto custom-scrollbar flex items-start justify-center p-0 bg-slate-950 relative h-full w-full">
               {fileUrl ? (
                 <iframe 
                   src={fileUrl + "#toolbar=0&navpanes=0&scrollbar=0"} 
                   className="w-full h-full border-0"
                   title="Resume Preview"
                 />
               ) : (
                 <div className="text-slate-500 m-auto">PDF not available</div>
               )}
             </div>
          </div>

          {/* Right: AI Analysis & Data */}
          <div className="w-full md:w-1/2 flex flex-col bg-slate-900">
             <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex space-x-1 bg-white/5 p-1 rounded-xl">
                  <button onClick={() => setActiveTab('analysis')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'analysis' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                    <Activity className="w-4 h-4" /> ATS Analysis
                  </button>
                  <button onClick={() => setActiveTab('sections')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'sections' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                    <FileText className="w-4 h-4" /> Sections
                  </button>
                  <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}>
                    <History className="w-4 h-4" /> History
                  </button>
                  <button onClick={() => setActiveTab('rewrite')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'rewrite' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
                    <Sparkles className="w-4 h-4" /> AI Rewrite
                  </button>
                  <button onClick={() => setActiveTab('interview')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'interview' ? 'bg-pink-500/20 text-pink-400' : 'text-slate-400 hover:text-white'}`}>
                    <MessageSquare className="w-4 h-4" /> Interview Predictor
                  </button>
                  <button onClick={() => setActiveTab('impact')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'impact' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white'}`}>
                    <BarChart2 className="w-4 h-4" /> Impact Tracker
                  </button>
                  <button onClick={() => setActiveTab('feedback')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'feedback' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'text-slate-400 hover:text-white'}`}>
                    <MessageSquare className="w-4 h-4" /> Feedback
                  </button>
                  <button onClick={() => setActiveTab('report')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'report' ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white'}`}>
                    <FileDown className="w-4 h-4" /> Intel Report
                  </button>
                  <button onClick={() => setActiveTab('keywords')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'keywords' ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'}`}>
                    <Search className="w-4 h-4" /> Keyword Match
                  </button>
                  <button onClick={() => setActiveTab('jdscore')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'jdscore' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                    <Target className="w-4 h-4" /> Score JD
                  </button>
                </div>
                
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activeTab === 'analysis' && (
                  <div className="space-y-6">
                    {resume.isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-4 py-20 text-center">
                        <div className="w-12 h-12 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
                        <div>
                          <p className="text-emerald-400 font-medium">AI is analyzing this resume...</p>
                          <p className="text-sm text-slate-400">Extracting skills, sections, and computing ATS score.</p>
                        </div>
                      </div>
                    ) : !resume.analysis ? (
                       <div className="text-center py-20">
                         <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                         <p className="text-slate-400">No analysis available for this resume.</p>
                       </div>
                    ) : (
                      <>
                        <div className={`p-6 rounded-2xl border flex items-center gap-6 ${atsBg}`}>
                           <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-white/10" />
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="126" strokeDashoffset={126 - (126 * atsScore) / 100} className={`transition-all duration-1000 ease-out ${atsColor}`} />
                              </svg>
                              <div className="absolute flex flex-col items-center">
                                <span className={`text-2xl font-bold ${atsColor}`}>{atsScore}</span>
                                <span className="text-[10px] text-white/50 uppercase font-medium tracking-wider">ATS Score</span>
                              </div>
                           </div>
                           
                           <div>
                              <h4 className="text-lg font-semibold text-white mb-2">Resume Fit Analysis</h4>
                              <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
                           </div>
                        </div>

                        {analysis.strengths?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Strengths</h4>
                            <ul className="space-y-2">
                              {analysis.strengths.map((str, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-emerald-200/80 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                  {str}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.weaknesses?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Areas for Improvement</h4>
                            <ul className="space-y-2">
                              {analysis.weaknesses.map((wk, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-amber-200/80 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5 ml-1 mr-0.5" />
                                  {wk}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysis.keywordsFound?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Detected Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.keywordsFound.map((kw, i) => (
                                <span key={i} className="px-2.5 py-1 text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 rounded-lg">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Networking V5 Integrations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                          {/* Target Role Match & Referral Ready */}
                          <div className="bg-[#13141f] border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Target className="w-4 h-4 text-indigo-400" /> Target Role Match
                            </h4>
                            <div className="flex flex-col gap-3 relative z-10">
                              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                <span className="text-sm text-slate-400">Inferred Target</span>
                                <span className="text-sm font-bold text-white">{resume.tags?.[0] || 'Software Engineer'}</span>
                              </div>
                              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                <span className="text-sm text-slate-400">Referral Ready Status</span>
                                {atsScore >= 80 ? (
                                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Referral Ready
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    Needs Work
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Who Can Review */}
                          <div className="bg-[#13141f] border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <Users className="w-4 h-4 text-pink-400" /> Who Can Review
                            </h4>
                            <p className="text-xs text-slate-400 mb-3">Send this resume to your network for feedback before applying.</p>
                            <button 
                              onClick={() => window.location.href = `/networking?tab=messages&type=resume_review`}
                              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4 text-pink-400" />
                              Draft Review Request
                            </button>
                          </div>
                        </div>

                        <PeerBenchmarkSection resumeId={resume._id} />
                        <InterviewSignalsSection resumeId={resume._id} />
                        <OutcomeLearningSection resumeId={resume._id} />
                        <PrepHubGapsSection resumeId={resume._id} />
                      </>
                    )}
                  </div>
                )}

                {activeTab === 'sections' && (
                  <div className="space-y-6">
                    {sections.length === 0 ? (
                      <div className="text-center py-20 text-slate-400">No sections extracted.</div>
                    ) : (
                      sections.map((sec, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                           <div className="px-4 py-3 bg-white/5 border-b border-white/5">
                             <h4 className="font-semibold text-emerald-400 uppercase tracking-wider text-sm">{sec.heading}</h4>
                           </div>
                           <div className="p-4 text-sm text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-slate-950/50">
                             {sec.content}
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <div className="relative border-l-2 border-white/10 ml-3 pl-6 space-y-8">
                      {versions.map((ver, idx) => (
                        <div key={ver._id} className="relative">
                          <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 ${ver._id === resume._id ? 'bg-emerald-500 border-slate-900' : 'bg-slate-700 border-slate-900'}`} />
                          <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h5 className="font-semibold text-white">Version {ver.version}</h5>
                                <p className="text-xs text-slate-400">{new Date(ver.createdAt).toLocaleString()}</p>
                              </div>
                              {ver._id === resume._id && (
                                <span className="px-2 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded uppercase tracking-wider">Current</span>
                              )}
                            </div>
                            {ver.changeNote && (
                              <p className="text-sm text-slate-300 mt-2 bg-slate-950 p-2 rounded-lg border border-white/5">
                                <span className="text-slate-500 mr-2">Notes:</span>
                                {ver.changeNote}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'rewrite' && (
                  <AI_RewriteTab 
                    resume={resume} 
                    sections={sections} 
                    onSectionUpdate={(updatedSection) => {
                      // Trigger refetch ideally
                    }} 
                  />
                )}

                {activeTab === 'impact' && (
                  <ImpactTrackerTab resumeId={resume?._id} />
                )}

                {activeTab === 'feedback' && (
                  <FeedbackTab resumeId={resume?._id} />
                )}

                {activeTab === 'report' && (
                  <IntelligenceReportTab resumeId={resume?._id} />
                )}

                {activeTab === 'versions' && (
                  <VersionsTab 
                    resumeId={resume?._id} 
                    onPreviewVersion={(sections) => {
                      // Optionally set preview to these sections
                      toast.success('Previewing version functionality can be mapped to render these sections');
                    }}
                  />
                )}

                {activeTab === 'keywords' && (
                  <KeywordMatchTab
                    resume={resume}
                    sections={sections}
                    onSectionUpdate={(updatedSection) => {
                      // Trigger refetch ideally
                    }}
                  />
                )}

                {activeTab === 'jdscore' && (
                  <JDScoreTab resumeId={resume?._id} />
                )}

                {activeTab === 'interview' && (
                  <InterviewPredictorTab resume={resume} />
                )}
             </div>
          </div>
        </motion.div>
      </div>

      <TailoringModal
        isOpen={showTailorModal}
        onClose={() => setShowTailorModal(false)}
        resume={resume}
        onTailoringComplete={() => {
          // Trigger a refetch or notification here
        }}
      />
    </AnimatePresence>
  );
}
