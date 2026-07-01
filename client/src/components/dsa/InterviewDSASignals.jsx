import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const InterviewDSASignals = () => {
  // Use mock data representing extracted signals
  const signals = [
    { topic: 'Dynamic Programming', pattern: '0/1 Knapsack', feedback: 'Struggled to identify state transitions', severity: 'HIGH' },
    { topic: 'Graphs', pattern: 'BFS', feedback: 'Good approach, slow implementation', severity: 'MEDIUM' },
    { topic: 'Arrays', pattern: 'Two Pointers', feedback: 'Optimal solution found quickly', severity: 'LOW' }
  ];

  const getSeverityIcon = (sev) => {
    switch(sev) {
      case 'HIGH': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'MEDIUM': return <TrendingUp className="w-4 h-4 text-amber-400" />;
      case 'LOW': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      default: return null;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Interview Signals</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">Feedback extracted directly from your recent interview debriefs.</p>

      <div className="space-y-3">
        {signals.map((sig, idx) => (
          <div key={idx} className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex gap-3 items-start">
            <div className="mt-0.5">{getSeverityIcon(sig.severity)}</div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-white">{sig.topic}</span>
                <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded text-gray-300">{sig.pattern}</span>
              </div>
              <p className="text-xs text-gray-400">{sig.feedback}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewDSASignals;
