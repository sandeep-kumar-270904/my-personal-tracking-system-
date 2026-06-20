import React, { useState } from 'react';
import axios from 'axios';
import { ShieldAlert, CheckCircle, ChevronRight } from 'lucide-react';

const STRATEGIES = [
  { id: 'CLARIFYING_QUESTION', name: 'The Clarifying Question Pivot', example: '"Let me make sure I understand the problem correctly — can the input array be empty?"' },
  { id: 'BRUTE_FORCE_PROPOSAL', name: 'The Brute Force Proposal', example: '"I know this won\'t be optimal but let me start with the O(n²) approach and optimize from there — is that okay?"' },
  { id: 'THINK_ALOUD', name: 'The Think-Aloud', example: '"I am thinking about this in terms of what data structure would give me O(1) lookup — a hash map comes to mind..."' },
  { id: 'ASKED_FOR_NUDGE', name: 'The Honest Nudge Request', example: '"I feel like I am close to the insight but not quite there — could I get a small hint on the direction without the solution?"' }
];

export default function StuckRecoveryTrainer() {
  const [currentStrategyIndex, setCurrentStrategyIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  
  const strategy = STRATEGIES[currentStrategyIndex];

  const submitRecovery = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/interviews/training/stuck-recovery', {
        studentResponse: response,
        recoveryStrategy: strategy.id
      });
      setScore(res.data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const nextStrategy = () => {
    setScore(null);
    setResponse('');
    setCurrentStrategyIndex((prev) => (prev + 1) % STRATEGIES.length);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <ShieldAlert className="w-6 h-6 mr-2 text-rose-400" />
        Stuck Recovery Protocol
      </h2>
      <p className="text-gray-400 mb-6 text-sm">You have been working on this for 15 minutes and feel completely stuck. Train what you say when you have nothing.</p>

      <div className="flex space-x-2 mb-6">
        {STRATEGIES.map((s, i) => (
          <div key={s.id} className={`flex-1 h-2 rounded ${i === currentStrategyIndex ? 'bg-rose-500' : i < currentStrategyIndex ? 'bg-emerald-500' : 'bg-gray-800'}`} />
        ))}
      </div>

      <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl mb-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-rose-400">Strategy {currentStrategyIndex + 1}: {strategy.name}</h3>
        </div>
        <p className="text-sm text-gray-400 italic mb-4">Example: {strategy.example}</p>
        
        <div className="bg-gray-900 p-4 rounded-lg">
          <p className="text-sm font-bold text-white mb-2">Scenario: Find the longest palindromic substring.</p>
          <p className="text-sm text-gray-400 mb-4">Your mind is blank. You forgot the expanding around center approach. Use the <span className="text-rose-400 font-bold">{strategy.name}</span> to recover gracefully.</p>
          
          <textarea 
            value={response}
            onChange={e => setResponse(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-sm focus:outline-none focus:border-rose-500 min-h-[100px]"
            placeholder="Type your exact spoken recovery here..."
            disabled={score !== null}
          />
        </div>
      </div>

      {!score ? (
        <button onClick={submitRecovery} disabled={!response || loading} className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 font-bold rounded-lg transition-colors">
          {loading ? 'Evaluating...' : 'Execute Recovery Pivot'}
        </button>
      ) : (
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-5 rounded-xl">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-emerald-400 flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Recovery Score: {score.recoveryScore}/100</h4>
          </div>
          <p className="text-sm text-emerald-200/80 mb-5">{score.feedbackText}</p>
          <button onClick={nextStrategy} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg flex items-center justify-center">
            Next Strategy <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
