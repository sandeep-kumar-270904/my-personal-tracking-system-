import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Mic, FileQuestion, BookOpen, Brain, Clock, Camera, FileText, Zap, Crosshair, Users, AlignLeft, ShieldAlert, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrainingHub() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    axios.get('/api/interviews/training/performance-dashboard')
      .then(res => setDashboard(res.data))
      .catch(console.error);
  }, []);

  const trainers = [
    { id: 'ritual', title: 'Opening Ritual', icon: <Mic />, pain: 'Stop freezing on the first question', desc: 'Practice your intro and first-minute transitions.' },
    { id: 'talk-coding', title: 'Talk While Coding', icon: <AlignLeft />, pain: 'Learn to narrate your thought process', desc: 'Code with live silence detection.' },
    { id: 'stuck', title: 'Stuck Recovery', icon: <ShieldAlert />, pain: 'Know exactly what to say when blanking', desc: 'Practice professional pivots.' },
    { id: 'question-bank', title: 'Question Bank', icon: <FileQuestion />, pain: 'Ask questions that make them remember you', desc: 'Build and categorize your end-of-interview questions.' },
    { id: 'skill-cal', title: 'Skill Calibration', icon: <Target />, pain: 'Fix over/under confidence gaps', desc: 'Align your claimed skills with your actual depth.' },
    { id: 'follow-up', title: 'Follow-Up Depth', icon: <Brain />, pain: 'Survive the 3rd layer of questioning', desc: 'Endurance training for deep-dive follow-ups.' },
    { id: 'time', title: 'Time Allocation', icon: <Clock />, pain: 'Stop running out of time during coding', desc: 'Train your internal phase clock.' },
    { id: 'story', title: 'Story Naturalness', icon: <BookOpen />, pain: 'Sound human, not rehearsed', desc: 'Deliver behavioral stories without sounding robotic.' },
    { id: 'cold', title: 'Cold Interviewer', icon: <Zap />, pain: 'Perform without validation', desc: 'Simulate a session with zero positive feedback.' },
    { id: 'memory', title: 'Memory Capture', icon: <Camera />, pain: 'Stop forgetting the interview 5 mins later', desc: 'Instant post-interview debrief questions.' },
    { id: 'wrong', title: 'Wrong Answer Recovery', icon: <Crosshair />, pain: 'Bounce back from a bad approach', desc: 'Practice receiving correction gracefully.' },
    { id: 'signal', title: 'Signal Reader', icon: <Users />, pain: 'Read the room', desc: 'Learn to decode subtle interviewer cues.' },
    { id: 'video', title: 'Human Presence', icon: <Camera />, pain: 'Master the video interview', desc: 'Train eye contact and composure on camera.' },
    { id: 'detail', title: 'Detail Calibration', icon: <FileText />, pain: 'Stop rambling or being too brief', desc: 'Learn to budget your answer length.' },
    { id: 'protocol', title: 'Pre-Interview Protocol', icon: <Award />, pain: 'Optimize the 24 hours before', desc: 'Your data-backed ritual for peak performance.' }
  ];

  if (!dashboard) return <div className="p-8 text-white">Loading Training Hub...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Training Hub</h1>
        <p className="text-gray-400">15 targeted mechanics to build your human performance skills.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Readiness Score</p>
            <h2 className="text-4xl font-bold text-indigo-400">{dashboard.trainingReadinessScore}%</h2>
          </div>
          <Target className="w-12 h-12 text-indigo-500/20" />
        </div>
        
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl">
          <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-3">Recommended This Week</p>
          <div className="space-y-2">
            {dashboard.recommendedTrainings.map((t, i) => (
              <div key={i} className="bg-indigo-900/30 text-indigo-300 text-sm px-3 py-2 rounded font-medium border border-indigo-500/30">
                {t}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 border border-gray-700 p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Training Streak</p>
            <div className="flex items-end space-x-2">
              <h2 className="text-4xl font-bold text-emerald-400">4</h2>
              <span className="text-gray-400 mb-1">days</span>
            </div>
          </div>
          <Zap className="w-12 h-12 text-emerald-500/20" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Training Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map(trainer => (
            <div key={trainer.id} className="bg-gray-900 border border-gray-800 hover:border-indigo-500 transition-colors p-5 rounded-xl flex flex-col h-full cursor-pointer group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {React.cloneElement(trainer.icon, { className: 'w-24 h-24 text-white' })}
              </div>
              <div className="flex items-center space-x-3 mb-3 relative z-10">
                <div className="p-2 bg-gray-800 rounded-lg text-indigo-400">
                  {React.cloneElement(trainer.icon, { className: 'w-5 h-5' })}
                </div>
                <h3 className="font-bold text-white text-lg">{trainer.title}</h3>
              </div>
              <p className="text-xs font-medium text-rose-400 mb-2 relative z-10">{trainer.pain}</p>
              <p className="text-sm text-gray-400 flex-grow relative z-10">{trainer.desc}</p>
              <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center relative z-10">
                <span className="text-xs text-gray-500">0 sessions</span>
                <span className="text-sm text-indigo-400 font-bold group-hover:text-indigo-300">Start Session &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
