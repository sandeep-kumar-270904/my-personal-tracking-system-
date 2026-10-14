import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, FileText, AlertTriangle, X, CheckCircle, Flame } from 'lucide-react';

const WeeklyHonestReport = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
        >
          <div className="p-8 pb-0">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Weekly Honest Report</h2>
            <p className="text-gray-400">Week of October 14th — No sugarcoating.</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Mechanic 12: Progress Story */}
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6">
              <h3 className="text-indigo-400 font-bold flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5" /> Your Trajectory
              </h3>
              <p className="text-gray-200 leading-relaxed font-medium">
                A month ago, you were struggling with <span className="text-white font-bold bg-gray-800 px-2 py-0.5 rounded">Tree BFS</span>. You couldn't identify the queue structure. This week, you solved 3 BFS mediums under 20 minutes each. It is now your top 3 strongest pattern.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-500" /> What Worked
                </h4>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> You finally stopped looking at solutions before 20 minutes passed.
                  </li>
                  <li className="flex gap-3 text-sm text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> Logged 14 problems, your highest yet.
                  </li>
                </ul>
              </div>

              <div className="bg-rose-900/10 border border-rose-500/20 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> The Brutal Truth
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed">
                  You are actively avoiding Dynamic Programming. You haven't touched a DP problem in 12 days, despite it appearing in 40% of Amazon interviews. Your avoidance lock will engage if you don't face it soon.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-800/50 border-t border-gray-800 flex justify-end">
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Message Received. Let's work.
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WeeklyHonestReport;
