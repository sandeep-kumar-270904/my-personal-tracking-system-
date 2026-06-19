import React, { useState } from 'react';
import { Ghost, EyeOff, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';

const MOCK_DRILL = {
  id: 'd1',
  description: 'You are given an array of integers representing the daily temperatures. Return an array such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature.',
  options: ['Two Pointers', 'Monotonic Stack', 'Binary Search', 'Sliding Window'],
  correct: 'Monotonic Stack',
  explanation: 'You need to find the "next greater element". A Monotonic Stack keeps track of elements that haven\'t found their "next greater" yet.'
};

const PatternDisguiseDrill = () => {
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = async (opt) => {
    setSelected(opt);
    setShowResult(true);
    try {
      await api.post('/dsa/pattern-disguise/submit', {
        drillId: MOCK_DRILL.id,
        selectedPattern: opt,
        isCorrect: opt === MOCK_DRILL.correct
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Ghost className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Pattern Disguise Drill</h2>
      </div>
      <p className="text-sm text-gray-400 mb-6 relative z-10">Read the problem description. Do not code. Just identify the underlying pattern.</p>

      <div className="bg-gray-800/80 p-5 rounded-xl border border-gray-700 mb-6 relative z-10">
        <EyeOff className="w-5 h-5 text-gray-500 mb-2" />
        <p className="text-gray-200 font-medium leading-relaxed">"{MOCK_DRILL.description}"</p>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        {MOCK_DRILL.options.map((opt) => (
          <button
            key={opt}
            disabled={showResult}
            onClick={() => handleSelect(opt)}
            className={`p-3 rounded-xl border text-sm font-bold transition-all ${showResult ? (opt === MOCK_DRILL.correct ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400' : selected === opt ? 'bg-rose-900/20 border-rose-500 text-rose-400' : 'bg-gray-800/50 border-gray-700 text-gray-500') : 'bg-gray-800 border-gray-700 hover:border-indigo-500 text-gray-300'}`}
          >
            {opt}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-xl relative z-10"
          >
            <h4 className="flex items-center gap-2 font-bold text-white mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-400" /> Insight
            </h4>
            <p className="text-sm text-indigo-200">{MOCK_DRILL.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatternDisguiseDrill;
