import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Edit2, Trash2, Calendar, Link as LinkIcon, Building2, Briefcase, FileText, CheckCircle2, History, AlertCircle, FilePlus, Mail, Globe, Wand2, TrendingUp, Info, Users } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PredictionTab from './PredictionTab';
import NegotiateTab from './NegotiateTab';

const fetchApplicationDetails = async (id) => {
  if (!id) return null;
  const res = await api.get(`/applications/${id}`);
  return res.data;
};

const ResumeSelector = ({ app }) => {
  const queryClient = useQueryClient();
  const [selectedResumeId, setSelectedResumeId] = useState(app.resumeId);

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await api.get('/resumes');
      return res.data;
    }
  });

  const { data: perf } = useQuery({
    queryKey: ['resumePerformance', selectedResumeId],
    queryFn: async () => {
      if (!selectedResumeId) return null;
      const res = await api.get(`/resumes/${selectedResumeId}/performance`);
      return res.data;
    },
    enabled: !!selectedResumeId
  });

  const updateResumeMutation = useMutation({
    mutationFn: async (resumeId) => {
      await api.patch(`/applications/${app._id}`, { resumeId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['application', app._id]);
      toast.success('Resume updated for this application.');
    }
  });

  const handleChange = (e) => {
    const newId = e.target.value;
    if (newId && newId !== app.resumeId) {
      if (window.confirm("Warning: Changing the resume will alter historical performance metrics. Are you sure?")) {
        setSelectedResumeId(newId);
        updateResumeMutation.mutate(newId);
      } else {
        e.target.value = selectedResumeId || "";
      }
    }
  };

  const currentResume = resumes.find(r => r._id === selectedResumeId);

  return (
    <div className="space-y-3">
      <select 
        value={selectedResumeId || ""} 
        onChange={handleChange}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff6b00]"
      >
        <option value="" disabled>Select a resume</option>
        {resumes.map(r => (
          <option key={r._id} value={r._id}>{r.originalName} ({r.versionTag})</option>
        ))}
      </select>

      {perf && perf.totalApplications > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
            {Math.round((perf.shortlistedCount / perf.totalApplications) * 100)}% Shortlist Rate
          </span>
          {perf.topRoles && perf.topRoles.length > 0 && perf.topRoles[0].role === app.role && (
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
              <Star className="w-3 h-3" /> Best for this role
            </span>
          )}
        </div>
      )}
    </div>
  );
};

import { ContactMiniCard, ReferralStatusBadge } from '../networking/shared';

