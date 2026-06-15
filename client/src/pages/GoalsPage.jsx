import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Edit2, Check, TrendingUp, Briefcase, Code, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const fetchGoals = async () => {
  const { data } = await api.get('/goals');
  return data; // { goal: {...}, progress: {...} }
};

const GoalsPage = () => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    targetApplications: 10,
    targetDSA: 5,
    targetNetworking: 3
  });

  const { data, isLoading } = useQuery({
    queryKey: ['goals'], 
    queryFn: fetchGoals,
    onSuccess: (d) => {
      if (d?.goal) {
        setEditForm({
          targetApplications: d.goal.targetApplications,
          targetDSA: d.goal.targetDSA,
          targetNetworking: d.goal.targetNetworking
        });
      }
    }
  });

  // Since React Query v5 doesn't have onSuccess in useQuery the same way, we can use useEffect or just populate form on edit open.
  // We'll populate form on edit click.

  const updateMutation = useMutation({
    mutationFn: async (payload) => await api.put('/goals', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      toast.success('Goals updated!');
      setIsEditing(false);
    },
    onError: () => toast.error('Failed to update goals')
  });

  const handleEditOpen = () => {
    if (data?.goal) {
      setEditForm({
        targetApplications: data.goal.targetApplications,
        targetDSA: data.goal.targetDSA,
        targetNetworking: data.goal.targetNetworking
      });
    }
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(editForm);
  };

  const calculatePercentage = (progress, target) => {
    if (target === 0) return 0;
    const percentage = (progress / target) * 100;
    return percentage > 100 ? 100 : percentage;
  };

  const ProgressBar = ({ title, progress, target, icon: Icon, color }) => {
    const percentage = calculatePercentage(progress, target);
    const isComplete = progress >= target && target > 0;

    return (
      <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col h-full">
        {isComplete && (
          <div className="absolute top-0 right-0 p-4">
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
              <Check className="w-3 h-3 mr-1" /> Target Hit!
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl border ${color.bg} ${color.text} ${color.border}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400">Weekly Target: {target}</p>
          </div>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-white">{progress} <span className="text-sm font-normal text-slate-400">completed</span></span>
            <span className="text-sm font-bold text-white bg-white/10 px-2 py-0.5 rounded">{Math.round(percentage)}%</span>
          </div>
          <div className="w-full h-3 bg-[#13141f] rounded-full overflow-hidden border border-white/5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${color.fill} shadow-[0_0_10px_currentColor]`}
            />
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 w-full max-w-6xl mx-auto">
        <div className="h-10 w-48 bg-white/5 animate-pulse rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 animate-pulse rounded-2xl"></div>)}
        </div>
      </div>
    );
  }

  const safeData = data || {
    goal: { targetApplications: 10, targetDSA: 5, targetNetworking: 3 },
    progress: { applications: 0, dsa: 0, networking: 0 }
  };

  const totalProgress = 
    (calculatePercentage(safeData.progress.applications, safeData.goal.targetApplications) +
    calculatePercentage(safeData.progress.dsa, safeData.goal.targetDSA) +
    calculatePercentage(safeData.progress.networking, safeData.goal.targetNetworking)) / 3;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Target className="text-[#00f0ff] w-8 h-8" />
            Goal Setting Engine
          </h1>
          <p className="text-slate-400">Track your weekly progress and build unstoppable momentum.</p>
        </div>
        
        {isEditing ? (
          <div className="flex gap-3">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              Cancel
            </button>
            <button onClick={handleSave} disabled={updateMutation.isPending} className="btn-primary">
              {updateMutation.isPending ? 'Saving...' : <><Check className="w-4 h-4 mr-2" /> Save Goals</>}
            </button>
          </div>
        ) : (
          <button onClick={handleEditOpen} className="btn-primary">
            <Edit2 className="w-4 h-4 mr-2" /> Edit Targets
          </button>
        )}
      </header>

      {isEditing && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-6 rounded-2xl border border-[#00f0ff]/30 mb-8 bg-[#00f0ff]/5"
        >
          <h3 className="text-lg font-bold text-white mb-4">Set Your Weekly Targets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Weekly Applications</label>
              <input type="number" min="0" value={editForm.targetApplications} onChange={(e) => setEditForm({...editForm, targetApplications: Number(e.target.value)})} className="input-field text-lg font-bold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Weekly DSA Problems</label>
              <input type="number" min="0" value={editForm.targetDSA} onChange={(e) => setEditForm({...editForm, targetDSA: Number(e.target.value)})} className="input-field text-lg font-bold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Weekly Networking Contacts</label>
              <input type="number" min="0" value={editForm.targetNetworking} onChange={(e) => setEditForm({...editForm, targetNetworking: Number(e.target.value)})} className="input-field text-lg font-bold" />
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressBar 
          title="Job Applications" progress={safeData.progress.applications} target={safeData.goal.targetApplications} icon={Briefcase}
          color={{ bg: 'bg-blue-500/10', text: 'text-[#00f0ff]', fill: 'bg-gradient-to-r from-blue-600 to-[#00f0ff]', border: 'border-blue-500/20' }}
        />
        <ProgressBar 
          title="DSA Practice" progress={safeData.progress.dsa} target={safeData.goal.targetDSA} icon={Code}
          color={{ bg: 'bg-violet-500/10', text: 'text-violet-400', fill: 'bg-gradient-to-r from-purple-600 to-violet-400', border: 'border-violet-500/20' }}
        />
        <ProgressBar 
          title="Cold Outreach" progress={safeData.progress.networking} target={safeData.goal.targetNetworking} icon={Users}
          color={{ bg: 'bg-amber-500/10', text: 'text-amber-400', fill: 'bg-gradient-to-r from-orange-500 to-amber-400', border: 'border-amber-500/20' }}
        />
      </div>

      <div className="mt-8 glass-card p-8 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="w-20 h-20 rounded-full bg-[#13141f] flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] relative z-10">
          <TrendingUp className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-2">Keep up the momentum!</h3>
          <p className="text-slate-400 leading-relaxed text-lg">
            Small consistent steps every week lead to massive results over time. You are currently hitting 
            <strong className="text-emerald-400 mx-1"> {Math.round(totalProgress || 0)}% </strong> 
            of your total goals this week.
          </p>
        </div>
      </div>

      <div className="mt-8 glass-card p-8 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-[0.03] transform translate-x-1/4 -translate-y-1/4">
          <Target className="w-96 h-96 text-white" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-4 relative z-10">Why Weekly Goals?</h3>
        <p className="text-slate-300 max-w-4xl relative z-10 leading-relaxed text-lg">
          Consistency is the secret weapon in job hunting. Instead of cramming 50 applications in one day and burning out, 
          aim for a steady pace. Hitting small weekly targets compounds over time, leading to better interview 
          performance and higher quality applications. 
        </p>
        <div className="mt-8 inline-flex items-center text-[#00f0ff] font-medium bg-[#00f0ff]/10 px-6 py-3 rounded-xl relative z-10 border border-[#00f0ff]/20 text-lg italic shadow-inner">
          "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time."
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
