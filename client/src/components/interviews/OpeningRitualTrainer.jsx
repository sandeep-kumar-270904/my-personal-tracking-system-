import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, Play, CheckCircle, RefreshCw } from 'lucide-react';

export default function OpeningRitualTrainer() {
  const [phase, setPhase] = useState(0); // 0: Start, 1: Greeting, 2: First Question, 3: Completed
  const [sessionCount, setSessionCount] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [score, setScore] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  
  const timerRef = useRef(null);

  // Fallback if SpeechRecognition isn't available
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let current = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          current += e.results[i][0].transcript;
        }
        setTranscript(prev => prev + ' ' + current);
      };
      setRecognition(rec);
    }
  }, []);

  const startPhase = (newPhase, time) => {
    setPhase(newPhase);
    setTimeRemaining(time);
    setTranscript('');
    setScore(null);
    setFeedback('');
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          stopRecordingAndSubmit(newPhase);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleRecording = () => {
    if (recording) {
      if (recognition) recognition.stop();
      setRecording(false);
    } else {
      if (recognition) recognition.start();
      setRecording(true);
    }
  };

  const stopRecordingAndSubmit = async (currentPhase) => {
    if (recognition && recording) recognition.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setLoading(true);
    try {
      const practiceType = currentPhase === 1 ? 'GREETING' : 'FIRST_QUESTION_RESPONSE';
      const res = await axios.post('/api/interviews/training/opening-ritual', {
        transcript,
        practiceType,
        timeToFirstWord: 2, // Mocked for now
        hesitationCount: (transcript.match(/um|uh|like/g) || []).length
      });
      setScore(res.data.fluencyScore);
      setFeedback(res.data.feedbackText);
    } catch (e) {
      console.error(e);
      setFeedback("Failed to evaluate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Mic className="w-6 h-6 mr-2 text-indigo-400" />
        Opening Ritual Trainer
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Practice the first 2 minutes of the interview. Eliminate the freeze response.</p>

      {phase === 0 && (
        <div className="text-center py-10 bg-gray-800 rounded-xl">
          <p className="mb-6 font-medium">Session {sessionCount + 1} / 5</p>
          <button onClick={() => startPhase(1, 60)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg transition-colors flex items-center justify-center mx-auto">
            <Play className="w-5 h-5 mr-2" /> Start Greeting Phase
          </button>
        </div>
      )}

      {(phase === 1 || phase === 2) && (
        <div className="space-y-6">
          <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-xl">
            <p className="text-xs text-indigo-400 font-bold uppercase mb-2">Simulated Interviewer</p>
            <p className="text-lg font-medium">
              {phase === 1 
                ? "Hi, can you hear me okay? Great — let's get started. Can you tell me a little about yourself?"
                : "Great, let's start. Given an array of integers find the two numbers that add up to a target sum."}
            </p>
          </div>

          <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl">
            <div className="flex items-center space-x-4">
              <button onClick={toggleRecording} className={`p-4 rounded-full ${recording ? 'bg-rose-500 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'}`}>
                {recording ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
              <div>
                <p className="text-sm font-bold text-gray-300">{recording ? 'Recording...' : 'Microphone Off'}</p>
                <p className="text-xs text-gray-500">Click to toggle. Try not to use text input.</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold uppercase">Time Remaining</p>
              <p className={`text-2xl font-bold ${timeRemaining < 10 ? 'text-rose-400' : 'text-emerald-400'}`}>
                00:{timeRemaining.toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          <div>
            <textarea 
              value={transcript} 
              onChange={(e) => setTranscript(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 min-h-[100px] focus:outline-none focus:border-indigo-500"
              placeholder="Your speech will appear here... (or you can type as a fallback)"
            />
          </div>

          {!score && !loading && (
            <button onClick={() => stopRecordingAndSubmit(phase)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-lg text-white">
              Submit Answer
            </button>
          )}

          {loading && (
            <div className="text-center py-4 text-indigo-400 animate-pulse">Evaluating your response...</div>
          )}

          {score && (
            <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-emerald-400 flex items-center"><CheckCircle className="w-5 h-5 mr-2" /> Evaluation</h4>
                <span className="font-bold text-xl">{score}/100</span>
              </div>
              <p className="text-sm text-gray-300 mb-5">{feedback}</p>
              
              {phase === 1 ? (
                <button onClick={() => startPhase(2, 30)} className="w-full py-2 bg-indigo-600 rounded-lg font-bold">Next: First Technical Question</button>
              ) : (
                <button onClick={() => { setSessionCount(c => c+1); setPhase(0); }} className="w-full py-2 bg-gray-700 rounded-lg font-bold">Complete Session & Next Iteration</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
