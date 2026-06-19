import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, PlayCircle, ShieldAlert } from 'lucide-react';
import api from '../../../services/api';

const MonthlyCalibrationInterview = ({ isOpen, onClose }) => {
  const [started, setStarted] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 border border-indigo-500/50 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl shadow-indigo-900/20 text-center relative"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>

          {!started ? (
            <div className="p-8">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                <Calendar className="w-10 h-10 text-indigo-400" />
                <div className="absolute -bottom-2 -right-2 bg-gray-900 rounded-full p-1 border border-gray-800">
                  <ShieldAlert className="w-5 h-5 text-rose-500" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Monthly Calibration Interview</h2>
              
              <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl mb-6 text-left">
                <p className="text-gray-300 text-sm leading-relaxed mb-2">
                  This is not a drill. Once a month, the platform forces a complete, timed mock interview across your weakest and strongest patterns to recalibrate your entire curriculum.
                </p>
                <ul className="text-xs text-indigo-400 font-medium space-y-1 ml-4 list-disc">
                  <li>45 minutes strict time limit</li>
                  <li>2 patterns chosen by AI</li>
                  <li>Pressure Mode is ON automatically</li>
                  <li>Cannot be skipped</li>
                </ul>
              </div>

              <button 
                onClick={() => setStarted(true)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <PlayCircle className="w-6 h-6" /> Begin Calibration
              </button>
            </div>
          ) : (
            <div className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4 animate-pulse">Connecting to Mock Environment...</h2>
              <p className="text-gray-400">Loading your customized question set based on your weakness radar.</p>
              <button onClick={onClose} className="mt-8 text-gray-500 hover:text-white underline text-sm">Force close (Dev only)</button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MonthlyCalibrationInterview;
