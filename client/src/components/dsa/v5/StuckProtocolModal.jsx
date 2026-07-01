import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MessageSquare, Send, Brain, Lock } from 'lucide-react';
import api from '../../../services/api';

const StuckProtocolModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState('WARNING'); // WARNING, RUBBER_DUCK, UNLOCKED
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Quack! I am your rubber duck. Explain to me what you are trying to do, step by step.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsgs = [...messages, { role: 'user', content: input }];
    setMessages(newMsgs);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/dsa/rubber-duck', { messages: newMsgs });
      setMessages([...newMsgs, { role: 'assistant', content: res.data.reply }]);
      
      if (res.data.unlocked) {
        setStep('UNLOCKED');
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMsgs, { role: 'assistant', content: 'Quack? Try rephrasing that.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[80vh]"
        >
          {step === 'WARNING' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Stuck Protocol Activated</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Looking at the solution right now will short-circuit your learning. You need to articulate the exact bottleneck first.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold transition-colors"
                >
                  I'll keep trying
                </button>
                <button 
                  onClick={() => setStep('RUBBER_DUCK')}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" /> Talk to Duck
                </button>
              </div>
            </div>
          )}

          {step === 'RUBBER_DUCK' && (
            <>
              <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center text-xl">🦆</div>
                  <div>
                    <h3 className="font-bold text-white">Rubber Duck Mode</h3>
                    <p className="text-xs text-amber-400 font-medium">Socratic Guidance Only</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">Cancel</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 border border-gray-700 rounded-tl-none'}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-tl-none flex gap-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-800 bg-gray-900 shrink-0">
                <div className="relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="My current approach is..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-4 pr-12 py-3 text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 top-2 p-1.5 bg-amber-500 hover:bg-amber-400 text-gray-900 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'UNLOCKED' && (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">You got the breakthrough!</h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                You successfully identified the bottleneck. By articulating the problem, you found the core issue yourself.
              </p>
              <button 
                onClick={onClose}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
              >
                Return to Coding
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StuckProtocolModal;
