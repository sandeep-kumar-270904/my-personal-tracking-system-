import { useQuery } from '@tanstack/react-query';
import { RefreshCw, TrendingUp, BookOpen, Target, Activity, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

const MyStatsPage = () => {
  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my_stats'],
    queryFn: async () => {
      const res = await api.get('/my-stats');
      return res.data;
    }
  });

  const handleRefresh = async () => {
    await api.get('/my-stats?refresh=true');
    await refetch();
    toast.success('Stats refreshed!');
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-full text-slate-500 animate-pulse">
        Loading deep analytics...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center h-full text-slate-500">
        No stats available yet. Keep learning!
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-400" />
            Deep Analytics
          </h1>
          <p className="text-slate-400">Track your learning velocity, application progress, and DSA mastery.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefetching}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-lg transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-400' : ''}`} />
          {isRefetching ? 'Syncing...' : 'Sync Latest Data'}
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#13141f] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <BookOpen className="w-24 h-24 -mr-4 -mb-4 text-blue-500" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Resources Completed</p>
          <p className="text-4xl font-black text-white">{stats.totalCompletions}</p>
        </div>
        <div className="bg-[#13141f] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <TrendingUp className="w-24 h-24 -mr-4 -mb-4 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Applications Sent</p>
          <p className="text-4xl font-black text-white">{stats.applicationsSubmitted}</p>
        </div>
        <div className="bg-[#13141f] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Target className="w-24 h-24 -mr-4 -mb-4 text-purple-500" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">DSA Solved</p>
          <p className="text-4xl font-black text-white">{stats.dsaSolved}</p>
        </div>
        <div className="bg-[#13141f] border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Award className="w-24 h-24 -mr-4 -mb-4 text-amber-500" />
          </div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Streak</p>
          <p className="text-4xl font-black text-white">{stats.streak} <span className="text-sm font-bold text-amber-500">Days</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activity Heatmap Area Chart */}
        <div className="bg-[#13141f] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Learning Velocity</h3>
          {stats.activityHeatmap.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.activityHeatmap}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="date" stroke="#52525b" fontSize={12} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                  <YAxis stroke="#52525b" fontSize={12} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-sm">Not enough data to display velocity.</div>
          )}
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="bg-[#13141f] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Resource Focus Areas</h3>
          {stats.categoryBreakdown.length > 0 ? (
            <div className="h-64 w-full flex">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="category"
                    >
                      {stats.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-48 flex flex-col justify-center gap-3">
                {stats.categoryBreakdown.map((cat, idx) => (
                  <div key={cat.category} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-slate-300 truncate" title={cat.category}>{cat.category}</span>
                    <span className="text-white font-bold ml-auto">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
             <div className="h-64 flex items-center justify-center text-slate-500 text-sm">No completions yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyStatsPage;
