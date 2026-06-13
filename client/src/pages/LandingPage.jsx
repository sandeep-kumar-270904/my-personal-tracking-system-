import { motion } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, TrendingUp, Users } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const LandingPage = () => {
  const { user, loading } = useContext(AuthContext);

  if (!loading && user) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] -z-10" />

      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-sm text-blue-400 mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            The Ultimate Career Hub
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Track your career <br />
            <span className="text-gradient">with precision.</span>
          </h1>
          
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Manage your internship and job applications, track interview stages, and land your dream role with our smart dashboard designed for modern job seekers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link to="/signup">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary px-8 py-4 text-lg"
              >
                Start Tracking Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary px-8 py-4 text-lg"
              >
                Login
              </motion.button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4 mb-20"
        >
          <div className="glass-card flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Application Tracking</h3>
            <p className="text-slate-400">Keep all your job applications organized in one beautiful dashboard with status updates.</p>
          </div>
          
          <div className="glass-card flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Insightful Analytics</h3>
            <p className="text-slate-400">Visualize your success rate and track your progress over time with rich interactive charts.</p>
          </div>
          
          <div className="glass-card flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Interview Prep</h3>
            <p className="text-slate-400">Never miss an interview. Track upcoming rounds, take notes, and stay prepared for success.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;
