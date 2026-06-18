import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Building2, Briefcase, Calendar, Link as LinkIcon, FileText, CheckCircle2, Edit2, AlertCircle, Wand2, Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AddApplicationModal = ({ isOpen, onClose, editingApp, onViewExisting }) => {
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
  
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [ignoreDuplicate, setIgnoreDuplicate] = useState(false);
  const [jdAnalysis, setJdAnalysis] = useState(null);
  const [isAnalyzingJD, setIsAnalyzingJD] = useState(false);

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await api.get('/resumes');
      return res.data;
    }
  });

  const { data: templates } = useQuery({
    queryKey: ['applicationTemplates'],
    queryFn: async () => {
      const res = await api.get('/applications/templates');
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

  const handleTemplateSelect = (e) => {
    const templateId = e.target.value;
    if (!templateId) return;
    const template = templates?.find(t => t._id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        status: template.defaultStatus || prev.status,
        source: template.defaultSource || prev.source,
        priority: template.defaultPriority || prev.priority,
        notes: template.defaultNotes || prev.notes,
        tags: template.defaultTags?.length ? template.defaultTags.join(', ') : prev.tags
      }));
      toast.success(`Template applied: ${template.name}`);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const name = prompt('Enter a name for this template:');
      if (!name) return;
      await api.post('/applications/templates', {
        name,
        defaultStatus: formData.status,
        defaultSource: formData.source,
        defaultPriority: formData.priority,
        defaultNotes: formData.notes,
        defaultTags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      });
      queryClient.invalidateQueries(['applicationTemplates']);
      toast.success('Template saved');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleAnalyzeJD = async () => {
    if (!formData.jobDescriptionUrl) {
      return toast.error("Please enter a JD URL first.");
    }
    setIsAnalyzingJD(true);
    try {
      const res = await api.post('/applications/analyze-jd', { url: formData.jobDescriptionUrl });
      setJdAnalysis(res.data);
      toast.success("JD Analyzed successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Analysis failed");
    } finally {
      setIsAnalyzingJD(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, tags: data.tags.split(',').map(t => t.trim()).filter(Boolean), ignoreDuplicate };
      if (editingApp) {
        const res = await api.patch(`/applications/${editingApp._id}`, payload);
        return { isEdit: true, data: res.data };
      } else {
        const res = await api.post('/applications', payload);
        return { isEdit: false, data: res.data };
      }
    },
    onSuccess: (response) => {
      if (response.data.isDuplicate) {
        setDuplicateWarning(response.data.existingApp);
        return; // Don't close modal or invalidate yet
      }
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
            {duplicateWarning ? (
              <div className="flex flex-col items-center justify-center space-y-6 py-8">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">Possible Duplicate Detected</h3>
                  <p className="text-slate-400 max-w-sm">
                    You may have already applied here. You applied to <strong className="text-white">{duplicateWarning.company}</strong> for <strong className="text-white">{duplicateWarning.role}</strong> on <strong className="text-white">{new Date(duplicateWarning.dateApplied).toLocaleDateString()}</strong>. Is this a different application?
                  </p>
                </div>
                <div className="flex flex-col w-full gap-3 max-w-sm">
                   <button 
                    type="button"
                    onClick={() => {
                      setIgnoreDuplicate(true);
                      setDuplicateWarning(null);
                      // Let useEffect or subsequent submit handle it, or just call mutation.mutate
                      mutation.mutate({ ...formData, ignoreDuplicate: true });
                    }}
                    className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium"
                   >
                     Yes, add anyway
                   </button>
                   <button 
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onViewExisting) onViewExisting(duplicateWarning);
                    }}
                    className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium"
                   >
                     No, view existing application
                   </button>
                   <button 
                    type="button"
                    onClick={() => {
                       // Update the existing one. For simplicity, just patch the existing one with current formData minus company/role
                       api.patch(`/applications/${duplicateWarning._id}`, { ...formData, tags: formData.tags.split(',').map(t=>t.trim()).filter(Boolean) })
                         .then(() => {
                           queryClient.invalidateQueries(['applications']);
                           toast.success('Merged successfully');
                           onClose();
                           if (onViewExisting) onViewExisting(duplicateWarning);
                         });
                    }}
                    className="w-full px-4 py-2 bg-[#ff6b00] hover:bg-[#ff6b00]/90 rounded-xl text-white font-medium"
                   >
                     Merge — update existing one
                   </button>
                </div>
              </div>
            ) : (
            <form id="app-form" onSubmit={handleSubmit} className="space-y-5">
              {!editingApp && templates?.length > 0 && (
                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl mb-4">
                  <label className="text-sm font-semibold text-slate-300 block mb-2">Use Template</label>
                  <select 
                    onChange={handleTemplateSelect}
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="">Select a template to auto-fill fields...</option>
                    {templates.map(t => (
                      <option key={t._id} value={t._id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
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
                  <label className="text-sm font-semibold text-slate-300 flex justify-between">
                    Job Description Link
                    <button type="button" onClick={handleAnalyzeJD} disabled={isAnalyzingJD || !formData.jobDescriptionUrl} className="text-xs text-[#ff6b00] flex items-center gap-1 hover:underline disabled:opacity-50">
                      {isAnalyzingJD ? 'Analyzing...' : <><Wand2 className="w-3 h-3"/> Analyze JD</>}
                    </button>
                  </label>
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

                {jdAnalysis && (
                  <div className="md:col-span-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mt-2">
                    <h4 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2"><Wand2 className="w-4 h-4"/> JD Analysis Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-slate-300"><span className="text-slate-500">Role Type:</span> {jdAnalysis.roleType}</div>
                      <div className="text-slate-300"><span className="text-slate-500">Experience:</span> {jdAnalysis.experienceLevel}</div>
                      <div className="text-slate-300 col-span-2"><span className="text-slate-500">Req Skills:</span> {jdAnalysis.requiredSkills?.join(', ')}</div>
                      {jdAnalysis.ctcRange && <div className="text-slate-300 col-span-2"><span className="text-slate-500">CTC:</span> {jdAnalysis.ctcRange}</div>}
                      {jdAnalysis.redFlags?.length > 0 && <div className="text-red-400 col-span-2 font-medium">Red Flags: {jdAnalysis.redFlags.join(', ')}</div>}
                    </div>
                  </div>
                )}

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
            )}
          </div>

          {!duplicateWarning && (
          <div className="p-6 border-t border-white/10 bg-white/[0.02] flex gap-3 justify-between items-center rounded-b-2xl">
            <button 
              type="button"
              onClick={handleSaveTemplate}
              className="px-4 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save as template
            </button>
            <div className="flex gap-3">
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
          </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AddApplicationModal;
