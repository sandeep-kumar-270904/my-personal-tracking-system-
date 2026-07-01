import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, TrendingUp, Users, Target, Clock, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const InsightsPanel = ({ insights, onDismiss }) => {
  if (!insights || insights.length === 0) return null;

  const getIcon = (type) => {
    switch(type) {
      case 'RELATIONSHIP_DECAY': return <Clock size={16} className="text-amber-400" />;
      case 'COMPANY_COVERAGE': return <Target size={16} className="text-red-400" />;
      case 'RESPONSE_RATE': return <TrendingUp size={16} className="text-blue-400" />;
      case 'WEAK_TIE_OPPORTUNITY': return <Users size={16} className="text-emerald-400" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  const getPriorityBorder = (priority) => {
    switch(priority) {
      case 'HIGH': return 'border-red-500/30 bg-red-500/5';
      case 'MEDIUM': return 'border-amber-500/30 bg-amber-500/5';
      case 'LOW': return 'border-blue-500/30 bg-blue-500/5';
      default: return 'border-white/10 bg-white/5';
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 px-2">Networking Insights</h3>
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence>
          {insights.map(insight => (
            <motion.div
              key={insight._id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative p-3 rounded-lg border ${getPriorityBorder(insight.priority)}`}
            >
              <button 
                onClick={() => onDismiss(insight._id)}
                className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
              
              <div className="flex gap-3">
                <div className="mt-0.5 shrink-0">
                  {getIcon(insight.insightType)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      insight.priority === 'HIGH' ? 'text-red-400' : 
                      insight.priority === 'MEDIUM' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      {insight.priority} PRIORITY
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mb-2">{insight.content}</p>
                  {insight.actionableStep && (
                    <p className="text-xs text-slate-400 border-t border-white/5 pt-2 mb-2">
                      <span className="font-semibold text-slate-300">Action:</span> {insight.actionableStep}
                    </p>
                  )}
                  {insight.insightType === 'REJECTION_STREAK' && (
                    <button 
                      onClick={() => {
                        toast.success('Opening Rejection Protocol...');
                        document.dispatchEvent(new CustomEvent('open-diagnosis-modal'));
                      }}
                      className="w-full mt-2 py-1.5 text-[10px] uppercase font-bold tracking-wider bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
                    >
                      Run Diagnosis Protocol
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InsightsPanel;
