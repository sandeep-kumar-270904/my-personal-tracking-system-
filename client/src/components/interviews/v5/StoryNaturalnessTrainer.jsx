import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Mic, CheckCircle } from 'lucide-react';

export default function StoryNaturalnessTrainer() {
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);

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

  const toggleRecording = () => {
    if (recording) {
      if (recognition) recognition.stop();
      setRecording(false);
    } else {
      setTranscript('');
      if (recognition) recognition.start();
      setRecording(true);
    }
  };

  const evaluateStory = async () => {
    if (recognition && recording) recognition.stop();
    setRecording(false);
    setLoading(true);
    try {
      const res = await axios.post('/api/interviews/training/story-naturalness', { transcript, deliveryMethod: 'SPOKEN' });
      setScore(res.data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <BookOpen className="w-6 h-6 mr-2 text-teal-400" />
        Story Naturalness Trainer
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Tell your behavioral story. We will scan for robotic phrases that sound rehearsed.</p>

      {!score ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-800 p-4 rounded-xl">
            <div className="flex items-center space-x-4">
              <button onClick={toggleRecording} className={`p-4 rounded-full ${recording ? 'bg-rose-500 animate-pulse' : 'bg-gray-700 hover:bg-gray-600'}`}>
                <Mic className="w-6 h-6" />
              </button>
              <div>
                <p className="text-sm font-bold text-gray-300">{recording ? 'Listening to your story...' : 'Ready to record'}</p>
                <p className="text-xs text-gray-500">Speak naturally as if talking to a colleague.</p>
              </div>
            </div>
          </div>
          
          <textarea 
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm focus:outline-none focus:border-teal-500 min-h-[150px]"
            placeholder="Your spoken story will appear here..."
            disabled={recording || loading}
          />

          <button onClick={evaluateStory} disabled={!transcript || loading} className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 font-bold rounded-lg text-white">
            {loading ? 'Analyzing Naturalness...' : 'Evaluate Delivery'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-xl border border-teal-500/30">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-teal-400 flex items-center"><CheckCircle className="mr-2" /> Evaluation Complete</h3>
            <span className="text-2xl font-bold">{score.naturalnesScore}/100</span>
          </div>

          <div className="space-y-4 mb-6 text-sm">
            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="font-bold text-rose-400 mb-2 uppercase tracking-wider text-xs">Robotic Phrases Detected</h4>
              {score.roboticPhrases.length > 0 ? (
                <ul className="list-disc pl-4 text-gray-300 space-y-1">
                  {score.roboticPhrases.map((p, i) => <li key={i}>"{p}"</li>)}
                </ul>
              ) : <p className="text-gray-500 italic">None detected. Good job!</p>}
              <p className="text-xs text-gray-500 mt-2 italic">These sound scripted. Try conversational alternatives like "What ended up happening was..."</p>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg">
              <h4 className="font-bold text-emerald-400 mb-2 uppercase tracking-wider text-xs">Genuine Moments</h4>
              {score.genuineMoments.length > 0 ? (
                <ul className="list-disc pl-4 text-gray-300 space-y-1">
                  {score.genuineMoments.map((p, i) => <li key={i}>"{p}"</li>)}
                </ul>
              ) : <p className="text-gray-500 italic">Need more specific, sensory details.</p>}
            </div>
          </div>

          <button onClick={() => setScore(null)} className="w-full py-2 bg-gray-700 hover:bg-gray-600 font-bold rounded-lg">Retry Story</button>
        </div>
      )}
    </div>
  );
}
