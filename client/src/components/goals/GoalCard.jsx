import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit2, Check, Plus, Calendar, History, Undo, TrendingUp, Lightbulb, MessageSquare, X, Pin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import GoalHistoryChart from './GoalHistoryChart';
import SlotSuggestionModal from './SlotSuggestionModal';

const defaultResources = [
  { id: '1', title: 'NeetCode', category: 'DSA', url: 'https://neetcode.io/', icon: 'Code', color: 'text-emerald-400' },
  { id: '2', title: 'Roadmap.sh', category: 'Web Dev', url: 'https://roadmap.sh/', icon: 'Monitor', color: 'text-blue-400' },
  { id: '3', title: 'ByteByteGo', category: 'System Design', url: 'https://bytebytego.com/', icon: 'Server', color: 'text-purple-400' },
  { id: '4', title: 'Pramp', category: 'Interview Prep', url: 'https://www.pramp.com/', icon: 'Briefcase', color: 'text-[#ff6b00]' }
];

const getResourceForGoal = (moduleName, title) => {
  if (moduleName === 'dsa_tracker' || title.toLowerCase().includes('dsa')) return defaultResources[0];
  if (moduleName === 'applications') return defaultResources[1];
  if (title.toLowerCase().includes('interview') || title.toLowerCase().includes('mock')) return defaultResources[3];
  if (title.toLowerCase().includes('system design')) return defaultResources[2];
  return null;
};

