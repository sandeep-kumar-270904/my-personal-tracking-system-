import React, { useState } from 'react';
import axios from 'axios';
import { Crosshair, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';

const SCENARIOS = [
  { problem: "Design a URL Shortener", mistake: "You proposed using a single MySQL database to store all URLs without sharding.", challenge: "Interviewer: 'With 100M new URLs a month, a single MySQL instance will hit a write bottleneck quickly. How would you handle that?'" },
  { problem: "Find k-th largest element", mistake: "You suggested sorting the entire array first, taking O(N log N).", challenge: "Interviewer: 'Is there a way to do this without sorting the whole array? Maybe closer to O(N)?'" }
];

export default function WrongAnswerRecoveryTrainer() {
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const scenario = SCENARIOS[index];

  const submitRecovery = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/interviews/training/wrong-answer-recovery', {
        initialWrongAnswer: scenario.mistake,
        challengeReceived: scenario.challenge,
        recoveryResponse: response
      });
      setEvaluation(res.data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const nextScenario = () => {
    setEvaluation(null);
    setResponse('');
    setIndex(prev => (prev + 1) % SCENARIOS.length);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Crosshair className="w-6 h-6 mr-2 text-rose-400" />
        Wrong Answer Recovery
      </h2>
      <p className="text-gray-400 mb-6 text-sm">You just gave a bad approach. The interviewer called you out. Practice taking the hit gracefully and pivoting without getting defensive.</p>

      <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Scenario: {scenario.problem}</p>
        <div className="bg-rose-900/20 border border-rose-500/20 p-3 rounded-lg mb-4">
          <p className="text-sm text-rose-200"><span className="font-bold">Your Mistake:</span> {scenario.mistake}</p>
        </div>
        <div className="flex items-start mb-4 bg-gray-900 p-4 rounded-xl border border-gray-700">
          <AlertTriangle className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-lg font-medium text-amber-100">{scenario.challenge}</p>
        </div>

        {!evaluation ? (
          <div>
            <textarea 
              value={response}
              onChange={e => setResponse(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 min-h-[120px] focus:outline-none focus:border-rose-500"
              placeholder="Exactly what do you say next?"
            />
            <button 
              onClick={submitRecovery} 
              disabled={!response || loading} 
              className="w-full mt-4 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 font-bold rounded-lg transition-colors"
            >
              {loading ? 'Evaluating...' : 'Pivot & Recover'}
            </button>
          </div>
        ) : (
          <div className="mt-4 bg-emerald-900/20 border border-emerald-500/30 p-5 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-emerald-400 flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Recovery Score</h4>
              <span className="font-bold text-xl">{evaluation.recoveryScore}/100</span>
            </div>
            <p className="text-sm text-emerald-200/80 mb-5">{evaluation.feedbackText}</p>
            <button onClick={nextScenario} className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg flex items-center justify-center">
              Next Scenario <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
