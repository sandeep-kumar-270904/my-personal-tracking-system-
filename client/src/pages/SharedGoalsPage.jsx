import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Target, Calendar, Check, Briefcase, Code, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';
import GoalHistoryChart from '../components/goals/GoalHistoryChart';

const SharedGoalsPage = () => {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSharedGoals = async () => {
      try {
        const res = await api.get(`/goals/shared/${token}`);
        setData(res.data);
      } catch (err) {
        setError('This link is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSharedGoals();
  }, [token]);

  const getIcon = (iconName) => {
    const icons = {
      briefcase: <Briefcase className="w-5 h-5" />,
      code: <Code className="w-5 h-5" />,
      users: <Users className="w-5 h-5" />
    };
    return icons[iconName] || <Target className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Target className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      <header className="mb-8 pt-6 border-b border-white/5 pb-6">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Target className="text-[#00f0ff] w-6 h-6" />
          {data.user.name}'s Goals
        </h1>
        <p className="text-sm text-slate-400">
          Accountability view. This link updates in real-time.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.goals.map((goal) => {
          const isComplete = goal.currentProgress >= goal.target_value;
          const percentage = Math.min((goal.currentProgress / goal.target_value) * 100, 100);

          return (
            <motion.div 
              key={goal._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-[#00f0ff]">
                    {getIcon(goal.icon)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{goal.title}</h3>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {goal.period} Target: {goal.target_value}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 mb-6">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-2xl font-bold text-white flex items-baseline gap-1.5">
                    {goal.currentProgress} <span className="text-sm font-medium text-slate-400">/ {goal.target_value}</span>
                  </div>
                  {isComplete && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Hit
                    </span>
                  )}
                </div>
                <div className="w-full h-2 bg-[#13141f] rounded-full overflow-hidden border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-[#00f0ff]'}`}
                  />
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                  History Trend
                </span>
                <div className="w-24">
                  <GoalHistoryChart history={goal.history} period={goal.period} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SharedGoalsPage;
