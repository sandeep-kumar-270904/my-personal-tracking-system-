import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LogOut, Settings, FileText, Code, Calendar, Users, CalendarDays, Target, BadgeDollarSign, Trophy, Menu, X, BookOpen, ChevronLeft, ChevronRight, User, Zap } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const location = useLocation();
  const { logout, user } = useContext(AuthContext);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Analyzer', path: '/ai-analyzer', icon: Zap },
    { name: 'Applications', path: '/applications', icon: Briefcase },
    { name: 'Resumes', path: '/resumes', icon: FileText },
    { name: 'DSA Tracker', path: '/dsa', icon: Code },
    { name: 'Interviews', path: '/interviews', icon: Calendar },
    { name: 'Networking', path: '/network', icon: Users },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Offers', path: '/offers', icon: BadgeDollarSign },
    { name: 'Contests', path: '/contests', icon: Trophy },
    { name: 'PrepHub', path: '/resources', icon: BookOpen },
  ];

  const mobileNavItems = navItems.slice(0, 4); // Show top 4 on mobile bottom nav

  const sidebarContent = (
    <>
      <div className={`h-20 flex items-center border-b border-white/5 transition-all duration-300 ${isCollapsed ? 'px-4 justify-center' : 'px-6'}`}>
        <div className="flex items-center gap-3 group overflow-hidden">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff007b] flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.3)]">
            <span className="font-bold text-white text-xl">S</span>
          </div>
          {!isCollapsed && (
            <motion.span 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              className="text-xl font-bold tracking-tight text-white whitespace-nowrap"
            >
              StudentTracker
            </motion.span>
          )}
        </div>
      </div>

      {/* User Profile Area */}
      <div className={`p-4 border-b border-white/5 relative ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button 
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          className={`flex items-center gap-3 w-full p-2 rounded-xl hover:bg-white/5 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className="w-10 h-10 shrink-0 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center overflow-hidden">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email || 'user@example.com'}</p>
            </div>
          )}
        </button>

        <AnimatePresence>
          {isProfileDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
              <motion.div 
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className={`absolute z-50 mt-2 bg-[#13141f] border border-white/10 rounded-xl shadow-xl w-48 overflow-hidden ${isCollapsed ? 'left-full ml-4 top-0' : 'left-4 right-4'}`}
              >
                <Link to="/settings" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                  <Settings className="w-4 h-4 mr-3" /> Settings
                </Link>
                <button onClick={logout} className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-4 h-4 mr-3" /> Logout
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <div key={item.name} className="relative group">
              <Link to={item.path}>
                <motion.div 
                  whileHover={{ x: isCollapsed ? 0 : 4 }}
                  className={`flex items-center py-3 rounded-xl transition-all duration-200 relative ${
                    isCollapsed ? 'justify-center px-0' : 'px-4'
                  } ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#ff6b00]/10 to-[#ff007b]/10 text-white' 
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTab" 
                      className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#ff6b00] to-[#ff007b] rounded-r-full"
                    />
                  )}
                  <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-[#ff6b00]' : 'group-hover:text-[#ff007b]'} ${!isCollapsed ? 'mr-3' : ''}`} />
                  {!isCollapsed && <span className="font-semibold whitespace-nowrap">{item.name}</span>}
                </motion.div>
              </Link>
              
              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#13141f] text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-xl">
                  {item.name}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-[5px] border-transparent border-r-[#13141f]"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-white/5 flex justify-end">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors w-full flex justify-center"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 z-40 flex items-center justify-around px-2 pb-safe">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link key={item.name} to={item.path} className="flex flex-col items-center justify-center w-full h-full p-1 relative">
              {isActive && (
                <motion.div layoutId="mobileActive" className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-[#ff6b00] to-[#ff007b] rounded-b-full shadow-[0_0_10px_rgba(255,107,0,0.8)]" />
              )}
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'text-[#ff6b00]' : 'text-slate-500'}`} />
              <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-slate-500'}`}>{item.name}</span>
            </Link>
          );
        })}
        
        {/* 'More' Menu for Mobile */}
        <div className="flex flex-col items-center justify-center w-full h-full p-1 cursor-pointer" onClick={() => setIsProfileDropdownOpen(true)}>
          <Menu className="w-6 h-6 mb-1 text-slate-500" />
          <span className="text-[10px] font-bold text-slate-500">More</span>
        </div>

        {/* Mobile 'More' Drawer */}
        <AnimatePresence>
          {isProfileDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsProfileDropdownOpen(false)} />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-16 left-0 w-full bg-[#13141f] border-t border-white/10 rounded-t-3xl z-50 p-4 pb-8 max-h-[80vh] overflow-y-auto"
              >
                <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {navItems.slice(4).map(item => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.name} to={item.path} onClick={() => setIsProfileDropdownOpen(false)} className="flex flex-col items-center p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                        <Icon className="w-6 h-6 text-slate-300 mb-2" />
                        <span className="text-[11px] font-bold text-white text-center">{item.name}</span>
                      </Link>
                    )
                  })}
                </div>
                <div className="border-t border-white/5 pt-4 flex gap-2">
                  <Link to="/settings" onClick={() => setIsProfileDropdownOpen(false)} className="flex-1 btn-secondary text-sm py-3">
                    <Settings className="w-4 h-4 mr-2" /> Settings
                  </Link>
                  <button onClick={logout} className="flex-1 btn-danger text-sm py-3">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Fixed Sidebar */}
      <motion.div 
        animate={{ width: isCollapsed ? 80 : 256 }}
        className="hidden md:flex fixed top-0 left-0 h-screen bg-[#050508] border-r border-white/5 flex-col z-50 shrink-0"
      >
        {sidebarContent}
      </motion.div>
    </>
  );
};

export default Sidebar;
