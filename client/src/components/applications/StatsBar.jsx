import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Target, Activity, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const fetchStats = async () => {
  const res = await api.get('/applications/stats');
  return res.data;
};

const StatsBar = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['applicationsStats'],
    queryFn: fetchStats,
  });

  if (isLoading || !stats) {
    return (
      <div className="flex gap-4 mb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex-1 h-20 bg-white/5 animate-pulse rounded-2xl border border-white/5"></div>
        ))}
      </div>
    );
  }

  const activePipeline = stats.totalApplications - (stats.byStatus['REJECTED'] || 0) - (stats.byStatus['OFFER'] || 0);

  const statItems = [
    { label: 'Total Applications', value: stats.totalApplications, icon: Target, color: 'text-blue-400' },
    { label: 'Shortlist Rate', value: `${stats.shortlistRate}%`, icon: CheckCircle2, color: 'text-teal-400' },
    { label: 'Response Rate', value: `${stats.responseRate}%`, icon: Activity, color: 'text-[#ff6b00]' },
    { label: 'Avg Days to Response', value: stats.avgDaysToResponse, icon: Clock, color: 'text-purple-400' },
    { label: 'Active Pipeline', value: activePipeline, icon: AlertCircle, color: 'text-green-400' },
    { label: 'Time Invested', value: `${Math.round((stats.totalEffortMinutes || 0) / 60)} hrs`, icon: Clock, color: 'text-[#ff6b00]' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
      {statItems.map((stat, i) => (
        <div key={i} className="bg-[#13141f] p-4 rounded-2xl border border-white/5 shadow-lg flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
            <stat.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
            <p className="text-2xl font-bold text-white leading-none">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;
