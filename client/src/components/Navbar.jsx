import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
              StudentTracker
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-slate-300 hover:text-white font-medium transition-colors">
              Log In
            </Link>
            <Link to="/signup">
              <button className="relative inline-flex h-10 overflow-hidden rounded-xl p-[1px] focus:outline-none group">
                <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#ff6b00_0%,#ff007b_50%,#00f0ff_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-[#0a0a0f] hover:bg-slate-900 px-6 py-2.5 text-sm font-bold text-white backdrop-blur-3xl transition-colors">
                  Get Started
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
