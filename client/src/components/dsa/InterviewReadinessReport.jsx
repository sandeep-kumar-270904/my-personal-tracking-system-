import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ShieldCheck, ShieldAlert, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import api from '../../services/api';

const InterviewReadinessReport = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['dsa', 'readiness'],
    queryFn: async () => {
      const res = await api.post('/dsa/readiness-assessment');
      return res.data;
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-800 shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Interview Readiness
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-6 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Analyzing your DSA profile...</p>
              </div>
            ) : assessment ? (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-gray-800 mb-4 bg-gray-900 shadow-inner relative">
                    <span className="text-4xl font-black text-white">{assessment.readinessScore}</span>
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="44" cy="44" r="44" className="stroke-gray-800 fill-none" strokeWidth="4" transform="translate(4,4)" />
                      <circle cx="44" cy="44" r="44" className={`fill-none transition-all duration-1000 ${
                        assessment.readinessScore >= 80 ? 'stroke-green-500' :
                        assessment.readinessScore >= 60 ? 'stroke-yellow-500' : 'stroke-red-500'
                      }`} strokeWidth="4" strokeDasharray={`${assessment.readinessScore * 2.76} 276`} strokeLinecap="round" transform="translate(4,4)" />
                    </svg>
                  </div>
                  <h3 className={`text-2xl font-bold ${
                    assessment.overallReadiness === 'STRONG' ? 'text-green-400' :
                    assessment.overallReadiness === 'READY' ? 'text-green-300' :
                    assessment.overallReadiness === 'PARTIALLY_READY' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {assessment.overallReadiness.replace('_', ' ')}
                  </h3>
                  {assessment.estimatedTimeToReady > 0 && (
                    <p className="text-gray-400 mt-2 flex items-center justify-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      Estimated {assessment.estimatedTimeToReady} days of consistent practice to reach STRONG
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Passed Checks
                    </h4>
                    <ul className="space-y-3">
                      {assessment.passedChecks.map((check, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{check}</span>
                        </li>
                      ))}
                      {assessment.passedChecks.length === 0 && <li className="text-gray-500 text-sm italic">None yet.</li>}
                    </ul>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Failed Checks (Gaps)
                    </h4>
                    <ul className="space-y-4">
                      {assessment.failedChecks.map((check, i) => (
                        <li key={i} className="flex flex-col gap-1 text-sm">
                          <div className="flex items-start gap-2 text-gray-300">
                            <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <span className="font-medium text-white">{check.gap}</span>
                          </div>
                          <span className="text-xs text-gray-500 ml-6 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Time to close: {check.estimatedTimeToClose}
                          </span>
                        </li>
                      ))}
                      {assessment.failedChecks.length === 0 && <li className="text-gray-500 text-sm italic">No gaps found! You are ready.</li>}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-10">Failed to load assessment data.</p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InterviewReadinessReport;
