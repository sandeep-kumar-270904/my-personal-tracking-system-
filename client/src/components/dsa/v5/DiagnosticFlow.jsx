import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../services/api';
import { Brain, ArrowRight, Target, CheckCircle } from 'lucide-react';

const QUESTIONS = [
  {
    id: 1,
    question: "Have you written a recursive function before?",
    options: [
      { text: "Yes fully comfortable", value: 3 },
      { text: "Yes but shaky", value: 2 },
      { text: "Heard of it but not tried", value: 1 },
      { text: "No", value: 0 }
    ]
  },
  {
    id: 2,
    question: "Can you reverse a linked list from memory?",
    options: [
      { text: "Yes in under 5 minutes", value: 3 },
      { text: "With some thinking", value: 2 },
      { text: "With significant struggle", value: 1 },
      { text: "No", value: 0 }
    ]
  },
  // Add 8 more to simulate the 10 questions
  {
    id: 3, question: "How comfortable are you with Big O notation?", options: [{text:"Very", value:3}, {text:"Somewhat", value:2}, {text:"Barely", value:1}, {text:"Not at all", value:0}]
  },
  {
    id: 4, question: "Do you know how a Hash Map works under the hood?", options: [{text:"Yes perfectly", value:3}, {text:"Mostly", value:2}, {text:"Vaguely", value:1}, {text:"No", value:0}]
  },
  {
    id: 5, question: "Have you used multiple pointers in an array before?", options: [{text:"Many times", value:3}, {text:"A few times", value:2}, {text:"Once", value:1}, {text:"Never", value:0}]
  },
  {
    id: 6, question: "Can you implement Binary Search without bugs?", options: [{text:"First try usually", value:3}, {text:"Eventually", value:2}, {text:"With a tutorial", value:1}, {text:"No", value:0}]
  },
  {
    id: 7, question: "Do you understand the Call Stack?", options: [{text:"Deeply", value:3}, {text:"Basic understanding", value:2}, {text:"Heard the term", value:1}, {text:"No", value:0}]
  },
  {
    id: 8, question: "Have you ever solved a LeetCode Medium problem?", options: [{text:"Many", value:3}, {text:"A few", value:2}, {text:"Tried but failed", value:1}, {text:"Never tried", value:0}]
  },
  {
    id: 9, question: "Can you identify when to use a Queue vs Stack?", options: [{text:"Instantly", value:3}, {text:"Usually", value:2}, {text:"Sometimes", value:1}, {text:"No", value:0}]
  },
  {
    id: 10, question: "How do you feel about Dynamic Programming?", options: [{text:"Love it", value:3}, {text:"Can do basics", value:2}, {text:"Terrified", value:1}, {text:"What is it?", value:0}]
  }
];

const DiagnosticFlow = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleSelect = (value) => {
    setResponses({ ...responses, [currentStep]: value });
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitDiagnostic();
    }
  };

  const submitDiagnostic = async () => {
    setIsAnalyzing(true);
    try {
      const res = await api.post('/dsa/diagnostic', { responses });
      setTimeout(() => {
        setResult(res.data);
        setIsAnalyzing(false);
      }, 3000); // 3 second analyzing animation
    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
    }
  };

  if (result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex items-center justify-center p-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
           {/* Particle animation placeholder */}
           <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 bg-cyan-500/10 blur-[100px] rounded-full"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-lg w-full text-center space-y-6"
        >
          <div className="w-16 h-16 mx-auto bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center border border-cyan-500/30">
            <Target className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white">Your Starting Point</h1>
          
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center gap-3 text-cyan-400 font-bold text-lg">
              <span className="text-white">Start here:</span> {result.startingPattern} <ArrowRight className="w-4 h-4 text-gray-500" /> {result.startingTopic}
            </div>
            
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Problem:</p>
              <p className="font-bold text-white text-lg">{result.firstProblemRecommendation.title}</p>
            </div>
            
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4">
              <p className="text-sm text-indigo-300">
                <span className="font-bold">Reason:</span> {result.firstProblemRecommendation.reason}
              </p>
            </div>
          </div>

          <button 
            onClick={onComplete}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold text-lg transition-colors"
          >
            Let's go
          </button>
          <p className="text-xs text-gray-500 mt-4">The full roadmap will reveal itself progressively as you practice.</p>
        </motion.div>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-16 h-16 rounded-full border-4 border-gray-800 border-t-cyan-500 mb-6"
        />
        <h2 className="text-xl font-bold text-white animate-pulse">Analyzing your profile...</h2>
        <p className="text-gray-400 text-sm mt-2">Building your personalized starting point</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-900 w-full">
        <motion.div 
          className="h-full bg-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
        <div className="w-full mb-8 text-center">
          <p className="text-cyan-500 font-bold text-sm mb-4">QUESTION {currentStep + 1} OF {QUESTIONS.length}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full space-y-8"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center leading-tight">
              {QUESTIONS[currentStep].question}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {QUESTIONS[currentStep].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(option.value)}
                  className="w-full p-4 md:p-5 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-cyan-500/50 rounded-2xl text-left transition-all group flex items-center justify-between"
                >
                  <span className="text-gray-200 group-hover:text-white font-medium text-lg">{option.text}</span>
                  <div className="w-5 h-5 rounded-full border-2 border-gray-700 group-hover:border-cyan-500 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiagnosticFlow;
