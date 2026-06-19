import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, Pause, Maximize2, Minimize2, CheckCircle2 } from 'lucide-react';
import useDSASessionStore from '../../store/dsaSessionStore';

const StudySessionTracker = ({ onEndSession }) => {
  const { isActive, startedAt, problemsAttempted, problemsSolved } = useDSASessionStore();
  const [elapsed, setElapsed] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let interval;
    if (isActive && startedAt) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAt) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, startedAt]);

  if (!isActive) return null;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      >
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-2xl w-64 origin-bottom-right"
          >
            <h3 className="text-sm font-bold text-white mb-3">Session Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Attempted</span>
                <span className="text-white font-medium">{problemsAttempted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Solved</span>
                <span className="text-green-400 font-medium">{problemsSolved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pace</span>
                <span className="text-cyan-400 font-medium">
                  {problemsSolved > 0 ? `${Math.round((elapsed / 60) / problemsSolved)}m/prob` : '-'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="bg-gray-900 border border-gray-700 shadow-2xl rounded-full p-2 flex items-center gap-4">
          <div className="flex items-center gap-3 pl-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="font-mono text-lg font-bold text-white min-w-[80px]">
              {formatTime(elapsed)}
            </span>
          </div>

          <div className="flex items-center gap-1 border-l border-gray-800 pl-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-full transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button 
              onClick={onEndSession}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors group relative"
            >
              <Square className="w-4 h-4 fill-current" />
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-gray-700">
                End Session
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StudySessionTracker;
