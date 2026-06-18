import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, ShieldAlert, Send, DollarSign } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const NegotiateTab = ({ applicationId }) => {
  const queryClient = useQueryClient();
  const [base, setBase] = useState('');
  const [variable, setVariable] = useState('');
  const [equity, setEquity] = useState('');
  const [targetCTC, setTargetCTC] = useState('');
  const [batna, setBatna] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  const { data: session, isLoading } = useQuery({
    queryKey: ['negotiation', applicationId],
    queryFn: async () => {
      try {
        const res = await api.get(`/applications/${applicationId}/negotiation-sim`);
        return res.data;
      } catch (err) {
        return null; // Not initialized
      }
    },
    enabled: !!applicationId,
    retry: false
  });

  const initSimMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/applications/${applicationId}/negotiation-sim`, {
        offeredCTC: { base: Number(base), variable: Number(variable), equity: Number(equity) },
        targetCTC: Number(targetCTC),
        batna
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['negotiation', applicationId]);
      toast.success('Strategy generated!');
    },
    onError: () => toast.error('Failed to generate strategy')
  });

  const sendChatMutation = useMutation({
    mutationFn: async (msg) => {
      const res = await api.post(`/applications/${applicationId}/negotiation-chat`, { message: msg });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['negotiation', applicationId]);
      setChatMessage('');
    }
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    sendChatMutation.mutate(chatMessage);
  };

  if (!session && !initSimMutation.isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-blue-400 mb-1">Negotiation Simulator</h4>
            <p className="text-sm text-slate-300">Enter offer details to generate a strategy and roleplay the negotiation with our AI recruiter.</p>
          </div>
        </div>

        <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Offered Base (LPA)</label>
            <input type="number" value={base} onChange={e => setBase(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm" placeholder="e.g. 15" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Variable</label>
              <input type="number" value={variable} onChange={e => setVariable(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm" placeholder="e.g. 2" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Equity</label>
              <input type="number" value={equity} onChange={e => setEquity(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm" placeholder="e.g. 5" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target CTC (LPA)</label>
            <input type="number" value={targetCTC} onChange={e => setTargetCTC(e.target.value)} className="w-full bg-[#ff6b00]/10 border border-[#ff6b00]/30 rounded-lg p-2 text-[#ff6b00] font-bold text-sm" placeholder="e.g. 25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">BATNA / Competing Offers</label>
            <input type="text" value={batna} onChange={e => setBatna(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white text-sm" placeholder="e.g. 20 LPA from Amazon" />
          </div>
          <button 
            onClick={() => initSimMutation.mutate()} 
            disabled={!base || !targetCTC || initSimMutation.isLoading}
            className="w-full btn-primary py-2 mt-2"
          >
            {initSimMutation.isLoading ? 'Analyzing...' : 'Generate Strategy'}
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || initSimMutation.isLoading) return <div className="text-center py-10 text-slate-400 animate-pulse">Loading Strategy...</div>;

  return (
    <div className="flex flex-col h-[500px]">
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-4 flex-shrink-0">
        <h3 className="font-bold text-white mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400"/> Strategy</h3>
        <p className={`text-sm font-semibold mb-2 ${session.strategy.isAdvisable ? 'text-emerald-400' : 'text-red-400'}`}>
          {session.strategy.isAdvisable ? 'Advisable to negotiate.' : 'High risk to negotiate.'}
        </p>
        <p className="text-sm text-slate-300 mb-2"><strong>Ask:</strong> {session.strategy.recommendedAsk}</p>
        <p className="text-sm text-slate-400 italic">"{session.strategy.callOpeningLine}"</p>
      </div>

      <div className="flex-1 bg-black/30 rounded-xl border border-white/5 overflow-hidden flex flex-col relative">
        <div className="p-3 border-b border-white/5 bg-white/5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5" /> Roleplay Simulator
          </h4>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {session.chatHistory.map((msg, idx) => {
            const isModel = msg.role === 'model';
            return (
              <div key={idx} className={`flex ${isModel ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${isModel ? 'bg-white/10 text-slate-200 rounded-tl-sm' : 'bg-[#ff6b00]/20 border border-[#ff6b00]/30 text-white rounded-tr-sm'}`}>
                  {msg.parts[0].text}
                </div>
              </div>
            );
          })}
          {sendChatMutation.isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 p-3 rounded-xl text-slate-400 text-xs animate-pulse">Recruiter typing...</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-3 bg-white/5 border-t border-white/5 flex gap-2">
          <input 
            type="text" 
            value={chatMessage}
            onChange={e => setChatMessage(e.target.value)}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ff6b00]"
            placeholder="Type your response..."
            disabled={sendChatMutation.isLoading}
          />
          <button type="submit" disabled={!chatMessage.trim() || sendChatMutation.isLoading} className="p-2 bg-[#ff6b00] text-white rounded-lg hover:bg-[#e66000] disabled:opacity-50">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default NegotiateTab;
