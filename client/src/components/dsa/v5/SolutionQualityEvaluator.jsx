import React, { useState } from 'react';
import { Sparkles, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';

const SolutionQualityEvaluator = ({ code, language = 'javascript' }) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const evaluateCode = async () => {
    if (!code || code.trim() === '') return;
    setIsEvaluating(true);
    try {
      const res = await api.post('/dsa/solution-quality', { code, language });
      setEvaluation(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!evaluation && !isEvaluating) {
    return (
      <button 
        onClick={evaluateCode}
        className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold rounded-lg transition-colors flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" /> Evaluate Solution Quality
      </button>
    );
  }

  if (isEvaluating) {
    return (
      <div className="flex items-center gap-2 text-indigo-400 animate-pulse bg-gray-900 border border-gray-800 p-4 rounded-xl">
        <Sparkles className="w-5 h-5 animate-spin" /> Analyzing complexity and readability...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-4 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" /> AI Solution Analysis
        </h3>
        <span className="text-2xl font-bold text-white">{evaluation.qualityScore}/100</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Time Complexity</p>
          <p className="text-lg font-mono text-cyan-400">{evaluation.timeComplexity}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Space Complexity</p>
          <p className="text-lg font-mono text-emerald-400">{evaluation.spaceComplexity}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-gray-300">Feedback</p>
        <ul className="space-y-2">
          {evaluation.feedback.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
              {f.includes('Good') || f.includes('Optimal') ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              )}
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SolutionQualityEvaluator;