const NetworkContacts = ({ app }) => {
  const queryClient = useQueryClient();

  const { data: contactsResponse, isLoading } = useQuery({
    queryKey: ['network', app.company],
    queryFn: async () => {
      // Assuming a generic /networking endpoint gets all contacts, or we can fetch by company
      const res = await api.get(`/networking?company=${encodeURIComponent(app.company)}`);
      return res.data;
    }
  });

  const companyContacts = contactsResponse?.contacts || [];

  if (isLoading) return <div className="text-sm text-slate-500 p-4">Loading network...</div>;

  if (companyContacts.length === 0) {
    return (
      <div className="bg-[#ff6b00]/5 border border-[#ff6b00]/20 p-4 rounded-xl flex flex-col items-center justify-center text-center">
        <Users className="w-8 h-8 text-[#ff6b00]/50 mb-2" />
        <h3 className="text-sm font-semibold text-white mb-1">No contacts here</h3>
        <p className="text-xs text-slate-400 mb-3">You don't have any contacts at {app.company}. Reach out to someone to boost your chances.</p>
        <button 
          onClick={() => window.location.href = `/networking?tab=alumni&company=${encodeURIComponent(app.company)}`}
          className="bg-[#ff6b00]/20 hover:bg-[#ff6b00]/30 text-[#ff6b00] border border-[#ff6b00]/20 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
        >
          <Globe className="w-4 h-4" />
          Find Alumni at {app.company}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Users className="w-4 h-4" /> Company Contacts ({companyContacts.length})</h3>
        <button 
          onClick={() => window.location.href = `/networking?company=${encodeURIComponent(app.company)}`}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
        >
          View all
        </button>
      </div>
      <div className="space-y-3">
        {companyContacts.slice(0, 3).map(c => (
          <div key={c._id} className="flex justify-between items-center bg-[#13141f] border border-white/5 rounded-lg p-3 group hover:border-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/20">
                {c.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-white font-medium group-hover:text-indigo-400 transition-colors">{c.name}</p>
                <p className="text-xs text-slate-400">{c.role}</p>
              </div>
            </div>
            {c.isReferralSource && <ReferralStatusBadge status={c.referralStatus} />}
            {!c.isReferralSource && (
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">{c.connectionStrength}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ApplicationDetailDrawer = ({ isOpen, onClose, applicationId, onEdit, onDelete }) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details'); // details, timeline, emails, intel, predict, negotiate
  const [newNote, setNewNote] = useState('');
  const [effortToAdd, setEffortToAdd] = useState('');
  
  const [jdAnalysis, setJdAnalysis] = useState(null);
  const [emails, setEmails] = useState(null);
  
  const { data: app, isLoading } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => fetchApplicationDetails(applicationId),
    enabled: !!applicationId && isOpen,
  });

  const { data: intel, isLoading: isIntelLoading } = useQuery({
    queryKey: ['companyIntel', app?.company],
    queryFn: async () => {
      const res = await api.get(`/companies/${app.company}/intel`);
      return res.data;
    },
    enabled: activeTab === 'intel' && !!app?.company,
    staleTime: 24 * 60 * 60 * 1000 // 1 day
  });

  const analyzeJdMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/applications/analyze-jd`, { url: app.jobDescriptionUrl });
      return res.data;
    },
    onSuccess: (data) => {
      setJdAnalysis(data);
      toast.success("JD Analyzed");
    },
    onError: () => toast.error("Failed to analyze JD")
  });

  const analyzeRejectionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/applications/${applicationId}/rejection-analysis`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['application', applicationId]);
      toast.success("Rejection analysis complete");
    },
    onError: () => toast.error("Failed to analyze rejection")
  });

  const syncEmailsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/applications/${applicationId}/email-thread`);
      return res.data.emails;
    },
    onSuccess: (data) => {
      setEmails(data);
      toast.success("Emails synced");
    },
    onError: () => toast.error("Failed to sync emails")
  });

  const addNoteMutation = useMutation({
    mutationFn: async (note) => {
      await api.patch(`/applications/${applicationId}`, { noteForTimeline: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['application', applicationId]);
      setNewNote('');
      toast.success('Note added to timeline');
    }
  });

  const addEffortMutation = useMutation({
    mutationFn: async (minutes) => {
      const res = await api.patch(`/applications/${applicationId}/effort`, { minutes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['application', applicationId]);
      setEffortToAdd('');
      toast.success('Effort logged');
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/applications/${applicationId}/archive`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['application', applicationId]);
      queryClient.invalidateQueries(['applications']);
      toast.success(data.isArchived ? 'Application archived' : 'Application unarchived');
    }
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ x: '100%' }} 
          animate={{ x: 0 }} 
          exit={{ x: '100%' }} 
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#13141f] border-l border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/[0.02]">
            {isLoading || !app ? (
              <div className="w-full flex justify-between">
                <div className="h-6 w-32 bg-white/10 animate-pulse rounded"></div>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
            ) : (
              <>
                <div className="flex gap-4 items-center">
                  <img src={`https://logo.clearbit.com/${app.company.replace(/ /g, '').toLowerCase()}.com`} alt={app.company} className="w-12 h-12 rounded-xl bg-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-white mb-1">{app.company}</h2>
                      {(() => {
                        const cachedNetwork = queryClient.getQueryData(['network']) || [];
                        const hasReferral = cachedNetwork.some(c => c.company.toLowerCase() === app.company.toLowerCase() && c.status === 'Referral Given');
                        return hasReferral ? (
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Referral Used
                          </span>
                        ) : null;
                      })()}
                      {app.fitScore !== undefined && (
                        <div className="group relative">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${app.fitScore >= 75 ? 'bg-green-500/10 text-green-400 border-green-500/20' : app.fitScore >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {app.fitScore}% Fit
                          </span>
                          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-48 bg-[#1a1b26] border border-white/10 p-3 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 text-xs">
                            <p className="font-semibold text-white mb-2">Score Breakdown</p>
                            <div className="space-y-1 text-slate-300">
                              <div className="flex justify-between"><span>Target Co:</span><span>{app.fitScoreBreakdown?.isTargetCompany ? 'Yes' : 'No'}</span></div>
                              <div className="flex justify-between"><span>Role Match:</span><span>{app.fitScoreBreakdown?.roleMatchScore}/25</span></div>
                              <div className="flex justify-between"><span>Campus:</span><span>{app.fitScoreBreakdown?.campusHistoryScore}/25</span></div>
                              <div className="flex justify-between"><span>Alumni:</span><span>{app.fitScoreBreakdown?.alumniScore}/30</span></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-400 font-medium flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> {app.role}
                    </p>
                    {app.isArchived && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-slate-500/20 text-slate-300 border border-slate-500/30 rounded text-xs font-bold uppercase tracking-wider">
                        Archived
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={onEdit} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex px-6 pt-4 border-b border-white/5 gap-6">
            <button 
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'details' ? 'border-[#ff6b00] text-[#ff6b00]' : 'border-transparent text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button 
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'timeline' ? 'border-[#ff6b00] text-[#ff6b00]' : 'border-transparent text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('timeline')}
            >
              Timeline
            </button>
            <button 
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'emails' ? 'border-[#ff6b00] text-[#ff6b00]' : 'border-transparent text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('emails')}
            >
              <Mail className="w-4 h-4" /> Emails
            </button>
            <button 
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'intel' ? 'border-[#ff6b00] text-[#ff6b00]' : 'border-transparent text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('intel')}
            >
              <Globe className="w-4 h-4" /> Intel
            </button>
            <button 
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'predict' ? 'border-[#ff6b00] text-[#ff6b00]' : 'border-transparent text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('predict')}
            >
              <Wand2 className="w-4 h-4" /> Predict
            </button>
            <button 
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'negotiate' ? 'border-[#ff6b00] text-[#ff6b00]' : 'border-transparent text-slate-400 hover:text-white'}`}
              onClick={() => setActiveTab('negotiate')}
            >
              <DollarSign className="w-4 h-4" /> Negotiate
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {isLoading || !app ? (
              <div className="space-y-4">
                <div className="h-20 bg-white/5 animate-pulse rounded-xl"></div>
                <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
              </div>
            ) : activeTab === 'details' ? (
              <div className="space-y-6">
                
                {/* Effort Logger & Archive Actions */}
                <div className="flex gap-4 items-end bg-[#1a1b26] p-4 rounded-xl border border-white/5 shadow-inner">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Log Effort (Total: {app.effortMinutes || 0} mins)</label>
                    <div className="flex gap-2">
                      <button onClick={() => addEffortMutation.mutate(15)} disabled={addEffortMutation.isLoading} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm border border-blue-500/20 transition-colors disabled:opacity-50">+15m</button>
                      <button onClick={() => addEffortMutation.mutate(30)} disabled={addEffortMutation.isLoading} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm border border-blue-500/20 transition-colors disabled:opacity-50">+30m</button>
                      <button onClick={() => addEffortMutation.mutate(60)} disabled={addEffortMutation.isLoading} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm border border-blue-500/20 transition-colors disabled:opacity-50">+1h</button>
                      <input 
                        type="number" 
                        placeholder="Custom (m)"
                        value={effortToAdd}
                        onChange={(e) => setEffortToAdd(e.target.value)}
                        className="w-24 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#ff6b00]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && effortToAdd) {
                            addEffortMutation.mutate(Number(effortToAdd));
                          }
                        }}
                      />
                    </div>
                  </div>
                  <button onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isLoading} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${app.isArchived ? 'bg-slate-500/20 text-slate-300 border-slate-500/30 hover:bg-slate-500/30' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}>
                    {app.isArchived ? 'Unarchive' : 'Archive'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Status</p>
                    <p className="text-sm font-bold text-white">{app.status.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Date Applied</p>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(app.dateApplied).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Priority</p>
                    <p className={`text-sm font-bold ${app.priority === 'HIGH' ? 'text-red-400' : app.priority === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'}`}>
                      {app.priority}
                    </p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Source</p>
                    <p className="text-sm font-bold text-white">{app.source}</p>
                  </div>
                  {app.deadline && (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 col-span-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Application Deadline</p>
                      <p className="text-sm font-bold text-red-400 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-red-400" />
                        {new Date(app.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Resume Selector */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Resume Used</p>
                  <ResumeSelector app={app} />
                </div>

                {app.link && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Application Link</h3>
                    <a href={app.link} target="_blank" rel="noopener noreferrer" className="text-[#ff6b00] hover:underline text-sm break-all">
                      {app.link}
                    </a>
                  </div>
                )}

                {app.jobDescriptionUrl && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2"><FileText className="w-4 h-4" /> Job Description Link</h3>
                      <button onClick={() => analyzeJdMutation.mutate()} disabled={analyzeJdMutation.isLoading} className="text-xs text-[#ff6b00] flex items-center gap-1 hover:underline disabled:opacity-50">
                        {analyzeJdMutation.isLoading ? 'Analyzing...' : <><Wand2 className="w-3 h-3"/> Analyze JD</>}
                      </button>
                    </div>
                    <a href={app.jobDescriptionUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                      {app.jobDescriptionUrl}
                    </a>
                    {jdAnalysis && (
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mt-3">
                        <h4 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2"><Wand2 className="w-4 h-4"/> Analysis Results</h4>
                        <div className="space-y-2 text-xs text-slate-300">
                          <div><span className="text-slate-500">Role Type:</span> {jdAnalysis.roleType}</div>
                          <div><span className="text-slate-500">Experience:</span> {jdAnalysis.experienceLevel}</div>
                          <div><span className="text-slate-500">Required Skills:</span> {jdAnalysis.requiredSkills?.join(', ')}</div>
                          {jdAnalysis.ctcRange && <div><span className="text-slate-500">CTC:</span> {jdAnalysis.ctcRange}</div>}
                          {jdAnalysis.redFlags?.length > 0 && <div className="text-red-400 font-medium mt-2">Red Flags: {jdAnalysis.redFlags.join(', ')}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {app.tags && app.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {app.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 rounded bg-white/10 text-slate-300 text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {app.notes && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Notes</h3>
                    <div className="text-sm text-slate-400 whitespace-pre-wrap">{app.notes}</div>
                  </div>
                )}

                <NetworkContacts app={app} />

                {app.interviews && app.interviews.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Linked Interviews</h3>
                    <div className="space-y-3">
                      {app.interviews.map(int => (
                        <div key={int._id} className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-purple-400 text-sm">{int.type} Interview</p>
                            <p className="text-xs text-slate-400">{new Date(int.date).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded border ${int.status === 'COMPLETED' ? 'border-green-500/20 text-green-500' : 'border-purple-500/20 text-purple-400'}`}>
                            {int.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {app.status === 'REJECTED' && (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-red-400 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Rejection Analysis</h3>
                      {!app.rejectionAnalysis && (
                        <button onClick={() => analyzeRejectionMutation.mutate()} disabled={analyzeRejectionMutation.isLoading} className="text-xs text-red-400 hover:underline">
                          {analyzeRejectionMutation.isLoading ? 'Analyzing...' : 'Generate Analysis'}
                        </button>
                      )}
                    </div>
                    {app.rejectionAnalysis ? (
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-slate-500 text-xs uppercase mb-1">Reason</p>
                          <p className="text-slate-300">{app.rejectionAnalysis.reason}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase mb-1">Improvement Area</p>
                          <p className="text-slate-300">{app.rejectionAnalysis.improvementArea}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs uppercase mb-1">Next Steps</p>
                          <p className="text-slate-300">{app.rejectionAnalysis.actionableFeedback}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No analysis generated yet.</p>
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === 'timeline' ? (
              <div className="space-y-6 relative">
                {/* Timeline rendering */}
                <div className="absolute left-[11px] top-2 bottom-0 w-0.5 bg-white/10"></div>
                {app.timeline && app.timeline.map((event, index) => (
                  <div key={event._id} className="relative pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-[#13141f] border-2 border-[#ff6b00] flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#ff6b00]"></div>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-xl">
                      <p className="font-semibold text-white text-sm">{event.event}</p>
                      <p className="text-xs text-slate-500 mb-2">{new Date(event.createdAt).toLocaleString()}</p>
                      {event.note && (
                        <div className="text-sm text-slate-300 bg-white/5 p-2 rounded border border-white/5">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.note}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : activeTab === 'emails' ? (
              <div className="space-y-4 relative">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-slate-400">Track email communications for this role.</p>
                  <button 
                    onClick={() => syncEmailsMutation.mutate()} 
                    disabled={syncEmailsMutation.isLoading}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-white transition-colors"
                  >
                    {syncEmailsMutation.isLoading ? 'Syncing...' : 'Fetch Latest Emails'}
                  </button>
                </div>
                {emails ? (
                  emails.length > 0 ? emails.map((email, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{email.subject}</p>
                          <p className="text-xs text-slate-400">From: {email.sender}</p>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(email.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-3">{email.snippet}</p>
                      {email.sentiment && (
                        <span className={`mt-2 inline-block px-2 py-0.5 rounded text-xs ${email.sentiment === 'POSITIVE' ? 'bg-green-500/10 text-green-400' : email.sentiment === 'NEGATIVE' ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'}`}>
                          {email.sentiment}
                        </span>
                      )}
                    </div>
                  )) : (
                    <p className="text-sm text-slate-500 text-center py-8">No emails found for this company.</p>
                  )
                ) : (
                  <div className="text-center py-8">
                    <Mail className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Click fetch to parse your inbox for updates.</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'intel' ? (
              <div className="space-y-6">
                {isIntelLoading ? (
                  <div className="space-y-4">
                    <div className="h-20 bg-white/5 animate-pulse rounded-xl"></div>
                    <div className="h-32 bg-white/5 animate-pulse rounded-xl"></div>
                  </div>
                ) : intel ? (
                  <>
                    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-5">
                      <h3 className="text-lg font-bold text-blue-400 mb-2">Company Culture</h3>
                      <p className="text-sm text-slate-300 leading-relaxed">{intel.culture}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Difficulty</p>
                        <p className={`text-sm font-bold ${intel.difficulty === 'Hard' ? 'text-red-400' : intel.difficulty === 'Medium' ? 'text-amber-400' : 'text-green-400'}`}>{intel.difficulty}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">CTC Range</p>
                        <p className="text-sm font-bold text-white">{intel.ctcRange}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Sentiment</p>
                        <p className="text-sm font-bold text-white">{intel.sentiment}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Bond/Agreement</p>
                        <p className="text-sm font-bold text-white">{intel.serviceAgreement}</p>
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <h3 className="text-sm font-semibold text-slate-300 mb-2">Hiring Process</h3>
                      <p className="text-sm text-slate-400 whitespace-pre-wrap">{intel.hiringProcess}</p>
                    </div>

                    {intel.interviewTopics?.length > 0 && (
                      <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                        <h3 className="text-sm font-semibold text-slate-300 mb-2">Key Interview Topics</h3>
                        <div className="flex flex-wrap gap-2">
                          {intel.interviewTopics.map(topic => (
                            <span key={topic} className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs">{topic}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8">No intel available for this company.</p>
                )}
              </div>
            ) : activeTab === 'predict' ? (
              <PredictionTab applicationId={applicationId} currentStatus={app.status} />
            ) : activeTab === 'negotiate' ? (
              <NegotiateTab applicationId={applicationId} />
            ) : null}
          </div>

          {/* Add Note Footer for Timeline */}
          {activeTab === 'timeline' && app && (
            <div className="p-4 border-t border-white/10 bg-white/[0.02]">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a timeline note..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff6b00]"
                  onKeyDown={(e) => e.key === 'Enter' && newNote.trim() && addNoteMutation.mutate(newNote)}
                />
                <button 
                  onClick={() => newNote.trim() && addNoteMutation.mutate(newNote)}
                  disabled={!newNote.trim() || addNoteMutation.isLoading}
                  className="bg-[#ff6b00] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#ff6b00]/90 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ApplicationDetailDrawer;
