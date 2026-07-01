import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import { Play, RotateCcw, X, AlertCircle } from 'lucide-react';
import api from '../../../services/api';
import SolutionQualityEvaluator from './SolutionQualityEvaluator';

const BlindImplementationModule = ({ isOpen, onClose, problemId, problemTitle }) => {
  const [code, setCode] = useState('// Write your implementation from memory.\n// Focus on the core logic.\n\nfunction solve() {\n  \n}');
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes
  const [gotStuck, setGotStuck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let timer;
    if (isOpen && timeLeft > 0 && !result) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, timeLeft, result]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/dsa/problems/${problemId || 'mock'}/blind-implementation`, {
        studentCode: code,
        gotStuck,
        timeRemaining: timeLeft
      });
      setResult("Successfully saved to your active recall notes.");
    } catch (err) {
      console.error(err);
      setResult("Failed to save, but good effort.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] bg-[#0a0a0f] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-400" /> Blind Implementation: {problemTitle}
            </h2>
            <p className="text-sm text-gray-400">Implement from pure recall. No peeking.</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className={`font-mono text-2xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            theme="vs-dark"
            value={code}
            onChange={value => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              fontSize: 16,
              wordWrap: 'on',
              padding: { top: 24 }
            }}
          />

          {/* Overlay Result */}
          {result && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-900 border border-gray-800 p-8 rounded-2xl max-w-md text-center"
              >
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{result}</h3>
                <p className="text-gray-400 mb-6">Blind implementations solidify your understanding incredibly well.</p>
                <button 
                  onClick={onClose}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!result && (
          <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex flex-col gap-4">
            <SolutionQualityEvaluator code={code} />
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-amber-500 rounded border-gray-700 bg-gray-800"
                  checked={gotStuck}
                  onChange={(e) => setGotStuck(e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300">I got stuck / had to look something up</span>
              </label>
              
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Saving...' : 'Submit Implementation'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};

export default BlindImplementationModule;
