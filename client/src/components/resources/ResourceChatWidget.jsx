import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, AlertCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

const ResourceChatWidget = ({ resourceId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [usage, setUsage] = useState({ count: 0, max: 20 });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (msg) => {
      const res = await api.post(`/resource-chat/${resourceId}`, {
        message: msg,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });
      return res.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
      setUsage({ count: data.usage, max: data.maxUsage });
    },
    onError: (err) => {
      setMessages(prev => [...prev, { role: 'model', content: err.response?.data?.message || 'Sorry, I encountered an error. Please try again later.', isError: true }]);
    }
  });

  const handleSend = () => {
    if (!input.trim() || chatMutation.isPending) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    chatMutation.mutate(userMsg);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[400px] bg-[#13141f] rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-white/10 bg-[#1a1b26]/50 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-bold text-white text-sm">Ask AI about this resource</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 bg-white/5 px-2 py-1 rounded">
          {usage.count}/{usage.max} questions today
        </span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 opacity-50">
            <Bot className="w-8 h-8" />
            <p className="text-xs text-center max-w-[200px]">I can help explain concepts, summarize this resource, or answer related questions.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-tr-sm' : msg.isError ? 'bg-red-500/20 text-red-200 border border-red-500/30 rounded-tl-sm' : 'bg-[#1a1b26] border border-white/5 text-slate-200 rounded-tl-sm'}`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-[#1a1b26] border border-white/5 rounded-tl-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/10 bg-[#1a1b26]/30">
        <div className="relative flex items-center">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={chatMutation.isPending || usage.count >= usage.max}
            placeholder={usage.count >= usage.max ? "Limit reached for today" : "Ask a question..."}
            className="w-full bg-[#13141f] border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending || usage.count >= usage.max}
            className="absolute right-2 p-1.5 bg-indigo-500 text-white rounded-lg disabled:opacity-50 disabled:bg-slate-700 hover:bg-indigo-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceChatWidget;
