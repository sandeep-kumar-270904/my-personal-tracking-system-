import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, MessageSquare, Briefcase, Mail, Globe, Users, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const fetchNetwork = async () => {
  const { data } = await api.get('/network');
  return data;
};

const NetworkPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [contactToDelete, setContactToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', company: '', role: '', platform: 'LinkedIn', status: 'To Contact', lastContactDate: new Date().toISOString().split('T')[0], notes: '', followUpDate: ''
  });

  const { data: contacts = [], isLoading, isError } = useQuery({
    queryKey: ['network'], queryFn: fetchNetwork
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) return await api.put(`/network/${editingId}`, data);
      return await api.post('/network', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['network']);
      toast.success(editingId ? 'Contact updated' : 'Contact added');
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
    },
    onError: () => toast.error('Failed to save contact')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/network/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['network']);
      toast.success('Contact deleted');
      setContactToDelete(null);
    },
    onError: () => toast.error('Failed to delete contact')
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => await api.put(`/network/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['network']);
      toast.success('Status updated');
    },
    onError: () => toast.error('Failed to update status')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const openEditModal = (contact) => {
    setFormData({
      name: contact.name,
      company: contact.company,
      role: contact.role,
      platform: contact.platform,
      status: contact.status,
      lastContactDate: contact.lastContactDate ? new Date(contact.lastContactDate).toISOString().split('T')[0] : '',
      notes: contact.notes,
      followUpDate: contact.followUpDate ? new Date(contact.followUpDate).toISOString().split('T')[0] : ''
    });
    setEditingId(contact._id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', company: '', role: '', platform: 'LinkedIn', status: 'To Contact', lastContactDate: new Date().toISOString().split('T')[0], notes: '', followUpDate: ''
    });
  };

  const getPlatformIcon = (platform) => {
    switch(platform) {
      case 'LinkedIn': return <Briefcase className="w-4 h-4 text-blue-400" />;
      case 'Email': return <Mail className="w-4 h-4 text-rose-400" />;
      case 'Twitter': return <Globe className="w-4 h-4 text-sky-400" />;
      default: return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'To Contact': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'Reached Out': return 'bg-blue-500/10 text-[#00f0ff] border-blue-500/20';
      case 'Replied': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Referral Given': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/5 text-slate-400 border-white/10';
    }
  };

  const handleSendEmail = (e, contact) => {
    e.stopPropagation();
    const subject = encodeURIComponent(`Connecting regarding opportunities at ${contact.company}`);
    const body = encodeURIComponent(`Hi ${contact.name.split(' ')[0]},\n\nHope you are doing well...\n`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8"><div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={Users} heading="Error" subtext="Failed to load network." />;
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col pb-10">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Networking</h1>
          <p className="text-slate-400">Manage your cold outreach, track referrals, and send emails.</p>
        </div>
        <button onClick={() => { resetForm(); setEditingId(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Contact
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 pb-10">
        {contacts.length === 0 ? (
          <EmptyState 
            icon={Users} 
            heading="No contacts yet" 
            subtext="Start building your network for referrals." 
            ctaText="Add First Contact"
            ctaAction={() => { resetForm(); setEditingId(null); setIsModalOpen(true); }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {contacts.map((contact) => (
                <motion.div
                  key={contact._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 relative group flex flex-col h-full"
                >
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(contact)} className="p-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-md text-slate-300">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setContactToDelete(contact._id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-md text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-4 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                      {getPlatformIcon(contact.platform)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-0.5 pr-16 truncate">{contact.name}</h3>
                      <p className="text-sm text-slate-400 truncate">{contact.role} @ <span className="text-[#00f0ff] font-medium">{contact.company}</span></p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 mb-5">
                    <div className="flex items-center justify-between">
                      <select
                        value={contact.status}
                        onChange={(e) => statusMutation.mutate({ id: contact._id, status: e.target.value })}
                        className={`appearance-none cursor-pointer px-3 py-1 rounded-full text-xs font-bold border transition-colors ${getStatusColor(contact.status)}`}
                      >
                        <option value="To Contact" className="bg-[#13141f]">To Contact</option>
                        <option value="Reached Out" className="bg-[#13141f]">Reached Out</option>
                        <option value="Replied" className="bg-[#13141f]">Replied</option>
                        <option value="Referral Given" className="bg-[#13141f]">Referral Given</option>
                        <option value="Rejected" className="bg-[#13141f]">Rejected</option>
                      </select>
                      <span className="text-xs text-slate-400 font-medium">
                        Last: {new Date(contact.lastContactDate).toLocaleDateString()}
                      </span>
                    </div>
                    {contact.followUpDate && (
                      <div className="flex items-center text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-lg w-fit mt-1">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        Follow-up: {new Date(contact.followUpDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-h-[60px] bg-white/5 rounded-xl p-3 border border-white/5 mb-5 overflow-hidden">
                    <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                      {contact.notes || <span className="text-slate-500 italic">No notes provided.</span>}
                    </p>
                  </div>

                  <button 
                    onClick={(e) => handleSendEmail(e, contact)}
                    className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-[#00f0ff]/10 text-slate-300 hover:text-[#00f0ff] rounded-xl text-sm font-bold border border-transparent hover:border-[#00f0ff]/30 transition-colors"
                  >
                    <Send className="w-4 h-4" /> Send Email
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!contactToDelete}
        onClose={() => setContactToDelete(null)}
        onConfirm={() => deleteMutation.mutate(contactToDelete)}
        title="Delete Contact"
        message="Are you sure you want to delete this networking contact?"
      />

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Contact' : 'New Contact'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Platform</label>
                    <select value={formData.platform} onChange={(e) => setFormData({...formData, platform: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] appearance-none">
                      <option value="LinkedIn">LinkedIn</option><option value="Email">Email</option><option value="Twitter">Twitter</option><option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Company</label>
                    <input type="text" required value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                    <input type="text" required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00]" placeholder="e.g. SWE, Recruiter" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] appearance-none">
                      <option value="To Contact">To Contact</option><option value="Reached Out">Reached Out</option><option value="Replied">Replied</option><option value="Referral Given">Referral Given</option><option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Last Contact Date</label>
                    <input type="date" required value={formData.lastContactDate} onChange={(e) => setFormData({...formData, lastContactDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] [color-scheme:dark]" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Follow-up Date (Optional)</label>
                  <input type="date" value={formData.followUpDate} onChange={(e) => setFormData({...formData, followUpDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] [color-scheme:dark]" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes (Email templates, links)</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#ff6b00] min-h-[100px] resize-y" placeholder="Link to profile, drafted email..."></textarea>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5 gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 transition-colors font-medium">Cancel</button>
                  <button type="submit" disabled={saveMutation.isPending} className="btn-primary px-6 disabled:opacity-50">{editingId ? 'Save Changes' : 'Add Contact'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NetworkPage;
