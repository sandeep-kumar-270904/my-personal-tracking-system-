import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, X, ExternalLink, Briefcase } from 'lucide-react';
import api from '../services/api';

const ApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'Applied',
    appliedDate: new Date().toISOString().split('T')[0],
    link: '',
    notes: ''
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await api.get('/applications');
      setApplications(res.data);
    } catch (error) {
      console.error('Failed to fetch', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/applications/${editingId}`, formData);
      } else {
        await api.post('/applications', formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
      fetchApplications();
    } catch (error) {
      console.error('Failed to save', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await api.delete(`/applications/${id}`);
        fetchApplications();
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  const openEditModal = (app) => {
    setFormData({
      company: app.company,
      role: app.role,
      status: app.status,
      appliedDate: new Date(app.appliedDate).toISOString().split('T')[0],
      link: app.link,
      notes: app.notes
    });
    setEditingId(app._id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      company: '',
      role: '',
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      link: '',
      notes: ''
    });
  };

  return (
    <>
      <div className="max-w-7xl mx-auto">
          <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Applications</h1>
              <p className="text-slate-400">Track and manage your job applications.</p>
            </div>
            <button 
              onClick={() => { resetForm(); setEditingId(null); setIsModalOpen(true); }}
              className="btn-primary"
            >
              <Plus className="w-5 h-5" />
              New Application
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {applications.map((app) => (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -5 }}
                  className="glass-card-card flex flex-col h-full relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/20 transition-all duration-300"
                >
                  <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(app)} className="p-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-md text-slate-300">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(app._id)} className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-md text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-1 pr-16">{app.company}</h3>
                    <p className="text-[#00f0ff] font-medium">{app.role}</p>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border
                      ${app.status === 'Applied' ? 'bg-blue-500/10 text-[#00f0ff] border-blue-500/20' : ''}
                      ${app.status === 'OA' ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : ''}
                      ${app.status === 'Interview' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                      ${app.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                      ${app.status === 'Selected' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                    `}>
                      {app.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(app.appliedDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5">
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                      {app.notes || 'No notes added.'}
                    </p>
                    {app.link && (
                      <a 
                        href={app.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-[#00f0ff] hover:text-blue-300"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Posting
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {applications.length === 0 && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#13141f] mb-4 text-slate-400">
                <Briefcase className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No applications found</h3>
              <p className="text-slate-400 mb-6">Start tracking your job hunt today.</p>
              <button 
                onClick={() => { resetForm(); setEditingId(null); setIsModalOpen(true); }}
                className="btn-primary mx-auto mt-6"
              >
                Add Your First Application
              </button>
            </div>
          )}
        </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">
                  {editingId ? 'Edit Application' : 'New Application'}
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
                      <option value="Applied">Applied</option>
                      <option value="OA">Online Assessment (OA)</option>
                      <option value="Interview">Interview</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Selected">Selected / Offer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Date Applied</label>
                    <input 
                      type="date" 
                      value={formData.appliedDate}
                      onChange={(e) => setFormData({...formData, appliedDate: e.target.value})}
                      className="input-field" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Job Link URL</label>
                  <input 
                    type="url" 
                    value={formData.link}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    className="input-field" 
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input-field min-h-[100px] resize-y" 
                    placeholder="Interview details, contact info..."
                  ></textarea>
                </div>

                <div className="flex justify-end pt-4 border-t border-white/5 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-[#13141f] transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary px-6">
                    {editingId ? 'Save Changes' : 'Add Application'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ApplicationsPage;
