import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Zap, CheckCircle } from 'lucide-react';

const InterviewEveProtocolModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center"
        >
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-emerald-500/30">
            <Shield className="w-12 h-12" />
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">Interview Eve Protocol Initiated</h1>
          <p className="text-xl text-gray-400 mb-12">
            Your interview is in less than 24 hours. The platform is now in lockdown mode.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-12">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
              <h3 className="font-bold text-rose-400 flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5" /> Locked Features
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2 line-through"><Lock className="w-4 h-4 shrink-0" /> Learning new patterns</li>
                <li className="flex items-center gap-2 line-through"><Lock className="w-4 h-4 shrink-0" /> Solving HARD problems</li>
                <li className="flex items-center gap-2 line-through"><Lock className="w-4 h-4 shrink-0" /> Pressure Mode Simulator</li>
              </ul>
            </div>

            <div className="bg-emerald-900/10 border border-emerald-500/20 p-6 rounded-2xl">
              <h3 className="font-bold text-emerald-400 flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5" /> Available Features
              </h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Reviewing your active recall notes</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Re-solving your top 3 strongest patterns</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" /> Behavioral stories review</li>
              </ul>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-lg transition-all hover:scale-105"
          >
            Acknowledge & Enter Lockdown
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InterviewEveProtocolModal;
