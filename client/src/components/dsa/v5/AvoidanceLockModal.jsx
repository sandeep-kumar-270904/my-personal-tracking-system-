import React from 'react';
import { Lock, ShieldAlert, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AvoidanceLockModal = ({ isOpen, onClose, lockedPattern = 'Arrays', requiredPattern = 'Dynamic Programming' }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 border-2 border-rose-500/50 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-rose-900/20 text-center p-8 relative"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 to-orange-500"></div>

          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <Lock className="w-10 h-10 text-rose-500" />
            <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-1 border border-gray-800">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Avoidance Lock Engaged</h2>
          
          <div className="bg-rose-900/10 border border-rose-500/20 p-4 rounded-xl mb-6">
            <p className="text-gray-300 text-sm leading-relaxed">
              You are grinding <span className="font-bold text-white">{lockedPattern}</span> because it's comfortable, while actively ignoring your weakness in <span className="font-bold text-white">{requiredPattern}</span>.
            </p>
          </div>

          <p className="text-amber-400 font-bold mb-8">
            Solve 2 <span className="text-white">{requiredPattern}</span> problems to unlock {lockedPattern}.
          </p>

          <button 
            onClick={onClose}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Key className="w-5 h-5" /> Accept Challenge
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AvoidanceLockModal;
