import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import { Target, Briefcase, FileText, CheckCircle, X } from 'lucide-react';

const DailyBriefModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [briefData, setBriefData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDailyBrief = async () => {
      // Check localStorage first
      const today = new Date().toISOString().split('T')[0];
      const hasSeenToday = localStorage.getItem(`daily_brief_seen_${today}`);
      
      if (!hasSeenToday) {
        try {
          const res = await api.get('/dsa/daily-brief');
          setBriefData(res.data);
          setIsOpen(true);
          localStorage.setItem(`daily_brief_seen_${today}`, 'true');
        } catch (err) {
          console.error("Failed to load daily brief:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    checkDailyBrief();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
      >
        <div className="p-6 text-center border-b border-gray-800">
          <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">Your 60-Second Brief</h2>
          <p className="text-sm text-gray-400">Clear focus for today. No distractions.</p>
        </div>

        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-16 bg-gray-800 rounded-xl"></div>
              <div className="h-16 bg-gray-800 rounded-xl"></div>
              <div className="h-16 bg-gray-800 rounded-xl"></div>
            </div>
          ) : (
            <>
              {briefData?.dsaTask && (
                <div className="flex gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className="mt-0.5 text-cyan-400"><Target className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">DSA Focus</p>
                    <p className="text-sm text-gray-200">{briefData.dsaTask}</p>
                  </div>
                </div>
              )}
              
              {briefData?.applicationTask && (
                <div className="flex gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className="mt-0.5 text-emerald-400"><Briefcase className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Application Task</p>
                    <p className="text-sm text-gray-200">{briefData.applicationTask}</p>
                  </div>
                </div>
              )}
              
              {briefData?.resumeTask ? (
                <div className="flex gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                  <div className="mt-0.5 text-amber-400"><FileText className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Resume Action</p>
                    <p className="text-sm text-gray-200">{briefData.resumeTask}</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 opacity-60">
                  <div className="mt-0.5 text-gray-500"><CheckCircle className="w-5 h-5" /></div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1 tracking-wider uppercase">Resume Status</p>
                    <p className="text-sm text-gray-400">Resume looks good today.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 pt-0">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
          >
            Got it — let's go
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DailyBriefModal;
