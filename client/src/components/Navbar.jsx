import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="fixed top-0 z-50 w-full bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff007b] flex items-center justify-center shadow-[0_0_20px_rgba(255,107,0,0.3)] group-hover:shadow-[0_0_30px_rgba(255,107,0,0.6)] transition-all">
              <span className="font-bold text-white text-xl">S</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#ff6b00] group-hover:to-[#ff007b] transition-all">
              SmartTracker
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors">
              Log In
            </Link>
            <Link to="/signup">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary py-2.5 px-6 text-sm"
              >
                Get Started
              </motion.button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
