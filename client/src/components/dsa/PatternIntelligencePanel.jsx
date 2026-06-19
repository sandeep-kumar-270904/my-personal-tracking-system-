import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Network, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { motion } from 'framer-motion';

const MASTERY_COLORS = {
  NOT_STARTED: 'bg-gray-800 text-gray-400',
  BEGINNER: 'bg-red-900/40 text-red-400',
  INTERMEDIATE: 'bg-amber-900/40 text-amber-400',
  ADVANCED: 'bg-cyan-900/40 text-cyan-400',
  MASTERED: 'bg-green-900/40 text-green-400'
};

const PatternIntelligencePanel = () => {
  const { data: companyPatterns, isLoading } = useQuery({
    queryKey: ['dsa', 'company-patterns'],
    queryFn: async () => {
      const res = await api.get('/dsa/company-patterns');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="h-48 bg-gray-900 rounded-2xl animate-pulse"></div>;
  }

  return (
    <div className="mb-10 bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Network className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-bold text-white">Pattern Intelligence</h2>
      </div>

      {companyPatterns?.length > 0 ? (
        <div className="space-y-6">
          {companyPatterns.map((cp, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-800/50 rounded-xl p-5 border border-gray-700/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{cp.company} <span className="text-sm font-normal text-gray-400 ml-2">Target Patterns</span></h3>
                <div className="text-sm font-medium text-purple-400">
                  {cp.readinessScore}% Match
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cp.patterns.map((p, pIdx) => (
                  <div key={pIdx} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <p className="text-sm font-medium text-gray-300 mb-2">{p.pattern.replace(/_/g, ' ')}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Mastery</span>
                      <span className={`px-2 py-0.5 rounded ${MASTERY_COLORS[p.userMastery]}`}>
                        {p.userMastery.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-gray-300">{p.userProblems} / {p.targetProblems}</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ width: `${Math.min(100, (p.userProblems / p.targetProblems) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-800/20 rounded-xl border border-gray-800 border-dashed">
          <p className="text-gray-400">No active applications found.</p>
          <p className="text-sm text-gray-500 mt-1">Add companies to your Applications tracker to see targeted patterns here.</p>
        </div>
      )}
    </div>
  );
};

export default PatternIntelligencePanel;
