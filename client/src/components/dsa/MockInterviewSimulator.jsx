import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Play, Clock, Code, Award } from 'lucide-react';
import api from '../../services/api';

const MockInterviewSimulator = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState('SETUP'); // SETUP, IN_PROGRESS, REPORT
  const [interviewType, setInterviewType] = useState(45);
  const [targetCompany, setTargetCompany] = useState('');
  
  // Mock problems array for the frontend (the actual system would ideally fetch these from backend, 
  // but per instructions we simulate and only LLM evaluate)
  const [problems, setProblems] = useState([]);
  const [currentProblemIdx, setCurrentProblemIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [approach, setApproach] = useState('');
  const [timeComp, setTimeComp] = useState('O(N)');
  const [spaceComp, setSpaceComp] = useState('O(1)');
  const [submissions, setSubmissions] = useState([]);
  const [report, setReport] = useState(null);

  const evaluateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/dsa/mock-interview/evaluate', data);
      return res.data;
    },
    onSuccess: (data) => {
      setReport(data);
      setStep('REPORT');
      queryClient.invalidateQueries(['dsa']);
    }
  });

  useEffect(() => {
    let timer;
    if (step === 'IN_PROGRESS' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && step === 'IN_PROGRESS') {
      handleSubmitAll();
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const handleStart = () => {
    // Generate simulated problems (one weak pattern, one company specific, one stretch)
    setProblems([
      { title: "Sliding Window Maximum", difficulty: "HARD" },
      { title: "Word Search II", difficulty: "HARD" },
      { title: "Longest Increasing Subsequence", difficulty: "MEDIUM" }
    ]);
    setTimeLeft(interviewType * 60);
    setStep('IN_PROGRESS');
    setCurrentProblemIdx(0);
    setSubmissions([]);
    setApproach('');
  };

  const handleNextProblem = () => {
    const newSubs = [...submissions, {
      title: problems[currentProblemIdx].title,
      difficulty: problems[currentProblemIdx].difficulty,
      userApproach: approach,
      timeComplexity: timeComp,
      spaceComplexity: spaceComp
    }];
    setSubmissions(newSubs);
    setApproach('');
    setTimeComp('O(N)');
    setSpaceComp('O(1)');

    if (currentProblemIdx < problems.length - 1) {
      setCurrentProblemIdx(i => i + 1);
    } else {
      submitToBackend(newSubs);
    }
  };

  const handleSubmitAll = () => {
    const newSubs = [...submissions];
    if (approach) {
      newSubs.push({
        title: problems[currentProblemIdx].title,
        difficulty: problems[currentProblemIdx].difficulty,
        userApproach: approach,
        timeComplexity: timeComp,
        spaceComplexity: spaceComp
      });
    }
    submitToBackend(newSubs);
  };

  const submitToBackend = (subs) => {
    setStep('EVALUATING');
    evaluateMutation.mutate({
      interviewType,
      targetCompany,
      problemsAttempted: subs
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-gray-950 flex flex-col overflow-hidden text-gray-200">
      {/* Header */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 shrink-0 bg-gray-900">
        <div className="flex items-center gap-3">
          <Code className="w-6 h-6 text-indigo-400" />
          <h1 className="text-xl font-bold text-white">Mock Interview Simulator</h1>
        </div>
        {step === 'IN_PROGRESS' && (
          <div className="flex items-center gap-2 bg-gray-800 px-4 py-1.5 rounded-full border border-gray-700">
            <Clock className={`w-4 h-4 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
            <span className={`font-mono font-bold ${timeLeft < 300 ? 'text-red-500' : 'text-cyan-400'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {step === 'SETUP' && (
          <div className="max-w-xl mx-auto mt-20 p-8 bg-gray-900 border border-gray-800 rounded-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Configure Interview</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Duration & Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 45, label: 'Tech Screen (45m)' },
                    { val: 60, label: 'Onsite (60m)' },
                    { val: 90, label: 'Competitive (90m)' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => setInterviewType(opt.val)}
                      className={`p-3 text-sm font-medium rounded-xl border transition-all ${
                        interviewType === opt.val 
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                          : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Target Company (Optional)</label>
                <input 
                  type="text" 
                  value={targetCompany}
                  onChange={e => setTargetCompany(e.target.value)}
                  placeholder="e.g. Google, Amazon, Atlassian"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button 
                onClick={handleStart}
                className="w-full py-4 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                Start Interview
              </button>
            </div>
          </div>
        )}

        {step === 'IN_PROGRESS' && problems[currentProblemIdx] && (
          <div className="max-w-5xl mx-auto mt-8 flex flex-col h-[calc(100vh-120px)]">
            <div className="mb-6">
              <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase">Problem {currentProblemIdx + 1} of {problems.length}</span>
              <h2 className="text-3xl font-bold text-white mt-1">{problems[currentProblemIdx].title}</h2>
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border ${
                problems[currentProblemIdx].difficulty === 'HARD' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                problems[currentProblemIdx].difficulty === 'MEDIUM' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                'bg-green-500/20 border-green-500/50 text-green-400'
              }`}>
                {problems[currentProblemIdx].difficulty}
              </span>
            </div>

            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col">
              <label className="block text-sm font-medium text-gray-400 mb-2">Your Approach & Pseudocode</label>
              <textarea 
                value={approach}
                onChange={e => setApproach(e.target.value)}
                placeholder="Talk through your thought process. Describe the optimal approach. Write pseudocode..."
                className="flex-1 w-full bg-gray-950 border border-gray-800 rounded-xl p-4 text-gray-300 font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Time Complexity</label>
                  <input type="text" value={timeComp} onChange={e => setTimeComp(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Space Complexity</label>
                  <input type="text" value={spaceComp} onChange={e => setSpaceComp(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleNextProblem}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
                >
                  {currentProblemIdx < problems.length - 1 ? 'Submit & Next Problem' : 'Finish Interview'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'EVALUATING' && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-white">Interviewer is evaluating your approach...</h2>
            <p className="text-gray-400 mt-2">Checking time/space complexity and identifying edge cases.</p>
          </div>
        )}

        {step === 'REPORT' && report && (
          <div className="max-w-4xl mx-auto my-10 space-y-8">
            <div className="text-center">
              <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-4xl font-black text-white">Interview Complete</h2>
              <p className="text-xl text-gray-400 mt-2">Overall Score: <span className="text-white font-bold">{report.overallScore}/100</span></p>
            </div>

            {report.weaknessesExposed?.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-400 mb-3">Weaknesses Exposed</h3>
                <div className="flex gap-2 flex-wrap">
                  {report.weaknessesExposed.map(w => (
                    <span key={w} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">{w}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {report.problemsAttempted.map((p, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Q{i+1}: {p.title}</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                      <p className="text-gray-400">Approach correctness</p>
                      <p className={`font-bold ${p.evaluation.approachCorrectness === 'CORRECT' ? 'text-green-400' : p.evaluation.approachCorrectness === 'PARTIALLY_CORRECT' ? 'text-yellow-400' : 'text-red-400'}`}>
                        {p.evaluation.approachCorrectness.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-950 rounded-lg border border-gray-800">
                      <p className="text-gray-400">Time Complexity</p>
                      <p className={`font-bold ${p.evaluation.timeComplexityCorrectness === 'Match' ? 'text-green-400' : 'text-red-400'}`}>
                        {p.evaluation.timeComplexityCorrectness}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Interviewer Feedback</h4>
                      <p className="text-gray-300 leading-relaxed bg-gray-800/50 p-4 rounded-xl italic">"{p.evaluation.interviewerSimulatedFeedback}"</p>
                    </div>
                    
                    {p.evaluation.missedEdgeCases?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Missed Edge Cases</h4>
                        <ul className="list-disc list-inside text-gray-300 text-sm">
                          {p.evaluation.missedEdgeCases.map((ec, idx) => <li key={idx}>{ec}</li>)}
                        </ul>
                      </div>
                    )}

                    {p.evaluation.betterApproach && p.evaluation.betterApproach !== 'None' && (
                      <div>
                        <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Optimal Approach</h4>
                        <p className="text-gray-300 text-sm">{p.evaluation.betterApproach}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-8">
              <button onClick={onClose} className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors border border-gray-700">
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterviewSimulator;
