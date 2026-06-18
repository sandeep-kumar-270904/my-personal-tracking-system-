import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, Target, Code2, Trophy, BadgeDollarSign, ChevronLeft } from 'lucide-react';
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

const SignupPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    branch: '',
    gradYear: '',
    targetCompanies: [],
    placementSeasonStart: '',
  });
  
  const [companyInput, setCompanyInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const { register, googleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGoogleSignup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsSubmitting(true);
        setError('');
        await googleLogin(tokenResponse.access_token);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Google signup failed.');
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => setError('Google Signup Failed'),
  });

  const handleGithubSignup = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) return setError('GitHub Client ID is missing');
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=github`;
    window.location.href = url;
  };

  const handleLinkedinSignup = () => {
    const clientId = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
    if (!clientId) return setError('LinkedIn Client ID is missing');
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const scope = 'openid profile email';
    const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=linkedin`;
    window.location.href = url;
  };

  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 8) strength++;
    if (formData.password.match(/[A-Z]/)) strength++;
    if (formData.password.match(/[0-9]/)) strength++;
    if (formData.password.match(/[^A-Za-z0-9]/)) strength++;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddCompany = (e) => {
    if (e.key === 'Enter' && companyInput.trim()) {
      e.preventDefault();
      if (!formData.targetCompanies.includes(companyInput.trim())) {
        setFormData({
          ...formData,
          targetCompanies: [...formData.targetCompanies, companyInput.trim()]
        });
      }
      setCompanyInput('');
    }
  };

  const removeCompany = (company) => {
    setFormData({
      ...formData,
      targetCompanies: formData.targetCompanies.filter(c => c !== company)
    });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
      if (passwordStrength < 2) {
        setError('Please choose a stronger password');
        return;
      }
      setError('');
      setStep(2);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await register(formData);
      setStep(3); // Show success step
      setTimeout(() => navigate('/login', { state: { message: 'Account created successfully! Please sign in.' } }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex font-['Plus_Jakarta_Sans'] text-slate-200">
      
      {/* Left Panel (40%) */}
      <div className="hidden lg:flex flex-col w-[40%] relative overflow-hidden bg-[#0D1117] border-r border-[#1E2330] p-10 justify-between">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#F97316]/40 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer w-fit">
            <div className="w-8 h-8 rounded bg-[#F97316] flex items-center justify-center">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <span className="font-bold tracking-tight text-xl text-white">StudentTracker</span>
          </Link>
        </div>

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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.6 }} className="relative z-10 pt-8 border-t border-[#1E2330]">
          <p className="text-white font-semibold mb-1">3,200+ students · 180+ colleges · ₹40L+ avg CTC tracked</p>
          <p className="text-slate-500 text-sm">Trusted by students from ANITS, VIT, NIT Warangal, IIIT Hyderabad and more</p>
        </motion.div>
      </div>

      {/* Right Panel (60%) */}
      <div className="w-full lg:w-[60%] flex flex-col p-6 sm:p-12 bg-[#111318] relative">
        
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

        {step > 1 && step < 3 && (
          <button onClick={() => setStep(1)} className="absolute top-6 left-6 text-[#8B949E] hover:text-white flex items-center gap-1 text-[13px] font-medium hidden lg:flex z-20">
            <ChevronLeft className="w-4 h-4" /> Back to Account Details
          </button>
        )}

        <div className="flex-1 flex items-center justify-center w-full mt-24 lg:mt-0">
          <AnimatePresence mode="wait">
            <motion.div 
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`w-full max-w-[420px] ${error ? 'animate-[shake_0.3s_ease-in-out]' : ''}`}
            >
              {step === 3 ? (
                // Success Screen
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <motion.path 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={3} 
                        d="M5 13l4 4L19 7" 
                      />
                    </svg>
                  </div>
                  <h2 className="text-[24px] font-medium text-white mb-2">Account Created!</h2>
                  <p className="text-[#8B949E] text-[14px]">Redirecting you to sign in...</p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="text-[24px] font-medium text-white mb-2">
                      {step === 1 ? 'Create an account' : 'Complete your profile'}
                    </h2>
                    <p className="text-[#8B949E] text-[14px]">
                      {step === 1 ? 'Start your placement journey with StudentTracker' : 'Tell us a bit about your academic background'}
                    </p>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-md bg-[#FEF2F2] border-l-[3px] border-[#EF4444] text-[#EF4444] text-[13px] font-medium">
                      {error}
                    </motion.div>
                  )}

                  {step === 1 && (
                    <>
                      {/* Social Auth Buttons */}
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <motion.button 
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={handleGoogleSignup}
                          className="w-12 h-12 rounded-full flex items-center justify-center bg-white border border-[#2A2F3E] hover:bg-[#F5F5F5] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all"
                          title="Sign up with Google"
                        >
                          <GoogleIcon />
                        </motion.button>

                        <motion.button 
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={handleGithubSignup}
                          className="w-12 h-12 rounded-full flex items-center justify-center bg-[#24292e] text-white border border-[#2A2F3E] hover:bg-[#2f363d] hover:shadow-[0_0_15px_rgba(36,41,46,0.3)] transition-all"
                          title="Sign up with GitHub"
                        >
                          <FaGithub className="w-5 h-5" />
                        </motion.button>

                        <motion.button 
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={handleLinkedinSignup}
                          className="w-12 h-12 rounded-full flex items-center justify-center bg-[#0a66c2] text-white border border-[#2A2F3E] hover:bg-[#004182] hover:shadow-[0_0_15px_rgba(10,102,194,0.3)] transition-all"
                          title="Sign up with LinkedIn"
                        >
                          <FaLinkedinIn className="w-5 h-5" />
                        </motion.button>
                      </div>

                      <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-[#2A2F3E]"></div>
                        <span className="text-[#8B949E] text-[13px]">or continue with email</span>
                        <div className="flex-1 h-px bg-[#2A2F3E]"></div>
                      </div>

                      <form onSubmit={handleNext} className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="block text-[13px] text-[#8B949E] font-medium">Full name</label>
                          <input 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full h-[44px] bg-[#1A1F2E] border ${error && !formData.name ? 'border-[#EF4444]' : 'border-[#2A2F3E]'} rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all`}
                            placeholder="John Doe"
                            required 
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="block text-[13px] text-[#8B949E] font-medium">Email address</label>
                          <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full h-[44px] bg-[#1A1F2E] border ${error && !formData.email ? 'border-[#EF4444]' : 'border-[#2A2F3E]'} rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all`}
                            placeholder="you@college.edu"
                            required 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-[13px] text-[#8B949E] font-medium">Password</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              className={`w-full h-[44px] bg-[#1A1F2E] border ${error && !formData.password ? 'border-[#EF4444]' : 'border-[#2A2F3E]'} rounded-lg pl-4 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all`}
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
                          {formData.password && (
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

                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit" 
                          className="w-full bg-[#F97316] hover:bg-[#EA6C0A] transition-colors text-white font-medium rounded-lg py-[12px] px-[24px] text-[15px] flex items-center justify-center mt-6"
                        >
                          Continue
                        </motion.button>
                      </form>

                      <p className="mt-8 text-center text-[#8B949E] text-[14px]">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#F97316] hover:underline font-medium">
                          Sign in &rarr;
                        </Link>
                      </p>
                    </>
                  )}

                  {step === 2 && (
                    <form onSubmit={handleSignupSubmit} className="space-y-5">
                      
                      <div className="space-y-1.5">
                        <label className="block text-[13px] text-[#8B949E] font-medium">College Name</label>
                        <input 
                          type="text" 
                          name="college"
                          value={formData.college}
                          onChange={handleChange}
                          className="w-full h-[44px] bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all"
                          placeholder="e.g. NIT Warangal"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[13px] text-[#8B949E] font-medium">Branch / Major</label>
                          <input 
                            type="text" 
                            name="branch"
                            value={formData.branch}
                            onChange={handleChange}
                            className="w-full h-[44px] bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all"
                            placeholder="e.g. CSE"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[13px] text-[#8B949E] font-medium">Graduation Year</label>
                          <input 
                            type="text" 
                            name="gradYear"
                            value={formData.gradYear}
                            onChange={handleChange}
                            className="w-full h-[44px] bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all"
                            placeholder="2025"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[13px] text-[#8B949E] font-medium">Target Companies (Press Enter)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.targetCompanies.map(company => (
                            <div key={company} className="flex items-center gap-1 bg-[#1A1F2E] border border-[#2A2F3E] rounded pl-2 pr-1 py-1 text-[12px] text-white">
                              {company}
                              <button type="button" onClick={() => removeCompany(company)} className="text-slate-500 hover:text-white px-1">×</button>
                            </div>
                          ))}
                        </div>
                        <input 
                          type="text" 
                          value={companyInput}
                          onChange={(e) => setCompanyInput(e.target.value)}
                          onKeyDown={handleAddCompany}
                          className="w-full h-[44px] bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all"
                          placeholder="e.g. Amazon, Google"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[13px] text-[#8B949E] font-medium">Placement Season Timing</label>
                        <div className="relative">
                          <select 
                            name="placementSeasonStart"
                            value={formData.placementSeasonStart}
                            onChange={handleChange}
                            className="w-full h-[44px] bg-[#1A1F2E] border border-[#2A2F3E] rounded-lg px-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[#F97316]/15 transition-all appearance-none"
                          >
                            <option value="" disabled>Select season</option>
                            <option value="Summer Internship">Summer Internship</option>
                            <option value="6-Month Internship">6-Month Internship</option>
                            <option value="Full Time (FTE)">Full Time (FTE)</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-[#8B949E]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button" 
                          onClick={() => setStep(1)}
                          className="flex-1 bg-transparent border border-[#2A2F3E] text-white font-medium rounded-lg py-[12px] px-[24px] text-[15px] flex items-center justify-center hover:bg-[#1A1F2E]"
                        >
                          Back
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit" 
                          disabled={isSubmitting}
                          className="flex-1 bg-[#F97316] hover:bg-[#EA6C0A] transition-colors text-white font-medium rounded-lg py-[12px] px-[24px] text-[15px] flex items-center justify-center disabled:opacity-70 disabled:pointer-events-none"
                        >
                          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                        </motion.button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
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

export default SignupPage;
