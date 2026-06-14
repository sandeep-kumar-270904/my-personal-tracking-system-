import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight, Lock, Mail, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0f] font-['Plus_Jakarta_Sans']">
      {/* Left Side - Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center border-r border-white/5 bg-[#050508]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b00]/10 via-transparent to-[#ff007b]/10" />
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-[#ff6b00]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-[#ff007b]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
        
        <div className="relative z-10 max-w-lg p-12 glass-card-card neon-border">
          <h2 className="text-4xl font-bold mb-6 text-white leading-tight">
            Welcome back to <br/><span className="text-gradient">SmartTracker</span>
          </h2>
          <p className="text-xl text-slate-400 leading-relaxed mb-8">
            Log in to continue managing your placement journey, track your latest applications, and analyze your mock interview performance.
          </p>
          <div className="flex items-center gap-4 text-slate-500 font-medium">
            <div className="flex -space-x-4">
              <img className="w-12 h-12 rounded-full border-2 border-[#050508]" src="https://ui-avatars.com/api/?name=User+One&background=ff6b00&color=fff" alt="" />
              <img className="w-12 h-12 rounded-full border-2 border-[#050508]" src="https://ui-avatars.com/api/?name=User+Two&background=00f0ff&color=fff" alt="" />
              <img className="w-12 h-12 rounded-full border-2 border-[#050508]" src="https://ui-avatars.com/api/?name=User+Three&background=ff007b&color=fff" alt="" />
            </div>
            <p>Join 10,000+ top students</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
        {/* Mobile background blurs */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#ff6b00]/20 rounded-full blur-[100px] lg:hidden" />
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <Link to="/" className="inline-flex items-center gap-2 mb-12 text-slate-400 hover:text-white transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b00] to-[#ff007b] flex items-center justify-center shadow-lg">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <span className="font-bold tracking-tight text-xl text-white">SmartTracker</span>
          </Link>

          <div className="mb-10">
            <h2 className="text-3xl font-extrabold text-white mb-3">Sign In</h2>
            <p className="text-slate-400 text-lg">Enter your details to access your dashboard.</p>
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
              <label className="block text-sm font-semibold text-slate-300">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12" 
                  placeholder="you@example.com"
                  required 
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-300">Password</label>
                <a href="#" className="text-sm font-medium text-[#ff6b00] hover:text-[#ff007b] transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12" 
                  placeholder="••••••••"
                  required 
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full btn-primary py-4 text-lg mt-4 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-400 font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:text-[#ff6b00] transition-colors font-bold underline decoration-white/30 underline-offset-4">
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
