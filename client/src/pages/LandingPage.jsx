import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, TrendingUp, Users, Target, Rocket, Shield, Code2, Play } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const LandingPage = () => {
  const { user, loading } = useContext(AuthContext);

  if (!loading && user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-[#ff6b00] selection:text-white overflow-hidden font-['Plus_Jakarta_Sans']">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 right-0 -z-10 translate-x-1/3 -translate-y-1/4">
          <div className="w-[500px] h-[500px] bg-[#ff6b00]/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
        </div>
        <div className="absolute bottom-0 left-0 -z-10 -translate-x-1/3 translate-y-1/4">
          <div className="w-[600px] h-[600px] bg-[#00f0ff]/20 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
        <div className="absolute top-1/2 left-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
          <div className="w-[800px] h-[800px] bg-[#ff007b]/10 blur-[150px] rounded-full mix-blend-screen" />
        </div>

        <div className="text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-sm font-semibold text-slate-300 mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(255,107,0,0.15)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6b00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff6b00]"></span>
              </span>
              The Ultimate Career Hub for Students
            </div>

            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Dominate your <br className="hidden md:block" />
              <span className="text-gradient drop-shadow-2xl">placement season.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12 font-medium">
              A professional-grade toolkit to track applications, conquer DSA, crush interviews, and land your dream role with zero friction.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/signup" className="w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto btn-primary px-10 py-5 text-lg"
                >
                  Start Tracking Free
                  <ArrowRight className="w-6 h-6 ml-2" />
                </motion.button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto btn-secondary px-10 py-5 text-lg group"
                >
                  <Play className="w-5 h-5 mr-2 text-slate-400 group-hover:text-white transition-colors" fill="currentColor" />
                  View Demo
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-24 relative z-10 border-t border-white/5 bg-black/50 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#0080ff]">succeed</span></h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">Stop using messy spreadsheets. Use a platform designed specifically for the modern job hunt.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="glass-card p-8 neon-border group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff6b00]/20 to-[#ff007b]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-7 h-7 text-[#ff6b00]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Application Tracker</h3>
              <p className="text-slate-400 leading-relaxed text-lg">Visual Kanban boards to track your applications from 'Applied' to 'Offer'. Never lose track of a recruiter email again.</p>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="glass-card p-8 neon-border group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00f0ff]/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Code2 className="w-7 h-7 text-[#00f0ff]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">DSA & Contests</h3>
              <p className="text-slate-400 leading-relaxed text-lg">Track your LeetCode progress and get live updates on upcoming coding contests from Codeforces and CodeChef.</p>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="glass-card p-8 neon-border group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Offer Analytics</h3>
              <p className="text-slate-400 leading-relaxed text-lg">Compare job offers side-by-side with smart CTC breakdowns and visually analyze your total compensation.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#ff007b]/10" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-8">Ready to land your <span className="text-[#ff6b00]">dream job?</span></h2>
          <p className="text-2xl text-slate-400 mb-12">Join thousands of students optimizing their career trajectory today.</p>
          <Link to="/signup">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary px-12 py-6 text-xl shadow-[0_0_40px_rgba(255,107,0,0.5)]"
            >
              <Rocket className="w-6 h-6 mr-3 inline-block" />
              Launch Your Career
            </motion.button>
          </Link>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-white/10 bg-[#050508] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ff007b] flex items-center justify-center shadow-lg shadow-[#ff6b00]/20">
              <span className="font-bold text-white text-xl">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SmartTracker</span>
          </div>
          <p className="text-slate-500 font-medium">© {new Date().getFullYear()} SmartTracker. Built for students.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
