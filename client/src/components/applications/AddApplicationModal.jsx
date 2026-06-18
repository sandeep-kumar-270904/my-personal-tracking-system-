import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Building2, Briefcase, Calendar, Link as LinkIcon, FileText, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AddApplicationModal = ({ isOpen, onClose, editingApp }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    status: 'APPLIED',
    dateApplied: new Date().toISOString().split('T')[0],
    source: 'ONLINE',
    priority: 'MEDIUM',
    link: '',
    jobDescriptionUrl: '',
    tags: '',
    notes: ''
  });

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await api.get('/resumes');
      return res.data;
    }
  });

  useEffect(() => {
    if (editingApp) {
      setFormData({
        company: editingApp.company,
        role: editingApp.role,
        status: editingApp.status,
        dateApplied: new Date(editingApp.dateApplied).toISOString().split('T')[0],
        source: editingApp.source || 'ONLINE',
        priority: editingApp.priority || 'MEDIUM',
        link: editingApp.link || '',
        jobDescriptionUrl: editingApp.jobDescriptionUrl || '',
        tags: editingApp.tags ? editingApp.tags.join(', ') : '',
        notes: editingApp.notes || '',
        resumeId: editingApp.resumeId?._id || ''
      });
    }
  }, [editingApp]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, tags: data.tags.split(',').map(t => t.trim()).filter(Boolean) };
      if (editingApp) {
        await api.patch(`/applications/${editingApp._id}`, payload);
      } else {
        await api.post('/applications', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['applications']);
      queryClient.invalidateQueries(['applicationsStats']);
      if (editingApp) queryClient.invalidateQueries(['application', editingApp._id]);
      toast.success(`Application ${editingApp ? 'updated' : 'added'} successfully`);
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save application');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company || !formData.role) {
      return toast.error('Company and Role are required');
    }
    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative bg-[#13141f] border border-white/10 sm:rounded-2xl w-full max-w-2xl shadow-2xl z-10 flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {editingApp ? <Edit2 className="w-5 h-5 text-[#ff6b00]" /> : <Building2 className="w-5 h-5 text-[#ff6b00]" />}
              {editingApp ? 'Edit Application' : 'New Application'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            <form id="app-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Company */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Company *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      name="company" 
                      value={formData.company} 
                      onChange={handleChange} 
                      placeholder="e.g. Google"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00]"
                      required 
                    />
                  </div>
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Role *</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text" 
                      name="role" 
                      value={formData.role} 
                      onChange={handleChange} 
                      placeholder="e.g. Software Engineer"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00]"
                      required 
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] appearance-none"
                  >
                    <option value="APPLIED">Applied</option>
                    <option value="OA_PENDING">OA Pending</option>
                    <option value="OA_DONE">OA Done</option>
                    <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
                    <option value="SHORTLISTED">Shortlisted</option>
                    <option value="OFFER">Offer</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {/* Date Applied */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Date Applied</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="date" 
                      name="dateApplied" 
                      value={formData.dateApplied} 
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00]"
                    />
                  </div>
                </div>

                {/* Source */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Source</label>
                  <select 
                    name="source" 
                    value={formData.source} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] appearance-none"
                  >
                    <option value="CAMPUS">Campus</option>
                    <option value="ONLINE">Online</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="COLD_EMAIL">Cold Email</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="JOB_PORTAL">Job Portal</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Priority</label>
                  <select 
                    name="priority" 
                    value={formData.priority} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] appearance-none"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
                
                {/* Resume */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-300">Resume Used</label>
                  <select 
                    name="resumeId" 
                    value={formData.resumeId || ''} 
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] appearance-none"
                  >
                    <option value="">None / External</option>
                    {resumes?.map(res => (
                      <option key={res._id} value={res._id}>{res.name}</option>
                    ))}
                  </select>
                </div>

                {/* Links */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Application Link</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="url" 
                      name="link" 
                      value={formData.link} 
                      onChange={handleChange} 
                      placeholder="https://..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300">Job Description Link</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="url" 
                      name="jobDescriptionUrl" 
                      value={formData.jobDescriptionUrl} 
                      onChange={handleChange} 
                      placeholder="https://..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00]"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-300">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    name="tags" 
                    value={formData.tags} 
                    onChange={handleChange} 
                    placeholder="e.g. Remote, Node.js, Fintech"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-300">Notes</label>
                  <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange} 
                    rows={3}
                    placeholder="Any specific details..."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00] resize-none"
                  />
                </div>

              </div>
            </form>
          </div>

          <div className="p-6 border-t border-white/10 bg-white/[0.02] flex gap-3 justify-end rounded-b-2xl">
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-2.5 rounded-xl font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="app-form"
              disabled={mutation.isLoading}
              className="px-6 py-2.5 rounded-xl font-semibold text-white bg-[#ff6b00] hover:bg-[#ff6b00]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {mutation.isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  {editingApp ? 'Save Changes' : 'Add Application'}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddApplicationModal;
