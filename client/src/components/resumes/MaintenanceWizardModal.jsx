import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Wand2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function MaintenanceWizardModal({ isOpen, onClose, resume }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const wizardMutation = useMutation({
    mutationFn: async (input) => {
      const { data } = await api.post(`/resumes/${resume._id}/maintenance-wizard`, { userInput: input });
      return data;
    },
    onSuccess: (data) => {
      setAiSuggestions(data);
      setStep(2);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to analyze update');
    }
  });

  const handleRunWizard = () => {
    if (!userInput.trim()) return toast.error("Please enter what you've been up to");
    wizardMutation.mutate(userInput);
  };

  const applyBullet = async (sectionHeading, bulletPoint, suggestionIndex) => {
    try {
      // Find the section id based on heading
      const section = resume.sections?.find(s => s.heading.toLowerCase().includes(sectionHeading.toLowerCase()));
      if (!section) {
        return toast.error(`Could not find a section named "${sectionHeading}"`);
      }

      const updatedContent = section.content + `\n- ${bulletPoint}`;
      
      await api.put(`/resumes/${resume._id}/sections/${section._id}`, { content: updatedContent });
      toast.success("Added to resume!");
      
      // Remove from suggestions array
      const newSuggestions = { ...aiSuggestions };
      newSuggestions.suggestions = newSuggestions.suggestions.filter((_, i) => i !== suggestionIndex);
      setAiSuggestions(newSuggestions);

      queryClient.invalidateQueries(['resumes']);
    } catch (err) {
      toast.error("Failed to add bullet point");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
        >
          <div className="flex justify-between items-center border-b border-white/5 p-6 bg-indigo-500/10">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Wand2 className="text-indigo-400"/> Resume Maintenance Wizard
              </h2>
              <p className="text-sm text-indigo-300 mt-1">Keep your resume fresh and competitive</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6">
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 flex gap-4">
                  <div className="mt-1">
                    <AlertCircle className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium mb-1">It's been a while!</h3>
                    <p className="text-slate-300 text-sm">
                      You haven't updated this resume in over 30 days. Have you learned any new technologies, completed any new projects, or taken on new responsibilities recently?
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tell me what you've been up to (in your own words)</label>
                  <textarea
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    placeholder="e.g., I built a full-stack job board using Next.js and Prisma over the weekend, and I also learned Docker for deployment..."
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>

                <button
                  onClick={handleRunWizard}
                  disabled={wizardMutation.isLoading || !userInput.trim()}
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {wizardMutation.isLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Processing...</>
                  ) : (
                    <>Generate Resume Updates <ChevronRight className="w-4 h-4"/></>
                  )}
                </button>
              </motion.div>
            )}

            {step === 2 && aiSuggestions && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-indigo-200 text-sm italic">
                  "{aiSuggestions.acknowledgement}"
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-medium">Suggested Updates:</h3>
                  {aiSuggestions.suggestions.length === 0 ? (
                    <p className="text-slate-400 text-sm">No updates left to apply!</p>
                  ) : (
                    aiSuggestions.suggestions.map((sug, idx) => (
                      <div key={idx} className="bg-slate-800 border border-white/5 rounded-xl p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 block">
                              Add to: {sug.sectionHeading}
                            </span>
                            <p className="text-slate-200 text-sm leading-relaxed">{sug.bulletPoint}</p>
                          </div>
                          <button 
                            onClick={() => applyBullet(sug.sectionHeading, sug.bulletPoint, idx)}
                            className="shrink-0 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Apply
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {aiSuggestions.suggestions.length === 0 && (
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
                  >
                    Done
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
