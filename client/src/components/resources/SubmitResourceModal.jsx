import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, ChevronLeft, Send, Sparkles, Clock, Target } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const categories = ['DSA', 'Web Dev', 'System Design', 'CS Core', 'Interview Prep'];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const times = ['< 1 week', '1–2 weeks', '1 month', 'Ongoing'];
const levels = ['Just starting out', 'Mid prep', 'Final round prep'];

const SubmitResourceModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('resourceSubmissionDraft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
    return {
      name: '', url: '', category: 'DSA', difficulty: 'Beginner', description: '',
      whyRecommend: '', timeToComplete: '< 1 week', levelWhenHelped: 'Just starting out'
    };
  });

  useEffect(() => {
    if (formData.name || formData.url || formData.description) {
      localStorage.setItem('resourceSubmissionDraft', JSON.stringify(formData));
    }
  }, [formData]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep(1);
        // Do not clear formData here so they can resume
      }, 300);
    }
  }, [isOpen]);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/resources/submit', data);
      return res.data;
    },
    onSuccess: () => {
      setStep(3);
      localStorage.removeItem('resourceSubmissionDraft');
      setFormData({
        name: '', url: '', category: 'DSA', difficulty: 'Beginner', description: '',
        whyRecommend: '', timeToComplete: '< 1 week', levelWhenHelped: 'Just starting out'
      });
      queryClient.invalidateQueries(['submissions']);
    }
  });

  const isStep1Valid = formData.name.trim() && formData.url.trim() && formData.description.trim();
  const isStep2Valid = formData.whyRecommend.trim();

  const handleNext = () => {
    if (isStep1Valid) setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isStep1Valid && isStep2Valid) {
      submitMutation.mutate(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-2xl relative shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#1a1b26]/50">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Submit a Resource
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Resource Name <span className="text-red-400">*</span></label>
                  <input type="text" maxLength={60} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="e.g. NeetCode 150" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Resource URL <span className="text-red-400">*</span></label>
                  <input type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors" placeholder="https://" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Difficulty</label>
                    <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 appearance-none">
                      {difficulties.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">Short Description <span className="text-red-400">*</span></label>
                    <span className={`text-xs ${formData.description.length > 180 ? 'text-amber-400' : 'text-slate-500'}`}>{formData.description.length}/200</span>
                  </div>
                  <textarea maxLength={200} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-[100px] resize-y transition-colors" placeholder="Briefly describe what this resource is..." />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-sm font-medium text-slate-300">Why are you recommending this? <span className="text-red-400">*</span></label>
                    <span className={`text-xs ${formData.whyRecommend.length > 280 ? 'text-amber-400' : 'text-slate-500'}`}>{formData.whyRecommend.length}/300</span>
                  </div>
                  <textarea maxLength={300} value={formData.whyRecommend} onChange={e => setFormData({...formData, whyRecommend: e.target.value})} className="w-full bg-[#1a1b26] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 min-h-[120px] resize-y transition-colors" placeholder="Tell other students what makes this resource worth their time..." />
                </div>

                <div className="bg-white/5 p-5 rounded-xl border border-white/5 space-y-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                      <Clock className="w-4 h-4 text-blue-400" /> How long did this take you to complete?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {times.map(t => (
                        <button key={t} type="button" onClick={() => setFormData({...formData, timeToComplete: t})} className={`py-2 px-3 rounded-lg text-sm font-bold transition-all border ${formData.timeToComplete === t ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-[#13141f] border-white/10 text-slate-400 hover:bg-white/5'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-white mb-3">
                      <Target className="w-4 h-4 text-emerald-400" /> What level were you when this helped most?
                    </label>
                    <div className="flex flex-col gap-2">
                      {levels.map(l => (
                        <label key={l} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${formData.levelWhenHelped === l ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[#13141f] border-white/10 hover:bg-white/5'}`}>
                          <input type="radio" name="level" checked={formData.levelWhenHelped === l} onChange={() => setFormData({...formData, levelWhenHelped: l})} className="accent-emerald-500 w-4 h-4 bg-[#13141f] border-white/20" />
                          <span className={`text-sm font-bold ${formData.levelWhenHelped === l ? 'text-emerald-400' : 'text-slate-300'}`}>{l}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Submitted Successfully!</h3>
                <p className="text-slate-400 max-w-md">
                  Thanks! Your resource has been submitted for review. Our team will review it within 48 hours. You'll be notified once it goes live.
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/5 bg-[#1a1b26]/50 flex justify-between items-center">
            {step === 1 && (
              <>
                <div className="flex gap-1.5">
                  <div className="w-8 h-2 rounded-full bg-blue-500"></div>
                  <div className="w-8 h-2 rounded-full bg-white/10"></div>
                </div>
                <button 
                  onClick={handleNext} 
                  disabled={!isStep1Valid}
                  className="px-6 py-2.5 bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  Next Step <Send className="w-4 h-4" />
                </button>
              </>
            )}
            
            {step === 2 && (
              <>
                <button onClick={() => setStep(1)} className="px-5 py-2.5 text-slate-300 font-bold hover:bg-white/5 rounded-xl transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="flex gap-1.5 hidden sm:flex absolute left-1/2 -translate-x-1/2">
                  <div className="w-8 h-2 rounded-full bg-white/20"></div>
                  <div className="w-8 h-2 rounded-full bg-blue-500"></div>
                </div>
                <button 
                  onClick={handleSubmit} 
                  disabled={!isStep2Valid || submitMutation.isPending}
                  className="px-6 py-2.5 bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Submit for Review'}
                </button>
              </>
            )}

            {step === 3 && (
              <div className="w-full flex justify-center gap-4">
                <button onClick={() => { setStep(1); setFormData({...formData, name:'', url:'', description:'', whyRecommend:''}); }} className="px-5 py-2.5 text-slate-300 font-bold hover:bg-white/5 border border-white/10 rounded-xl transition-colors">
                  Submit Another
                </button>
                <button onClick={onClose} className="px-6 py-2.5 bg-white text-black font-bold rounded-xl shadow-lg transition-all">
                  Back to Resources
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SubmitResourceModal;
