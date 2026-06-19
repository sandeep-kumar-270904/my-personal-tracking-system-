import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Brain, Search, RefreshCw } from 'lucide-react';
import api from '../../services/api';

const PatternTrainingFlashcards = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // We fetch problems, ideally we'd have a specific endpoint for this, 
  // but we can filter from the main problems list or call a new one.
  const { data: problems, isLoading } = useQuery({
    queryKey: ['dsa', 'problems'],
    queryFn: async () => {
      const res = await api.get('/dsa/problems');
      return res.data?.problems || [];
    }
  });

  if (isLoading) return <div className="h-48 bg-gray-900 rounded-2xl animate-pulse"></div>;

  // Filter problems that have patternTags
  const flashcards = problems?.filter(p => p.patternTags && p.patternTags.length > 0) || [];

  if (flashcards.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
        <Brain className="w-8 h-8 text-indigo-500 mx-auto mb-3 opacity-50" />
        <p className="text-gray-400 text-sm">No patterns identified yet. Add pattern tags to your problems to enable training mode.</p>
      </div>
    );
  }

  const card = flashcards[currentIdx];

  const nextCard = () => {
    setShowAnswer(false);
    setCurrentIdx((prev) => (prev + 1) % flashcards.length);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          Pattern Training
        </h3>
        <span className="text-xs font-bold text-gray-500">{currentIdx + 1} / {flashcards.length}</span>
      </div>

      <div 
        className="w-full bg-gray-800 border border-gray-700 hover:border-indigo-500/50 transition-colors rounded-xl p-8 min-h-[200px] flex flex-col items-center justify-center cursor-pointer relative"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        {!showAnswer ? (
          <>
            <h4 className="text-xl font-bold text-white text-center mb-2">{card.title}</h4>
            <span className="text-sm font-bold text-gray-400 bg-gray-900 px-3 py-1 rounded-full">{card.topic}</span>
            <p className="absolute bottom-4 text-xs text-gray-500 font-medium">Click to reveal pattern</p>
          </>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              {card.patternTags.map(pt => (
                <span key={pt} className="px-4 py-2 bg-indigo-500/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/30">
                  {pt}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="w-full mt-4 flex gap-2">
        <button 
          onClick={nextCard}
          className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors text-sm flex items-center justify-center gap-2"
        >
          Next Problem <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PatternTrainingFlashcards;
