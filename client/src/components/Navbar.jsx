import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#0D1117]/80 backdrop-blur-xl border-b border-[#1E2330]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#F97316] flex items-center justify-center transition-all">
              <span className="font-bold text-white text-xl">S</span>
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight text-white transition-all">
              StudentTracker
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-300 hover:text-white font-medium transition-colors text-sm">Features</a>
            <a href="#leaderboard" className="text-slate-300 hover:text-white font-medium transition-colors text-sm">Leaderboard</a>
            <a href="#pricing" className="text-slate-300 hover:text-white font-medium transition-colors text-sm">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors text-sm">
              Log In
            </Link>
            <Link to="/signup">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#F97316] hover:bg-[#EA6C0A] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors"
              >
                Get Started
              </motion.button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-white focus:outline-none p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0D1117] border-b border-[#1E2330] overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-4">
              <a href="#features" onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white font-medium text-base py-2">Features</a>
              <a href="#leaderboard" onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white font-medium text-base py-2">Leaderboard</a>
              <a href="#pricing" onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white font-medium text-base py-2">Pricing</a>
              
              <div className="h-px bg-[#1E2330] my-2"></div>
              
              <Link to="/login" onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white font-medium text-base py-2">
                Log In
              </Link>
              <Link to="/signup" onClick={() => setIsOpen(false)} className="w-full">
                <button className="w-full bg-[#F97316] hover:bg-[#EA6C0A] text-white px-6 py-3 rounded-lg text-base font-bold transition-colors text-center mt-2">
                  Get Started
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
