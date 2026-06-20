import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Edit2, Check, TrendingUp, Plus, Briefcase, Code, Users, Zap, Calendar, History, Undo, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import confetti from 'canvas-confetti';
import GoalEditModal from '../components/goals/GoalEditModal';
import GoalHistoryChart from '../components/goals/GoalHistoryChart';
import GoalCard from '../components/goals/GoalCard';
import GoalSeasonRetrospectiveModal from '../components/goals/GoalSeasonRetrospectiveModal';
import { Lightbulb, Info, X } from 'lucide-react';

const fetchGoalsOverview = async () => {
  const { data } = await api.get('/goals');
  return data;
};

const GoalsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRetroModalOpen, setIsRetroModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: fetchGoalsOverview
  });

  const handleAddGoal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const generateShareLinkMutation = useMutation({
    mutationFn: async () => {
      const activeGoals = goals.filter(g => g.status === 'active');
      const { data } = await api.post('/goals/share', { goalIds: activeGoals.map(g => g._id) });
      return data;
    },
    onSuccess: (data) => {
      navigator.clipboard.writeText(`${window.location.origin}${data.link}`);
      toast.success('Share link copied to clipboard!');
    },
    onError: () => toast.error('Failed to generate share link')
  });

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const getMomentumMessage = (momentum, calendarLoad) => {
    if (momentum < 100 && calendarLoad >= 2) {
      return `Applications are behind pace — makes sense with ${calendarLoad} interviews this week. No need to also chase volume right now.`;
    }
    if (momentum === 0) return "Week's just getting started. Ready when you are.";
    if (momentum < 30) return "Gaining traction. A few more reps will keep you on pace.";
    if (momentum < 75) return "Making solid progress. Keep up the consistency.";
    if (momentum < 100) return "Almost there. Just a strong push left to hit your targets.";
    return "Targets hit. Excellent consistency this period.";
  };

  const getIcon = (iconName) => {
    const icons = {
      briefcase: <Briefcase className="w-5 h-5" />,
      code: <Code className="w-5 h-5" />,
      users: <Users className="w-5 h-5" />,
      target: <Target className="w-5 h-5" />
    };
    return icons[iconName] || <Target className="w-5 h-5" />;
  };

  const [dismissedStageMsg, setDismissedStageMsg] = useState(localStorage.getItem('dismissed_stage_msg'));
  const [dismissedPaceMsg, setDismissedPaceMsg] = useState(localStorage.getItem('dismissed_pace_msg'));
  const [dismissedCapacityMsg, setDismissedCapacityMsg] = useState(localStorage.getItem('dismissed_capacity_msg'));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-[#00f0ff] border-t-transparent rounded-full" />
      </div>
    );
  }

  const { 
    goals = [], 
    momentum = 0, 
    streak = 0, 
    calendarLoad = 0, 
    userStage = 'Pre-interview', 
    showPaceCheck = false,
    capacityWarning = null,
    hasAcademicConflict = false
  } = data || {};

  const handleDismissStage = () => {
    localStorage.setItem('dismissed_stage_msg', userStage);
    setDismissedStageMsg(userStage);
  };

  const handleDismissPace = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dismissed_pace_msg', today);
    setDismissedPaceMsg(today);
  };

  const showStageSuggestion = userStage !== 'Pre-interview' && dismissedStageMsg !== userStage;
  const isPaceDismissedToday = dismissedPaceMsg === new Date().toISOString().split('T')[0];

  const handleDismissCapacity = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('dismissed_capacity_msg', today);
    setDismissedCapacityMsg(today);
  };
  const isCapacityDismissedToday = dismissedCapacityMsg === new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
      {/* Header section */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6">
        <div>
          <h1 className="text-[32px] font-bold text-white mb-2 flex items-center gap-3">
            <Target className="text-[#00f0ff] w-8 h-8" />
            Goal Setting Engine
          </h1>
          <p className="text-[15px] text-slate-400 max-w-2xl">
            Honest tracking for your placement preparation. Set weekly or monthly targets and track your real activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsRetroModalOpen(true)}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl border border-white/10 transition-colors flex items-center gap-2 hidden lg:flex"
            title="Season Summary"
          >
            <History className="w-5 h-5" />
            <span>Summary</span>
          </button>
          <button 
            onClick={() => generateShareLinkMutation.mutate()}
            disabled={generateShareLinkMutation.isPending || goals.length === 0}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-white/10 transition-colors flex items-center gap-2"
            title="Share read-only view with accountability partner"
          >
            {generateShareLinkMutation.isPending ? <div className="w-5 h-5 animate-spin border border-white border-t-transparent rounded-full" /> : <Share2 className="w-5 h-5" />}
            <span className="hidden sm:inline">Share</span>
          </button>
          <button 
            onClick={handleAddGoal}
            className="px-4 py-2.5 bg-[#00f0ff] hover:bg-[#00c0cc] text-[#13141f] font-bold rounded-xl shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> <span className="hidden sm:inline">New Target</span>
          </button>
        </div>
      </header>

      {/* Dynamic Momentum Board */}
      <section className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="shrink-0 w-24 h-24 relative flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle 
                  cx="50" cy="50" r="45" fill="none" stroke="#00f0ff" strokeWidth="8"
                  strokeDasharray="283"
                  initial={{ strokeDashoffset: 283 }}
                  animate={{ strokeDashoffset: 283 - (283 * momentum) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{momentum}%</span>
              </div>
            </div>
            
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Current Pace
              </h2>
              <p className="text-lg text-white/90 font-medium leading-relaxed max-w-lg">
                {getMomentumMessage(momentum, calendarLoad)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-orange-400" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-1">{streak} {streak === 1 ? 'Day' : 'Days'}</h3>
          <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">Current Streak</p>
        </div>
      </section>

      {/* Stage-Aware Banner */}
      <AnimatePresence>
        {showStageSuggestion && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-start gap-4"
          >
            <Lightbulb className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-indigo-400">Context: You are in the "{userStage}" stage</h4>
              <p className="text-sm text-slate-300 mt-1">
                {userStage === 'Post-offer' && "You've secured an offer! Consider lowering your application targets and focusing on networking or exploring specific skills for your upcoming role."}
                {userStage === 'Active interview' && "You're getting interviews. It might be wise to pause cold outreach goals and double down on Mock Interviews and Company Research."}
              </p>
            </div>
            <button onClick={handleDismissStage} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Capacity Warning Banner */}
      <AnimatePresence>
        {capacityWarning && !isCapacityDismissedToday && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4"
          >
            <Calendar className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-400">Ambitious Goals This Week</h4>
              <p className="text-sm text-slate-300 mt-1">
                Your active goals demand roughly {capacityWarning.totalGoalHours} hours this week, but your calendar only shows {capacityWarning.freeHours} hours of free time. Consider reducing targets to avoid burnout.
              </p>
            </div>
            <button onClick={handleDismissCapacity} className="text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sustainable Pace Banner */}
      {showPaceCheck && !isPaceDismissedToday && (
        <div className="mb-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex justify-between items-center">
          <div className="flex gap-3 items-center">
            <div className="p-2 bg-emerald-500/10 rounded-full shrink-0">
              <Info className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[13px] text-slate-300">
                You've been consistently active for 3 weeks straight — make sure you're building in rest too.
              </p>
            </div>
          </div>
          <button onClick={handleDismissPace} className="text-slate-500 hover:text-white p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...goals].sort((a, b) => {
          if (a.pinned === b.pinned) return 0;
          return a.pinned ? -1 : 1;
        }).map((goal) => (
          <GoalCard 
            key={goal._id} 
            goal={goal} 
            getIcon={getIcon} 
            onEdit={handleEditGoal} 
            hasAcademicConflict={hasAcademicConflict}
          />
        ))}
      </section>

      {goals.length === 0 && (
        <div className="text-center py-20 text-slate-500 border border-dashed border-white/10 rounded-2xl">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No active goals found. Create one to get started.</p>
        </div>
      )}

      <GoalEditModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        goalToEdit={editingGoal} 
      />

      <GoalSeasonRetrospectiveModal 
        isOpen={isRetroModalOpen} 
        onClose={() => setIsRetroModalOpen(false)} 
        goals={goals} 
      />
    </div>
  );
};

export default GoalsPage;
