import { useEffect, useState } from 'react';
import { tinykeys } from 'tinykeys';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

const KeyboardShortcuts = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = tinykeys(window, {
      'g d': (e) => { e.preventDefault(); navigate('/dashboard'); },
      'g a': (e) => { e.preventDefault(); navigate('/applications'); },
      'g s': (e) => { e.preventDefault(); navigate('/dsa'); },
      'g i': (e) => { e.preventDefault(); navigate('/interviews'); },
      'g r': (e) => { e.preventDefault(); navigate('/resources'); },
      'g c': (e) => { e.preventDefault(); navigate('/contests'); },
      'Shift+?': (e) => {
        // Prevent if inside an input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
        e.preventDefault();
        setShowModal(true);
      },
      'Escape': () => setShowModal(false),
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  return (
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#13141f] border border-white/10 p-6 rounded-2xl w-full max-w-lg relative shadow-2xl z-10"
          >
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 p-2 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Keyboard className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
            </div>

            <div className="space-y-4">
              <ShortcutRow keys={['g', 'd']} description="Go to Dashboard" />
              <ShortcutRow keys={['g', 'a']} description="Go to Applications" />
              <ShortcutRow keys={['g', 's']} description="Go to DSA Tracker" />
              <ShortcutRow keys={['g', 'i']} description="Go to Interviews" />
              <ShortcutRow keys={['g', 'r']} description="Go to Prep Hub" />
              <ShortcutRow keys={['g', 'c']} description="Go to Contests" />
              
              <div className="border-t border-white/5 pt-4 mt-4">
                <ShortcutRow keys={['Cmd/Ctrl', 'k']} description="Global Search" />
                <ShortcutRow keys={['Shift', '?']} description="Show Keyboard Shortcuts" />
                <ShortcutRow keys={['Esc']} description="Close Modals" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ShortcutRow = ({ keys, description }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-slate-300 text-sm font-medium">{description}</span>
    <div className="flex gap-1.5">
      {keys.map((k, i) => (
        <span key={i} className="px-2 py-1 bg-white/10 border border-white/10 text-white rounded text-xs font-mono font-bold shadow-sm">
          {k}
        </span>
      ))}
    </div>
  </div>
);

export default KeyboardShortcuts;
