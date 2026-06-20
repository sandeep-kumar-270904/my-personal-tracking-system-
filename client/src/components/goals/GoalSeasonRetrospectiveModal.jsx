import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Calendar, CheckCircle2, TrendingUp, X, Award, Zap } from 'lucide-react';

const GoalSeasonRetrospectiveModal = ({ isOpen, onClose, goals }) => {
  if (!isOpen) return null;

  // Aggregate stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.currentProgress >= g.target_value).length;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  
  const totalActionsLogged = goals.reduce((acc, goal) => acc + goal.currentProgress, 0);

  // Find most consistent category (naive implementation based on total actions)
  let categoryStats = {};
  goals.forEach(g => {
    const cat = g.linked_module || 'custom';
    if (!categoryStats[cat]) categoryStats[cat] = 0;
    categoryStats[cat] += g.currentProgress;
  });

  const bestCategory = Object.entries(categoryStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const formatCategory = (cat) => cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#13141f] border border-white/10 p-8 rounded-2xl w-full max-w-lg relative shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#00f0ff]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#00f0ff]/20">
              <Award className="w-8 h-8 text-[#00f0ff]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Season Retrospective</h3>
            <p className="text-slate-400">Your placement prep journey by the numbers.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
              <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{completionRate}%</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Completion Rate</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
              <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">{totalActionsLogged}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Actions Logged</div>
            </div>
          </div>

          <div className="bg-[#00f0ff]/5 border border-[#00f0ff]/10 p-5 rounded-xl mb-6">
            <h4 className="text-[#00f0ff] font-bold mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Strongest Area
            </h4>
            <p className="text-slate-300 text-sm">
              You've generated the most momentum in <strong>{formatCategory(bestCategory)}</strong> this season. Keep leveraging this strength while balancing other areas.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Goal Breakdown</h4>
            <div className="space-y-3">
              {goals.map(goal => {
                const isHit = goal.currentProgress >= goal.target_value;
                return (
                  <div key={goal._id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      {isHit ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />
                      )}
                      <span className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{goal.title}</span>
                    </div>
                    <span className="text-sm font-bold text-white">
                      {goal.currentProgress} <span className="text-slate-500 text-xs">/ {goal.target_value}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                // Future expansion: PDF Generation
                window.print();
              }}
              className="text-sm font-bold text-[#00f0ff] hover:text-[#00c0cc] transition-colors"
            >
              Export Summary
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default GoalSeasonRetrospectiveModal;
