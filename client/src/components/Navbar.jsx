import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="glass sticky top-0 z-50 w-full border-b border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Briefcase className="h-8 w-8 text-blue-500" />
            <span className="text-xl font-bold text-gradient">SmartTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link to="/signup">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary py-1.5 px-4 text-sm"
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
