import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Award, Zap, CheckCircle2, Clock } from 'lucide-react';

export default function PreInterviewProtocolViewer() {
  const [protocol, setProtocol] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProtocol();
  }, []);

  const fetchProtocol = async () => {
    try {
      const res = await axios.get('/api/interviews/training/pre-interview-protocol');
      setProtocol(res.data);
    } catch(e) { console.error(e); }
  };

  const generateProtocol = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/interviews/training/pre-interview-protocol/generate');
      setProtocol(res.data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  if (!protocol && !loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white text-center py-12">
        <Award className="w-12 h-12 text-indigo-500/50 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Pre-Interview Protocol</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">We will analyze your past 20 interviews to find what conditions resulted in your highest scores, and generate your personal 24-hour peak performance ritual.</p>
        <button onClick={generateProtocol} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg flex items-center justify-center mx-auto">
          <Zap className="w-5 h-5 mr-2" /> Generate My Protocol
        </button>
      </div>
    );
  }

  if (loading) {
    return <div className="bg-gray-900 border border-gray-800 p-12 rounded-xl text-white text-center text-indigo-400 animate-pulse">Correlating historical performance data with prep habits...</div>;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <Award className="w-6 h-6 mr-2 text-indigo-400" />
          Your 24-Hour Peak Protocol
        </h2>
        <button onClick={generateProtocol} className="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded font-bold text-gray-300">
          Recalibrate
        </button>
      </div>
      <p className="text-gray-400 mb-8 text-sm">Follow this exactly. When you follow your protocol, your average offer rate increases by 22%.</p>

      <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:to-gray-800">
        {protocol.protocolSteps.map((step, idx) => (
          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-gray-900 bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-[-24px] md:static">
              {step.isCompleted ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Clock className="w-3 h-3 text-white" />}
            </div>
            
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-2.5rem)] bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{step.time}</div>
              </div>
              <h3 className="font-bold text-white text-base mb-2">{step.action}</h3>
              <div className="bg-gray-900/50 p-2 rounded text-xs text-emerald-400/80 font-mono border border-emerald-500/10 inline-block">
                Data: {step.evidence}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
