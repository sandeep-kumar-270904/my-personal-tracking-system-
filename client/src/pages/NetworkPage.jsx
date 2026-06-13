import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, MessageSquare, Briefcase, Mail, Globe, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const NetworkPage = () => {
  const [contacts, setContacts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    role: '',
    platform: 'LinkedIn',
    status: 'To Contact',
    lastContactDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/network');
      setContacts(res.data);
    } catch (error) {
      console.error('Failed to fetch contacts', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/network/${editingId}`, formData);
      } else {
        await api.post('/network', formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
      fetchContacts();
    } catch (error) {
      console.error('Failed to save contact', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await api.delete(`/network/${id}`);
        fetchContacts();
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  const openEditModal = (contact) => {
    setFormData({
      name: contact.name,
      company: contact.company,
      role: contact.role,
      platform: contact.platform,
      status: contact.status,
      lastContactDate: new Date(contact.lastContactDate).toISOString().split('T')[0],
      notes: contact.notes
    });
    setEditingId(contact._id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      role: '',
      platform: 'LinkedIn',
      status: 'To Contact',
      lastContactDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const getPlatformIcon = (platform) => {
    switch(platform) {
      case 'LinkedIn': return <Briefcase className="w-4 h-4" />;
      case 'Email': return <Mail className="w-4 h-4" />;
      case 'Twitter': return <Globe className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'To Contact': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'Reached Out': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Replied': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Referral Given': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Network Tracker</h1>
              <p className="text-slate-400">Manage your cold outreach and track referrals.</p>
            </div>
            <button 
              onClick={() => { resetForm(); setEditingId(null); setIsModalOpen(true); }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              Add Contact
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {contacts.map((contact) => (
                <motion.div
                  key={contact._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card flex flex-col h-full relative group"
                >
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(contact)} className="p-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-md text-slate-300">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(contact._id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-md text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                      {getPlatformIcon(contact.platform)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-0.5 pr-12">{contact.name}</h3>
                      <p className="text-sm text-slate-400">{contact.role} @ <span className="text-blue-400 font-medium">{contact.company}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(contact.status)}`}>
                      {contact.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Last: {new Date(contact.lastContactDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-700/50">
                    <p className="text-sm text-slate-400 line-clamp-3">
                      {contact.notes || 'No notes added for this contact.'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {contacts.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4 text-slate-400">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No contacts yet</h3>
              <p className="text-slate-400 mb-6">Start building your network for referrals.</p>
              <button 
                onClick={() => { resetForm(); setEditingId(null); setIsModalOpen(true); }}
                className="btn-primary mx-auto"
              >
                Add Your First Contact
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Contact' : 'New Contact'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="input-field" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Platform</label>
                    <select 
                      value={formData.platform}
                      onChange={(e) => setFormData({...formData, platform: e.target.value})}
                      className="input-field appearance-none"
                    >
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Email">Email</option>
                      <option value="Twitter">Twitter</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Company</label>
                    <input 
                      type="text" 
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="input-field" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Role</label>
                    <input 
                      type="text" 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="input-field" 
                      placeholder="e.g. Recruiter, SWE"
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="input-field appearance-none"
                    >
                      <option value="To Contact">To Contact</option>
                      <option value="Reached Out">Reached Out</option>
                      <option value="Replied">Replied</option>
                      <option value="Referral Given">Referral Given</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Last Contact Date</label>
                    <input 
                      type="date" 
                      value={formData.lastContactDate}
                      onChange={(e) => setFormData({...formData, lastContactDate: e.target.value})}
                      className="input-field" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes (Email templates, responses, links)</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input-field min-h-[100px] resize-y" 
                    placeholder="Link to their LinkedIn, email draft..."
                  ></textarea>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-700/50 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary px-6">
                    {editingId ? 'Save Changes' : 'Add Contact'}
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

export default NetworkPage;
