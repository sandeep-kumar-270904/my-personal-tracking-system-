import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Briefcase, Code, Calendar, Users, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickAddFab = ({ onActionClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const actions = [
    { label: 'Add Application', id: 'ADD_APP', icon: Briefcase, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Log DSA Problem', id: 'LOG_DSA', icon: Code, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Add Interview', id: 'ADD_INTERVIEW', icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Add Contact', id: 'ADD_CONTACT', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  ];

  const handleAction = (actionId) => {
    setIsOpen(false);
    if (onActionClick) onActionClick(actionId);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="mb-4 bg-[#13141f] border border-white/10 rounded-2xl p-2 w-64 shadow-2xl flex flex-col gap-1"
            >
              <div className="px-3 py-2 border-b border-white/5 mb-1 flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Add</span>
                <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-400 font-mono">⌘K</kbd>
              </div>
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAction(action.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.bg}`}>
                    <action.icon className={`w-4 h-4 ${action.color}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-200">{action.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-[#ff6b00] hover:bg-[#EA6C0A] text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.4)] hover:shadow-[0_0_25px_rgba(255,107,0,0.6)] transition-all duration-300"
        >
          <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
            {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </motion.div>
        </button>
      </div>
    </>
  );
};

export default QuickAddFab;
