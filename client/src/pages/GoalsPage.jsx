import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Edit2, Check, TrendingUp, Briefcase, Code, Users } from 'lucide-react';
import api from '../services/api';

const GoalsPage = () => {
  const [data, setData] = useState({
    goal: {
      targetApplications: 10,
      targetDSA: 5,
      targetNetworking: 3
    },
    progress: {
      applications: 0,
      dsa: 0,
      networking: 0
    }
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    targetApplications: 10,
    targetDSA: 5,
    targetNetworking: 3
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      if (res.data) {
        setData(res.data);
        setEditForm({
          targetApplications: res.data.goal.targetApplications,
          targetDSA: res.data.goal.targetDSA,
          targetNetworking: res.data.goal.targetNetworking
        });
      }
    } catch (error) {
      console.error('Failed to fetch goals', error);
    }
  };

  const handleSave = async () => {
    try {
      await api.put('/goals', editForm);
      setIsEditing(false);
      fetchGoals();
    } catch (error) {
      console.error('Failed to update goals', error);
    }
  };

  const calculatePercentage = (progress, target) => {
    if (target === 0) return 0;
    const percentage = (progress / target) * 100;
    return percentage > 100 ? 100 : percentage;
  };

  const ProgressBar = ({ title, progress, target, icon: Icon, color }) => {
    const percentage = calculatePercentage(progress, target);
    const isComplete = progress >= target;

    return (
      <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        {isComplete && (
          <div className="absolute top-0 right-0 p-4">
            <span className="flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
              <Check className="w-3 h-3 mr-1" /> Target Hit!
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-4 mb-4">
          <div className={`p-3 rounded-xl ${color.bg} ${color.text}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400">Weekly Target: {target}</p>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-end mb-2">
            <span className="text-3xl font-bold text-white">{progress} <span className="text-sm font-normal text-slate-400">completed</span></span>
            <span className="text-sm font-medium text-slate-400">{Math.round(percentage)}%</span>
          </div>
          <div className="w-full h-3 bg-[#13141f] rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${color.fill}`}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 w-full max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Target className="text-[#ff6b00] w-8 h-8" />
            Goal Setting Engine
          </h1>
          <p className="text-slate-400">Track your weekly progress and build unstoppable momentum.</p>
        </div>
        
        {isEditing ? (
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setIsEditing(false);
                setEditForm({
                  targetApplications: data.goal.targetApplications,
                  targetDSA: data.goal.targetDSA,
                  targetNetworking: data.goal.targetNetworking
                });
              }}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary">
              <Check className="w-4 h-4 mr-2" /> Save Goals
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="btn-primary">
            <Edit2 className="w-4 h-4 mr-2" /> Edit Targets
          </button>
        )}
      </header>

      {isEditing && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="glass-card p-6 rounded-2xl border border-[#ff6b00]/30 mb-8 bg-[#ff6b00]/5"
        >
          <h3 className="text-lg font-bold text-white mb-4">Set Your Weekly Targets</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Weekly Applications</label>
              <input 
                type="number" 
                min="0"
                value={editForm.targetApplications}
                onChange={(e) => setEditForm({...editForm, targetApplications: Number(e.target.value)})}
                className="input-field text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Weekly DSA Problems</label>
              <input 
                type="number" 
                min="0"
                value={editForm.targetDSA}
                onChange={(e) => setEditForm({...editForm, targetDSA: Number(e.target.value)})}
                className="input-field text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Weekly Networking</label>
              <input 
                type="number" 
                min="0"
                value={editForm.targetNetworking}
                onChange={(e) => setEditForm({...editForm, targetNetworking: Number(e.target.value)})}
                className="input-field text-lg"
              />
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressBar 
          title="Job Applications"
          progress={data.progress.applications}
          target={data.goal.targetApplications}
          icon={Briefcase}
          color={{ bg: 'bg-blue-500/20', text: 'text-[#00f0ff]', fill: 'bg-blue-500' }}
        />
        <ProgressBar 
          title="DSA Practice"
          progress={data.progress.dsa}
          target={data.goal.targetDSA}
          icon={Code}
          color={{ bg: 'bg-violet-500/20', text: 'text-violet-400', fill: 'bg-violet-500' }}
        />
        <ProgressBar 
          title="Cold Outreach"
          progress={data.progress.networking}
          target={data.goal.targetNetworking}
          icon={Users}
          color={{ bg: 'bg-amber-500/20', text: 'text-amber-400', fill: 'bg-amber-500' }}
        />
      </div>

      <div className="mt-8 glass-card p-8 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 rounded-full bg-[#13141f] flex items-center justify-center shrink-0 border-4 border-white/10">
          <TrendingUp className="w-10 h-10 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Keep up the momentum!</h3>
          <p className="text-slate-400">
            Small consistent steps every week lead to massive results over time. You are currently hitting 
            <strong className="text-white"> {Math.round(((data.progress.applications / (data.goal.targetApplications || 1)) + (data.progress.dsa / (data.goal.targetDSA || 1)) + (data.progress.networking / (data.goal.targetNetworking || 1))) / 3 * 100)}% </strong> 
            of your total goals this week.
          </p>
        </div>
      </div>

      <div className="mt-8 glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <TrendingUp className="w-64 h-64 text-[#ff6b00]" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2 relative z-10">Why Weekly Goals?</h3>
        <p className="text-slate-400 max-w-3xl relative z-10 leading-relaxed">
          Consistency is the secret weapon in job hunting. Instead of cramming 50 applications in one day and burning out, 
          aim for a steady pace. Hitting small daily or weekly targets compounds over time, leading to better interview 
          performance and higher quality applications. 
        </p>
        <div className="mt-6 inline-flex items-center text-[#00f0ff] font-medium bg-[#00f0ff]/10 px-4 py-2 rounded-lg relative z-10 border border-[#00f0ff]/20">
          "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time."
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
