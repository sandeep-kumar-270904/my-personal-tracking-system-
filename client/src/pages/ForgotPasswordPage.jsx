import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await api.post('/auth/forgotpassword', { email });
      setMessage(res.data.message || 'Check your email for the reset link.');
      setStatus('success');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send reset email.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-['Plus_Jakarta_Sans'] bg-[#0D1117] p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F97316]/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#F97316]/10 blur-[120px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[420px] relative z-10"
      >
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 font-medium text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="bg-[#111318] border border-[#1E2330] p-8 rounded-2xl shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-slate-400 text-sm">
              Enter the email associated with your account and we'll send you a link to reset your password.
            </p>
          </div>

          {status === 'success' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-2">Email Sent!</h3>
              <p className="text-slate-400 text-sm">{message}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="p-3 rounded-md bg-[#FEF2F2] border-l-[3px] border-[#EF4444] text-[#EF4444] text-[13px] font-medium">
                  {message}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[13px] text-[#8B949E] font-medium">Email address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[44px] bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all"
                  placeholder="you@college.edu"
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-[#F97316] hover:bg-[#EA6C0A] active:scale-[0.98] transition-all duration-150 text-white font-medium rounded-lg py-[12px] px-[24px] text-[15px] flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
              >
                {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
