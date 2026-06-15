import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeDollarSign, Plus, X, Trash2, Edit2, MapPin, Building2, Calendar, TrendingUp } from 'lucide-react';
import api from '../services/api';

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    baseSalary: '',
    signOnBonus: '',
    rsu: '',
    deadline: '',
    status: 'Pending',
    notes: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const res = await api.get('/offers');
      setOffers(res.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/offers/${editingId}`, formData);
      } else {
        await api.post('/offers', formData);
      }
      setIsModalOpen(false);
      setFormData({
        company: '', role: '', baseSalary: '', signOnBonus: '', rsu: '', deadline: '', status: 'Pending', notes: ''
      });
      setEditingId(null);
      fetchOffers();
    } catch (error) {
      console.error('Error saving offer:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this offer?')) {
      try {
        await api.delete(`/offers/${id}`);
        fetchOffers();
      } catch (error) {
        console.error('Error deleting offer:', error);
      }
    }
  };

  const openEditModal = (offer) => {
    setFormData({
      company: offer.company,
      role: offer.role,
      baseSalary: offer.baseSalary,
      signOnBonus: offer.signOnBonus,
      rsu: offer.rsu,
      deadline: offer.deadline ? offer.deadline.split('T')[0] : '',
      status: offer.status,
      notes: offer.notes
    });
    setEditingId(offer._id);
    setIsModalOpen(true);
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Accepted': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Declined': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Negotiating': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-blue-500/20 text-[#00f0ff] border-blue-500/30'; // Pending
    }
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BadgeDollarSign className="text-emerald-500 w-8 h-8" />
            Offer & Compensation Tracker
          </h1>
          <p className="text-slate-400">Compare your CTC breakdowns and never miss a negotiation deadline.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ company: '', role: '', baseSalary: '', signOnBonus: '', rsu: '', deadline: '', status: 'Pending', notes: '' });
            setIsModalOpen(true);
          }} 
          className="flex items-center px-4 py-2 bg-[#ff6b00] hover:bg-[#ff007b] text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Offer
        </button>
      </header>

      {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-2xl border border-white/5">
          <BadgeDollarSign className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No offers tracked yet</h3>
          <p className="text-slate-400 mb-6">Aced the interview? Add your job offer here to track compensation.</p>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-[#ff6b00] hover:bg-[#ff007b] text-white rounded-lg transition-colors mx-auto mt-6">Add Your First Offer</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {offers.map(offer => {
            const basePct = (offer.baseSalary / offer.totalCTC) * 100 || 0;
            const bonusPct = (offer.signOnBonus / offer.totalCTC) * 100 || 0;
            const rsuPct = (offer.rsu / offer.totalCTC) * 100 || 0;

            return (
              <motion.div 
                key={offer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-white/5 hover:bg-[#13141f]/30 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-slate-400" /> {offer.company}
                    </h3>
                    <p className="text-slate-400 font-medium">{offer.role}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(offer.status)}`}>
                    {offer.status}
                  </span>
                </div>

                <div className="mb-6 flex items-center gap-2 text-sm text-slate-300 bg-white/[0.02] w-fit px-3 py-1.5 rounded-lg border border-white/5">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <span className="font-medium text-slate-200">Deadline:</span> 
                  {new Date(offer.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>

                <div className="bg-[#0a0a0f]/50 p-4 rounded-xl border border-white/5 mb-4">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-400 font-medium uppercase tracking-wider text-xs">Total CTC (Year 1)</span>
                    <span className="text-3xl font-bold text-emerald-400">{formatCurrency(offer.totalCTC)}</span>
                  </div>

                  {/* Stacked Bar Chart for CTC Breakdown */}
                  <div className="w-full h-4 rounded-full flex overflow-hidden mb-3">
                    <div style={{ width: `${basePct}%` }} className="bg-blue-500 h-full relative group">
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#13141f] text-xs px-2 py-1 rounded whitespace-nowrap z-10 transition-opacity">Base: {formatCurrency(offer.baseSalary)}</div>
                    </div>
                    <div style={{ width: `${bonusPct}%` }} className="bg-amber-500 h-full relative group">
                       <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#13141f] text-xs px-2 py-1 rounded whitespace-nowrap z-10 transition-opacity">Bonus: {formatCurrency(offer.signOnBonus)}</div>
                    </div>
                    <div style={{ width: `${rsuPct}%` }} className="bg-purple-500 h-full relative group">
                       <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-[#13141f] text-xs px-2 py-1 rounded whitespace-nowrap z-10 transition-opacity">RSU: {formatCurrency(offer.rsu)}</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-medium">
                    <div className="flex items-center gap-1 text-slate-300"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Base</div>
                    <div className="flex items-center gap-1 text-slate-300"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Sign-On</div>
                    <div className="flex items-center gap-1 text-slate-300"><div className="w-2 h-2 rounded-full bg-purple-500"></div> RSU</div>
                  </div>
                </div>

                {offer.notes && (
                  <p className="text-sm text-slate-400 mb-4 bg-[#13141f]/30 p-3 rounded-lg border border-white/10/30 italic">
                    "{offer.notes}"
                  </p>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button onClick={() => openEditModal(offer)} className="p-2 text-slate-400 hover:text-[#00f0ff] transition-colors bg-[#13141f] hover:bg-white/[0.05] rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(offer._id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors bg-[#13141f] hover:bg-white/[0.05] rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0f] border border-white/10 p-6 rounded-2xl w-full max-w-2xl my-8 relative"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <BadgeDollarSign className="text-emerald-500 w-6 h-6" />
                {editingId ? 'Edit Offer' : 'Add New Offer'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
                    <input 
                      type="text" 
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="input-field" 
                      placeholder="e.g. Google"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                    <input 
                      type="text" 
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="input-field" 
                      placeholder="e.g. Software Engineer"
                    />
                  </div>
                </div>

                <div className="bg-[#13141f]/30 p-4 rounded-xl border border-white/5 space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Compensation (Year 1)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Base Salary ($)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={formData.baseSalary}
                        onChange={(e) => setFormData({...formData, baseSalary: e.target.value})}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Sign-On Bonus ($)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.signOnBonus}
                        onChange={(e) => setFormData({...formData, signOnBonus: e.target.value})}
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">RSU/Stock ($)</label>
                      <input 
                        type="number" 
                        min="0"
                        value={formData.rsu}
                        onChange={(e) => setFormData({...formData, rsu: e.target.value})}
                        className="input-field" 
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-between items-center text-sm font-medium">
                    <span className="text-slate-400">Calculated CTC:</span>
                    <span className="text-xl text-emerald-400">
                      {formatCurrency(Number(formData.baseSalary || 0) + Number(formData.signOnBonus || 0) + Number(formData.rsu || 0))}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Deadline Date</label>
                    <input 
                      type="date" 
                      required
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                      className="input-field" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="input-field bg-[#13141f]"
                    >
                      <option value="Pending">Pending / Exploring</option>
                      <option value="Negotiating">Negotiating</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Notes (e.g. Relocation, Benefits)</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input-field h-24 resize-none" 
                    placeholder="Includes $10k relocation and full remote work options..."
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
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
