import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LogOut, Settings, FileText, Code, Calendar, Users, CalendarDays, Target, BadgeDollarSign, Trophy, Menu, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Applications', path: '/applications', icon: Briefcase },
    { name: 'Resumes', path: '/resumes', icon: FileText },
    { name: 'DSA Tracker', path: '/dsa', icon: Code },
    { name: 'Interviews', path: '/interviews', icon: Calendar },
    { name: 'Networking', path: '/network', icon: Users },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Offers', path: '/offers', icon: BadgeDollarSign },
    { name: 'Contests', path: '/contests', icon: Trophy },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const closeSidebar = () => setIsOpen(false);

  const sidebarContent = (
    <>
      <div className="h-20 flex items-center px-6 border-b border-white/5">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff007b] flex items-center justify-center shadow-[0_0_15px_rgba(255,107,0,0.3)]">
            <span className="font-bold text-white text-xl">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">SmartTracker</span>
        </div>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} to={item.path} onClick={closeSidebar}>
              <motion.div 
                whileHover={{ x: 4 }}
                className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#ff6b00]/10 to-[#ff007b]/10 text-white' 
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab" 
                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ff6b00] to-[#ff007b] rounded-r-full"
                  />
                )}
                <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-[#ff6b00]' : 'group-hover:text-[#ff007b]'}`} />
                <span className="font-semibold">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/5">
        <button 
          onClick={logout}
          className="w-full flex items-center px-4 py-3.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b00] to-[#ff007b] flex items-center justify-center">
            <span className="font-bold text-white text-sm">S</span>
          </div>
          <span className="text-lg font-bold text-white">SmartTracker</span>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-slate-300 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Content (Mobile Drawer + Desktop Fixed) */}
      <motion.div 
        className={`fixed top-0 left-0 h-screen w-64 bg-[#050508] border-r border-white/5 flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Mobile Close Button */}
        <button 
          onClick={closeSidebar} 
          className="md:hidden absolute top-6 right-4 p-2 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </motion.div>
    </>
  );
};

export default Sidebar;
