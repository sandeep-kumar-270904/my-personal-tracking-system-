import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await api.get(`/auth/verifyemail/${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    };
    verifyEmail();
  }, [token]);

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
        <div className="bg-[#111318] border border-[#1E2330] p-8 rounded-2xl shadow-2xl text-center">
          {status === 'loading' && (
            <div className="py-8">
              <Loader2 className="w-12 h-12 text-[#F97316] animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Verifying Email</h1>
              <p className="text-slate-400 text-sm">Please wait while we verify your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Email Verified!</h1>
              <p className="text-slate-400 text-sm mb-8">{message}</p>
              <Link 
                to="/login"
                className="inline-block w-full bg-[#F97316] hover:bg-[#EA6C0A] transition-all text-white font-medium rounded-lg py-3 px-6"
              >
                Continue to Login
              </Link>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="py-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
              <p className="text-slate-400 text-sm mb-8">{message}</p>
              <Link 
                to="/signup"
                className="inline-block w-full bg-[#1A1F2E] hover:bg-[#2A2F3E] transition-all text-white font-medium rounded-lg py-3 px-6"
              >
                Back to Sign Up
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
