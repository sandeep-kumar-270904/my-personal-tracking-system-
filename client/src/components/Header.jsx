import { useState, useEffect } from 'react';
import { Search, Bell, X, Briefcase, Users, Code, Calendar, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

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

const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const isOnline = useOnline();

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const dummyNotifications = [
    { id: 1, text: 'Flipkart interview in 24 hours', time: '2h ago' },
    { id: 2, text: 'LeetCode Weekly Contest starts in 1 hour', time: '3h ago' }
  ];

  const handleSearchNav = (path) => {
    navigate(path);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <>
      <header className="h-20 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8">
        <div className="flex-1 max-w-xl hidden md:block">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center px-4 py-2.5 bg-[#13141f] hover:bg-[#1a1c29] border border-white/5 hover:border-white/10 rounded-xl text-slate-400 transition-colors"
          >
            <Search className="w-5 h-5 mr-3 text-slate-500" />
            <span className="flex-1 text-left text-sm">Search across the app...</span>
            <div className="flex items-center gap-1 text-xs font-semibold bg-white/5 px-2 py-1 rounded-md">
              <span>Cmd</span><span>K</span>
            </div>
          </button>
        </div>

        {/* Mobile Left Side - Logo & Search */}
        <div className="flex-1 flex md:hidden items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#F97316] flex items-center justify-center">
            <span className="font-bold text-white text-sm">S</span>
          </div>
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {/* Connection Status */}
          {!isOnline && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold text-amber-500">Offline</span>
            </div>
          )}
          {/* Mobile Offline Icon */}
          {!isOnline && (
            <div className="sm:hidden flex items-center justify-center text-amber-500">
              <WifiOff className="w-5 h-5" />
            </div>
          )}

          {/* Notifications */}
          {/* Notifications */}
          <NotificationDropdown />
        </div>
      </header>

      {/* Global Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[20vh] px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="relative w-full max-w-2xl bg-[#13141f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center px-4 py-4 border-b border-white/10">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input 
                  type="text"
                  autoFocus
                  placeholder="Search applications, contacts, topics..."
                  className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setIsSearchOpen(false)} className="p-1 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 max-h-[60vh] overflow-y-auto">
                <div className="px-3 py-2 text-[13px] font-bold text-slate-500 uppercase tracking-wider">Quick Actions</div>
                <button onClick={() => handleSearchNav('/applications')} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-[#ff6b00]/10 text-slate-300 hover:text-[#ff6b00] group transition-colors">
                  <Briefcase className="w-5 h-5 mr-3" />
                  <span className="flex-1 text-left">Go to Applications</span>
                </button>
                <button onClick={() => handleSearchNav('/network')} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-[#ff007b]/10 text-slate-300 hover:text-[#ff007b] group transition-colors">
                  <Users className="w-5 h-5 mr-3" />
                  <span className="flex-1 text-left">Go to Networking</span>
                </button>
                <button onClick={() => handleSearchNav('/dsa')} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-500 group transition-colors">
                  <Code className="w-5 h-5 mr-3" />
                  <span className="flex-1 text-left">Go to DSA Tracker</span>
                </button>
                <button onClick={() => handleSearchNav('/interviews')} className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-purple-500/10 text-slate-300 hover:text-purple-500 group transition-colors">
                  <Calendar className="w-5 h-5 mr-3" />
                  <span className="flex-1 text-left">Go to Interviews</span>
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
