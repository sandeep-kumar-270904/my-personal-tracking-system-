import { NavLink } from 'react-router-dom';
import { Home, Briefcase, Code, Trophy, User } from 'lucide-react';

const BottomNavBar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Apps', path: '/applications', icon: Briefcase },
    { name: 'DSA', path: '/dsa', icon: Code },
    { name: 'Contests', path: '/contests', icon: Trophy },
    { name: 'Profile', path: '/settings', icon: User }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0a0a0f] border-t border-white/5 z-50 flex items-center justify-around px-2 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          aria-label={item.name}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-16 h-full transition-colors focus:outline-none focus:text-[#ff6b00] ${
              isActive ? 'text-[#ff6b00]' : 'text-slate-500 hover:text-slate-300'
            }`
          }
        >
          <item.icon className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">{item.name}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNavBar;
