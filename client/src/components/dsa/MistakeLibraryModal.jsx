import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const MistakeLibraryModal = ({ isOpen, onClose }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['dsa', 'mistake-patterns'],
    queryFn: async () => {
      const res = await api.get('/dsa/mistake-patterns');
      return res.data;
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  // Mock data if empty
  const mistakeData = data || {
    typeDistribution: {
      'EDGE_CASE_MISSED': 15,
      'WRONG_APPROACH': 8,
      'IMPLEMENTATION_BUG': 5,
      'TIME_MANAGEMENT': 2
    },
    recentMistakes: [
      { mistakeDescription: 'Forgot to handle negative numbers', correctionInsight: 'Check bounds and signs first', mistakeTypes: ['EDGE_CASE_MISSED'] },
      { mistakeDescription: 'Used O(N^2) instead of HashMap', correctionInsight: 'Identify frequency counting needs early', mistakeTypes: ['WRONG_APPROACH', 'COMPLEXITY_ERROR'] }
    ]
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                  <BookOpen className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Mistake Library</h2>
                  <p className="text-sm text-gray-400">Structured lessons from your past attempts</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              {/* Distribution */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Most Common Mistakes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(mistakeData.typeDistribution).map(([type, count]) => (
                    <div key={type} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                      <span className="text-2xl font-bold text-white">{count}</span>
                      <p className="text-[10px] font-bold text-gray-500 mt-1">{type.replace(/_/g, ' ')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Recent Insights</h3>
                <div className="space-y-3">
                  {mistakeData.recentMistakes.map((m, i) => (
                    <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex gap-4">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-white font-medium mb-1">{m.mistakeDescription}</p>
                        <div className="bg-emerald-500/10 rounded p-2 inline-flex items-center gap-2 mb-2">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs text-emerald-300">{m.correctionInsight}</span>
                        </div>
                        <div className="flex gap-2">
                          {m.mistakeTypes.map(t => (
                            <span key={t} className="text-[10px] bg-gray-900 border border-gray-700 px-2 py-0.5 rounded text-gray-400 font-bold">{t.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MistakeLibraryModal;
