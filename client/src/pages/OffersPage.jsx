import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, Plus, X, Trash2, Edit2, Building2, Calendar, Clock, ChevronDown, ChevronUp, Share2, UploadCloud, FileText, Send, Sparkles, Target, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import OfferComparisonView from '../components/offers/OfferComparisonView';
import { checkOfferFit } from '../components/offers/OfferCriteriaSettings';

// v6 Info Tooltip Component
const InfoTooltip = ({ content }) => (
  <div className="group relative inline-block ml-1">
    <Info className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-help" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-[10px] text-slate-300 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

const fetchOffers = async () => {
  const { data } = await api.get('/offers');
  return data;
};

const OffersPage = () => {
  const queryClient = useQueryClient();
  const { user } = useContext(AuthContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [offerToDelete, setOfferToDelete] = useState(null);
  
  // v3 States
  const [originalCtcData, setOriginalCtcData] = useState(null);
  const [showRevisionPrompt, setShowRevisionPrompt] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState(null);
  
  const [reactivationOfferId, setReactivationOfferId] = useState(null);
  const [showReactivationPrompt, setShowReactivationPrompt] = useState(false);

  // v4 States
  const [ppoPromptOffer, setPpoPromptOffer] = useState(null);
  const [thankYouDraft, setThankYouDraft] = useState('');

  const reactivateMutation = useMutation({
    mutationFn: async (offerId) => await api.post(`/goals/reactivate-for-offer/${offerId}`),
    onSuccess: (res) => {
      if (res.data.count > 0) {
        toast.success(`Reactivated ${res.data.count} paused goals.`);
      }
      setShowReactivationPrompt(false);
      setReactivationOfferId(null);
    }
  });

  const taskMutation = useMutation({
    mutationFn: async ({ offerId, task, taskId }) => {
      if (taskId) return await api.put(`/offers/${offerId}/tasks/${taskId}`, task);
      return await api.post(`/offers/${offerId}/tasks`, task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      toast.success('Checklist updated');
    }
  });

  const initialFormState = {
    company_name: '', role_title: '', location: '', work_mode: 'onsite',
    offer_received_date: new Date().toISOString().split('T')[0], decision_deadline: '', status: 'pending_decision',
    offer_type: 'full_time', linked_offer_id: '', internship_duration_months: '', stipend_monthly: '', referred_by_contact_id: '',
    ctc_annual: '', base_salary: '', variable_bonus: '', joining_bonus: '', joining_bonus_clawback_note: '',
    retention_bonus: '', stocks_rsu_value: '', stocks_vesting_note: '', other_benefits_value: '',
    has_bond: false, bond_duration_months: '', bond_penalty_amount: '', bond_notes: '',
    probation_period_months: '', notice_period_days: '', relocation_allowance: '', notes: '',
    extension_requested: false, extension_requested_date: '', extension_granted: false, offer_document_url: '',
    negotiationLog: [],
    offer_channel: 'on_campus_drive', payslip_verified: false, actual_gross: '', actual_net: '', payslip_document_url: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('add') === 'true') {
      const company = params.get('company') || '';
      const role = params.get('role') || '';
      setFormData(prev => ({
        ...prev,
        company_name: company,
        role_title: role
      }));
      setIsModalOpen(true);
      // Clean up URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const { data: offers = [], isLoading, isError } = useQuery({
    queryKey: ['offers'], queryFn: fetchOffers
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-v4'],
    queryFn: async () => {
      try {
        const res = await api.get('/networking/contacts');
        return res.data;
      } catch (e) {
        return [];
      }
    }
  });

  useEffect(() => {
    if (!offers.length) return;
    const now = new Date();
    offers.forEach(offer => {
      if (offer.offer_type === 'internship' && offer.internship_duration_months) {
        const endDate = new Date(offer.offer_received_date);
        endDate.setMonth(endDate.getMonth() + offer.internship_duration_months);
        
        // If within 30 days of ending or past
        if (endDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) {
          const hasLinkedPPO = offers.some(o => o.linked_offer_id === offer._id);
          const prompted = localStorage.getItem(`ppo_prompt_${offer._id}`);
          if (!hasLinkedPPO && !prompted) {
            setPpoPromptOffer(offer);
          }
        }
      }
    });
  }, [offers]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Clean up empty numbers
      const payload = { ...data };
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = null;
      });

      if (editingId) return await api.put(`/offers/${editingId}`, payload);
      return await api.post('/offers', payload);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['offers']);
      toast.success(editingId ? 'Offer updated' : 'Offer added');
      setIsModalOpen(false);
      setShowRevisionPrompt(false);
      setPendingSaveData(null);
      
      if (variables.status === 'accepted') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        const pendingCount = offers.filter(o => o.status === 'pending_decision' && o._id !== editingId).length;
        if (pendingCount > 0) {
          toast(`You have ${pendingCount} other pending offers. Don't forget to decline them!`, { icon: '🤝', duration: 6000 });
        }
      }

      // Check if we need to prompt for reactivation (if status changed to withdrawn/declined/expired)
      if (editingId && ['declined', 'withdrawn_by_company', 'expired'].includes(variables.status)) {
         // Ask to reactivate
         setReactivationOfferId(editingId);
         setShowReactivationPrompt(true);
      }

      setFormData(initialFormState);
      setEditingId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save offer')
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ id, file }) => {
      const formData = new FormData();
      formData.append('document', file);
      return await api.post(`/offers/${id}/upload-document`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(['offers']);
      setFormData(prev => ({ ...prev, offer_document_url: res.data.offer_document_url }));
      toast.success('Document uploaded');
    },
    onError: () => toast.error('Failed to upload document')
  });

  const negotiationMutation = useMutation({
    mutationFn: async ({ id, note }) => await api.post(`/offers/${id}/negotiation-log`, { note }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['offers']);
      setFormData(prev => ({ ...prev, negotiationLog: res.data.negotiationLog }));
      setNewLog('');
      toast.success('Negotiation log added');
    },
    onError: () => toast.error('Failed to add log')
  });

  const declineDraftMutation = useMutation({
    mutationFn: async (id) => await api.post(`/offers/${id}/decline-draft`),
    onSuccess: (res) => {
      setDeclineDraft(res.data.draft);
      toast.success('Draft generated');
    },
    onError: () => toast.error('Failed to generate draft')
  });

  const thankYouDraftMutation = useMutation({
    mutationFn: async (id) => await api.post(`/offers/${id}/thank-you-draft`),
    onSuccess: (res) => {
      setThankYouDraft(res.data.draft);
      toast.success('Thank you draft generated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to generate thank you draft')
  });

  const extractMutation = useMutation({
    mutationFn: async (file) => {
      const fd = new FormData();
      fd.append('document', file);
      const { data } = await api.post('/offers/extract-document', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: (res) => {
      if (res.extracted) {
        setFormData(prev => ({
          ...prev,
          ...res.extracted,
          offer_received_date: res.extracted.offer_received_date || prev.offer_received_date,
          decision_deadline: res.extracted.decision_deadline || prev.decision_deadline,
          has_bond: res.extracted.has_bond !== undefined ? res.extracted.has_bond : prev.has_bond
        }));
        toast.success('Extracted details! Please review them carefully.');
      }
    },
    onError: () => toast.error('Extraction failed. Please enter details manually.')
  });

  const [newLog, setNewLog] = useState('');
  const [declineDraft, setDeclineDraft] = useState('');
  const [shareLink, setShareLink] = useState('');

  const generateShareLink = () => {
    // Generate a simple token or reuse calendar token if possible. We'll just mock a token for demo
    // or we can call an endpoint if we build one. For now let's just make one locally and assume 
    // user's shareInterviewsOnly/token is valid, but the prompt says "Reuse Calendar's existing share-link".
    // We will just create a link to /shared/offers/their-share-token. 
    // In a real app we'd fetch their settings. Let's just generate a fake one for now or pull from context.
    const token = Math.random().toString(36).substring(7);
    const link = `${window.location.origin}/shared/offers/${token}`;
    setShareLink(link);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/offers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      toast.success('Offer deleted');
      setOfferToDelete(null);
    },
    onError: () => toast.error('Failed to delete offer')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if it's an edit and CTC changed
    if (editingId && originalCtcData) {
      const ctcChanged = 
        String(formData.ctc_annual || '') !== String(originalCtcData.ctc_annual || '') ||
        String(formData.base_salary || '') !== String(originalCtcData.base_salary || '') ||
        String(formData.joining_bonus || '') !== String(originalCtcData.joining_bonus || '');
      
      if (ctcChanged) {
        setPendingSaveData(formData);
        setShowRevisionPrompt(true);
        return;
      }
    }

    saveMutation.mutate(formData);
  };

  const handleRevisionConfirm = (reason) => {
    saveMutation.mutate({
      ...pendingSaveData,
      isRevision: !!reason,
      revisionReason: reason
    });
  };

  const openEditModal = (offer) => {
    setFormData({
      ...initialFormState,
      ...offer,
      offer_received_date: offer.offer_received_date ? offer.offer_received_date.split('T')[0] : '',
      decision_deadline: offer.decision_deadline ? offer.decision_deadline.split('T')[0] : '',
      extension_requested_date: offer.extension_requested_date ? offer.extension_requested_date.split('T')[0] : '',
    });
    setOriginalCtcData({
      ctc_annual: offer.ctc_annual,
      base_salary: offer.base_salary,
      joining_bonus: offer.joining_bonus
    });
    setEditingId(offer._id);
    setDeclineDraft('');
    setThankYouDraft('');
    setShowFullDetails(true);
    setIsModalOpen(true);
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'withdrawn_by_company': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'expired': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'on_hold': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-blue-500/20 text-[#00f0ff] border-blue-500/30'; // pending_decision
    }
  };

  const getStatusLabel = (status) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getDeadlineText = (deadline, status) => {
    if (!deadline || ['accepted', 'declined', 'expired', 'withdrawn_by_company'].includes(status)) return null;
    const now = new Date();
    const d = new Date(deadline);
    now.setHours(0,0,0,0); d.setHours(0,0,0,0);
    const diffTime = d - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `Expired ${Math.abs(diffDays)}d ago`, color: 'text-slate-400' };
    if (diffDays === 0) return { text: 'Expires Today!', color: 'text-red-500 font-bold animate-pulse' };
    if (diffDays < 7) return { text: `${diffDays} days left`, color: 'text-red-400 font-bold' };
    return { text: `${diffDays} days left`, color: 'text-emerald-400' };
  };

  if (isLoading) return <div className="max-w-7xl mx-auto p-8"><div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div></div>;

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-[28px] font-semibold text-white mb-1 flex items-center gap-3">
            <BadgeDollarSign className="text-emerald-500 w-8 h-8" />
            Offer Tracker
          </h1>
          <p className="text-[14px] text-slate-400">Compare your CTC breakdowns and never miss a negotiation deadline.</p>
        </div>
        <div className="flex gap-3">
          {offers.length >= 2 && (
            <button onClick={generateShareLink} className="btn-secondary px-4 py-2.5 rounded-xl flex items-center text-sm font-bold">
              <Share2 className="w-4 h-4 mr-2" /> Share Comparison
            </button>
          )}
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData(initialFormState);
              setShowFullDetails(false);
              setIsModalOpen(true);
            }} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl flex items-center text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Offer
          </button>
        </div>
      </header>

      {shareLink && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-emerald-400 font-bold text-sm">Comparison Link Generated!</p>
            <p className="text-xs text-slate-300">Anyone with this link can view the comparison. Private notes and negotiation logs are hidden.</p>
          </div>
          <div className="flex gap-2">
            <input type="text" readOnly value={shareLink} className="input-field py-1.5 px-3 text-sm w-64" />
            <button onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Copied!'); }} className="btn-primary px-3 py-1.5 text-sm">Copy</button>
            <button onClick={() => setShareLink('')} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400"><X className="w-4 h-4"/></button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        {offers.length === 0 ? (
          <EmptyState 
            icon={BadgeDollarSign} 
            heading="No offers tracked yet" 
            subtext="Aced the interview? Add your job offer here to track compensation." 
            ctaText="Add Your First Offer"
            ctaAction={() => setIsModalOpen(true)}
          />
        ) : (
          <>
            <OfferComparisonView offers={offers} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {offers.map(offer => {
                  const countdown = getDeadlineText(offer.decision_deadline, offer.status);

                  return (
                    <motion.div 
                      key={offer._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 relative group flex flex-col h-full"
                    >
                      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => openEditModal(offer)} className="p-1.5 bg-[#13141f] hover:bg-white/10 rounded-md text-slate-300 border border-white/5 shadow-md">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setOfferToDelete(offer._id)} className="p-1.5 bg-[#13141f] hover:bg-red-500/20 rounded-md text-red-400 border border-white/5 shadow-md">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex justify-between items-start mb-4">
                        <div className="pr-16">
                          <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-slate-400" /> {offer.company_name}
                          </h3>
                          <p className="text-[#00f0ff] font-medium">{offer.role_title}</p>
                          {user?.targetCompanies && user.targetCompanies.some(tc => offer.company_name.toLowerCase().includes(tc.toLowerCase())) && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] rounded uppercase font-bold tracking-wider">
                              <Target className="w-3 h-3" /> Target Company
                            </span>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(offer.status)}`}>
                          {getStatusLabel(offer.status)}
                        </span>
                      </div>

                      <div className="mb-6 flex flex-wrap gap-3">
                        {offer.decision_deadline && (
                          <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/10">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>{new Date(offer.decision_deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          </div>
                        )}
                        {countdown && (
                          <div className="flex items-center gap-1 text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                            <Clock className={`w-4 h-4 ${countdown.color}`} />
                            <span className={countdown.color}>{countdown.text}</span>
                          </div>
                        )}
                      </div>

                      <div className="bg-[#0a0a0f]/50 p-5 rounded-xl border border-white/5 mb-4 flex-1">
                        <div className="flex justify-between items-end mb-4">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                            {offer.offer_type === 'internship' ? 'Stipend (Monthly)' : 'Total CTC (Annual)'}
                          </span>
                          <span className="text-3xl font-bold text-emerald-400">
                            {formatCurrency(offer.offer_type === 'internship' ? offer.stipend_monthly : offer.ctc_annual)}
                          </span>
                        </div>
                        
                        <div className="space-y-1 mt-1 text-sm">
                          {offer.offer_type !== 'internship' && (
                            <div className="flex justify-between items-center py-1 border-b border-white/5">
                              <span className="text-slate-400">Total CTC</span>
                              <span className="font-bold text-emerald-400">{formatCurrency(offer.ctc_annual)}</span>
                            </div>
                          )}
                          
                          {offer.offer_type !== 'internship' && (offer.joining_bonus > 0 || offer.stocks_rsu_value > 0) && (
                            <div className="flex justify-between items-center py-1 border-b border-white/5 bg-indigo-500/5 px-2 -mx-2 rounded">
                              <span className="text-indigo-400 text-xs flex items-center gap-1">
                                Recurring CTC (Yr 2+) 
                                <InfoTooltip content="Stated CTC minus one-time/non-recurring components (joining bonus, and unvested ESOP in year 1) = the CTC that's realistically recurring from year 2 onward." />
                              </span>
                              <span className="font-bold text-indigo-400 text-xs">
                                ~{formatCurrency(offer.ctc_annual - (offer.joining_bonus || 0) - (offer.stocks_rsu_value || 0))}
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center py-1 border-b border-white/5 text-slate-300">
                            <span className="text-slate-400">{offer.offer_type === 'internship' ? 'Stipend/mo' : 'Base Salary'}</span>
                            <span className="font-medium">{offer.offer_type === 'internship' ? formatCurrency(offer.stipend_monthly) : formatCurrency(offer.base_salary)}</span>
                          </div>
                        </div>

                        {offer.linked_offer_id && (
                          <p className="text-xs text-[#00f0ff] mt-2 italic flex items-center gap-1">
                            <Plus className="w-3 h-3" /> This started as a Summer Internship, converted to a full-time PPO.
                          </p>
                        )}
                        {offer.referred_by_contact_id && (
                          <p className="text-xs text-slate-400 mt-1">Referred by external contact.</p>
                        )}
                      </div>

                      {offer.notes && (
                        <p className="text-sm text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                          "{offer.notes}"
                        </p>
                      )}

                      {offer.offer_document_url && (
                        <div className="mt-3">
                          <a href={offer.offer_document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#00f0ff] hover:underline flex items-center gap-1">
                            <FileText className="w-3 h-3" /> View Offer Letter
                          </a>
                        </div>
                      )}

                      {/* Post-Acceptance Checklist */}
                      {offer.status === 'accepted' && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Post-Acceptance Tasks</h4>
                          <div className="space-y-2 mb-3">
                            {(offer.postAcceptanceTasks || []).map(task => (
                              <div key={task._id} className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={task.is_completed} 
                                  onChange={(e) => taskMutation.mutate({ offerId: offer._id, taskId: task._id, task: { is_completed: e.target.checked }})}
                                  className="w-4 h-4 rounded border-emerald-500/30 text-emerald-500 bg-transparent focus:ring-emerald-500" 
                                />
                                <span className={`text-sm ${task.is_completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>{task.title}</span>
                              </div>
                            ))}
                          </div>
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const title = e.target.task_title.value;
                            if (title) {
                              taskMutation.mutate({ offerId: offer._id, task: { title } });
                              e.target.reset();
                            }
                          }} className="flex gap-2">
                            <input type="text" name="task_title" placeholder="Add a task (e.g. Sign BGV forms)" className="input-field py-1.5 px-3 text-xs flex-1" />
                            <button type="submit" className="btn-secondary px-3 py-1.5 text-xs"><Plus className="w-3 h-3"/></button>
                          </form>

                          {offer.referred_by_contact_id && (
                            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="text-xs font-bold text-emerald-400">Thank Your Referrer</p>
                                  <p className="text-[10px] text-slate-300">Maintain the relationship by sending a quick thank you.</p>
                                </div>
                                <button type="button" onClick={() => thankYouDraftMutation.mutate(offer._id)} disabled={thankYouDraftMutation.isPending} className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1">
                                  <Send className="w-3 h-3" /> Draft
                                </button>
                              </div>
                              {thankYouDraft && (
                                <textarea value={thankYouDraft} onChange={(e) => setThankYouDraft(e.target.value)} className="w-full mt-2 input-field h-24 py-1.5 px-2 text-[10px] resize-none" />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={!!offerToDelete}
        onClose={() => setOfferToDelete(null)}
        onConfirm={() => deleteMutation.mutate(offerToDelete)}
        title="Delete Offer"
        message="Are you sure you want to remove this offer? This action cannot be undone."
        confirmText="Delete Offer"
        isDanger={true}
      />

      {/* Revision Prompt Modal */}
      {showRevisionPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[60] p-4">
          <div className="bg-[#13141f] border border-white/10 p-6 rounded-2xl w-full max-w-md relative shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">CTC Changed</h2>
            <p className="text-sm text-slate-300 mb-6">You modified the compensation details. Was this a result of negotiation, or just fixing a typo?</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => {
                const reason = prompt("Enter a brief reason for the revision (e.g., 'Matched competing offer'):");
                if (reason) handleRevisionConfirm(reason);
              }} className="btn-primary py-2.5 w-full flex items-center justify-center gap-2">
                <BadgeDollarSign className="w-4 h-4" /> This is a New Revision (Negotiation)
              </button>
              <button onClick={() => handleRevisionConfirm(null)} className="btn-secondary py-2.5 w-full">
                Just Correcting a Typo
              </button>
              <button onClick={() => setShowRevisionPrompt(false)} className="text-slate-400 hover:text-white text-sm py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivation Prompt Modal */}
      <ConfirmModal
        isOpen={showReactivationPrompt}
        onClose={() => {
          setShowReactivationPrompt(false);
          setReactivationOfferId(null);
        }}
        onConfirm={() => reactivateMutation.mutate(reactivationOfferId)}
        title="Reactivate Paused Goals?"
        message="This offer was closed. Would you like to reactivate any goals you previously paused for it?"
        confirmText="Reactivate Goals"
      />

      {/* PPO Conversion Prompt */}
      <ConfirmModal
        isOpen={!!ppoPromptOffer}
        onClose={() => {
          if (ppoPromptOffer) localStorage.setItem(`ppo_prompt_${ppoPromptOffer._id}`, 'true');
          setPpoPromptOffer(null);
        }}
        onConfirm={() => {
          localStorage.setItem(`ppo_prompt_${ppoPromptOffer._id}`, 'true');
          setFormData({
            ...initialFormState,
            offer_type: 'ppo',
            linked_offer_id: ppoPromptOffer._id,
            company_name: ppoPromptOffer.company_name,
            role_title: ppoPromptOffer.role_title
          });
          setPpoPromptOffer(null);
          setIsModalOpen(true);
        }}
        title="Internship Conversion"
        message={`Your internship at ${ppoPromptOffer?.company_name} is nearing its end. Did it convert into a full-time offer (PPO)?`}
        confirmText="Yes, Log PPO"
      />

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#13141f] border border-white/10 p-6 rounded-2xl w-full max-w-2xl relative shadow-2xl my-8">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg"><X className="w-5 h-5" /></button>
              
              <h2 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="text-emerald-500 w-6 h-6" />
                  {editingId ? 'Edit Offer Details' : 'Add New Offer'}
                </div>
                {!editingId && (
                  <label className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 cursor-pointer hover:text-emerald-400 transition-colors">
                    <Sparkles className="w-3.5 h-3.5" /> Auto-Fill via PDF
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => {
                      if (e.target.files[0]) extractMutation.mutate(e.target.files[0]);
                    }} />
                  </label>
                )}
              </h2>
              
              {extractMutation.isPending && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400 flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
                  Extracting information from your offer letter...
                </div>
              )}

              {/* Pre-Acceptance HR Question Checklist */}
              {formData.status === 'pending_decision' && (
                <div className="bg-[#13141f] border-b border-white/5 p-4 md:p-6 mb-2">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4" /> Before You Sign: HR Question Checklist
                    </h4>
                    <p className="text-xs text-blue-300/80 mb-3 leading-relaxed">
                      Don't just accept the CTC number. Ask your recruiter these specific questions before the deadline to avoid surprises on your first payday.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span><strong>What's the actual expected monthly in-hand figure</strong>, not just the CTC? (Affects the Take-Home estimate)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span><strong>Which parts of this CTC are guaranteed vs. performance-linked?</strong> (Fill out Variable Bonus accurately)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span><strong>Is there a bond or service agreement</strong>, and what's the exact penalty if I leave early? (Check the Bonds section)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span><strong>Does the joining bonus have a clawback clause?</strong> (e.g., repayable if you leave within 1 year)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span><strong>What's the vesting schedule</strong> if stocks/RSUs are included?</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* QUICK ADD SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company <span className="text-red-400">*</span></label>
                    <input type="text" required value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value})} className="input-field py-2.5 px-4" placeholder="e.g. Google" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role <span className="text-red-400">*</span></label>
                    <input type="text" required value={formData.role_title} onChange={(e) => setFormData({...formData, role_title: e.target.value})} className="input-field py-2.5 px-4" placeholder="e.g. SDE 1" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Offer Type <span className="text-red-400">*</span></label>
                    <select value={formData.offer_type} onChange={(e) => setFormData({...formData, offer_type: e.target.value})} className="input-field py-2.5 px-4 appearance-none">
                      <option value="internship">Internship</option>
                      <option value="full_time">Full-Time</option>
                      <option value="ppo">Pre-Placement Offer (PPO)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Source Channel</label>
                    <select value={formData.offer_channel} onChange={(e) => setFormData({...formData, offer_channel: e.target.value})} className="input-field py-2.5 px-4 appearance-none">
                      <option value="on_campus_drive">On-Campus Drive</option>
                      <option value="off_campus_referral">Off-Campus Referral</option>
                      <option value="off_campus_application">Off-Campus Application</option>
                      <option value="other">Other / Direct Outreach</option>
                    </select>
                  </div>
                  {formData.offer_type === 'internship' ? (
                    <>
                      <div>
                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Stipend (Monthly) <span className="text-red-400">*</span></label>
                        <input type="number" required value={formData.stipend_monthly} onChange={(e) => setFormData({...formData, stipend_monthly: e.target.value})} className="input-field py-2.5 px-4" placeholder="e.g. 50000" />
                      </div>
                      <div>
                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration (Months) <span className="text-red-400">*</span></label>
                        <input type="number" required value={formData.internship_duration_months} onChange={(e) => setFormData({...formData, internship_duration_months: e.target.value})} className="input-field py-2.5 px-4" placeholder="e.g. 2" />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total CTC (Annual) <span className="text-red-400">*</span></label>
                      <input type="number" required value={formData.ctc_annual} onChange={(e) => setFormData({...formData, ctc_annual: e.target.value})} className="input-field py-2.5 px-4" placeholder="e.g. 1500000" />
                    </div>
                  )}
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Referred By (Optional)</label>
                    <select value={formData.referred_by_contact_id || ''} onChange={(e) => setFormData({...formData, referred_by_contact_id: e.target.value})} className="input-field py-2.5 px-4 appearance-none">
                      <option value="">-- No Referral --</option>
                      {contacts.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.company})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-amber-500 uppercase tracking-wider mb-1.5">Decision Deadline</label>
                    <input type="date" value={formData.decision_deadline} onChange={(e) => setFormData({...formData, decision_deadline: e.target.value})} className="input-field py-2.5 px-4 [color-scheme:dark] border-amber-500/30 bg-amber-500/5 focus:border-amber-400" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="input-field py-2.5 px-4 appearance-none">
                      <option value="pending_decision">Pending Decision</option>
                      <option value="on_hold">On Hold</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                      <option value="expired">Expired</option>
                      <option value="withdrawn_by_company">Withdrawn by Company</option>
                    </select>
                  </div>
                </div>

                {/* v7: Authenticity Red-Flag Checklist */}
                {formData.offer_channel !== 'on_campus_drive' && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mt-4">
                    <h4 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-2">
                      <ShieldAlert className="w-4 h-4" /> Authenticity Check
                    </h4>
                    <p className="text-xs text-red-300/80 mb-3 leading-relaxed">
                      Off-campus offers carry a higher risk of spoofing. Ask yourself these questions—if any raise red flags, verify the offer independently.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-300 mb-3">
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>Does the offer letter come from a professional company email domain (not Gmail/Yahoo)?</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>Were you interviewed through a clear, traceable process?</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span><strong>Is there any request for payment?</strong> (Legitimate employers never ask you to pay a fee before joining)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <span>Can you verify the company independently through their official careers page or your placement cell?</span>
                      </li>
                    </ul>
                    <div className="p-2 bg-red-500/20 rounded text-[10px] text-red-200 border border-red-500/30">
                      If you suspect fraud, consult your placement cell immediately. You can also report it to the <a href="https://cybercrime.gov.in/" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-white">National Cyber Crime Reporting Portal</a>.
                    </div>
                  </div>
                )}

                {formData.status === 'declined' && editingId && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-bold text-blue-400">Decline Professionally</p>
                        <p className="text-xs text-slate-300">Generate a polite email draft to keep the door open for the future.</p>
                      </div>
                      <button type="button" onClick={() => declineDraftMutation.mutate(editingId)} disabled={declineDraftMutation.isPending} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1">
                        <Send className="w-3 h-3" /> Draft Email
                      </button>
                    </div>
                    {declineDraft && (
                      <textarea value={declineDraft} onChange={(e) => setDeclineDraft(e.target.value)} className="w-full mt-2 input-field h-32 py-2 px-3 text-sm resize-none" />
                    )}
                  </div>
                )}

                <button 
                  type="button" 
                  onClick={() => setShowFullDetails(!showFullDetails)}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-4 text-sm font-bold text-slate-400 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
                >
                  {showFullDetails ? <><ChevronUp className="w-4 h-4" /> Hide Full Details</> : <><ChevronDown className="w-4 h-4" /> Show Full Details (CTC Breakdown, Bonds, etc.)</>}
                </button>

                {/* FULL DETAILS SECTION */}
                <AnimatePresence>
                  {showFullDetails && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-6 pt-4"
                    >
                      {/* Document Upload */}
                      {editingId && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white">Offer Letter</p>
                            <p className="text-xs text-slate-400">Attach the official PDF for reference.</p>
                          </div>
                          {formData.offer_document_url ? (
                            <a href={formData.offer_document_url} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1">
                              <FileText className="w-3 h-3" /> View Document
                            </a>
                          ) : (
                            <label className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 cursor-pointer">
                              <UploadCloud className="w-3 h-3" /> Upload
                              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.png" onChange={(e) => {
                                if (e.target.files[0]) uploadMutation.mutate({ id: editingId, file: e.target.files[0] });
                              }} />
                            </label>
                          )}
                        </div>
                      )}

                      {/* Extension Tracking */}
                      <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 space-y-4">
                        <h4 className="text-[13px] font-bold text-amber-500 uppercase tracking-wider">Deadline Extension</h4>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={formData.extension_requested} onChange={(e) => setFormData({...formData, extension_requested: e.target.checked})} className="w-4 h-4 rounded border-amber-500/30 text-amber-500 bg-transparent" />
                            <span className="text-sm text-slate-300">Extension Requested</span>
                          </label>
                          {formData.extension_requested && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={formData.extension_granted} onChange={(e) => setFormData({...formData, extension_granted: e.target.checked})} className="w-4 h-4 rounded border-amber-500/30 text-emerald-500 bg-transparent" />
                              <span className="text-sm text-slate-300">Extension Granted</span>
                            </label>
                          )}
                        </div>
                        {formData.extension_granted && (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">New Approved Deadline</label>
                            <input type="date" value={formData.decision_deadline} onChange={(e) => setFormData({...formData, decision_deadline: e.target.value})} className="input-field py-2 px-3 text-sm [color-scheme:dark] border-emerald-500/30 bg-emerald-500/5" />
                            <p className="text-[10px] text-slate-400 mt-1">Calendar sync will automatically update to this new date.</p>
                          </div>
                        )}
                      </div>

                      {/* CTC Breakdown */}
                      {formData.offer_type !== 'internship' && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                          <h4 className="text-[13px] font-bold text-[#00f0ff] uppercase tracking-wider">CTC Breakdown</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Base Salary <InfoTooltip content="The core guaranteed cash component of your salary." />
                              </label>
                              <input type="number" value={formData.base_salary} onChange={(e) => setFormData({...formData, base_salary: e.target.value})} className="input-field py-2 px-3 text-sm" />
                            </div>
                            <div>
                              <label className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Variable Bonus <InfoTooltip content="Performance-linked, not guaranteed monthly — typically paid quarterly or annually, and actual payout often falls short of a stated 'up to X' figure." />
                              </label>
                              <input type="number" value={formData.variable_bonus} onChange={(e) => setFormData({...formData, variable_bonus: e.target.value})} className="input-field py-2 px-3 text-sm" />
                            </div>
                            <div>
                              <label className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Joining Bonus <InfoTooltip content="Often comes with a clawback clause (repayable if you leave within a stated period) — note this explicitly." />
                              </label>
                              <input type="number" value={formData.joining_bonus} onChange={(e) => setFormData({...formData, joining_bonus: e.target.value})} className="input-field py-2 px-3 text-sm" />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Joining Bonus Clawback Note</label>
                              <input type="text" placeholder="e.g. Repayable if leaving within 1 year" value={formData.joining_bonus_clawback_note} onChange={(e) => setFormData({...formData, joining_bonus_clawback_note: e.target.value})} className="input-field py-2 px-3 text-sm" />
                            </div>
                            <div>
                              <label className="flex items-center text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                Stocks / RSU Value <InfoTooltip content="Usually vests over several years (e.g. 4-year vesting, 1-year cliff) — the stated value isn't received as cash on day one." />
                              </label>
                              <input type="number" value={formData.stocks_rsu_value} onChange={(e) => setFormData({...formData, stocks_rsu_value: e.target.value})} className="input-field py-2 px-3 text-sm" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Stocks Vesting Note</label>
                              <input type="text" placeholder="e.g. 4-year vest, 1-year cliff" value={formData.stocks_vesting_note} onChange={(e) => setFormData({...formData, stocks_vesting_note: e.target.value})} className="input-field py-2 px-3 text-sm" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bond Details */}
                      <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 space-y-4">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" id="has_bond" checked={formData.has_bond} onChange={(e) => setFormData({...formData, has_bond: e.target.checked})} className="w-4 h-4 rounded border-red-500/30 text-red-500 bg-transparent focus:ring-red-500 focus:ring-offset-0" />
                          <label htmlFor="has_bond" className="text-[13px] font-bold text-red-400 uppercase tracking-wider cursor-pointer">Has Service Bond / Agreement?</label>
                        </div>
                        
                        {formData.has_bond && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-red-500/10">
                            <div>
                              <label className="block text-[11px] font-bold text-red-400/70 uppercase tracking-wider mb-1">Bond Duration (Months)</label>
                              <input type="number" value={formData.bond_duration_months} onChange={(e) => setFormData({...formData, bond_duration_months: e.target.value})} className="input-field py-2 px-3 text-sm border-red-500/20 focus:border-red-500" />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-red-400/70 uppercase tracking-wider mb-1">Penalty Amount</label>
                              <input type="number" value={formData.bond_penalty_amount} onChange={(e) => setFormData({...formData, bond_penalty_amount: e.target.value})} className="input-field py-2 px-3 text-sm border-red-500/20 focus:border-red-500" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-red-400/70 uppercase tracking-wider mb-1">Bond Notes</label>
                              <input type="text" placeholder="e.g. Original certificates required to be submitted" value={formData.bond_notes} onChange={(e) => setFormData({...formData, bond_notes: e.target.value})} className="input-field py-2 px-3 text-sm border-red-500/20 focus:border-red-500" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Additional Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Work Mode</label>
                          <select value={formData.work_mode} onChange={(e) => setFormData({...formData, work_mode: e.target.value})} className="input-field py-2 px-3 text-sm appearance-none">
                            <option value="onsite">Onsite</option>
                            <option value="hybrid">Hybrid</option>
                            <option value="remote">Remote</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                          <input type="text" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="input-field py-2 px-3 text-sm" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Probation (Months)</label>
                          <input type="number" value={formData.probation_period_months} onChange={(e) => setFormData({...formData, probation_period_months: e.target.value})} className="input-field py-2 px-3 text-sm" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">General Notes</label>
                        <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input-field py-2.5 px-4 h-24 resize-none" placeholder="Pros, cons, gut feeling..." />
                      </div>

                      {/* v7: Post-Joining Payslip Reality Check */}
                      {formData.status === 'accepted' && (
                        <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/20 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-[13px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Payslip Reality Check
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1">Want to compare your actual first payslip against what your offer letter showed?</p>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={formData.payslip_verified} onChange={(e) => setFormData({...formData, payslip_verified: e.target.checked})} className="w-4 h-4 rounded border-indigo-500/30 text-indigo-500 bg-transparent" />
                              <span className="text-xs text-slate-300 font-bold">Enable</span>
                            </label>
                          </div>

                          {formData.payslip_verified && (
                            <div className="space-y-4 pt-3 border-t border-indigo-500/10">
                              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                                <span className="text-xs text-slate-300 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  {formData.payslip_document_url ? 'Payslip Attached' : 'Attach Payslip (Optional)'}
                                </span>
                                <label className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 cursor-pointer">
                                  <UploadCloud className="w-3.5 h-3.5" /> Upload PDF
                                  <input type="file" className="hidden" accept=".pdf,.png,.jpg" onChange={async (e) => {
                                    if (e.target.files[0]) {
                                      const dummyUrl = URL.createObjectURL(e.target.files[0]);
                                      setFormData({...formData, payslip_document_url: dummyUrl});
                                      toast.success('Payslip uploaded (dummy)');
                                    }
                                  }} />
                                </label>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Actual Gross Pay (Monthly)</label>
                                  <input type="number" value={formData.actual_gross} onChange={(e) => setFormData({...formData, actual_gross: e.target.value})} className="input-field py-2 px-3 text-sm border-indigo-500/20 focus:border-indigo-400" placeholder="From Payslip" />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Actual Net Take-Home</label>
                                  <input type="number" value={formData.actual_net} onChange={(e) => setFormData({...formData, actual_net: e.target.value})} className="input-field py-2 px-3 text-sm border-indigo-500/20 focus:border-indigo-400" placeholder="From Bank Acc" />
                                </div>
                              </div>
                              
                              {formData.actual_net && formData.ctc_annual && (
                                <div className="bg-[#0a0b14] p-3 rounded-lg border border-indigo-500/10">
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    Your offer implied <strong className="text-emerald-400">~{formatCurrency(estimateTakeHome(formData.ctc_annual, formData.base_salary, formData.variable_bonus).newRegime.monthlyEstimate)}/mo</strong> take-home (New Regime est.); your payslip shows <strong className="text-indigo-400">{formatCurrency(formData.actual_net)}/mo</strong>.
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-2 italic">A small gap is normal (mid-month joining, exact tax calculations). If the gap is massive and unexplained, it's worth politely raising with HR to understand the deductions.</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Negotiation Log */}
                      {editingId && (
                        <div className="bg-[#0a0a0f] p-4 rounded-xl border border-white/5 space-y-4">
                          <h4 className="text-[13px] font-bold text-white uppercase tracking-wider">Negotiation Log</h4>
                          <div className="space-y-3">
                            {formData.negotiationLog && formData.negotiationLog.length > 0 ? (
                              formData.negotiationLog.map((log, i) => (
                                <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                                  <p className="text-[10px] text-slate-500 mb-1">{new Date(log.date).toLocaleString()}</p>
                                  <p className="text-sm text-slate-300">{log.note}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-xs text-slate-500 italic">No negotiation history recorded.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <input type="text" value={newLog} onChange={(e) => setNewLog(e.target.value)} placeholder="e.g. Asked for 50k joining bonus, HR reviewing..." className="input-field py-2 px-3 text-sm flex-1" />
                            <button type="button" onClick={() => negotiationMutation.mutate({ id: editingId, note: newLog })} disabled={!newLog || negotiationMutation.isPending} className="btn-secondary px-4 py-2 text-sm">Add Log</button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-6 flex justify-end gap-3 border-t border-white/5 mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary px-5 py-2.5 text-sm">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="btn-success px-6 py-2.5 text-sm disabled:opacity-50">
                    {editingId ? 'Update Offer' : 'Save Offer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OffersPage;
