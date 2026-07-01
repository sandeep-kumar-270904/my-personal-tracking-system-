import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Eye, HelpCircle } from 'lucide-react';

export default function SignalReaderTrainer() {
  const [signals, setSignals] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    axios.get('/api/interviews/training/signal-vocabulary')
      .then(res => {
        if(res.data.length === 0) {
          // Fallback mocked signals for demo
          setSignals([
            { signal: 'Interviewer interrupts to ask about a specific edge case', meaning: 'You are going down the wrong path or missing something critical. They are trying to save you time.', category: 'REDIRECT', appropriateResponse: 'Stop coding immediately. Address the edge case out loud.' },
            { signal: 'Interviewer says "Are you sure?"', meaning: 'You are likely wrong. Do not double down without checking.', category: 'WARNING', appropriateResponse: 'Say "Let me double check my logic" and trace it.' },
            { signal: 'Interviewer leans back and says "Okay, that makes sense."', meaning: 'They accept your logic. You can proceed.', category: 'POSITIVE', appropriateResponse: 'Move to the next step or start coding.' }
          ]);
        } else {
          setSignals(res.data);
        }
      })
      .catch(console.error);
  }, []);

  if(signals.length === 0) return <div className="text-white p-8">Loading...</div>;

  const current = signals[index];

  const handleNext = () => {
    setShowAnswer(false);
    setSelectedCategory(null);
    setIndex((prev) => (prev + 1) % signals.length);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Users className="w-6 h-6 mr-2 text-fuchsia-400" />
        Signal Reader
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Interviews are won and lost in the micro-expressions and subtle verbal cues. Train your ability to read the room.</p>

      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 text-center mb-6 min-h-[200px] flex flex-col justify-center">
        <Eye className="w-8 h-8 text-fuchsia-500/50 mx-auto mb-4" />
        <p className="text-xl font-medium px-4">"{current.signal}"</p>
      </div>

      {!showAnswer ? (
        <div className="space-y-4">
          <p className="text-sm font-bold text-center mb-4">What does this signal mean?</p>
          <div className="grid grid-cols-2 gap-4">
            {['POSITIVE', 'WARNING', 'REDIRECT', 'PROBE'].map(cat => (
              <button 
                key={cat}
                onClick={() => { setSelectedCategory(cat); setShowAnswer(true); }}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 p-4 rounded-xl text-sm font-bold transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className={`p-6 rounded-xl border ${selectedCategory === current.category ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-rose-900/20 border-rose-500/30'}`}>
          <div className="flex items-start mb-4">
            <HelpCircle className={`w-6 h-6 mr-3 flex-shrink-0 ${selectedCategory === current.category ? 'text-emerald-400' : 'text-rose-400'}`} />
            <div>
              <h3 className={`font-bold text-lg mb-1 ${selectedCategory === current.category ? 'text-emerald-400' : 'text-rose-400'}`}>
                {selectedCategory === current.category ? 'Correct Analysis' : `Incorrect. This is a ${current.category} signal.`}
              </h3>
              <p className="text-sm text-gray-300"><span className="font-bold text-white">True Meaning:</span> {current.meaning}</p>
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-wider mb-1">How you must respond</p>
            <p className="text-sm">{current.appropriateResponse}</p>
          </div>
          <button onClick={handleNext} className="w-full py-3 bg-gray-800 hover:bg-gray-700 font-bold rounded-lg transition-colors">
            Next Signal
          </button>
        </div>
      )}
    </div>
  );
}
