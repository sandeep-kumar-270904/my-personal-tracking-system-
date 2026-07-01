import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Mic, AlignLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function TalkWhileCodingTrainer() {
  const [code, setCode] = useState('// Write your solution here...\nfunction twoSum(nums, target) {\n  \n}');
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [silenceWarning, setSilenceWarning] = useState(false);
  const [score, setScore] = useState(null);
  
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const mediaStreamRef = useRef(null);

  const startTraining = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      setRecording(true);
      setTranscript('Starting narration capture... ');
      monitorSilence();

      // Mocking speech recognition text updates for UI purposes
      const mockInterval = setInterval(() => {
        setTranscript(prev => prev + 'thinking aloud... ');
      }, 5000);
      
      return () => clearInterval(mockInterval);
    } catch (e) {
      console.error("Mic access denied or error:", e);
      alert("Microphone access is required for Talk While Coding training.");
    }
  };

  const monitorSilence = () => {
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    const checkAudio = () => {
      if(!recording) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const sum = dataArray.reduce((a, b) => a + b, 0);
      const isSilent = sum < 1000; // Threshold

      if (isSilent) {
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            setSilenceWarning(true);
          }, 10000); // 10 seconds of silence
        }
      } else {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
          setSilenceWarning(false);
        }
      }
      requestAnimationFrame(checkAudio);
    };
    checkAudio();
  };

  const finishSession = async () => {
    setRecording(false);
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current) audioContextRef.current.close();
    
    try {
      const res = await axios.post('/api/interviews/training/talk-while-coding', {
        transcript,
        silenceGaps: [], // Mocked
        longestSilence: 12
      });
      setScore(res.data);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <AlignLeft className="w-6 h-6 mr-2 text-blue-400" />
          Talk While Coding Trainer
        </h2>
        {!recording && !score ? (
          <button onClick={startTraining} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold">Start Session</button>
        ) : recording ? (
          <button onClick={finishSession} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-bold">Finish & Evaluate</button>
        ) : null}
      </div>

      {score ? (
        <div className="bg-gray-800 p-6 rounded-xl border border-emerald-500/30">
          <h3 className="text-emerald-400 font-bold mb-4 flex items-center"><CheckCircle className="mr-2" /> Session Evaluation</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-900 p-4 rounded text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Narration Quality</p>
              <p className="text-3xl font-bold">{score.narrationQuality}/100</p>
            </div>
            <div className="bg-gray-900 p-4 rounded text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Longest Silence</p>
              <p className="text-3xl font-bold text-amber-400">{score.longestSilence}s</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 bg-gray-900 p-3 rounded border border-gray-700">{score.feedbackText}</p>
          <button onClick={() => setScore(null)} className="mt-4 text-blue-400 text-sm hover:underline">Try another session</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 flex flex-col h-[400px]">
            <div className="bg-gray-900 px-4 py-2 border-b border-gray-700 text-xs text-gray-400 font-mono">solution.js</div>
            <textarea 
              value={code} 
              onChange={e => setCode(e.target.value)}
              className="w-full flex-grow bg-transparent p-4 font-mono text-sm text-gray-300 focus:outline-none resize-none"
              spellCheck="false"
            />
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 flex flex-col h-[400px] relative">
            <div className="bg-gray-900 px-4 py-2 border-b border-gray-700 text-xs text-gray-400 font-bold flex justify-between items-center">
              <span>Narration Feed</span>
              {recording && <span className="flex items-center text-rose-400"><span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse mr-2"></span>Live</span>}
            </div>
            
            <div className="p-4 overflow-y-auto flex-grow text-sm text-gray-400 italic">
              {transcript || "Click 'Start Session' and speak while you code. We will detect if you stay silent for too long."}
            </div>

            {silenceWarning && (
              <div className="absolute bottom-4 left-4 right-4 bg-rose-900/90 border border-rose-500 p-3 rounded-lg flex items-start shadow-xl animate-bounce">
                <AlertCircle className="w-5 h-5 text-rose-400 mr-2 flex-shrink-0" />
                <p className="text-sm font-bold text-rose-200">Keep talking — what are you thinking right now? What does the next line do?</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
