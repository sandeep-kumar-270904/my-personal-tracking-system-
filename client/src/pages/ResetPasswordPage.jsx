import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import api from '../services/api';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;
    setPasswordStrength(strength);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }
    if (passwordStrength < 2) {
      setStatus('error');
      setMessage('Password is too weak');
      return;
    }

    setStatus('loading');
    try {
      const res = await api.put(`/auth/resetpassword/${token}`, { password });
      setStatus('success');
      setTimeout(() => navigate('/login', { state: { message: 'Password updated successfully. Please sign in.' } }), 2000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Failed to reset password. The link might be expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-['Plus_Jakarta_Sans'] bg-[#0D1117] p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#F97316]/10 blur-[120px] rounded-full pointer-events-none -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#F97316]/10 blur-[120px] rounded-full pointer-events-none translate-x-1/3 translate-y-1/3" />

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
            <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
            <p className="text-slate-400 text-sm">
              Please enter your new password below.
            </p>
          </div>

          {status === 'success' ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-2">Password Updated!</h3>
              <p className="text-slate-400 text-sm">Redirecting to sign in...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="p-3 rounded-md bg-[#FEF2F2] border-l-[3px] border-[#EF4444] text-[#EF4444] text-[13px] font-medium">
                  {message}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[13px] text-[#8B949E] font-medium">New Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[44px] bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg pl-4 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B949E] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {password && (
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4].map((level) => (
                      <div 
                        key={level} 
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordStrength >= level 
                            ? passwordStrength < 2 ? 'bg-[#EF4444]' : passwordStrength < 4 ? 'bg-[#F59E0B]' : 'bg-[#10B981]'
                            : 'bg-[#2A2F3E]'
                        }`} 
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] text-[#8B949E] font-medium">Confirm New Password</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-[44px] bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg pl-4 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B949E] hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="w-full bg-[#F97316] hover:bg-[#EA6C0A] active:scale-[0.98] transition-all duration-150 text-white font-medium rounded-lg py-[12px] px-[24px] text-[15px] flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
              >
                {status === 'loading' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
