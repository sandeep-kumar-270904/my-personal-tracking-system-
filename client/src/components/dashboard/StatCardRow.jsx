import { motion } from 'framer-motion';
import { Briefcase, Clock, CheckCircle2, Code, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedCounter from '../AnimatedCounter';
import DashboardNetworkingCard from './DashboardNetworkingCard';

const StatCardRow = ({ stats }) => {
  const cards = [
    { title: 'Total Applications', value: stats?.totalApplications || 0, icon: Briefcase, color: 'text-[#ff6b00]', bg: 'bg-[#ff6b00]/20', border: 'border-[#ff6b00]/50', link: '/applications' },
    { title: 'Active Interviews', value: stats?.activeInterviews || 0, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/50', link: '/interviews' },
    { title: 'Offers Received', value: stats?.offersReceived || 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', link: '/offers', subtext: stats?.nearestOfferDeadline ? `Deadline: ${new Date(stats.nearestOfferDeadline).toLocaleDateString()}` : null },
    { title: 'DSA Topics Tracked', value: stats?.dsaTopicsTracked || 0, icon: Code, color: 'text-purple-500', bg: 'bg-purple-500/20', border: 'border-purple-500/50', link: '/dsa' },
    { title: 'Current Streak', value: stats?.currentStreak || 0, suffix: ' Days', icon: Flame, color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/50', link: '/dsa' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((stat, idx) => (
        <Link key={idx} to={stat.link}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`glass-card p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 border-t-4 ${stat.border} relative overflow-hidden group h-full`}
          >
            <div className={`absolute -right-10 -top-10 w-32 h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full blur-2xl ${stat.bg.split('/')[0]}`} />
            
            <div className="flex flex-col gap-3 relative z-10">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color} ${stat.title === 'Current Streak' ? 'animate-pulse' : ''}`} />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                  <AnimatedCounter value={stat.value} />
                  {stat.suffix && <span className="text-sm font-bold text-slate-400">{stat.suffix}</span>}
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">{stat.title}</p>
                {stat.subtext && <p className="text-[10px] text-amber-400 font-bold mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {stat.subtext}</p>}
              </div>
            </div>
          </motion.div>
        </Link>
      ))}
      <DashboardNetworkingCard />
    </div>
  );
};

export default StatCardRow;
