import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Clock, Play, Square, CheckCircle } from 'lucide-react';

export default function TimeAllocationCoach() {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // in seconds
  const [phases, setPhases] = useState([
    { name: 'Understand & Clarify', expectedTime: 300, actualTime: 0, completed: false }, // 5 mins
    { name: 'Design & Optimal Approach', expectedTime: 600, actualTime: 0, completed: false }, // 10 mins
    { name: 'Implementation (Coding)', expectedTime: 900, actualTime: 0, completed: false }, // 15 mins
    { name: 'Dry Run & Edge Cases', expectedTime: 300, actualTime: 0, completed: false } // 5 mins
  ]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [evaluation, setEvaluation] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
        setPhases(prev => {
          const newPhases = [...prev];
          if(!newPhases[currentPhaseIndex].completed) {
             newPhases[currentPhaseIndex].actualTime += 1;
          }
          return newPhases;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, currentPhaseIndex]);

  const advancePhase = () => {
    setPhases(prev => {
      const newPhases = [...prev];
      newPhases[currentPhaseIndex].completed = true;
      return newPhases;
    });

    if (currentPhaseIndex < phases.length - 1) {
      setCurrentPhaseIndex(prev => prev + 1);
    } else {
      setIsRunning(false);
      submitLog();
    }
  };

  const submitLog = async () => {
    try {
      const res = await axios.post('/api/interviews/training/time-allocation', {
        problemId: 'mock-123',
        phaseData: phases
      });
      setEvaluation(res.data);
    } catch(e) { console.error(e); }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Clock className="w-6 h-6 mr-2 text-cyan-400" />
        Time Allocation Coach
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Most coding interviews fail because students rush the design or run out of time to test. Train your internal clock for the 4 phases of a 35-minute technical interview.</p>

      {!evaluation ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Time</p>
              <h3 className="text-4xl font-bold font-mono text-white">{formatTime(elapsed)}</h3>
            </div>
            {!isRunning && currentPhaseIndex === 0 ? (
              <button onClick={() => setIsRunning(true)} className="flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-bold">
                <Play className="w-5 h-5 mr-2" /> Start Mock Interview
              </button>
            ) : isRunning ? (
              <button onClick={() => setIsRunning(false)} className="flex items-center px-4 py-2 bg-rose-900/50 hover:bg-rose-900 text-rose-400 rounded-lg font-bold border border-rose-500/30">
                <Square className="w-4 h-4 mr-2" /> Stop Early
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            {phases.map((phase, idx) => {
              const isActive = isRunning && currentPhaseIndex === idx;
              const diff = phase.actualTime - phase.expectedTime;
              const isOvertime = diff > 0 && isActive;

              return (
                <div key={idx} className={`p-4 rounded-xl border ${isActive ? 'bg-cyan-900/20 border-cyan-500' : phase.completed ? 'bg-gray-800 border-gray-700 opacity-50' : 'bg-gray-800/50 border-gray-800'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`font-bold ${isActive ? 'text-cyan-400' : 'text-gray-300'}`}>{phase.name}</h4>
                      <p className="text-xs text-gray-500">Target: {formatTime(phase.expectedTime)}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className={`font-mono text-xl font-bold ${isOvertime ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
                          {formatTime(phase.actualTime)}
                        </span>
                        {isOvertime && <p className="text-[10px] text-rose-400 uppercase font-bold">Over Target</p>}
                      </div>
                      {isActive && (
                        <button onClick={advancePhase} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold text-sm ml-4">
                          {idx === phases.length - 1 ? 'Finish' : 'Next Phase \u2192'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <h3 className="text-xl font-bold text-emerald-400 flex items-center mb-6"><CheckCircle className="mr-2" /> Time Allocation Analysis</h3>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-900 p-4 rounded-lg text-center border border-gray-800">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Phase Accuracy Score</p>
              <p className="text-3xl font-bold text-white">{evaluation.phaseAccuracy}/100</p>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg text-center border border-gray-800">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Elapsed</p>
              <p className="text-3xl font-bold text-white font-mono">{formatTime(elapsed)}</p>
            </div>
          </div>
          
          <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-lg">
            <h4 className="font-bold text-cyan-400 text-sm uppercase tracking-wider mb-2">Diagnostic Feedback</h4>
            <p className="text-sm text-cyan-100">You rushed the design phase (spent 3 mins instead of 10), which likely means your implementation will require major refactoring. Slow down before you code.</p>
          </div>
          
          <button onClick={() => { setEvaluation(null); setElapsed(0); setPhases(phases.map(p => ({...p, actualTime: 0, completed: false}))); setCurrentPhaseIndex(0); }} className="w-full mt-6 py-2 bg-gray-700 hover:bg-gray-600 rounded font-bold">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
