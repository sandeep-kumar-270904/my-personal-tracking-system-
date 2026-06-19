import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, MessageSquareWarning, X, AlertTriangle, Send } from 'lucide-react';
import api from '../../../services/api';

const PressureSimulationSession = ({ isOpen, onClose, problemTitle }) => {
  const [timeLeft, setTimeLeft] = useState(1200);
  const [prompts, setPrompts] = useState([]);
  const [activePrompt, setActivePrompt] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [pressureScore, setPressureScore] = useState(null);

  useEffect(() => {
    if (isOpen && !isStarted) {
      startSession();
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (isStarted && timeLeft > 0 && !completed) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1;
          // Check for prompt
          const upcomingPrompt = prompts.find(p => p.timeOffset === next);
          if (upcomingPrompt) {
            setActivePrompt(upcomingPrompt.promptText);
            // Auto hide after 15 seconds
            setTimeout(() => setActivePrompt(null), 15000);
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft, completed, prompts]);

  const startSession = async () => {
    try {
      const res = await api.post('/dsa/pressure-mode/start');
      setTimeLeft(res.data.timeLimitSeconds);
      setPrompts(res.data.prompts);
      setIsStarted(true);
    } catch (err) {
      console.error(err);
    }
  };

  const finishSession = async () => {
    setCompleted(true);
    try {
      const res = await api.post('/dsa/pressure-mode/submit');
      setPressureScore(res.data.pressureScore);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isCritical = timeLeft < 300;

  if (completed) {
    return (
      <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gray-900 p-8 rounded-2xl max-w-sm w-full text-center border border-gray-800">
          <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
            <span className="text-3xl font-bold text-rose-400">{pressureScore || '--'}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Pressure Score</h2>
          <p className="text-gray-400 mb-6 text-sm">You handled the interruptions well, but your typing speed dropped by 40% during the complexity question.</p>
          <button onClick={onClose} className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors">
            Exit Simulator
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-auto z-[100] pointer-events-none p-4 flex flex-col items-end justify-end gap-4 h-screen">
      
      {/* Prompts Overlay */}
      <AnimatePresence>
        {activePrompt && (
          <motion.div 
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className="bg-gray-900 border-2 border-rose-500/50 p-4 rounded-2xl shadow-2xl shadow-rose-900/20 max-w-md w-full pointer-events-auto flex gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
              <MessageSquareWarning className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Interviewer Interruption</p>
              <p className="text-gray-200 font-medium">{activePrompt}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Timer HUD */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-4 pointer-events-auto flex items-center gap-6"
      >
        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Pressure Mode Active</span>
          <span className="text-sm font-medium text-gray-300 truncate max-w-[200px]">{problemTitle || 'Mock Interview Session'}</span>
        </div>
        
        <div className={`flex items-center gap-2 font-mono text-3xl font-bold ${isCritical ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          <Timer className={`w-6 h-6 ${isCritical ? 'text-red-500' : 'text-gray-400'}`} />
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </div>

        <button 
          onClick={finishSession}
          className="ml-4 px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
        >
          <Send className="w-4 h-4" /> Finish
        </button>
      </motion.div>
    </div>
  );
};

export default PressureSimulationSession;
