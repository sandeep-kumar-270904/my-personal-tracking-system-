import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { Mic, MicOff, Play, Square, Loader2, Target, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardBanner from '../components/dashboard/DashboardBanner';

const BEHAVIORAL_QUESTIONS = [
  "Tell me about a time you had to learn a new technology on the fly.",
  "Describe a time when you had a conflict with a team member and how you resolved it.",
  "Tell me about a project you are most proud of and your specific contribution.",
  "How do you handle missing a deadline or realizing you won't meet it?",
  "Explain a complex technical concept to me as if I were a beginner.",
  "Tell me about a time you failed and what you learned from it.",
  "Describe a situation where you had to lead a team through a difficult technical challenge."
];

export default function MockInterviewPage() {
  const [question, setQuestion] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Pick a random question on load
    setQuestion(BEHAVIORAL_QUESTIONS[Math.floor(Math.random() * BEHAVIORAL_QUESTIONS.length)]);

    // Setup Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + ' ';
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          toast.error("Microphone access denied. Please enable it in your browser settings.");
          setIsRecording(false);
        }
      };
    } else {
      toast.error("Your browser does not support Speech Recognition. Please use Chrome.");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const evaluateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/ai/mock-interview-eval', data);
      return res.data;
    },
    onSuccess: (data) => {
      setEvaluation(data);
      toast.success('Evaluation complete!');
    },
    onError: () => {
      toast.error('Failed to evaluate. Please try again.');
    }
  });

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      // Wait a moment for final transcript, then submit
      setTimeout(() => {
        if (transcript.trim().length > 10) {
          evaluateMutation.mutate({ question, answer: transcript });
        } else {
          toast.error("Your answer was too short to evaluate!");
        }
      }, 500);
    } else {
      setTranscript('');
      setEvaluation(null);
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const nextQuestion = () => {
    setQuestion(BEHAVIORAL_QUESTIONS[Math.floor(Math.random() * BEHAVIORAL_QUESTIONS.length)]);
    setTranscript('');
    setEvaluation(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <DashboardBanner 
        title="AI Audio Mock Interview" 
        subtitle="Practice behavioral questions using your microphone and get instant AI feedback."
        icon={Mic}
      />

      <div className="max-w-4xl mx-auto space-y-6 mt-8">
        
        {/* Question Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-indigo-400">Current Question:</h2>
            <button 
              onClick={nextQuestion}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
              title="Next Question"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <p className="text-3xl font-bold text-white leading-tight mb-8">
            "{question}"
          </p>

          {/* Recording Controls */}
          <div className="flex flex-col items-center justify-center py-6 border-t border-slate-700">
            <div className="relative">
              {isRecording && (
                <motion.div 
                  className="absolute inset-0 bg-rose-500 rounded-full"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              <button
                onClick={toggleRecording}
                disabled={evaluateMutation.isPending}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg
                  ${isRecording 
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30'}
                  disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording ? <Square className="w-8 h-8 text-white fill-current" /> : <Mic className="w-10 h-10 text-white" />}
              </button>
            </div>
            <p className="text-slate-400 mt-6 font-medium">
              {isRecording ? "Listening... Speak clearly" : "Click to Start Recording"}
            </p>
          </div>
        </div>

        {/* Live Transcript */}
        <AnimatePresence>
          {transcript && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-6"
            >
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Live Transcription</h3>
              <p className="text-slate-300 leading-relaxed text-lg italic">"{transcript}"</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Evaluation Results */}
        <AnimatePresence>
          {evaluateMutation.isPending && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center"
            >
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Analyzing your answer...</h3>
              <p className="text-slate-400">Our AI recruiter is grading your clarity, conciseness, and use of the STAR method.</p>
            </motion.div>
          )}

          {evaluation && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden"
            >
              <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">AI Feedback</h3>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Score</span>
                  <div className={`text-3xl font-black ${evaluation.score >= 80 ? 'text-emerald-400' : evaluation.score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {evaluation.score}/100
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Overall Assessment</h4>
                  <p className="text-slate-200 text-lg leading-relaxed">{evaluation.feedback}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
                    <h4 className="text-emerald-400 font-medium flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-5 h-5" /> What you did well
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.strengths.map((str, i) => (
                        <li key={i} className="flex gap-2 text-slate-300">
                          <span className="text-emerald-500 mt-1">•</span> {str}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                    <h4 className="text-amber-400 font-medium flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5" /> Areas to improve
                    </h4>
                    <ul className="space-y-2">
                      {evaluation.improvements.map((imp, i) => (
                        <li key={i} className="flex gap-2 text-slate-300">
                          <span className="text-amber-500 mt-1">•</span> {imp}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
