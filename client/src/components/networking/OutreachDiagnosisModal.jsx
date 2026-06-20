import React from 'react';
import { motion } from 'framer-motion';
import { X, Activity, ShieldAlert, HeartPulse, RefreshCcw } from 'lucide-react';

const OutreachDiagnosisModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-red-500/20 bg-red-500/5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Rejection Resilience Protocol</h2>
              <p className="text-sm text-red-300">You've hit a streak of non-responses or rejections. Let's diagnose it.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#13141f] border border-white/5 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Activity size={16} className="text-amber-400" />
                Symptom: Ghosting
              </h3>
              <p className="text-xs text-slate-400 mb-3">Contacts are opening but not replying to your DMs.</p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded p-3 text-xs text-amber-200">
                <strong>Diagnosis:</strong> Your ask might be too big for the relationship depth. Switch from "Can you refer me?" to "Can I get your opinion on a technical choice I made?"
              </div>
            </div>

            <div className="bg-[#13141f] border border-white/5 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                <HeartPulse size={16} className="text-red-400" />
                Symptom: Instant Rejections
              </h3>
              <p className="text-xs text-slate-400 mb-3">You get generic "we are not hiring" responses.</p>
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-xs text-red-200">
                <strong>Diagnosis:</strong> Timing is off. Use the Placement Timeline to reach out earlier in the cycle before roles officially open.
              </div>
            </div>
          </div>

          <div className="bg-[#13141f] border border-white/5 rounded-xl p-5">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Post-Rejection Pivot Plays</h3>
            <div className="space-y-3">
              <PivotPlay 
                title="The Feedback Pivot"
                desc='Reply with: "Understood. Since you know this team well, what is the #1 skill they look for that I am currently missing?"'
              />
              <PivotPlay 
                title="The Long-Term Pivot"
                desc='Reply with: "Makes sense. I am going to build [Project X] over the next 3 months using [Company Tech Stack]. Mind if I send you a 1-min demo when it is done?"'
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PivotPlay = ({ title, desc }) => (
  <div className="flex gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
    <div className="mt-1">
      <RefreshCcw size={16} className="text-purple-400" />
    </div>
    <div>
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="text-xs text-slate-300 mt-1 italic">{desc}</p>
    </div>
  </div>
);

export default OutreachDiagnosisModal;
