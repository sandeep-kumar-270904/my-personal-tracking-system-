import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, User, Mail, Lock, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const SignupPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] font-['Plus_Jakarta_Sans']">
      
      {/* Right Side - Form (Reversed layout compared to Login) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden z-10 bg-[#0a0a0f]">
        {/* Mobile background blurs */}
        <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-[#ff007b]/20 rounded-full blur-[100px] lg:hidden -z-10" />

        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-10 text-slate-400 hover:text-white transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00f0ff] to-[#ff007b] flex items-center justify-center shadow-lg">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <span className="font-bold tracking-tight text-xl text-white">SmartTracker</span>
          </Link>

          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-white mb-3">Create an Account</h2>
            <p className="text-slate-400 text-lg">Join the ultimate career hub and start dominating your placement season.</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex gap-3 items-start"
            >
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              <p className="text-red-400 text-sm font-medium">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-12 focus:ring-[#ff007b]/50 focus:border-[#ff007b]" 
                  placeholder="John Doe"
                  required 
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12 focus:ring-[#ff007b]/50 focus:border-[#ff007b]" 
                  placeholder="you@example.com"
                  required 
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-300">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12 focus:ring-[#ff007b]/50 focus:border-[#ff007b]" 
                  placeholder="Create a strong password"
                  required 
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Must be at least 6 characters long.</p>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full btn-primary py-4 text-lg mt-4 flex items-center justify-center gap-2 before:from-[#00f0ff] before:to-[#ff007b] bg-gradient-to-r from-[#ff007b] to-[#00f0ff] shadow-[0_0_20px_rgba(255,0,123,0.4)] hover:shadow-[0_0_30px_rgba(255,0,123,0.6)]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-400 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:text-[#ff007b] transition-colors font-bold underline decoration-white/30 underline-offset-4">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Left Side - Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center border-l border-white/5 bg-[#050508]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/10 via-transparent to-[#ff007b]/10" />
        <div className="absolute top-1/4 -right-20 w-[500px] h-[500px] bg-[#00f0ff]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 -left-20 w-[500px] h-[500px] bg-[#ff007b]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 max-w-lg p-12 glass-card-card neon-border before:from-[#00f0ff] before:to-[#ff007b]">
          <div className="mb-8">
             <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-[#00f0ff]/20 to-[#ff007b]/20 mb-6">
                <User className="w-10 h-10 text-[#00f0ff]" />
             </div>
             <h3 className="text-3xl font-bold text-white mb-4 leading-tight">Start your journey today.</h3>
             <p className="text-slate-400 text-lg leading-relaxed">
               Get full access to the Kanban board, advanced networking tracker, and interactive offer comparison features instantly.
             </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-slate-300 font-medium bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 text-xs">✓</span>
              </div>
              Free forever for basic tracking
            </div>
            <div className="flex items-center gap-3 text-slate-300 font-medium bg-white/[0.02] p-4 rounded-xl border border-white/5">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-emerald-400 text-xs">✓</span>
              </div>
              Secure encrypted data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
