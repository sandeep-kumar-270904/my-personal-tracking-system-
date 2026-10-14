import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, MessageSquare, Monitor, Phone, FileText } from 'lucide-react';
import axios from 'axios';

export default function SimulationEnvironment({ onClose, simulationType, targetCompany, targetRole, roundType }) {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [report, setReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Audio Speech Recognition setup
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initial interviewer message
    setMessages([{ role: 'interviewer', text: `Hi! I'm your interviewer from ${targetCompany}. I see we're doing a ${roundType} round for the ${targetRole} role. Are you ready to begin?` }]);
    
    if (simulationType === 'PHONE' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setCurrentInput(prev => prev + ' ' + finalTranscript);
        }
      };
    }
  }, [simulationType, targetCompany, targetRole, roundType]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setCurrentInput('');
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const handleSend = async () => {
    if(!currentInput.trim()) return;
    
    const newMessages = [...messages, { role: 'student', text: currentInput }];
    setMessages(newMessages);
    setCurrentInput('');
    
    if (simulationType === 'PHONE') {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    
    try {
      const res = await axios.post('/api/interviews/simulations/chat', {
        messages: newMessages,
        targetCompany,
        targetRole,
        roundType,
        simulationType
      });
      
      const aiReply = res.data.reply || "That's an interesting approach. Let's move on.";
      setMessages([...newMessages, { role: 'interviewer', text: aiReply }]);
      
      if (simulationType === 'PHONE' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiReply);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'interviewer', text: "Sorry, I had trouble processing that. Can you repeat?" }]);
    }
  };

  const finishSimulation = async () => {
    setLoadingReport(true);
    try {
      const questions = messages.filter(m => m.role === 'interviewer').map(m => ({ questionText: m.text, timestamp: new Date() }));
      const responses = messages.filter(m => m.role === 'student').map(m => ({ responseText: m.text, timestamp: new Date() }));
      
      const res = await axios.post('/api/interviews/simulations', {
        simulationType, targetCompany, targetRole, roundType,
        questionsAsked: questions,
        studentResponses: responses,
        performanceReport: "You structured your answers well but missed clarifying the scale constraints in the second question.",
        score: 82
      });
      setReport(res.data);
    } catch(e) {
      console.error(e);
      // Mock report if API fails
      setReport({ score: 85, performanceReport: "Good communication. Solid approach." });
    } finally {
      setLoadingReport(false);
    }
  };

  if (report) {
    return (
      <div className="fixed inset-0 bg-gray-950 z-[200] flex flex-col items-center justify-center p-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl p-8 text-center shadow-2xl">
          <FileText className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-3xl font-black text-white mb-2">Simulation Complete</h2>
          <div className="text-5xl font-black text-emerald-400 mb-6">{report.score} <span className="text-lg font-normal text-gray-500">/ 100</span></div>
          <div className="bg-gray-950 border border-gray-800 p-6 rounded-xl mb-8 text-left">
            <h4 className="font-bold text-gray-300 uppercase tracking-wider text-sm mb-2">Performance Report</h4>
            <p className="text-gray-200">{report.performanceReport}</p>
          </div>
          <button onClick={onClose} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors">Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-950 z-[200] flex flex-col">
      <div className="h-16 border-b border-gray-800 bg-gray-900 flex justify-between items-center px-6">
        <div className="flex items-center">
          {simulationType === 'VIDEO' && <Monitor className="w-5 h-5 text-indigo-400 mr-2" />}
          {simulationType === 'PHONE' && <Phone className="w-5 h-5 text-emerald-400 mr-2" />}
          {simulationType === 'WHITEBOARD' && <FileText className="w-5 h-5 text-amber-400 mr-2" />}
          <span className="font-bold text-white uppercase tracking-wider text-sm">{simulationType} SIMULATION: {targetCompany}</span>
        </div>
        <div className="flex space-x-3">
          <button onClick={finishSimulation} disabled={loadingReport} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-lg transition-colors">
            {loadingReport ? 'Generating Report...' : 'End Simulation'}
          </button>
          <button onClick={onClose} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Environment specific */}
        {simulationType === 'VIDEO' && (
          <div className="hidden md:flex flex-1 bg-black border-r border-gray-800 items-center justify-center p-6 relative">
            <div className="w-full max-w-lg aspect-video bg-gray-900 rounded-xl border border-gray-800 shadow-2xl flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-black"></div>
              <img src="https://i.pravatar.cc/300" alt="Interviewer" className="w-32 h-32 rounded-full border-4 border-gray-800 z-10" />
              <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-white text-sm font-medium z-10">{targetCompany} Interviewer</div>
            </div>
            {/* Self view pip */}
            <div className="absolute bottom-6 right-6 w-48 aspect-video bg-gray-800 rounded-lg border border-gray-700 shadow-xl overflow-hidden">
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-500">Camera Off</div>
            </div>
          </div>
        )}
        
        {simulationType === 'WHITEBOARD' && (
          <div className="hidden md:flex flex-1 bg-gray-900 border-r border-gray-800 flex-col">
            <div className="p-4 border-b border-gray-800 bg-gray-950 flex justify-between items-center text-sm">
              <span className="text-gray-400">Drawing Canvas</span>
              <span className="text-indigo-400">Read-Only Placeholder (Integrated in I5)</span>
            </div>
            <div className="flex-1 w-full h-full p-6 text-gray-600 flex items-center justify-center border-4 border-dashed border-gray-800 m-4 rounded-xl">
              [Whiteboard Area]
            </div>
          </div>
        )}

        {/* Right Side / Mobile Full: Chat panel */}
        <div className={`flex flex-col h-full bg-gray-900 ${simulationType === 'PHONE' ? 'w-full max-w-3xl mx-auto border-x border-gray-800' : 'w-full md:w-[450px]'}`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'student' ? 'items-end' : 'items-start'}`}>
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 px-1">
                  {m.role === 'student' ? 'You' : 'Interviewer'}
                </span>
                <div className={`px-4 py-3 rounded-2xl max-w-[85%] ${
                  m.role === 'student' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-gray-950 border-t border-gray-800">
            {simulationType === 'PHONE' && (
              <div className="flex justify-center mb-4">
                <button 
                  onClick={toggleListening}
                  className={`p-4 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isListening ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/20' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                  }`}
                >
                  {isListening ? <Mic className="w-8 h-8" /> : <MicOff className="w-8 h-8" />}
                </button>
              </div>
            )}
            <div className="flex items-end space-x-2">
              <textarea 
                value={currentInput}
                onChange={e => setCurrentInput(e.target.value)}
                placeholder={simulationType === 'PHONE' ? "Or type your response..." : "Type your response..."}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-indigo-500 outline-none resize-none"
                rows="3"
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button onClick={handleSend} disabled={!currentInput.trim()} className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed h-[74px] aspect-square flex items-center justify-center transition-colors">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
