import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Check, X, RotateCcw } from 'lucide-react';
import api from '../../../services/api';

const MOCK_NOTES = [
  { id: '1', front: 'In binary search, when do you use `left <= right` vs `left < right`?', back: 'Use `<=` when returning from inside the loop. Use `<` when you want the pointers to converge on the target and return after the loop.' },
  { id: '2', front: 'What is the standard sliding window template?', back: '1. Add to window\n2. While window invalid: remove from left\n3. Update max/min result' }
];

const ActiveRecallNotesCard = () => {
  const [notes, setNotes] = useState(MOCK_NOTES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleReview = async (quality) => {
    try {
      await api.post('/dsa/active-recall/review', { noteId: notes[currentIndex].id, quality });
    } catch (err) {
      console.error(err);
    }
    
    setShowAnswer(false);
    if (currentIndex < notes.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setNotes([]);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 text-center">
        <Brain className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-1">All Caught Up!</h2>
        <p className="text-sm text-gray-400">Your memory is rock solid today.</p>
      </div>
    );
  }

  const currentNote = notes[currentIndex];

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Active Recall Review</h2>
        </div>
        <span className="text-xs font-bold text-gray-400 bg-gray-800 px-2 py-1 rounded-md">
          {currentIndex + 1} / {notes.length}
        </span>
      </div>
      <p className="text-sm text-gray-400 mb-6 relative z-10">Micro-insights you told yourself to remember.</p>

      <div className="relative min-h-[160px] perspective-1000 z-10">
        <AnimatePresence mode="wait">
          {!showAnswer ? (
            <motion.div
              key="front"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/50 transition-colors"
              onClick={() => setShowAnswer(true)}
            >
              <h3 className="text-lg font-bold text-white text-center">{currentNote.front}</h3>
              <p className="text-xs text-amber-400 mt-4 animate-pulse">Click to reveal answer</p>
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-indigo-900/20 border border-indigo-500/50 rounded-xl p-6 flex flex-col justify-between"
            >
              <p className="text-sm text-indigo-100 font-medium whitespace-pre-wrap">{currentNote.back}</p>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-indigo-500/30">
                <button 
                  onClick={() => handleReview(1)}
                  className="flex-1 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-xs font-bold transition-colors"
                >
                  Forgot It
                </button>
                <button 
                  onClick={() => handleReview(3)}
                  className="flex-1 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-xs font-bold transition-colors"
                >
                  Hard
                </button>
                <button 
                  onClick={() => handleReview(5)}
                  className="flex-1 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold transition-colors"
                >
                  Easy
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ActiveRecallNotesCard;
