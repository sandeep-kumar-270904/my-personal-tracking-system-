import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { BadgeDollarSign, Send, User, Bot, Briefcase, RefreshCw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardBanner from '../components/dashboard/DashboardBanner';

export default function NegotiationSimulatorPage() {
  const [offerDetails, setOfferDetails] = useState({
    company: 'Tech Corp',
    role: 'Software Engineer',
    baseSalary: '$100,000'
  });
  
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      role: 'recruiter',
      content: `Hi there! We are thrilled to offer you the ${offerDetails.role} position at ${offerDetails.company}. We'd like to start with a base salary of ${offerDetails.baseSalary}. How does that sound to you?`
    }
  ]);
  
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const negotiateMutation = useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/ai/negotiate', data);
      return res.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: 'recruiter', content: data.reply }]);
    },
    onError: () => {
      toast.error('The recruiter disconnected. Please try again.');
      setMessages(prev => {
        const newMsgs = [...prev];
        // Remove the user's message if it failed
        if (newMsgs[newMsgs.length - 1].role === 'user') {
          newMsgs.pop();
        }
        return newMsgs;
      });
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || negotiateMutation.isPending) return;

    const userMsg = input.trim();
    setInput('');
    
    setMessages(prev => [...prev, { id: `msg-${Date.now()}`, role: 'user', content: userMsg }]);

    negotiateMutation.mutate({
      history: messages,
      currentMessage: userMsg,
      offerDetails
    });
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to restart the negotiation?")) {
      setMessages([{
        id: 'msg-1',
        role: 'recruiter',
        content: `Hi there! We are thrilled to offer you the ${offerDetails.role} position at ${offerDetails.company}. We'd like to start with a base salary of ${offerDetails.baseSalary}. How does that sound to you?`
      }]);
      negotiateMutation.reset();
    }
  };

  return (
    <div className="space-y-6 pb-20 h-full flex flex-col">
      <DashboardBanner 
        title="Salary Negotiation Simulator" 
        subtitle="Practice negotiating your job offer against an AI Recruiter before you do it in real life."
        icon={BadgeDollarSign}
      />

      <div className="flex-1 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        
        {/* Left Sidebar: Offer Context */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                Offer Details
              </h3>
              <button 
                onClick={handleReset}
                className="text-slate-400 hover:text-white transition-colors"
                title="Restart Simulation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium">Company</label>
                <input 
                  type="text" 
                  value={offerDetails.company}
                  onChange={(e) => setOfferDetails({...offerDetails, company: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium">Role</label>
                <input 
                  type="text" 
                  value={offerDetails.role}
                  onChange={(e) => setOfferDetails({...offerDetails, role: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase font-medium">Base Salary</label>
                <input 
                  type="text" 
                  value={offerDetails.baseSalary}
                  onChange={(e) => setOfferDetails({...offerDetails, baseSalary: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button 
                onClick={handleReset}
                className="w-full mt-4 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Update & Restart
              </button>
            </div>
          </div>

          <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 text-sm text-slate-300">
            <h4 className="font-semibold text-indigo-400 mb-2">Negotiation Tips</h4>
            <ul className="space-y-2 list-disc pl-4">
              <li>Always show gratitude first.</li>
              <li>Ask if there is flexibility in the base or sign-on bonus.</li>
              <li>Use data to justify your ask (e.g., market averages).</li>
              <li>Don't be afraid if they say no—they rarely pull the offer.</li>
            </ul>
          </div>
        </div>

        {/* Right Area: Chat Interface */}
        <div className="lg:col-span-3 bg-slate-800 border border-slate-700 rounded-2xl flex flex-col h-[600px] overflow-hidden shadow-xl">
          
          {/* Chat Header */}
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Recruiter</h3>
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online
              </p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-900/50">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-2xl p-4 ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-sm' 
                      : 'bg-slate-700 text-slate-200 rounded-bl-sm border border-slate-600'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              
              {negotiateMutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-700 border border-slate-600 rounded-2xl rounded-bl-sm p-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                    <span className="text-slate-400 text-sm">Recruiter is typing...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-4 bg-slate-900 border-t border-slate-700">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your response... (e.g. Is there any flexibility on the base salary?)"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-4 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={negotiateMutation.isPending}
              />
              <button
                type="submit"
                disabled={!input.trim() || negotiateMutation.isPending}
                className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}
