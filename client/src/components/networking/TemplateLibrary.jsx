import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const TemplateLibrary = ({ templates, onClose, onCreateTemplate }) => {
  const [newTemplate, setNewTemplate] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'INITIAL_CONTACT', channel: 'LINKEDIN', text: '' });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Template copied to clipboard');
  };

  const handleCreate = () => {
    onCreateTemplate({
      templateName: form.name,
      messageType: form.type,
      channel: form.channel,
      template: form.text
    });
    setNewTemplate(false);
    setForm({ name: '', type: 'INITIAL_CONTACT', channel: 'LINKEDIN', text: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-lg bg-[#0a0a0f] border-l border-white/10 h-full flex flex-col shadow-2xl"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#13141f]">
          <h2 className="text-xl font-bold text-white">Message Templates</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {!newTemplate ? (
            <div className="space-y-4">
              <button 
                onClick={() => setNewTemplate(true)}
                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-slate-300 hover:border-[#ff6b00] hover:text-[#ff6b00] flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Create New Template
              </button>

              {templates.map(t => (
                <div key={t._id} className="bg-[#13141f] border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{t.templateName}</h3>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">{t.channel}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">{t.messageType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">{t.responseRate.toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-500 uppercase">Response Rate</div>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-[#0a0a0f] rounded-lg border border-white/5 text-sm text-slate-300 relative group">
                    <p className="whitespace-pre-wrap">{t.template}</p>
                    <button 
                      onClick={() => handleCopy(t.template)}
                      className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Used {t.usageCount} times
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">New Template</h3>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Template Name</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full bg-[#13141f] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#ff6b00]"
                  placeholder="e.g., Alumni Referral Request"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Message Type</label>
                  <select 
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    className="w-full bg-[#13141f] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="INITIAL_CONTACT">Initial Contact</option>
                    <option value="FOLLOW_UP">Follow Up</option>
                    <option value="REFERRAL_REQUEST">Referral Request</option>
                    <option value="CHECK_IN">Check In</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Channel</label>
                  <select 
                    value={form.channel}
                    onChange={(e) => setForm({...form, channel: e.target.value})}
                    className="w-full bg-[#13141f] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="EMAIL">Email</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Template Content</label>
                <p className="text-[10px] text-slate-500 mb-2">Use {'{{firstName}}'}, {'{{company}}'}, {'{{role}}'} as placeholders.</p>
                <textarea 
                  value={form.text}
                  onChange={(e) => setForm({...form, text: e.target.value})}
                  className="w-full bg-[#13141f] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#ff6b00] h-48 custom-scrollbar resize-none"
                  placeholder="Hi {{firstName}}, I saw your profile..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setNewTemplate(false)}
                  className="flex-1 py-2.5 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!form.name || !form.text}
                  className="flex-1 py-2.5 bg-[#ff6b00] hover:bg-[#e66000] disabled:opacity-50 disabled:hover:bg-[#ff6b00] text-white rounded-lg transition-colors font-medium"
                >
                  Save Template
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TemplateLibrary;
