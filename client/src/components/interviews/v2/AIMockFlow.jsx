import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Brain, Code, User, Play, CheckCircle, ChevronRight, XCircle } from 'lucide-react';

export default function AIMockFlow({ config, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [evaluation, setEvaluation] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const initMock = async () => {
      try {
        const res = await axios.post('/api/interviews/mock', {
          targetCompany: config.targetCompany,
          targetRole: config.targetRole,
          roundType: config.roundType,
          conductedWith: 'AI'
        });
        setQuestions(res.data.questionsUsed || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    initMock();
  }, [config]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
      generateEvaluation();
    }
  };

  const generateEvaluation = async () => {
    // In a real app we'd stream this from an LLM.
    // For now we simulate an evaluation.
    setTimeout(() => {
      setEvaluation({
        score: 82,
        strengths: ["Clear communication", "Structured approach"],
        weaknesses: ["Missed edge cases in problem 2", "Behavioral answer lacked concrete metrics"],
      });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-[200]">
        <Brain className="w-16 h-16 text-indigo-500 animate-pulse mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Generating Simulation...</h2>
        <p className="text-gray-400">Loading company profile for {config.targetCompany}...</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="fixed inset-0 bg-gray-950 z-[200] p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto pt-10">
          <h2 className="text-3xl font-bold text-white mb-8">Simulation Report</h2>
          {!evaluation ? (
            <div className="text-center py-20">
              <Brain className="w-12 h-12 text-indigo-500 animate-pulse mx-auto mb-4" />
              <p className="text-gray-400">Analyzing your responses...</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-8 border-emerald-500/30 mb-4">
                  <span className="text-3xl font-bold text-emerald-400">{evaluation.score}</span>
                </div>
                <h3 className="text-xl font-bold text-white">Overall Performance</h3>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-6">
                  <h4 className="font-bold text-emerald-400 mb-3 flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Strengths</h4>
                  <ul className="space-y-2">
                    {evaluation.strengths.map((s,i) => <li key={i} className="text-sm text-gray-300">• {s}</li>)}
                  </ul>
                </div>
                <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-6">
                  <h4 className="font-bold text-rose-400 mb-3 flex items-center"><XCircle className="w-5 h-5 mr-2" /> Areas to Improve</h4>
                  <ul className="space-y-2">
                    {evaluation.weaknesses.map((w,i) => <li key={i} className="text-sm text-gray-300">• {w}</li>)}
                  </ul>
                </div>
              </div>

              <button onClick={onExit} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-8">
                Exit Simulation
              </button>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-gray-950 z-[200] flex flex-col">
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900">
        <div className="flex items-center space-x-4">
          <Brain className="w-6 h-6 text-indigo-500" />
          <div>
            <div className="font-bold text-white text-sm">AI Interviewer • {config.targetCompany}</div>
            <div className="text-xs text-gray-400">Question {currentIndex + 1} of {questions.length}</div>
          </div>
        </div>
        <button onClick={onExit} className="text-sm text-gray-400 hover:text-white">Abort</button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl mb-6">
            <span className="px-2 py-1 bg-indigo-900/30 text-indigo-400 text-xs font-bold rounded mb-4 inline-block tracking-wider uppercase">
              {currentQ?.category || 'Question'}
            </span>
            <h2 className="text-2xl text-white font-medium leading-relaxed">
              "{currentQ?.question}"
            </h2>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 flex items-center border-b border-gray-700">
              <User className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Your Answer</span>
            </div>
            <textarea 
              rows="8"
              value={answers[currentIndex] || ''}
              onChange={e => setAnswers({...answers, [currentIndex]: e.target.value})}
              placeholder="Type your answer or approach here..."
              className="w-full bg-transparent p-6 text-white placeholder-gray-600 focus:outline-none resize-none font-mono text-sm leading-relaxed"
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleNext}
              className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish & Evaluate'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
