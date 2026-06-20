import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Filter, Search, Plus, MessageSquare } from 'lucide-react';
import api from '../services/api';
import StatsBar from '../components/networking/StatsBar';
import TodayActionsStrip from '../components/networking/TodayActionsStrip';
import CompanyNetworkMap from '../components/networking/CompanyNetworkMap';
import ContactCard from '../components/networking/ContactCard';
import ContactDetailDrawer from '../components/networking/ContactDetailDrawer';
import OutreachAnalytics from '../components/networking/OutreachAnalytics';
import ReferralKanban from '../components/networking/ReferralKanban';
import InsightsPanel from '../components/networking/InsightsPanel';
import TemplateLibrary from '../components/networking/TemplateLibrary';
import WeeklyGoalsCard from '../components/networking/WeeklyGoalsCard';
import LinkedInImportModal from '../components/networking/LinkedInImportModal';
import NetworkGraph from '../components/networking/NetworkGraph';
import WeeklyBriefBanner from '../components/networking/WeeklyBriefBanner';
import PlatformBenchmarkBanner from '../components/networking/PlatformBenchmarkBanner';
import BatchOutreachModal from '../components/networking/BatchOutreachModal';
import AlumniSuggestionsCard from '../components/networking/AlumniSuggestionsCard';
import NetworkDepthAuditModal from '../components/networking/NetworkDepthAuditModal';
import PlacementTimelinePanel from '../components/networking/PlacementTimelinePanel';
import OutreachDiagnosisModal from '../components/networking/OutreachDiagnosisModal';
import AlumniTransitionModal from '../components/networking/AlumniTransitionModal';
import PlacementPlaysBoard from '../components/networking/PlacementPlaysBoard';
import toast from 'react-hot-toast';

