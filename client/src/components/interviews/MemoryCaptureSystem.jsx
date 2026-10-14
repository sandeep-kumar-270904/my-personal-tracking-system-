import React, { useState } from 'react';
import axios from 'axios';
import { Camera, CheckCircle, Save } from 'lucide-react';

export default function MemoryCaptureSystem() {
  const [questions, setQuestions] = useState([
    "What was the first technical question you were asked?",
    "At what point in the interview did you feel most confident and why?",
    "At what point did you feel least confident and what happened?",
    "What did the interviewer say or do that you want to remember?",
    "What is the one thing you would do differently?"
  ]);
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axios.post('/api/interviews/training/memory-capture/mock-123/submit', { responses });
      setSubmitted(true);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-xl text-white text-center">
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Memory Captured</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">Your immediate post-interview state has been preserved. This raw data is invaluable for long-term pattern recognition.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <Camera className="w-6 h-6 mr-2 text-pink-400" />
            Memory Capture
          </h2>
          <p className="text-gray-400 text-sm mt-1">Answer these within 10 minutes of closing the Zoom window.</p>
        </div>
        <div className="bg-pink-900/30 text-pink-400 border border-pink-500/30 px-3 py-1 rounded text-xs font-bold uppercase animate-pulse">
          Action Required
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-gray-800 p-5 rounded-xl border border-gray-700 focus-within:border-pink-500 transition-colors">
            <label className="block text-sm font-bold text-gray-200 mb-3">{idx + 1}. {q}</label>
            <textarea 
              value={responses[idx] || ''}
              onChange={e => setResponses({...responses, [idx]: e.target.value})}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:outline-none focus:border-pink-500 min-h-[80px]"
              placeholder="Dump your thoughts here..."
            />
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading || Object.keys(responses).length === 0} className="w-full py-4 bg-pink-600 hover:bg-pink-500 font-bold rounded-xl text-white flex items-center justify-center disabled:opacity-50">
        {loading ? 'Preserving Memory...' : <><Save className="w-5 h-5 mr-2" /> Preserve Memory</>}
      </button>
    </div>
  );
}
