import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Plus, BarChart2, Activity, Play, CheckCircle2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ABTestingDashboardModal({ isOpen, onClose, existingResumes }) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    resumeAId: '',
    resumeBId: '',
    roleType: '',
    sampleSize: 10
  });

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['abTests'],
    queryFn: async () => {
      const { data } = await api.get('/resumes/ab-tests');
      return data;
    },
    enabled: isOpen
  });

  const createMutation = useMutation({
    mutationFn: async (data) => await api.post('/resumes/ab-tests', data),
    onSuccess: () => {
      toast.success("A/B Test created successfully!");
      setIsCreating(false);
      queryClient.invalidateQueries(['abTests']);
      setFormData({ resumeAId: '', resumeBId: '', roleType: '', sampleSize: 10 });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create test')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.resumeAId || !formData.resumeBId || !formData.roleType) {
      return toast.error("Please fill all fields");
    }
    if (formData.resumeAId === formData.resumeBId) {
      return toast.error("Please select two different resumes");
    }
    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl relative z-10 flex flex-col"
        >
          <div className="flex justify-between items-center border-b border-white/5 p-6 bg-slate-900">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
              <BarChart2 className="text-indigo-400"/> A/B Testing Dashboard
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!isCreating && (
              <div className="mb-8 flex justify-between items-center bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl">
                <div>
                  <h3 className="text-indigo-300 font-medium mb-1">Test which resume performs better</h3>
                  <p className="text-sm text-indigo-400/80">Track shortlisting rates between two versions of your resume for the same role.</p>
                </div>
                <button 
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4"/> New Test
                </button>
              </div>
            )}

            {isCreating ? (
              <div className="bg-slate-950 border border-white/5 rounded-xl p-6 max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-white mb-6">Create New A/B Test</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Role Type (e.g., SDE Intern)</label>
                    <input 
                      type="text" 
                      value={formData.roleType} 
                      onChange={e => setFormData({...formData, roleType: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Resume A (Control)</label>
                      <select 
                        value={formData.resumeAId} 
                        onChange={e => setFormData({...formData, resumeAId: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-white outline-none"
                      >
                        <option value="">Select...</option>
                        {existingResumes.map(r => <option key={r._id} value={r._id}>{r.name || r.originalName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Resume B (Variant)</label>
                      <select 
                        value={formData.resumeBId} 
                        onChange={e => setFormData({...formData, resumeBId: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-white outline-none"
                      >
                        <option value="">Select...</option>
                        {existingResumes.map(r => <option key={r._id} value={r._id}>{r.name || r.originalName}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Target Sample Size</label>
                    <input 
                      type="number" 
                      min="2" max="100"
                      value={formData.sampleSize} 
                      onChange={e => setFormData({...formData, sampleSize: Number(e.target.value)})}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-white focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                    <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" disabled={createMutation.isLoading} className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors">
                      {createMutation.isLoading ? 'Creating...' : 'Start Test'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading ? (
                  <div className="col-span-full flex justify-center py-20"><div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"/></div>
                ) : tests.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-slate-500">No active tests. Create one to start tracking.</div>
                ) : (
                  tests.map(test => (
                    <div key={test._id} className="bg-slate-950 border border-white/5 rounded-xl p-6 flex flex-col relative overflow-hidden">
                      {test.completedAt && (
                         <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-bl-xl text-xs font-semibold flex items-center gap-1">
                           <CheckCircle2 className="w-3 h-3"/> Completed
                         </div>
                      )}
                      {!test.completedAt && (
                         <div className="absolute top-0 right-0 bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-bl-xl text-xs font-semibold flex items-center gap-1">
                           <Activity className="w-3 h-3"/> Active
                         </div>
                      )}

                      <h4 className="text-white font-semibold text-lg mb-1">{test.roleType}</h4>
                      <p className="text-xs text-slate-400 mb-6">Target Applications: {test.sampleSize}</p>

                      <div className="grid grid-cols-2 gap-4 flex-1">
                        {/* Resume A */}
                        <div className={`p-4 rounded-xl border ${test.winnerResumeId === test.resumeAId?._id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-white/5'}`}>
                          <p className="text-xs text-slate-500 font-semibold mb-1">VERSION A</p>
                          <p className="text-sm text-slate-300 font-medium truncate mb-4" title={test.resumeAId?.name || test.resumeAId?.originalName}>{test.resumeAId?.name || test.resumeAId?.originalName}</p>
                          
                          <div className="flex items-end gap-2">
                             <span className="text-3xl font-bold text-white">
                               {test.currentResults?.a?.total ? Math.round((test.currentResults.a.shortlists / test.currentResults.a.total) * 100) : 0}%
                             </span>
                             <span className="text-xs text-slate-400 mb-1">shortlist rate</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">{test.currentResults?.a?.shortlists || 0} / {test.currentResults?.a?.total || 0} applications</p>
                        </div>

                        {/* Resume B */}
                        <div className={`p-4 rounded-xl border ${test.winnerResumeId === test.resumeBId?._id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-white/5'}`}>
                          <p className="text-xs text-slate-500 font-semibold mb-1">VERSION B</p>
                          <p className="text-sm text-slate-300 font-medium truncate mb-4" title={test.resumeBId?.name || test.resumeBId?.originalName}>{test.resumeBId?.name || test.resumeBId?.originalName}</p>
                          
                          <div className="flex items-end gap-2">
                             <span className="text-3xl font-bold text-white">
                               {test.currentResults?.b?.total ? Math.round((test.currentResults.b.shortlists / test.currentResults.b.total) * 100) : 0}%
                             </span>
                             <span className="text-xs text-slate-400 mb-1">shortlist rate</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">{test.currentResults?.b?.shortlists || 0} / {test.currentResults?.b?.total || 0} applications</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-6">
                        <div className="flex justify-between text-xs text-slate-400 mb-2">
                          <span>Progress</span>
                          <span>{((test.currentResults?.a?.total || 0) + (test.currentResults?.b?.total || 0))} / {test.sampleSize}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${Math.min(100, (((test.currentResults?.a?.total || 0) + (test.currentResults?.b?.total || 0)) / test.sampleSize) * 100)}%` }}
                          />
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
