import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Smartphone, CheckCircle2, MessageCircle } from 'lucide-react';
import api from '../../services/api';

const WhatsAppConnectWidget = () => {
  const { user, setUser } = useContext(AuthContext);
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleSavePhone = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    try {
      // Clean up phone number (remove spaces/dashes)
      const cleanPhone = phone.replace(/[\s-]/g, '');
      const response = await api.put('/auth/profile', { phone: cleanPhone });
      setUser({ ...user, phone: response.data.phone });
      setSaveStatus('success');
    } catch (error) {
      console.error('Error saving phone:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const isConnected = !!user?.phone;

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/5 relative overflow-hidden">
      {/* Decorative gradient blob */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 flex items-center justify-center border border-emerald-500/20 shrink-0">
          <MessageCircle className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
            WhatsApp Auto-Logger
            {isConnected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </h3>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            {isConnected 
              ? "Your phone is linked! Text the bot to log applications on the go."
              : "Link your phone number to log applications by texting the StudentTracker bot."}
          </p>
        </div>
      </div>

      {!isConnected ? (
        <form onSubmit={handleSavePhone} className="mt-5 space-y-3 relative z-10">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Phone Number (with Country Code)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Smartphone className="h-4 w-4 text-slate-500" />
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSaving || !phone.trim()}
            className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium text-sm py-2.5 rounded-xl border border-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? 'Linking...' : 'Link WhatsApp'}
          </button>
          {saveStatus === 'error' && (
            <p className="text-xs text-red-400 mt-2 text-center">Failed to save phone number.</p>
          )}
        </form>
      ) : (
        <div className="mt-5 bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 relative z-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-medium text-slate-400">Bot Phone Number:</span>
            <span className="text-sm font-mono text-emerald-300 font-medium">+1 (555) 000-1234</span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-500">Try texting:</p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-slate-300">
              "applied to Google"
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-slate-300">
              "solved 2 leetcode problems"
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppConnectWidget;
