import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, X } from 'lucide-react';

const ShortcutHintCard = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('hasSeenShortcuts');
    if (!hasSeen) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        handleDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('hasSeenShortcuts', 'true');
    setIsVisible(false);
  };

  const shortcuts = [
    { keys: ['N', 'A'], label: 'Add Application' },
    { keys: ['N', 'D'], label: 'Log DSA' },
    { keys: ['N', 'I'], label: 'Add Interview' },
    { keys: ['G'], label: 'Go to Goals' },
    { keys: ['C'], label: 'Go to Contests' },
    { keys: ['/'], label: 'Search' },
  ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="fixed bottom-8 left-8 z-50 bg-[#13141f] border border-white/10 rounded-2xl p-4 shadow-2xl w-72"
        >
          <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Command className="w-4 h-4" />
              <span className="text-sm font-semibold">Keyboard Shortcuts</span>
            </div>
            <button onClick={handleDismiss} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {shortcuts.map((sc, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{sc.label}</span>
                <div className="flex gap-1">
                  {sc.keys.map((k, j) => (
                    <kbd key={j} className="bg-white/10 px-1.5 py-0.5 rounded text-slate-300 font-mono">{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ShortcutHintCard;
