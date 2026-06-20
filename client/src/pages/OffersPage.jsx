import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, Plus, X, Trash2, Edit2, Building2, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import api from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import OfferLeverageCard from '../components/offers/OfferLeverageCard';

const fetchOffers = async () => {
  const { data } = await api.get('/offers');
  return data;
};

const OffersPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [offerToDelete, setOfferToDelete] = useState(null);

  const [formData, setFormData] = useState({
    company: '', role: '', baseSalary: '', signOnBonus: '', rsu: '', deadline: '', status: 'Pending', notes: ''
  });

  const { data: offers = [], isLoading, isError } = useQuery({
    queryKey: ['offers'], queryFn: fetchOffers
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) return await api.put(`/offers/${editingId}`, data);
      return await api.post('/offers', data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['offers']);
      toast.success(editingId ? 'Offer updated' : 'Offer added');
      setIsModalOpen(false);
      
      // Trigger confetti if status is set to Accepted!
      if (variables.status === 'Accepted') {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      }

      setFormData({ company: '', role: '', baseSalary: '', signOnBonus: '', rsu: '', deadline: '', status: 'Pending', notes: '' });
      setEditingId(null);
    },
    onError: () => toast.error('Failed to save offer')
  });

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
    saveMutation.mutate(formData);
  };

  const openEditModal = (offer) => {
    setFormData({
      company: offer.company, role: offer.role,
      baseSalary: offer.baseSalary, signOnBonus: offer.signOnBonus, rsu: offer.rsu,
      deadline: offer.deadline ? offer.deadline.split('T')[0] : '',
      status: offer.status, notes: offer.notes
    });
    setEditingId(offer._id);
    setIsModalOpen(true);
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Negotiating': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-blue-500/20 text-[#00f0ff] border-blue-500/30'; // Pending
    }
  };

  const getDeadlineText = (deadline) => {
    if (!deadline) return null;
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

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8"><div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={BadgeDollarSign} heading="Error" subtext="Failed to load offers." />;
  }

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
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ company: '', role: '', baseSalary: '', signOnBonus: '', rsu: '', deadline: '', status: 'Pending', notes: '' });
            setIsModalOpen(true);
          }} 
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Offer
        </button>
      </header>

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {offers.map(offer => {
                const basePct = (offer.baseSalary / offer.totalCTC) * 100 || 0;
                const bonusPct = (offer.signOnBonus / offer.totalCTC) * 100 || 0;
                const rsuPct = (offer.rsu / offer.totalCTC) * 100 || 0;
                const countdown = getDeadlineText(offer.deadline);

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
                          <Building2 className="w-5 h-5 text-slate-400" /> {offer.company}
                        </h3>
                        <p className="text-[#00f0ff] font-medium">{offer.role}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(offer.status)}`}>
                        {offer.status}
                      </span>
                    </div>

                    <div className="mb-6 flex flex-wrap gap-3">
                      {offer.deadline && (
                        <div className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/10">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{new Date(offer.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                      {countdown && offer.status !== 'Declined' && offer.status !== 'Accepted' && (
                        <div className="flex items-center gap-1 text-sm bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                          <Clock className={`w-4 h-4 ${countdown.color}`} />
                          <span className={countdown.color}>{countdown.text}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-[#0a0a0f]/50 p-5 rounded-xl border border-white/5 mb-4 flex-1">
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Total CTC (Year 1)</span>
                        <span className="text-3xl font-bold text-emerald-400">{formatCurrency(offer.totalCTC)}</span>
                      </div>

                      <div className="w-full h-3 rounded-full flex overflow-hidden mb-3 bg-[#13141f]">
                        {basePct > 0 && (
                          <div style={{ width: `${basePct}%` }} className="bg-blue-500 h-full relative group/tooltip">
                            <div className="opacity-0 group-hover/tooltip:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#13141f] text-xs px-2 py-1 rounded whitespace-nowrap z-20 border border-white/10 shadow-lg pointer-events-none transition-opacity">Base: {formatCurrency(offer.baseSalary)}</div>
                          </div>
                        )}
                        {bonusPct > 0 && (
                          <div style={{ width: `${bonusPct}%` }} className="bg-amber-500 h-full relative group/tooltip">
                            <div className="opacity-0 group-hover/tooltip:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#13141f] text-xs px-2 py-1 rounded whitespace-nowrap z-20 border border-white/10 shadow-lg pointer-events-none transition-opacity">Bonus: {formatCurrency(offer.signOnBonus)}</div>
                          </div>
                        )}
                        {rsuPct > 0 && (
                          <div style={{ width: `${rsuPct}%` }} className="bg-purple-500 h-full relative group/tooltip">
                            <div className="opacity-0 group-hover/tooltip:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#13141f] text-xs px-2 py-1 rounded whitespace-nowrap z-20 border border-white/10 shadow-lg pointer-events-none transition-opacity">RSU: {formatCurrency(offer.rsu)}</div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between text-xs font-bold text-slate-400">
                        {basePct > 0 && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Base</div>}
                        {bonusPct > 0 && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Sign-On</div>}
                        {rsuPct > 0 && <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div> RSU</div>}
                      </div>
                    </div>

                    {offer.notes && (
                      <p className="text-sm text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5 italic">
                        "{offer.notes}"
                      </p>
                    )}

                    {offer.status === 'Negotiating' || offer.status === 'Pending' ? (
                      <OfferLeverageCard offer={offer} />
                    ) : null}

                    {/* Networking V5: Thank your network prompt */}
                    {offer.status === 'Accepted' && (
                      <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <div className="flex flex-col gap-3">
                          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                            🎉 Time to share the good news!
                          </h4>
                          <p className="text-xs text-emerald-200/80">
                            Don't forget to reach out and thank the connections who helped you along the way. A simple message goes a long way.
                          </p>
                          <button 
                            onClick={() => window.location.href = `/networking?tab=messages&type=thank_you&company=${encodeURIComponent(offer.company)}`}
                            className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold transition-colors"
                          >
                            Draft Thank You Messages
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!offerToDelete}
        onClose={() => setOfferToDelete(null)}
        onConfirm={() => deleteMutation.mutate(offerToDelete)}
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This action cannot be undone."
      />

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#13141f] border border-white/10 p-6 rounded-2xl w-full max-w-2xl relative shadow-2xl">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg"><X className="w-5 h-5" /></button>
              
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <BadgeDollarSign className="text-emerald-500 w-6 h-6" />
                {editingId ? 'Edit Offer Details' : 'Add New Offer'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company</label>
                    <input type="text" required value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="input-field py-2.5 px-4" placeholder="e.g. Google" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                    <input type="text" required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="input-field py-2.5 px-4" placeholder="e.g. SDE 1" />
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
                  <h4 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Compensation Breakdown (Year 1)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Base Salary ($)</label>
                      <input type="number" required min="0" value={formData.baseSalary} onChange={(e) => setFormData({...formData, baseSalary: e.target.value})} className="input-field py-2.5 px-4" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Sign-On Bonus ($)</label>
                      <input type="number" min="0" value={formData.signOnBonus} onChange={(e) => setFormData({...formData, signOnBonus: e.target.value})} className="input-field py-2.5 px-4" />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">RSU/Stock ($)</label>
                      <input type="number" min="0" value={formData.rsu} onChange={(e) => setFormData({...formData, rsu: e.target.value})} className="input-field py-2.5 px-4" />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wider">Total Calculated CTC:</span>
                    <span className="text-xl font-bold text-emerald-400">
                      {formatCurrency(Number(formData.baseSalary || 0) + Number(formData.signOnBonus || 0) + Number(formData.rsu || 0))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deadline to Accept</label>
                    <input type="date" required value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} className="input-field py-2.5 px-4 [color-scheme:dark]" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="input-field py-2.5 px-4 appearance-none">
                      <option value="Pending">Pending / Exploring</option>
                      <option value="Negotiating">Negotiating</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes & Benefits</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="input-field py-2.5 px-4 h-24 resize-none" placeholder="Relocation package details, PTO, remote options..." />
                </div>

                <div className="pt-4 flex justify-end gap-3">
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
