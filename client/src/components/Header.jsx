import { useState, useEffect, useContext, useRef } from 'react';
import { Bell, Search, Plus, User, LogOut, ChevronDown, Building2, BadgeDollarSign, FileText, Target, Mic, Trophy, Users, CalendarDays, BookOpen, Activity, Briefcase, Code, Calendar, WifiOff, X, Settings } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import { AuthContext } from '../context/AuthContext';

const useOnline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return isOnline;
};

// Hook for closing dropdowns when clicking outside
const useOutsideClick = (ref, callback) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, callback]);
};

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnline();
  const { user, logout } = useContext(AuthContext);

  const moreDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useOutsideClick(moreDropdownRef, () => setIsMoreOpen(false));
  useOutsideClick(profileDropdownRef, () => setIsProfileOpen(false));

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMoreOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearchNav = (path) => {
    navigate(path);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'AI Analyzer', path: '/ai-analyzer' },
    { name: 'Applications', path: '/applications' },
    { name: 'DSA Tracker', path: '/dsa' },
    { name: 'Interviews', path: '/interviews' },
  ];

  const moreItems = [
    { name: 'Company Insights', path: '/company-insights', icon: Building2 },
    { name: 'Salary Negotiation', path: '/negotiation', icon: BadgeDollarSign },
    { name: 'Mock Interview', path: '/mock-interview', icon: Mic },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
    { name: 'Resumes', path: '/resumes', icon: FileText },
    { name: 'Networking', path: '/network', icon: Users },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Offers', path: '/offers', icon: BadgeDollarSign },
    { name: 'Contests', path: '/contests', icon: Trophy },
    { name: 'PrepHub', path: '/resources', icon: BookOpen },
    { name: 'My Stats', path: '/my-stats', icon: Activity },
  ];

  if (user?.role === 'placement_cell_admin') {
    moreItems.push({ name: 'Admin Dashboard', path: '/admin', icon: Briefcase });
  }

  return (
    <>
      <header className="h-[60px] border-b border-white/10 bg-[#010409] sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 font-sans">
        
        {/* Left Section: Logo & Nav Links */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff6b00] to-[#ff007b] flex items-center justify-center shadow-[0_0_10px_rgba(255,107,0,0.3)]">
              <span className="font-bold text-white text-[15px]">S</span>
            </div>
            <span className="text-white font-semibold tracking-tight text-[15px] hidden xl:block">StudentTracker</span>
          </Link>

          {/* Primary Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.name} 
                  to={item.path}
                  className={`tour-nav-${item.name.toLowerCase().replace(/\s+/g, '-')} px-3 py-1.5 rounded-md text-[14px] font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  {item.name}
                </Link>
              )
            })}
            
            {/* More Dropdown */}
            <div className="relative" ref={moreDropdownRef}>
              <button 
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className={`tour-nav-more flex items-center gap-1 px-3 py-1.5 rounded-md text-[14px] font-medium transition-colors ${moreItems.some(i => i.path === location.pathname) ? 'text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
              >
                More <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              
              <AnimatePresence>
                {isMoreOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-[#161b22] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 z-50"
                  >
                    {moreItems.map(item => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link 
                          key={item.name} 
                          to={item.path}
                          onClick={() => setIsMoreOpen(false)}
                          className={`flex items-center px-4 py-2 text-[14px] ${isActive ? 'text-white bg-white/5' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                        >
                          <Icon className="w-4 h-4 mr-3 opacity-70" />
                          {item.name}
                        </Link>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>
        </div>

        {/* Right Section: Search, Offline, Notifications, Profile */}
          <div className="flex items-center gap-1 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Global Search Button */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open Global Search"
            className="hidden sm:flex items-center w-64 px-3 py-1.5 bg-[#0d1117] border border-white/20 hover:border-slate-500 rounded-md text-slate-400 transition-colors"
          >
            <Search className="w-4 h-4 mr-2" />
            <span className="flex-1 text-left text-[13px]">Search or jump to...</span>
            <div className="flex items-center justify-center border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-[#161b22]">
              /
            </div>
          </button>
          
          {/* Mobile Search Button */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search"
            className="sm:hidden p-2 text-slate-400 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Connection Status */}
          {!isOnline && (
            <div className="flex items-center justify-center text-amber-500 px-2" title="Offline">
              <WifiOff className="w-4 h-4" />
            </div>
          )}

          <NotificationDropdown />

          {/* User Profile */}
          <div className="relative" ref={profileDropdownRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="User Profile Menu"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center overflow-hidden border border-white/10 hover:border-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff6b00]"
            >
              <User className="w-4 h-4 text-slate-300" />
            </button>
            
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-[#161b22] border border-white/10 rounded-lg shadow-xl overflow-hidden py-1 z-50"
                >
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-[13px] text-slate-400">Signed in as</p>
                    <p className="text-[14px] font-semibold text-white truncate mt-0.5">{user?.name || 'User'}</p>
                  </div>
                  <div className="py-1">
                    <Link to="/settings" onClick={() => setIsProfileOpen(false)} className="flex items-center px-4 py-2 text-[14px] text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                      <Settings className="w-4 h-4 mr-3 opacity-70" /> Settings
                    </Link>
                  </div>
                  <div className="border-t border-white/10 py-1">
                    <button onClick={logout} className="w-full flex items-center px-4 py-2 text-[14px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4 mr-3 opacity-70" /> Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4 font-sans">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-[#010409]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-[#161b22] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center px-4 py-4 border-b border-white/10 bg-[#0d1117]">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input 
                  type="text"
                  autoFocus
                  placeholder="Search applications, contacts, topics..."
                  className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-[15px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setIsSearchOpen(false)} className="p-1 text-slate-400 hover:text-white bg-white/5 rounded-md">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-2 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Quick Actions</div>
                <button onClick={() => handleSearchNav('/applications')} className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-[#1f6feb]/15 text-slate-300 hover:text-blue-400 group transition-colors">
                  <Briefcase className="w-4 h-4 mr-3 opacity-70 group-hover:opacity-100" />
                  <span className="flex-1 text-left text-[14px]">Go to Applications</span>
                </button>
                <button onClick={() => handleSearchNav('/network')} className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-[#1f6feb]/15 text-slate-300 hover:text-blue-400 group transition-colors">
                  <Users className="w-4 h-4 mr-3 opacity-70 group-hover:opacity-100" />
                  <span className="flex-1 text-left text-[14px]">Go to Networking</span>
                </button>
                <button onClick={() => handleSearchNav('/dsa')} className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-[#1f6feb]/15 text-slate-300 hover:text-blue-400 group transition-colors">
                  <Code className="w-4 h-4 mr-3 opacity-70 group-hover:opacity-100" />
                  <span className="flex-1 text-left text-[14px]">Go to DSA Tracker</span>
                </button>
                <button onClick={() => handleSearchNav('/interviews')} className="w-full flex items-center px-3 py-2.5 rounded-md hover:bg-[#1f6feb]/15 text-slate-300 hover:text-blue-400 group transition-colors">
                  <Calendar className="w-4 h-4 mr-3 opacity-70 group-hover:opacity-100" />
                  <span className="flex-1 text-left text-[14px]">Go to Interviews</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
