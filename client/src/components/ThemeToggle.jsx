import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'dark', icon: Moon, label: 'Dark' },
    { id: 'system', icon: Monitor, label: 'System' }
  ];

  const currentOption = options.find(o => o.id === theme) || options[2];
  const Icon = currentOption.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff6b00]"
        title="Toggle Theme"
        aria-label={`Toggle Theme. Current theme is ${theme}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Icon className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-36 bg-[#161b22] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 z-50"
            role="menu"
          >
            {options.map((opt) => (
              <button
                key={opt.id}
                role="menuitem"
                onClick={() => { setTheme(opt.id); setIsOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors focus:outline-none focus:bg-white/10 ${theme === opt.id ? 'text-[#ff6b00] bg-white/5 font-bold' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeToggle;
