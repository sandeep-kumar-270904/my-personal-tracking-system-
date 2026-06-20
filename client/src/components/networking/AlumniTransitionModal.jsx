import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Award, GraduationCap, ArrowRight, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AlumniTransitionModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [pledgeChecked, setPledgeChecked] = useState(false);

  const handleComplete = () => {
    toast.success('Welcome to the Alumni Network!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0f] border border-emerald-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] flex flex-col"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#13141f]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Offer Accepted! 🎓</h2>
              <p className="text-sm text-emerald-300">Transition your profile to an Alumni Mentor.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="text-center">
                <GraduationCap className="mx-auto text-emerald-400 mb-4" size={48} />
                <h3 className="text-2xl font-bold text-white mb-2">Congratulations! You did it.</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  You successfully navigated the placement process. Now it's time to pay it forward.
                </p>
              </div>

              <div className="bg-[#13141f] border border-emerald-500/20 rounded-xl p-5">
                <h4 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                  <Share2 size={16} />
                  The Alumni Pledge
                </h4>
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-slate-300">
                    By switching to Alumni Mode, you agree to:
                  </p>
                  <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
                    <li>Respond to messages from students in this platform within 72 hours.</li>
                    <li>Provide brutally honest JD vs. Reality feedback.</li>
                    <li>Submit your successful outreach templates to the Plays Board.</li>
                  </ul>
                </div>
                
                <label className="flex items-center gap-3 p-3 bg-[#0a0a0f] border border-white/5 rounded-lg cursor-pointer hover:border-emerald-500/30 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={pledgeChecked}
                    onChange={(e) => setPledgeChecked(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-500 text-emerald-500 focus:ring-emerald-500 bg-transparent"
                  />
                  <span className="text-sm text-white font-medium">I pledge to help the next batch of students.</span>
                </label>
              </div>

              <button 
                onClick={() => setStep(2)}
                disabled={!pledgeChecked}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                Continue <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-2">Configure Your Alumni Profile</h3>
              <p className="text-sm text-slate-400 mb-6">Let students know what you can help them with.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">I am willing to provide:</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Referrals', 'Resume Reviews', 'Mock Interviews', 'Coffee Chats', 'Project Feedback'].map(item => (
                      <label key={item} className="flex items-center gap-2 text-sm text-slate-300">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-emerald-500 bg-[#0a0a0f] border-slate-600" />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Automated Greeting for Students</label>
                  <textarea 
                    className="w-full bg-[#13141f] border border-white/10 text-white text-sm rounded-lg p-3 h-24 focus:border-emerald-500 outline-none resize-none custom-scrollbar"
                    defaultValue="Hey! Happy to help. Please send me your resume and specify exactly what you need help with."
                  />
                </div>
              </div>

              <button 
                onClick={handleComplete}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Activate Alumni Mode
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AlumniTransitionModal;
