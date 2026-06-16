import { useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, CheckCircle2, Clock, Code, AlertCircle, Flame } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import QuickAddFab from '../components/QuickAddFab';
import EmptyState from '../components/EmptyState';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend
} from 'recharts';
import AnimatedCounter from '../components/AnimatedCounter';

const fetchDashboardData = async () => {
  const [stats, apps, dsa, interviews, goals] = await Promise.all([
    api.get('/dashboard/stats').then(res => res.data),
    api.get('/applications').then(res => res.data),
    api.get('/dsa').then(res => res.data),
    api.get('/interviews').then(res => res.data),
    api.get('/goals').then(res => res.data)
  ]);
  return { stats, applications: apps, dsa, interviews, goalsData: goals };
};

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl"></div>
          ))}
        </div>
        <div className="h-48 bg-white/5 animate-pulse rounded-2xl mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-white/5 animate-pulse rounded-2xl"></div>
          <div className="h-96 bg-white/5 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={AlertCircle} heading="Failed to load dashboard" subtext="There was an error loading your data." />;
  }

  const { stats, applications, dsa, interviews, goalsData } = data;

  const statsCards = [
    { title: 'Total Applications', value: stats.totalApplications, icon: Briefcase, color: 'text-[#ff6b00]', bg: 'bg-[#ff6b00]/20', border: 'border-[#ff6b00]/50' },
    { title: 'Active Interviews', value: stats.activeInterviews, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500/50' },
    { title: 'Offers Received', value: stats.offersReceived, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50' },
    { title: 'DSA Topics Tracked', value: stats.dsaTopicsTracked, icon: Code, color: 'text-purple-500', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
    { title: 'Current Streak', value: '3 Days', icon: Flame, color: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/50' }, // Hardcoded streak for now until backend added
  ];

  // Applications Overview Line Chart
  const monthlyData = applications.reduce((acc, app) => {
    const month = new Date(app.appliedDate).toLocaleString('default', { month: 'short' });
    const existing = acc.find(item => item.name === month);
    if (existing) existing.count += 1;
    else acc.push({ name: month, count: 1 });
    return acc;
  }, []).reverse().slice(0, 6);

  // Application Status Pie Chart
  const statusData = [
    { name: 'Applied', value: applications.filter(a => a.status === 'Applied').length },
    { name: 'OA', value: applications.filter(a => a.status === 'OA').length },
    { name: 'Interview', value: applications.filter(a => a.status === 'Interview').length },
    { name: 'Rejected', value: applications.filter(a => a.status === 'Rejected').length },
    { name: 'Selected', value: applications.filter(a => a.status === 'Selected').length },
  ].filter(d => d.value > 0);
  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

  // Application Growth Area Chart
  const last30Days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    last30Days.push({ dateStr: d.toISOString().split('T')[0], display: `${d.getMonth()+1}/${d.getDate()}`, count: 0, cumulative: 0 });
  }
  applications.forEach(app => {
    if (app.appliedDate) {
      const dateStr = app.appliedDate.split('T')[0];
      const dayData = last30Days.find(d => d.dateStr === dateStr);
      if (dayData) dayData.count += 1;
    }
  });
  let runningTotal = 0;
  last30Days.forEach(day => { runningTotal += day.count; day.cumulative = runningTotal; });

  // Activity by Day Bar Chart
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activityByDay = Array(7).fill(0).map((_, i) => ({ name: daysOfWeek[i], count: 0 }));
  applications.forEach(app => {
    if (app.appliedDate) {
      const dayIndex = new Date(app.appliedDate).getDay();
      activityByDay[dayIndex].count += 1;
    }
  });

  // DSA Donut Chart
  const dsaProgressData = [
    { name: 'Easy', completed: dsa.filter(d => d.difficulty === 'Easy' && d.status === 'Completed').length, total: dsa.filter(d => d.difficulty === 'Easy').length },
    { name: 'Medium', completed: dsa.filter(d => d.difficulty === 'Medium' && d.status === 'Completed').length, total: dsa.filter(d => d.difficulty === 'Medium').length },
    { name: 'Hard', completed: dsa.filter(d => d.difficulty === 'Hard' && d.status === 'Completed').length, total: dsa.filter(d => d.difficulty === 'Hard').length },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto pb-20">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-[28px] font-semibold text-white mb-1">Dashboard</h1>
          <p className="text-[14px] text-slate-400">Welcome back, {user?.name}. Here's your career overview.</p>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statsCards.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-card p-5 rounded-2xl border border-white/5 hover:border-white/20 transition-all duration-300 border-l-4 ${stat.border} relative overflow-hidden group`}
          >
            {/* Stat specific background glow on hover */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-full blur-2xl ${stat.bg.split('/')[0]}`} />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color} ${stat.title === 'Current Streak' ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <p className="text-slate-400 text-[13px] font-bold uppercase tracking-wider">{stat.title}</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {typeof stat.value === 'number' ? <AnimatedCounter value={stat.value} /> : stat.value}
                </h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Weekly Goals Widget */}
      {goalsData && goalsData.goal && (
        <div className="mb-8 glass-card p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Weekly Goals Progress</h3>
            <Link to="/goals" className="text-sm font-medium text-[#ff6b00] hover:text-[#EA6C0A] transition-colors">Edit Goals &rarr;</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Applications', progress: goalsData.progress.applications, target: goalsData.goal.targetApplications, color: 'bg-blue-500' },
              { label: 'DSA Practice', progress: goalsData.progress.dsa, target: goalsData.goal.targetDSA, color: 'bg-purple-500' },
              { label: 'Networking', progress: goalsData.progress.networking, target: goalsData.goal.targetNetworking, color: 'bg-amber-500' }
            ].map(goal => {
              const pct = Math.min(100, Math.round((goal.progress / goal.target) * 100)) || 0;
              return (
                <div key={goal.label}>
                  <div className="flex justify-between text-sm mb-2 font-medium">
                    <span className="text-slate-300">{goal.label} <span className="text-slate-500">({goal.progress}/{goal.target})</span></span>
                    <span className="text-white">{pct}%</span>
                  </div>
                  <div className="w-full h-3 bg-[#13141f] rounded-full overflow-hidden shadow-inner border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full ${goal.color} rounded-full relative`}
                    >
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Applications Growth */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">Applications Growth (Last 30 Days)</h3>
          {stats.totalApplications > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last30Days}>
                <defs>
                  <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff6b00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="display" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#13141f', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                <Area type="monotone" dataKey="cumulative" stroke="#ff6b00" strokeWidth={3} fillOpacity={1} fill="url(#colorCumulative)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Briefcase} heading="No applications yet" subtext="Add your first application to see the growth chart." ctaText="Add Application" ctaLink="/applications" />
          )}
        </div>

        {/* Application Status */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">Application Pipeline</h3>
          {stats.totalApplications > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="45%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#13141f', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Briefcase} heading="No applications yet" subtext="Start adding applications to build your pipeline." ctaText="Add Application" ctaLink="/applications" />
          )}
        </div>

        {/* Activity by Day */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">Activity by Day of Week</h3>
          {stats.totalApplications > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#13141f', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                <Bar dataKey="count" name="Applications Submitted" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Briefcase} heading="No activity" subtext="Log applications to see which days you are most active." ctaText="Add Application" ctaLink="/applications" />
          )}
        </div>

        {/* DSA Difficulty */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 h-[400px]">
          <h3 className="text-lg font-bold text-white mb-6">DSA Completion by Difficulty</h3>
          {stats.dsaTopicsTracked > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dsaProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#13141f', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="total" name="Total Tracked" fill="#475569" radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={Code} heading="No DSA tracked" subtext="Start tracking your LeetCode progress here." ctaText="Log DSA" ctaLink="/dsa" />
          )}
        </div>

      </div>

      <QuickAddFab />
    </motion.div>
  );
};

export default DashboardPage;
