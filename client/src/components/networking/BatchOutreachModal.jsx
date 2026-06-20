import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const BatchOutreachModal = ({ contacts, onClose, onComplete }) => {
  const [channel, setChannel] = useState('LINKEDIN');
  const [messageType, setMessageType] = useState('INITIAL_CONTACT');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data } = await api.post('/networking/outreach/batch-generate', {
        contactIds: contacts.map(c => c._id),
        channel,
        messageType
      });
      setGeneratedMessages(data);
      toast.success('Batch generation complete');
    } catch (error) {
      toast.error('Failed to generate messages');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateMessage = (index, newText) => {
    const updated = [...generatedMessages];
    updated[index].message = newText;
    setGeneratedMessages(updated);
  };

  const handleSendAll = async () => {
    setIsSending(true);
    try {
      const validMessages = generatedMessages.filter(m => !m.error);
      await api.post('/networking/outreach/bulk-send', {
        messages: validMessages.map(m => ({
          contactId: m.contactId,
          messageContent: m.message,
          channel,
          messageType,
          aiGenerated: true
        }))
      });
      toast.success(`Logged ${validMessages.length} messages and scheduled follow-ups!`);
      onComplete();
    } catch (error) {
      toast.error('Failed to log bulk messages');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Bot className="text-blue-400" /> AI Batch Outreach
            </h2>
            <p className="text-sm text-slate-400 mt-1">Generating personalized messages for {contacts.length} contacts</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {generatedMessages.length === 0 ? (
            <div className="space-y-6 max-w-md mx-auto py-8">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Channel</label>
                <select 
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full bg-[#13141f] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="LINKEDIN">LinkedIn DM</option>
                  <option value="EMAIL">Email</option>
                  <option value="TWITTER">Twitter/X</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Message Type</label>
                <select 
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="w-full bg-[#13141f] border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500"
                >
                  <option value="INITIAL_CONTACT">Initial Contact</option>
                  <option value="FOLLOW_UP">Follow Up</option>
                  <option value="REFERRAL_REQUEST">Referral Request</option>
                  <option value="THANK_YOU">Thank You</option>
                </select>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
              >
                {isGenerating ? <><Bot className="animate-spin" /> Generating...</> : <><Bot /> Generate {contacts.length} Messages</>}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm text-blue-400">
                <AlertCircle className="shrink-0" />
                <p>Review and edit the AI-generated messages below. Use the copy button to copy each message to paste into LinkedIn/Email. When you're done sending them, click "Log All as Sent" to update your CRM.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {generatedMessages.map((msg, idx) => (
                  <div key={idx} className="bg-[#13141f] border border-white/5 rounded-xl p-4 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-white">{msg.contactName}</h4>
                        <p className="text-xs text-slate-400">{msg.contactCompany}</p>
                      </div>
                      {!msg.error && (
                        <div className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                          <CheckCircle size={12} /> {msg.estimatedResponseProbability}% expected response
                        </div>
                      )}
                    </div>
                    
                    <textarea 
                      value={msg.message}
                      onChange={(e) => handleUpdateMessage(idx, e.target.value)}
                      className="w-full flex-1 bg-[#0a0a0f] border border-white/10 rounded-lg p-3 text-sm text-slate-300 focus:outline-none focus:border-blue-500 resize-none h-32 custom-scrollbar"
                    />
                    
                    <div className="mt-3 flex justify-end">
                      <button 
                        onClick={() => copyToClipboard(msg.message)}
                        className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {generatedMessages.length > 0 && (
          <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#0a0a0f] rounded-b-2xl">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSendAll}
              disabled={isSending}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {isSending ? 'Logging...' : <><Send size={16} /> Log All as Sent</>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BatchOutreachModal;