const NetworkPage = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('CONTACTS'); // CONTACTS, ANALYTICS, REFERRALS
  const [viewMode, setViewMode] = useState('GRID'); // GRID, GRAPH
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDepthAudit, setShowDepthAudit] = useState(false);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [showAlumni, setShowAlumni] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStrength, setFilterStrength] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Queries
  const { data: stats } = useQuery({ queryKey: ['networking-stats'], queryFn: async () => (await api.get('/networking/stats')).data });
  const { data: recommendations = [] } = useQuery({ queryKey: ['networking-recs'], queryFn: async () => (await api.get('/networking/recommendations')).data });
  const { data: companyMap = [] } = useQuery({ queryKey: ['networking-company-map'], queryFn: async () => (await api.get('/networking/company-map')).data });
  const { data: insights = [] } = useQuery({ queryKey: ['networking-insights'], queryFn: async () => (await api.get('/networking/insights')).data });
  const { data: templates = [] } = useQuery({ queryKey: ['networking-templates'], queryFn: async () => (await api.get('/networking/templates')).data });
  const { data: goals } = useQuery({ queryKey: ['networking-goals'], queryFn: async () => (await api.get('/networking/goals/current')).data });
  
  const { data: contacts = [] } = useQuery({ 
    queryKey: ['networking-contacts', searchTerm, filterStrength], 
    queryFn: async () => {
      const params = new URLSearchParams();
      if(searchTerm) params.append('search', searchTerm);
      if(filterStrength) params.append('connectionStrength', filterStrength);
      const res = await api.get(`/networking/contacts?${params.toString()}`);
      return Array.isArray(res.data) ? res.data : (res.data.contacts || []);
    } 
  });

  const { data: referralPipeline = [] } = useQuery({ queryKey: ['networking-pipeline'], queryFn: async () => (await api.get('/networking/referral-pipeline')).data });

  useEffect(() => {
    const handleOpenDiagnosis = () => setShowDiagnosis(true);
    const handleOpenAlumni = () => setShowAlumni(true);
    document.addEventListener('open-diagnosis-modal', handleOpenDiagnosis);
    document.addEventListener('open-alumni-modal', handleOpenAlumni);
    return () => {
      document.removeEventListener('open-diagnosis-modal', handleOpenDiagnosis);
      document.removeEventListener('open-alumni-modal', handleOpenAlumni);
    };
  }, []);

  // Contact Details Query (only when selected)
  const { data: contactDetails, refetch: refetchContact } = useQuery({
    queryKey: ['networking-contact', selectedContact?._id],
    queryFn: async () => (await api.get(`/networking/contacts/${selectedContact._id}`)).data,
    enabled: !!selectedContact
  });

  // Mutations
  const analyzeMutation = useMutation({
    mutationFn: () => api.post('/networking/analyze'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['networking-insights'] })
  });

  const updateContactMutation = useMutation({
    mutationFn: (data) => api.patch(`/networking/contacts/${selectedContact._id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networking-contacts'] });
      refetchContact();
    }
  });

  const createContactMutation = useMutation({
    mutationFn: (data) => api.post('/networking/contacts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networking-contacts'] });
      queryClient.invalidateQueries({ queryKey: ['networking-company-map'] });
      toast.success('Contact added');
    }
  });

  const sendOutreachMutation = useMutation({
    mutationFn: (data) => api.post('/networking/outreach/send', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networking-stats'] });
      queryClient.invalidateQueries({ queryKey: ['networking-contacts'] });
      refetchContact();
      toast.success('Message logged');
    }
  });

  const createPipelineMutation = useMutation({
    mutationFn: (data) => api.post('/networking/referral-pipeline', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networking-pipeline'] });
      refetchContact();
      toast.success('Referral pipeline started');
    }
  });

  const updatePipelineMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/networking/referral-pipeline/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networking-pipeline'] });
      refetchContact();
    }
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => api.post('/networking/templates', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['networking-templates'] });
      toast.success('Template saved');
    }
  });

  // Run analysis on mount
  useEffect(() => {
    analyzeMutation.mutate();
    // eslint-disable-next-line
  }, []);

  const handleCreateDummyContact = (company = '') => {
    const name = prompt("Enter contact name:");
    if (!name) return;
    const role = prompt("Enter contact role (e.g. Software Engineer):");
    const comp = company || prompt("Enter company name:");
    createContactMutation.mutate({ name, role, company: comp, contactType: 'ALUMNI', connectionStrength: 'WEAK' });
  };

  return (
    <div className="relative min-h-screen bg-[#050508] p-4 md:p-8 space-y-6 overflow-hidden">
      {/* Premium Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff6b00]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Users className="text-[#ff6b00]" size={32} />
            Networking Intelligence
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl">
            Treat networking as a skill. Build relationships, track outreach, and turn connections into placements.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto h-[72px]">
          <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 w-64 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
            <WeeklyGoalsCard goals={goals} onEdit={() => toast.success('Edit goals modal would open here')} />
          </div>
          <div className="h-full flex flex-col gap-2">
            <div className="flex gap-2 flex-1">
              <button 
                onClick={() => setShowImportModal(true)}
                className="flex-1 px-4 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-blue-500/20"
              >
                <Users size={16} /> Import LinkedIn
              </button>
              {/* Networking V6: 10-minute active networking sprint mode */}
              <button 
                onClick={() => toast.success('Sprint mode activated! Timer started for 10 minutes.')}
                className="flex-1 px-4 bg-gradient-to-r from-rose-500/20 to-orange-500/20 hover:from-rose-500/30 hover:to-orange-500/30 text-orange-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-orange-500/30"
              >
                ⚡ 10-Min Sprint
              </button>
              <button 
                onClick={() => setShowDepthAudit(true)}
                className="flex-1 px-4 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-purple-500/20"
              >
                Depth Audit
              </button>
            </div>
            <div className="flex gap-2 flex-1">
              <button 
                onClick={() => setShowTemplates(true)}
                className="flex-1 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/10"
              >
                <MessageSquare size={16} /> Templates
              </button>
              <button 
                onClick={() => handleCreateDummyContact()}
                className="flex-1 px-4 bg-[#ff6b00] hover:bg-[#ff8533] text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,107,0,0.4)]"
              >
                <Plus size={16} /> Contact
              </button>
            </div>
          </div>
        </div>
      </div>

      <WeeklyBriefBanner />
      
      {/* Networking V6: 7-day Networking Kickstart view */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🚀 7-Day Networking Kickstart
          </h2>
          <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Day 3 / 7
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#13141f] p-4 rounded-xl border border-white/5 opacity-50 relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 backdrop-blur-md">Completed</div>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Day 1: Audit Profile</h3>
            <p className="text-xs text-slate-400">Update LinkedIn headline and about section.</p>
          </div>
          <div className="bg-[#13141f] p-4 rounded-xl border border-white/5 opacity-50 relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/30 backdrop-blur-md">Completed</div>
            </div>
            <h3 className="text-sm font-bold text-white mb-1">Day 2: Identify Targets</h3>
            <p className="text-xs text-slate-400">Find 5 alumni at your dream companies.</p>
          </div>
          <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
            <h3 className="text-sm font-bold text-emerald-400 mb-1">Day 3: Send Outreach (Today)</h3>
            <p className="text-xs text-slate-300 mb-3">Send your first 3 AI-generated connection requests.</p>
            <button className="w-full py-1.5 bg-emerald-500 text-white rounded text-xs font-bold hover:bg-emerald-600 transition-colors">Start Day 3 Action</button>
          </div>
        </div>
      </div>

      <StatsBar stats={stats} />

      <PlatformBenchmarkBanner />

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)]">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-12">
          
          <TodayActionsStrip 
            recommendations={recommendations} 
            onActionClick={(contact) => setSelectedContact(contact)} 
          />
          
          <CompanyNetworkMap 
            companies={companyMap} 
            onCreateContact={(company) => handleCreateDummyContact(company)}
          />

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {['CONTACTS', 'REFERRALS', 'ANALYTICS', 'PLAYS'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  activeTab === tab ? 'border-[#ff6b00] text-white' : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'PLAYS' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PlacementPlaysBoard />
            </motion.div>
          )}

          {activeTab === 'CONTACTS' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex gap-4 mb-6">
                <div className="flex bg-[#13141f] border border-white/10 rounded-xl p-1 shrink-0">
                  <button 
                    onClick={() => setViewMode('GRID')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'GRID' ? 'bg-[#ff6b00] text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Grid
                  </button>
                  <button 
                    onClick={() => setViewMode('GRAPH')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${viewMode === 'GRAPH' ? 'bg-[#ff6b00] text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Graph
                  </button>
                </div>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search contacts by name, role, or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#13141f] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] transition-colors"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={filterStrength}
                    onChange={(e) => setFilterStrength(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-[#13141f] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] appearance-none"
                  >
                    <option value="">All Strengths</option>
                    <option value="CLOSE">Close</option>
                    <option value="STRONG">Strong</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="WEAK">Weak</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (isSelectionMode) setSelectedContactIds([]); // clear on exit
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${isSelectionMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-[#13141f] text-slate-300 border-white/10 hover:bg-white/5'}`}
                >
                  {isSelectionMode ? 'Cancel Selection' : 'Batch Outreach'}
                </button>
              </div>

              {contacts.length === 0 ? (
                <div className="text-center py-12 bg-[#13141f] border border-white/5 rounded-xl">
                  <Users className="mx-auto mb-4 text-slate-600" size={48} />
                  <h3 className="text-xl font-bold text-white mb-2">Build Your Network</h3>
                  <p className="text-slate-400 max-w-md mx-auto mb-6">
                    Add your first contact — start with senior students from your college who are now at target companies.
                  </p>
                  <button onClick={() => handleCreateDummyContact()} className="px-6 py-2.5 bg-[#ff6b00] hover:bg-[#e66000] text-white font-medium rounded-lg transition-colors">
                    Add Contact
                  </button>
                </div>
              ) : viewMode === 'GRAPH' ? (
                <NetworkGraph contacts={contacts} onNodeClick={setSelectedContact} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-16">
                  {contacts.map((contact, idx) => {
                    const isSelected = selectedContactIds.includes(contact._id);
                    return (
                      <motion.div key={contact._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="relative">
                        <ContactCard 
                          contact={contact} 
                          onClick={(c) => {
                            if (isSelectionMode) {
                              setSelectedContactIds(prev => prev.includes(c._id) ? prev.filter(id => id !== c._id) : [...prev, c._id]);
                            } else {
                              setSelectedContact(c);
                            }
                          }} 
                        />
                        {isSelectionMode && (
                          <div className={`absolute inset-0 border-2 rounded-xl pointer-events-none transition-colors ${isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-transparent'}`} />
                        )}
                        {isSelectionMode && (
                          <div className={`absolute top-4 right-4 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20 bg-[#13141f]'}`}>
                            {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'REFERRALS' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ReferralKanban 
                pipeline={referralPipeline} 
                onUpdateStatus={(id, data) => updatePipelineMutation.mutate({ id, data })}
              />
            </motion.div>
          )}

          {activeTab === 'ANALYTICS' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <OutreachAnalytics stats={stats} />
            </motion.div>
          )}

        </div>

        {/* Right Sidebar - Insights */}
        <div className="w-full lg:w-72 shrink-0 hidden lg:block bg-[#13141f] border border-white/5 rounded-xl p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          <InsightsPanel 
            insights={insights} 
            onDismiss={(id) => {
              toast.success('Insight dismissed');
            }} 
          />
          <PlacementTimelinePanel />
          <AlumniSuggestionsCard />
        </div>

      </div>

      {/* Modals and Overlays */}
      <AnimatePresence>
        {selectedContact && contactDetails && !isSelectionMode && (
          <ContactDetailDrawer 
            contact={contactDetails}
            messages={contactDetails.messages}
            pipeline={contactDetails.referralPipeline}
            applications={contactDetails.applications}
            onClose={() => setSelectedContact(null)}
            onUpdate={(data) => updateContactMutation.mutate(data)}
            onSendOutreach={(data) => sendOutreachMutation.mutate(data)}
            onCreatePipeline={(contactId) => createPipelineMutation.mutate({ contactId, notes: 'Started via pipeline' })}
            onDelete={() => deleteContactMutation.mutate(selectedContact._id)}
          />
        )}
        
        {showDepthAudit && <NetworkDepthAuditModal onClose={() => setShowDepthAudit(false)} />}
        {showDiagnosis && <OutreachDiagnosisModal onClose={() => setShowDiagnosis(false)} />}
        {showAlumni && <AlumniTransitionModal onClose={() => setShowAlumni(false)} />}
        
        {showTemplates && (
          <TemplateLibrary 
            templates={templates} 
            onClose={() => setShowTemplates(false)}
            onCreateTemplate={(data) => createTemplateMutation.mutate(data)}
          />
        )}
      </AnimatePresence>
      {showImportModal && (
        <LinkedInImportModal 
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            setShowImportModal(false);
            queryClient.invalidateQueries(['contacts']);
            queryClient.invalidateQueries(['networkingStats']);
          }}
        />
      )}
      {showBatchModal && (
        <BatchOutreachModal 
          contacts={contacts.filter(c => selectedContactIds.includes(c._id))}
          onClose={() => setShowBatchModal(false)}
          onComplete={() => {
            setShowBatchModal(false);
            setIsSelectionMode(false);
            setSelectedContactIds([]);
            queryClient.invalidateQueries(['networking-contacts']);
          }}
        />
      )}

      {/* Floating Selection Bar */}
      <AnimatePresence>
        {isSelectionMode && selectedContactIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#13141f] border border-blue-500/30 shadow-2xl rounded-2xl p-4 z-40 flex items-center gap-6"
          >
            <div className="text-white font-bold">
              {selectedContactIds.length} contact{selectedContactIds.length !== 1 && 's'} selected
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedContactIds([])}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button 
                onClick={() => setShowBatchModal(true)}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-lg"
              >
                Generate Messages
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
};

export default NetworkPage;
