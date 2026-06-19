import React from 'react';
import { X, Zap, TrendingUp, AlertTriangle, Flag, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InsightsPanel({ insights, onDismiss }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 text-center text-gray-500 h-full">
        <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
        <h3 className="font-bold text-gray-400 mb-1">No insights yet</h3>
        <p className="text-sm">Log your first interview debrief to generate AI-driven insights about your performance.</p>
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'STRENGTH': return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'WEAKNESS': return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      case 'PATTERN': return <TrendingUp className="w-5 h-5 text-indigo-400" />;
      case 'IMPROVEMENT': return <Target className="w-5 h-5 text-blue-400" />;
      case 'MILESTONE': return <Flag className="w-5 h-5 text-amber-400" />;
      default: return <Zap className="w-5 h-5 text-gray-400" />;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'STRENGTH': return 'border-emerald-500/30 bg-emerald-500/10';
      case 'WEAKNESS': return 'border-rose-500/30 bg-rose-500/10';
      case 'PATTERN': return 'border-indigo-500/30 bg-indigo-500/10';
      case 'IMPROVEMENT': return 'border-blue-500/30 bg-blue-500/10';
      case 'MILESTONE': return 'border-amber-500/30 bg-amber-500/10';
      default: return 'border-gray-800 bg-gray-900';
    }
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 h-full">
      <h3 className="font-bold text-white mb-4 flex items-center">
        <Zap className="w-5 h-5 mr-2 text-indigo-400" />
        Interview Insights
      </h3>
      <div className="space-y-4">
        <AnimatePresence>
          {insights.map(insight => (
            <motion.div
              key={insight._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0, overflow: 'hidden' }}
              className={`relative p-4 rounded-xl border ${getColor(insight.insightType)}`}
            >
              <div className="flex items-start">
                <div className="mr-3 mt-0.5">{getIcon(insight.insightType)}</div>
                <div className="flex-1 pr-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-300 opacity-70 mb-1 block">
                    {insight.insightType}
                  </span>
                  <p className="text-sm text-gray-100 leading-relaxed">{insight.content}</p>
                </div>
                <button 
                  onClick={() => onDismiss(insight._id)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
