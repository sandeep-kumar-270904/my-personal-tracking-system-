import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Zap } from 'lucide-react';
import api from '../../services/api';

const PinnedGoalsWidget = () => {
  const [pinnedGoals, setPinnedGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const res = await api.get('/goals');
        const activePinned = res.data.goals.filter(g => g.status === 'active' && g.pinned);
        setPinnedGoals(activePinned.slice(0, 3)); // Max 3 pinned goals
      } catch (err) {
        console.error('Failed to fetch goals', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  if (loading) return null;
  if (pinnedGoals.length === 0) return null;

  return (
    <div className="bg-[#13141f] border border-white/10 rounded-2xl p-6 mb-8 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
          <Target className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Focus Goals</h3>
          <p className="text-xs text-slate-400">Your pinned priorities for this week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {pinnedGoals.map(goal => {
          const progress = Math.min(100, Math.round((goal.progress / goal.target_value) * 100));
          return (
            <motion.div 
              key={goal._id} 
              whileHover={{ y: -2 }}
              className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 flex flex-col"
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-bold text-white truncate pr-2">{goal.title}</h4>
                <div className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono text-slate-300 whitespace-nowrap">
                  {goal.progress} / {goal.target_value}
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                  />
                </div>
                {progress >= 100 && (
                  <p className="text-xs text-emerald-400 font-bold mt-2 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Target hit!
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default PinnedGoalsWidget;
