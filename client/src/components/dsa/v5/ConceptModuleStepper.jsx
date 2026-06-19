import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, ChevronRight, X, BrainCircuit, PlayCircle, Code } from 'lucide-react';
import api from '../../../services/api';

const MOCK_MODULE_STEPS = [
  {
    type: "ANALOGY",
    title: "The Real World Analogy",
    content: "Imagine you are trying to find a specific book in a massive library where all books are sorted by ISBN. You wouldn't start at the first book and check every single one. You'd open to the middle, see if you're too high or too low, and immediately eliminate half the library.",
    illustration: "library" // Imagine a visual here
  },
  {
    type: "CORE_INSIGHT",
    title: "The Core Insight",
    content: "Binary search isn't just about arrays. It's about finding a boundary. Anytime you have a sorted space (or a monotonic function) where everything on the left is 'valid' and everything on the right is 'invalid', you can use Binary Search to find the exact transition point in O(log N) time.",
    illustration: "boundary"
  },
  {
    type: "TEMPLATE",
    title: "The Bulletproof Template",
    content: `left = 0\nright = len(arr) - 1\n\nwhile left <= right:\n    mid = left + (right - left) // 2\n    if condition(mid):\n        # Found exactly what we want\n        return mid\n    elif arr[mid] < target:\n        left = mid + 1\n    else:\n        right = mid - 1`,
    illustration: "code"
  },
  {
    type: "MICRO_PROBLEM",
    title: "Prove It: Micro Problem",
    question: "If left = 5 and right = 6, what does left + (right - left) // 2 evaluate to? And why don't we use (left + right) // 2?",
    options: [
      { text: "5. Because it prevents integer overflow in other languages.", isCorrect: true },
      { text: "5.5. Because it finds the exact mathematical center.", isCorrect: false },
      { text: "6. Because it rounds up.", isCorrect: false }
    ]
  }
];

const ConceptModuleStepper = ({ moduleId, topicOrPattern, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleNext = () => {
    if (currentStep < MOCK_MODULE_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeModule();
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setShowFeedback(true);
  };

  const completeModule = async () => {
    try {
      await api.post(`/dsa/concept-modules/${moduleId}/complete`);
      setCompleted(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      // Fallback close
      onClose();
    }
  };

  const stepData = MOCK_MODULE_STEPS[currentStep];

  if (completed) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Concept Unlocked</h2>
          <p className="text-gray-400">You now have the mental model for {topicOrPattern}.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0F] flex flex-col">
      {/* Header & Progress */}
      <div className="p-6 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-bold">{topicOrPattern} Module</h2>
            <p className="text-xs text-gray-400">Fear Dismantler & Mental Model</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800">
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <div className="w-full h-1 bg-gray-900">
        <motion.div 
          className="h-full bg-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep) / MOCK_MODULE_STEPS.length) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-2xl w-full"
          >
            <h1 className="text-3xl font-bold text-white mb-8 text-center">{stepData.title}</h1>
            
            {stepData.type === 'TEMPLATE' ? (
              <div className="bg-[#1E1E2E] p-6 rounded-2xl font-mono text-sm text-blue-300 shadow-2xl border border-gray-800">
                <pre>{stepData.content}</pre>
              </div>
            ) : stepData.type === 'MICRO_PROBLEM' ? (
              <div className="space-y-6">
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 text-lg text-white">
                  {stepData.question}
                </div>
                <div className="space-y-3">
                  {stepData.options.map((opt, i) => (
                    <button 
                      key={i}
                      onClick={() => handleOptionSelect(opt)}
                      disabled={showFeedback}
                      className={`w-full p-4 rounded-xl text-left border transition-all ${showFeedback ? (opt.isCorrect ? 'bg-green-900/20 border-green-500 text-white' : selectedOption === opt ? 'bg-red-900/20 border-red-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-500') : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-indigo-500'}`}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
                {showFeedback && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-6">
                    {selectedOption?.isCorrect ? (
                      <p className="text-green-400 font-bold">Spot on! The integer overflow nuance is what senior engineers look for.</p>
                    ) : (
                      <p className="text-rose-400 font-bold">Not quite. Look up "integer overflow in binary search" when you have a moment.</p>
                    )}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="text-center">
                {stepData.illustration === 'library' && (
                  <div className="w-32 h-32 mx-auto mb-8 text-indigo-500 opacity-50 flex items-center justify-center">
                     <BookOpen className="w-24 h-24" />
                  </div>
                )}
                <p className="text-xl text-gray-300 leading-relaxed">
                  {stepData.content}
                </p>
              </div>
            )}

            <div className="mt-12 flex justify-center">
              <button 
                onClick={handleNext}
                disabled={stepData.type === 'MICRO_PROBLEM' && !showFeedback}
                className="px-8 py-4 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all"
              >
                {currentStep === MOCK_MODULE_STEPS.length - 1 ? 'Complete Module' : 'I understand, next'} 
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConceptModuleStepper;
