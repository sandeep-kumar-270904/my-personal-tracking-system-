import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Save, Clock, Trash2, Pause, Play, AlertTriangle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const GoalEditModal = ({ isOpen, onClose, goalToEdit, onSaveSuccess }) => {
  const queryClient = useQueryClient();
  const isNew = !goalToEdit;
  
  const [formData, setFormData] = useState({
    title: '',
    target_value: 5,
    period: 'weekly',
    tracking_mode: 'manual',
    linked_module: '',
    status: 'active'
  });

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setFormData({
          title: goalToEdit.title,
          target_value: goalToEdit.target_value,
          period: goalToEdit.period,
          tracking_mode: goalToEdit.tracking_mode,
          linked_module: goalToEdit.linked_module || '',
          status: goalToEdit.status
        });
      } else {
        setFormData({
          title: '',
          target_value: 5,
          period: 'weekly',
          tracking_mode: 'manual',
          linked_module: '',
          status: 'active'
        });
      }
    }
  }, [isOpen, goalToEdit]);

  const { data: benchmarkData } = useQuery({
    queryKey: ['benchmarks'],
    queryFn: async () => {
      const { data } = await api.get('/benchmarks');
      return data;
    },
    enabled: isOpen,
    retry: false
  });

  let cohortAverage = null;
  if (benchmarkData && formData.linked_module && formData.period === 'weekly') {
    if (formData.linked_module === 'applications') cohortAverage = benchmarkData.avgGoalTargetApps;
    if (formData.linked_module === 'dsa_tracker') cohortAverage = benchmarkData.avgGoalTargetDSA;
    if (formData.linked_module === 'networking') cohortAverage = benchmarkData.avgGoalTargetNetwork;
  }

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        linked_module: data.linked_module || null,
        icon: data.linked_module === 'applications' ? 'briefcase' : 
              data.linked_module === 'dsa_tracker' ? 'code' : 
              data.linked_module === 'networking' ? 'users' : 'target'
      };
      if (data.linked_module) {
        payload.tracking_mode = 'hybrid';
      }

      if (isNew) {
        return await api.post('/goals', payload);
      } else {
        return await api.put(`/goals/${goalToEdit._id}`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success(isNew ? 'Goal created' : 'Goal updated');
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save goal');
    }
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/goals/${goalToEdit._id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Goal archived');
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.error('Title is required');
    if (formData.target_value < 1) return toast.error('Target must be at least 1');
    saveMutation.mutate(formData);
  };

  const handleArchive = () => {
    if (window.confirm('Archive this goal? History will be preserved, but it will no longer track new progress.')) {
      archiveMutation.mutate();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#13141f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-[#00f0ff]" />
              {isNew ? 'Create New Goal' : 'Edit Goal'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="goal-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Goal Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-[#1a1b26] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#00f0ff]/50"
                  placeholder="e.g. Mock Interviews"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.target_value}
                    onChange={e => setFormData({...formData, target_value: parseInt(e.target.value) || 1})}
                    className="w-full bg-[#1a1b26] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#00f0ff]/50"
                  />
                  {cohortAverage > 0 && (
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      Cohort average: <span className="text-white font-medium">{cohortAverage.toFixed(1)}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Period</label>
                  <select
                    value={formData.period}
                    onChange={e => setFormData({...formData, period: e.target.value})}
                    className="w-full bg-[#1a1b26] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#00f0ff]/50"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Tracking Source</label>
                <select
                  value={formData.linked_module}
                  onChange={e => setFormData({...formData, linked_module: e.target.value})}
                  className="w-full bg-[#1a1b26] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-[#00f0ff]/50"
                >
                  <option value="">Manual Only</option>
                  <option value="applications">Applications Tracker</option>
                  <option value="dsa_tracker">DSA Tracker</option>
                  <option value="networking">Networking Module</option>
                </select>
                <p className="mt-2 text-xs text-slate-500">
                  {formData.linked_module 
                    ? `Activity in the ${formData.linked_module.replace('_', ' ')} module will automatically progress this goal. You can still manually add entries.`
                    : 'You will need to manually log progress for this goal.'}
                </p>
              </div>

              {!isNew && (
                <div className="pt-4 border-t border-white/5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, status: formData.status === 'active' ? 'paused' : 'active'})}
                    className={`flex-1 py-2 px-3 rounded-xl border font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                      formData.status === 'active' 
                        ? 'border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20' 
                        : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    }`}
                  >
                    {formData.status === 'active' ? <><Pause className="w-4 h-4"/> Pause Goal</> : <><Play className="w-4 h-4"/> Resume Goal</>}
                  </button>
                  <button
                    type="button"
                    onClick={handleArchive}
                    className="flex-1 py-2 px-3 rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4"/> Archive
                  </button>
                </div>
              )}
              
            </form>
          </div>

          <div className="p-5 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="goal-form"
              disabled={saveMutation.isPending}
              className="px-5 py-2 rounded-xl text-sm font-bold bg-[#00f0ff] hover:bg-[#00d0e0] text-[#13141f] transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Goal'}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GoalEditModal;
