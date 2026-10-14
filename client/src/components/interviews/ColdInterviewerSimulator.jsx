import React, { useState } from 'react';
import axios from 'axios';
import { Zap, Send, Activity } from 'lucide-react';

export default function ColdInterviewerSimulator() {
  const [sessionId, setSessionId] = useState(null);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/interviews/training/cold-simulation', { targetCompany: 'Amazon', roundType: 'Leadership Principles' });
      setSessionId(res.data.sessionId);
      setHistory([{ role: 'interviewer', content: res.data.nextQuestion }]);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const sendAnswer = async () => {
    if(!input) return;
    const currentInput = input;
    setInput('');
    setHistory(prev => [...prev, { role: 'student', content: currentInput }]);
    setLoading(true);

    try {
      if (history.length >= 5) {
        setHistory(prev => [...prev, { role: 'interviewer', content: "Thank you. We will be in touch." }]);
        setSessionComplete(true);
      } else {
        const res = await axios.post(`/api/interviews/training/cold-simulation/${sessionId}/answer`, { answer: currentInput });
        setHistory(prev => [...prev, { role: 'interviewer', content: res.data.nextQuestion }]);
      }
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Zap className="w-6 h-6 mr-2 text-sky-400" />
        Cold Interviewer Simulator
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Train your composure. The AI will give absolutely ZERO positive feedback, validation, or encouragement.</p>

      {!sessionId ? (
        <div className="text-center py-8">
          <button onClick={startSession} disabled={loading} className="px-6 py-3 bg-sky-600 hover:bg-sky-500 font-bold rounded-lg flex items-center justify-center mx-auto">
            {loading ? 'Starting...' : 'Enter Cold Session'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-[400px]">
          <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
            {history.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'interviewer' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'interviewer' ? 'bg-gray-800 border border-gray-700 text-gray-200' : 'bg-sky-900/30 border border-sky-500/30 text-sky-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && <div className="text-gray-500 text-xs italic">Interviewer is typing...</div>}
          </div>

          {!sessionComplete ? (
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendAnswer()}
                className="flex-grow bg-gray-800 border border-gray-700 rounded px-4 py-2 text-sm focus:outline-none focus:border-sky-500"
                placeholder="Type your answer..."
                disabled={loading}
              />
              <button onClick={sendAnswer} disabled={!input || loading} className="px-4 bg-sky-600 hover:bg-sky-500 rounded font-bold disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-sky-900/20 border border-sky-500/30 p-4 rounded-xl text-center">
              <h4 className="font-bold text-sky-400 mb-2 flex items-center justify-center"><Activity className="mr-2" /> Session Complete</h4>
              <p className="text-sm text-sky-200 mb-4">You completed a cold session. How was your composure without validation?</p>
              <button onClick={() => setSessionId(null)} className="px-4 py-2 bg-gray-700 rounded font-bold text-sm">Debrief Composure</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
