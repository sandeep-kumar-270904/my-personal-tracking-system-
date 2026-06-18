import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Edit2, X } from 'lucide-react';

const GoalRing = ({ label, target, completed, colorClass, strokeColor }) => {
  const percentage = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center mb-3">
        {/* Background track */}
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-white/5"
          />
          {/* Animated fill */}
          <motion.circle
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            cx="48"
            cy="48"
            r={radius}
            stroke={strokeColor}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{percentage}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-sm font-bold tracking-wide ${colorClass}`}>{label}</p>
        <p className="text-xs text-slate-400 font-medium mt-1">{completed} / {target}</p>
      </div>
    </div>
  );
};

const GoalRings = ({ goalsData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const applicationsTarget = goalsData?.applicationsTarget || 10;
  const applicationsCompleted = goalsData?.applicationsCompleted || 0;
  const dsaTarget = goalsData?.dsaTarget || 5;
  const dsaCompleted = goalsData?.dsaCompleted || 0;
  const networkingTarget = goalsData?.networkingTarget || 3;
  const networkingCompleted = goalsData?.networkingCompleted || 0;

  const [form, setForm] = useState({
    applicationsTarget,
    dsaTarget,
    networkingTarget
  });

  const mutation = useMutation({
    mutationFn: (newTargets) => api.put('/goals', newTargets),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboardData']);
      setIsEditing(false);
      toast.success('Weekly targets updated');
    },
    onError: () => {
      toast.error('Failed to update targets');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({
      applicationsTarget: Number(form.applicationsTarget),
      dsaTarget: Number(form.dsaTarget),
      networkingTarget: Number(form.networkingTarget),
    });
  };

  return (
    <div className="mb-8 glass-card p-6 rounded-2xl border border-white/5 relative">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-white">Weekly Goals Progress</h3>
        <button 
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg"
        >
          <Edit2 className="w-4 h-4" /> Edit Targets
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GoalRing 
          label="JOB APPLICATIONS" 
          target={applicationsTarget} 
          completed={applicationsCompleted} 
          colorClass="text-[#ff6b00]" 
          strokeColor="#ff6b00" 
        />
        <GoalRing 
          label="DSA PRACTICE" 
          target={dsaTarget} 
          completed={dsaCompleted} 
          colorClass="text-purple-500" 
          strokeColor="#a855f7" 
        />
        <GoalRing 
          label="COLD OUTREACH" 
          target={networkingTarget} 
          completed={networkingCompleted} 
          colorClass="text-teal-400" 
          strokeColor="#2dd4bf" 
        />
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm rounded-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-2xl border border-white/10 w-full max-w-md relative"
          >
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Edit Weekly Targets</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Applications Target</label>
                <input 
                  type="number" 
                  min="1"
                  value={form.applicationsTarget}
                  onChange={(e) => setForm({...form, applicationsTarget: e.target.value})}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#ff6b00]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">DSA Problems Target</label>
                <input 
                  type="number" 
                  min="1"
                  value={form.dsaTarget}
                  onChange={(e) => setForm({...form, dsaTarget: e.target.value})}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#ff6b00]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Networking Target</label>
                <input 
                  type="number" 
                  min="1"
                  value={form.networkingTarget}
                  onChange={(e) => setForm({...form, networkingTarget: e.target.value})}
                  className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#ff6b00]"
                />
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={mutation.isLoading}
                  className="w-full bg-gradient-to-r from-[#ff6b00] to-[#ff4500] text-white font-bold py-2 rounded-lg hover:shadow-[0_0_15px_rgba(255,107,0,0.4)] transition-all"
                >
                  {mutation.isLoading ? 'Saving...' : 'Save Targets'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GoalRings;
