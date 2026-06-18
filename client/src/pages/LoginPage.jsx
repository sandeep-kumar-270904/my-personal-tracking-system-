import { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, Target, Code2, Trophy, BadgeDollarSign, Check } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import { FaGithub, FaLinkedinIn } from 'react-icons/fa';

// Standardized Google Icon SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsSubmitting(true);
        setError('');
        // Send the access token to backend
        await googleLogin(tokenResponse.access_token);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Google login failed.');
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => setError('Google Login Failed'),
  });

  const handleGithubLogin = () => {
    const clientId = 'Ov23lieR3QvH9yKO3AEf';
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github`;
    window.location.href = url;
  };

  const handleLinkedinLogin = () => {
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    if (!clientId) return toast.error('LinkedIn Client ID is missing');
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const scope = 'openid profile email';
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=linkedin`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex font-['Plus_Jakarta_Sans'] text-slate-200">
      
      {/* Left Panel (40%) */}
      <div className="hidden lg:flex flex-col w-[40%] relative overflow-hidden bg-[#0D1117] border-r border-[#1E2330] p-10 justify-between">
        {/* Subtle orange glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#F97316]/40 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer w-fit">
            <div className="w-8 h-8 rounded bg-[#F97316] flex items-center justify-center">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <span className="font-bold tracking-tight text-xl text-white">StudentTracker</span>
          </Link>
        </div>

        {/* Center Content */}
        <div className="relative z-10 my-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <h1 className="text-4xl font-bold text-white mb-4 leading-tight">Everything you need to crack placement season.</h1>
            <p className="text-[16px] text-slate-400 leading-relaxed mb-10">
              Track applications, master DSA, monitor contests, and compare offers — all in one place built for Indian students.
            </p>

            <div className="space-y-3">
              {[
                { icon: Target, label: 'Applications tracker' },
                { icon: Trophy, label: 'Live contest alerts' },
                { icon: Code2, label: 'DSA progress heatmap' },
                { icon: BadgeDollarSign, label: 'CTC comparison' },
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                  className="bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg p-[10px] px-[14px] flex items-center gap-3 w-fit"
                >
                  <feature.icon className="w-5 h-5 text-[#F97316]" />
                  <span className="text-white font-medium text-sm">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }} className="relative z-10 pt-8 border-t border-[#1E2330]">
          <p className="text-white font-semibold mb-1">3,200+ students · 180+ colleges · ₹40L+ avg CTC tracked</p>
          <p className="text-slate-500 text-sm">Trusted by students from ANITS, VIT, NIT Warangal, IIIT Hyderabad and more</p>
        </motion.div>
      </div>

      {/* Right Panel (60%) */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-6 sm:p-12 bg-[#111318]">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden absolute top-0 left-0 right-0 p-6 flex flex-col items-center border-b border-[#1E2330] bg-[#0D1117]">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer mb-2">
            <div className="w-8 h-8 rounded bg-[#F97316] flex items-center justify-center">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <span className="font-bold tracking-tight text-xl text-white">StudentTracker</span>
          </Link>
          <p className="text-slate-400 text-[14px] text-center">Everything you need to crack placement season.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`w-full max-w-[420px] ${error ? 'animate-[shake_0.3s_ease-in-out]' : ''} mt-24 lg:mt-0`}
        >
          <div className="mb-8">
            <h2 className="text-[24px] font-medium text-white mb-2">Welcome back</h2>
            <p className="text-[#8B949E] text-[14px]">Sign in to your StudentTracker account</p>
          </div>

          {/* Success Message */}
          {successMessage && !error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-lg bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-400 text-sm font-medium">
              {successMessage}
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-md bg-[#FEF2F2] border-l-[3px] border-[#EF4444] text-[#EF4444] text-[13px] font-medium">
              {error}
            </motion.div>
          )}

          {/* Social Auth Buttons */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleGoogleLogin}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white border border-[#2A2F3E] hover:bg-[#F5F5F5] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all"
              title="Continue with Google"
            >
              <GoogleIcon />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleGithubLogin}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[#24292e] text-white border border-[#2A2F3E] hover:bg-[#2f363d] hover:shadow-[0_0_15px_rgba(36,41,46,0.3)] transition-all"
              title="Continue with GitHub"
            >
              <FaGithub className="w-5 h-5" />
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleLinkedinLogin}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[#0a66c2] text-white border border-[#2A2F3E] hover:bg-[#004182] hover:shadow-[0_0_15px_rgba(10,102,194,0.3)] transition-all"
              title="Continue with LinkedIn"
            >
              <FaLinkedinIn className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#2A2F3E]"></div>
            <span className="text-[#8B949E] text-[13px]">or continue with email</span>
            <div className="flex-1 h-px bg-[#2A2F3E]"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[13px] text-[#8B949E] font-medium">Email address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full h-[44px] bg-[#1A1F2E] border ${error ? 'border-[#EF4444]' : 'border-[#2A2F3E]'} rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all`}
                placeholder="you@college.edu"
                required 
                disabled={isSubmitting}
              />
            </div>
            
            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[13px] text-[#8B949E] font-medium">Password</label>
                <Link to="/forgot-password" className="text-[13px] text-[#F97316] hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full h-[44px] bg-[#1A1F2E] border ${error ? 'border-[#EF4444]' : 'border-[#2A2F3E]'} rounded-lg pl-4 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all`}
                  required 
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8B949E] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 mt-2">
              <button 
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-[#F97316] border-[#F97316]' : 'bg-[#1A1F2E] border-[#8B949E]'}`}
              >
                {rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </button>
              <span className="text-[13px] text-[#8B949E] cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>Remember me for 30 days</span>
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#F97316] hover:bg-[#EA6C0A] transition-colors text-white font-medium rounded-lg py-[12px] px-[24px] text-[15px] flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none mt-6"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-[#8B949E] text-[14px]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#F97316] hover:underline font-medium">
              Sign up &rarr;
            </Link>
          </p>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-4px); }
        }
      `}} />
    </div>
  );
};

export default LoginPage;
