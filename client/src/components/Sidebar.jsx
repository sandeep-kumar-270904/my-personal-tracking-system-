import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, LogOut, Settings, BarChart2, FileText, Code, Calendar, Users, CalendarDays, Target, BadgeDollarSign, Trophy } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const location = useLocation();
  const { logout } = useContext(AuthContext);

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

  return (
    <div className="w-64 min-h-screen glass border-r border-slate-700/50 flex flex-col fixed left-0 top-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-700/50">
        <Briefcase className="h-6 w-6 text-blue-500 mr-2" />
        <span className="text-xl font-bold text-gradient">SmartTrack</span>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} to={item.path}>
              <motion.div 
                whileHover={{ x: 5 }}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-700/50">
        <button 
          onClick={logout}
          className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
