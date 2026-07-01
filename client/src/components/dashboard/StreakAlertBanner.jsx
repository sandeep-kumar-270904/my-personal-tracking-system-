import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, X } from 'lucide-react';

const StreakAlertBanner = ({ streak, onLogClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const dismissed = localStorage.getItem(`dismissedStreakAlert_${today}`);
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`dismissedStreakAlert_${today}`, 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="mb-6"
        >
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-400">Streak at risk!</h4>
                <p className="text-xs text-amber-500/80 mt-0.5">
                  Your {streak}-day streak is at risk — you haven't logged a DSA problem today.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={onLogClick}
                className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Log problem now
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 text-amber-500/60 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakAlertBanner;
