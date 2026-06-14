import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2, XCircle, Clock, FileText, Code, Calendar, AlertCircle, Target } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    applications: [],
    resumes: [],
    dsa: [],
    interviews: [],
    goalsData: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [appRes, resRes, dsaRes, intRes, goalsRes] = await Promise.all([
          api.get('/applications').catch(() => ({ data: [] })),
          api.get('/resumes').catch(() => ({ data: [] })),
          api.get('/dsa').catch(() => ({ data: [] })),
          api.get('/interviews').catch(() => ({ data: [] })),
          api.get('/goals').catch(() => ({ data: null }))
        ]);

        setData({
          applications: appRes.data,
          resumes: resRes.data,
          dsa: dsaRes.data,
          interviews: intRes.data,
          goalsData: goalsRes.data
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const { applications, resumes, dsa, interviews, goalsData } = data;

  // Stats calculation
  const totalApps = applications.length;
  const interviewing = applications.filter(a => a.status === 'Interview').length;
  const offers = applications.filter(a => a.status === 'Selected').length;
  const totalDSA = dsa.length;
  
  const statsCards = [
    { title: 'Total Applications', value: totalApps, icon: Briefcase, color: 'text-[#ff6b00]', bg: 'bg-blue-500/20' },
    { title: 'Active Interviews', value: interviewing, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/20' },
    { title: 'Offers Received', value: offers, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/20' },
    { title: 'DSA Topics Tracked', value: totalDSA, icon: Code, color: 'text-purple-500', bg: 'bg-purple-500/20' },
  ];

  // Chart data: Applications Status
  const statusData = [
    { name: 'Applied', value: applications.filter(a => a.status === 'Applied').length },
    { name: 'OA', value: applications.filter(a => a.status === 'OA').length },
    { name: 'Interview', value: applications.filter(a => a.status === 'Interview').length },
    { name: 'Rejected', value: applications.filter(a => a.status === 'Rejected').length },
    { name: 'Selected', value: applications.filter(a => a.status === 'Selected').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

  // Chart data: Monthly applications
  const monthlyData = applications.reduce((acc, app) => {
    const month = new Date(app.appliedDate).toLocaleString('default', { month: 'short' });
    const existing = acc.find(item => item.name === month);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: month, count: 1 });
    }
    return acc;
  }, []).reverse().slice(0, 6);

  // Chart data: DSA Progress
  const dsaProgressData = [
    { name: 'Easy', completed: dsa.filter(d => d.difficulty === 'Easy' && d.status === 'Completed').length, total: dsa.filter(d => d.difficulty === 'Easy').length },
    { name: 'Medium', completed: dsa.filter(d => d.difficulty === 'Medium' && d.status === 'Completed').length, total: dsa.filter(d => d.difficulty === 'Medium').length },
    { name: 'Hard', completed: dsa.filter(d => d.difficulty === 'Hard' && d.status === 'Completed').length, total: dsa.filter(d => d.difficulty === 'Hard').length },
  ];

  // Productivity Insights Logic
  const getInsights = () => {
    const insights = [];
    const now = new Date();
    
    // Check stale applications
    const staleApps = applications.filter(a => {
      if (a.status !== 'Applied') return false;
      const daysSince = Math.floor((now - new Date(a.appliedDate)) / (1000 * 60 * 60 * 24));
      return daysSince > 14;
    });
    if (staleApps.length > 0) {
      insights.push({ id: 1, type: 'warning', text: `You have ${staleApps.length} applications stuck in 'Applied' for over 14 days. Consider following up.` });
    }

    // Check primary resume
    const hasPrimaryResume = resumes.some(r => r.isPrimary);
    if (resumes.length === 0) {
      insights.push({ id: 2, type: 'info', text: "You haven't uploaded any resumes yet." });
    } else if (!hasPrimaryResume) {
      insights.push({ id: 3, type: 'warning', text: "You have resumes uploaded but none marked as 'Primary'." });
    }

    // Upcoming interviews
    const upcomingInterviews = interviews.filter(i => {
      if (i.status === 'Done' || i.status === 'Cancelled') return false;
      const daysUntil = Math.ceil((new Date(i.interviewDate) - now) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 3;
    });
    if (upcomingInterviews.length > 0) {
      insights.push({ id: 4, type: 'urgent', text: `You have ${upcomingInterviews.length} interview(s) coming up in the next 3 days! Keep preparing.` });
    }

    // DSA check
    const hardPending = dsa.filter(d => d.difficulty === 'Hard' && d.status !== 'Completed');
    if (hardPending.length > 3) {
      insights.push({ id: 5, type: 'info', text: `You have several 'Hard' DSA topics pending. Break them down into smaller problems.` });
    }

    if (insights.length === 0) {
      insights.push({ id: 6, type: 'success', text: "Everything looks great! You're on top of your career prep." });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <Sidebar />
      
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pt-24 md:pt-8 overflow-y-auto h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto"
        >
          <header className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-slate-400">Welcome back, {user?.name}. Here's your career overview.</p>
            </div>
          </header>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {/* Productivity Insights */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4">Productivity Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map(insight => (
                    <div key={insight.id} className={`p-4 rounded-xl border flex items-start gap-3
                      ${insight.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' : ''}
                      ${insight.type === 'urgent' ? 'bg-red-500/10 border-red-500/20 text-red-200' : ''}
                      ${insight.type === 'info' ? 'bg-blue-500/10 border-blue-500/20 text-blue-200' : ''}
                      ${insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200' : ''}
                    `}>
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium">{insight.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statsCards.map((stat, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card flex items-center p-6 rounded-2xl border border-white/5"
                  >
                    <div className={`w-14 h-14 rounded-xl ${stat.bg} flex items-center justify-center mr-4`}>
                      <stat.icon className={`w-7 h-7 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm font-medium mb-1">{stat.title}</p>
                      <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Weekly Goals Widget */}
              {goalsData && goalsData.goal && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Weekly Goals Progress</h3>
                    <Link to="/goals" className="text-sm text-[#00f0ff] hover:text-blue-300 flex items-center">
                      View details
                    </Link>
                  </div>
                  <div className="glass-card p-6 rounded-2xl border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">Applications ({goalsData.progress.applications}/{goalsData.goal.targetApplications})</span>
                          <span className="text-[#00f0ff] font-medium">{Math.min(100, Math.round((goalsData.progress.applications / goalsData.goal.targetApplications) * 100)) || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#13141f] rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (goalsData.progress.applications / goalsData.goal.targetApplications) * 100) || 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">DSA Practice ({goalsData.progress.dsa}/{goalsData.goal.targetDSA})</span>
                          <span className="text-violet-400 font-medium">{Math.min(100, Math.round((goalsData.progress.dsa / goalsData.goal.targetDSA) * 100)) || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#13141f] rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(100, (goalsData.progress.dsa / goalsData.goal.targetDSA) * 100) || 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-slate-300">Networking ({goalsData.progress.networking}/{goalsData.goal.targetNetworking})</span>
                          <span className="text-amber-400 font-medium">{Math.min(100, Math.round((goalsData.progress.networking / goalsData.goal.targetNetworking) * 100)) || 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#13141f] rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (goalsData.progress.networking / goalsData.goal.targetNetworking) * 100) || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass-card p-6 rounded-2xl border border-white/5 h-96">
                  <h3 className="text-lg font-bold text-white mb-6">Applications Overview</h3>
                  {totalApps > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 pb-10">No data available</div>
                  )}
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/5 h-96">
                  <h3 className="text-lg font-bold text-white mb-6">Application Status</h3>
                  {totalApps > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="45%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 pb-10">No data available</div>
                  )}
                </div>
                
                <div className="glass-card p-6 rounded-2xl border border-white/5 h-96 lg:col-span-2">
                  <h3 className="text-lg font-bold text-white mb-6">DSA Topic Completion by Difficulty</h3>
                  {totalDSA > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dsaProgressData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          cursor={{ fill: '#334155', opacity: 0.4 }}
                        />
                        <Legend />
                        <Bar dataKey="total" name="Total Topics Tracked" fill="#475569" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completed" name="Completed Topics" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 pb-10">No DSA data available</div>
                  )}
                </div>
              </div>

            </>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default DashboardPage;