const GoalCard = ({ goal, getIcon, onEdit, hasAcademicConflict }) => {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [dismissedSuggestion, setDismissedSuggestion] = useState(
    localStorage.getItem(`dismissed_suggestions_${goal._id}`)
  );
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);

  const { data: insightsData } = useQuery({
    queryKey: ['goalInsights', goal._id],
    queryFn: async () => {
      const { data } = await api.get(`/goals/${goal._id}/insights`);
      return data;
    },
    staleTime: 1000 * 60 * 60 // 1 hour
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['goalSuggestions', goal._id],
    queryFn: async () => {
      const { data } = await api.get(`/goals/${goal._id}/suggestions`);
      return data;
    },
    staleTime: 1000 * 60 * 60
  });

  const progressMutation = useMutation({
    mutationFn: async ({ amount, note }) => {
      return await api.post(`/goals/${goal._id}/progress`, { amount, note: note || 'Manual log from Goals page' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['dashboard']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to log progress');
    }
  });

  const undoMutation = useMutation({
    mutationFn: async (entryId) => {
      return await api.delete(`/goals/progress/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['dashboard']);
      toast.success('Progress undone');
    }
  });

  const feedbackMutation = useMutation({
    mutationFn: async ({ snapshotId, feedback }) => {
      return await api.post(`/goals/snapshots/${snapshotId}/feedback`, { feedback });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['goalSuggestions', goal._id]);
      toast.success('Feedback recorded');
    }
  });

  const updateTargetMutation = useMutation({
    mutationFn: async (newTarget) => {
      return await api.put(`/goals/${goal._id}`, { target_value: newTarget });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      queryClient.invalidateQueries(['goalSuggestions', goal._id]);
      toast.success('Target updated');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status) => {
      return await api.put(`/goals/${goal._id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
      toast.success('Goal updated');
    }
  });

  const handleLogProgress = () => {
    progressMutation.mutate({ amount: 1 });
    toast.success('+1 Logged', { icon: '✅', duration: 1500 });
  };

  const handlePause = () => {
    updateStatusMutation.mutate('paused');
  };

  const updatePinnedMutation = useMutation({
    mutationFn: async (pinned) => {
      return await api.put(`/goals/${goal._id}`, { pinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['goals']);
    }
  });

  const handleTogglePin = () => {
    updatePinnedMutation.mutate(!goal.pinned);
  };

  const handleDismissSuggestion = () => {
    const timestamp = Date.now().toString();
    localStorage.setItem(`dismissed_suggestions_${goal._id}`, timestamp);
    setDismissedSuggestion(timestamp);
  };

  const handleApplySuggestion = (suggestedValue) => {
    updateTargetMutation.mutate(suggestedValue);
    handleDismissSuggestion();
  };

  const isComplete = goal.currentProgress >= goal.target_value;
  const percentage = Math.min((goal.currentProgress / goal.target_value) * 100, 100);
  const lastManualEntry = goal.entries?.find(e => e.source === 'manual_adjustment');

  const suggestedValue = suggestionsData?.adaptiveTarget?.suggestedTarget;
  const isSuggestionCoolingDown = dismissedSuggestion && (Date.now() - parseInt(dismissedSuggestion)) < 7 * 24 * 60 * 60 * 1000;
  const showSuggestion = suggestedValue && suggestedValue !== goal.target_value && !isSuggestionCoolingDown && goal.status === 'active';

  const isHistoricallyBehindPace = goal.status === 'active' && 
                       goal.period === 'weekly' && 
                       insightsData?.recentPacing?.trend === 'behind' && 
                       insightsData?.recentPacing?.expectedPace > goal.currentProgress;

  const isNetworking = goal.linked_module === 'networking' || goal.title.toLowerCase().includes('outreach') || goal.title.toLowerCase().includes('network');
  
  const [suggestedCompany] = useState(() => {
    if (user?.targetCompanies?.length > 0) {
      return user.targetCompanies[Math.floor(Math.random() * user.targetCompanies.length)];
    }
    return null;
  });

  const resource = getResourceForGoal(goal.linked_module, goal.title);

  // 1. Daily Pacing Breakdown
  const getPacing = (period) => {
    const now = new Date();
    let daysElapsed = 0;
    let daysInPeriod = 7;
    
    if (period === 'weekly') {
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      daysElapsed = dayOfWeek;
      daysInPeriod = 7;
    } else if (period === 'monthly') {
      daysElapsed = now.getDate();
      daysInPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }
    return { daysElapsed, daysInPeriod };
  };

  const { daysElapsed, daysInPeriod } = getPacing(goal.period);
  const expectedPace = Math.ceil((goal.target_value / daysInPeriod) * daysElapsed);
  const pacePercentage = Math.min((expectedPace / goal.target_value) * 100, 100);
  const isBehindPace = goal.currentProgress < expectedPace && goal.status === 'active';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 rounded-2xl border flex flex-col ${goal.status === 'paused' ? 'border-amber-500/20 opacity-75' : 'border-white/5'}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-[#00f0ff]">
            {getIcon(goal.icon)}
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {goal.title}
              {goal.status === 'paused' && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Paused</span>}
            </h3>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {goal.period} Target: {goal.target_value}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg transition-colors ${goal.pinned ? 'text-[#00f0ff] bg-[#00f0ff]/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
            title={goal.pinned ? "Unpin goal" : "Pin goal to top"}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onEdit(goal)}
            className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title="Edit goal"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 mb-4">
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
        <div className="relative w-full h-2 bg-[#13141f] rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`h-full ${isComplete ? 'bg-emerald-500' : 'bg-[#00f0ff]'}`}
          />
          {goal.status === 'active' && !isComplete && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10"
              style={{ left: `${pacePercentage}%` }}
              title={`Pace for today: ${expectedPace}`}
            />
          )}
        </div>
        {goal.status === 'active' && !isComplete && (
          <div className="flex justify-between mt-1.5">
            <span className={`text-[10px] ${isBehindPace ? 'text-amber-400' : 'text-slate-500'}`}>
              Pace for today: {expectedPace}
            </span>
          </div>
        )}
      </div>

      {isBehindPace && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setIsSlotModalOpen(true)}
            className="flex-1 py-1.5 px-3 bg-white/5 hover:bg-white/10 text-xs text-white font-medium rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" /> Find time for this
          </button>
          {getResourceForGoal(goal.linked_module, goal.title) && (
            <a
              href={getResourceForGoal(goal.linked_module, goal.title).url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 px-3 bg-white/5 hover:bg-white/10 text-xs text-white font-medium rounded-lg border border-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5 text-emerald-400" /> Need a resource?
            </a>
          )}
        </div>
      )}

      {/* Academic Conflict Suggestion */}
      {hasAcademicConflict && goal.status === 'active' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 overflow-hidden"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex gap-2">
              <Calendar className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
              <p className="text-xs text-white/90 leading-relaxed">You have an exam/academic week coming up. Want to pause this goal until next week?</p>
            </div>
          </div>
          <div className="mt-2 ml-6 flex gap-2">
            <button 
              onClick={handlePause}
              disabled={updateStatusMutation.isPending}
              className="text-[11px] font-bold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-2.5 py-1 rounded-md transition-colors"
            >
              Pause Goal
            </button>
          </div>
        </motion.div>
      )}

      {/* Target-Company Outreach Suggestion */}
      {isNetworking && isBehindPace && suggestedCompany && goal.status === 'active' && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 overflow-hidden"
        >
          <div className="flex justify-between items-start gap-2">
            <div className="flex gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <p className="text-xs text-white/90 leading-relaxed">
                Haven't reached out to <strong>{suggestedCompany}</strong> yet — want to log that?
              </p>
            </div>
          </div>
          <div className="mt-2 ml-6 flex gap-2">
            <button 
              onClick={() => {
                progressMutation.mutate({ amount: 1, note: `Outreach to ${suggestedCompany}` });
                toast.success(`Logged outreach to ${suggestedCompany}`);
              }}
              disabled={progressMutation.isPending}
              className="text-[11px] font-bold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 px-2.5 py-1 rounded-md transition-colors"
            >
              Log +1 for {suggestedCompany}
            </button>
          </div>
        </motion.div>
      )}

      {/* Adaptive Target Suggestion */}
      <AnimatePresence>
        {showSuggestion && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-xl p-3 overflow-hidden"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex gap-2">
                <Lightbulb className="w-4 h-4 text-[#00f0ff] mt-0.5 shrink-0" />
                <p className="text-xs text-white/90 leading-relaxed">{suggestionsData.suggestion}</p>
              </div>
              <button onClick={handleDismissSuggestion} className="text-slate-500 hover:text-white shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2 ml-6 flex gap-2">
              <button 
                onClick={() => handleApplySuggestion(suggestionsData.suggestedValue)}
                className="text-[11px] font-bold bg-[#00f0ff]/10 text-[#00f0ff] hover:bg-[#00f0ff]/20 px-2.5 py-1 rounded-md transition-colors"
              >
                Apply Target
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outcome Correlation Insights */}
      {insightsData?.message && (
        <div className="mb-4 bg-white/5 rounded-xl p-3 flex gap-2 items-start border border-white/5">
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {insightsData.message}
          </p>
        </div>
      )}

      {/* Weekly Reflection Prompt */}
      {goal.needsReflection && (
        <div className="mb-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
          <div className="flex gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-white/90">How did this target feel this past period?</p>
          </div>
          <div className="flex gap-2 ml-6">
            <button 
              onClick={() => feedbackMutation.mutate({ snapshotId: goal.needsReflection, feedback: 'too_easy' })}
              className="flex-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded transition-colors"
            >
              Too easy
            </button>
            <button 
              onClick={() => feedbackMutation.mutate({ snapshotId: goal.needsReflection, feedback: 'just_right' })}
              className="flex-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded transition-colors"
            >
              Just right
            </button>
            <button 
              onClick={() => feedbackMutation.mutate({ snapshotId: goal.needsReflection, feedback: 'too_much' })}
              className="flex-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-white px-2 py-1 rounded transition-colors"
            >
              Too much
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto space-y-4">
        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex flex-col">
            <button 
              onClick={handleLogProgress}
              disabled={progressMutation.isPending || goal.status === 'paused'}
              className="text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-white transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Log +1
            </button>
            {lastManualEntry && (
              <button 
                onClick={() => undoMutation.mutate(lastManualEntry._id)}
                className="text-[10px] text-slate-500 hover:text-red-400 mt-2 flex items-center gap-1 transition-colors"
                title={`Undo last manual log from ${new Date(lastManualEntry.logged_at).toLocaleTimeString()}`}
              >
                <Undo className="w-3 h-3" /> Undo last log
              </button>
            )}
          </div>
          
          <div className="text-right">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
              <History className="w-3 h-3 inline mr-1" /> History Trend
            </span>
            <div className="w-24">
              <GoalHistoryChart history={goal.history} period={goal.period} />
            </div>
          </div>
        </div>
      </div>

      <SlotSuggestionModal 
        isOpen={isSlotModalOpen} 
        onClose={() => setIsSlotModalOpen(false)} 
        goal={goal} 
      />
    </motion.div>
  );
};

export default GoalCard;
