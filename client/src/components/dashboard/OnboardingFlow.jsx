import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, FileText, Briefcase, Target, Code, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const OnboardingFlow = ({ stats, userName, onComplete, onActionClick }) => {
  const [checking, setChecking] = useState(false);
  
  // Checklist states
  const hasResume = stats.resumeCount > 0; // Requires resumeCount from API or assume from score
  const hasApp = stats.totalApplications > 0;
  const hasGoal = stats.weeklyGoals?.applicationsTarget > 0 || stats.weeklyGoals?.dsaTarget > 0;
  const hasDSA = stats.dsaTopicsTracked > 0; // Simplified check
  const hasNetwork = stats.networkCount > 0; // We might need to guess from score or add to stats

  // Using readiness score API for accurate counts
  const [readiness, setReadiness] = useState(null);

  useEffect(() => {
    api.get('/dashboard/readiness-score').then(res => setReadiness(res.data)).catch(console.error);
  }, []);

  const isResumeDone = readiness?.breakdown?.resume > 0;
  const isAppDone = stats.totalApplications > 0;
  const isGoalDone = readiness?.breakdown?.goals > 0 || stats.weeklyGoals?.applicationsTarget > 0;
  const isDSADone = readiness?.breakdown?.dsa > 0;
  const isNetworkDone = readiness?.breakdown?.network > 0;

  const totalDone = [isResumeDone, isAppDone, isGoalDone, isDSADone, isNetworkDone].filter(Boolean).length;
  const isAllDone = totalDone === 5 || stats.totalApplications >= 3;

  useEffect(() => {
    if (isAllDone && !checking) {
      setChecking(true);
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff6b00', '#10b981', '#3b82f6']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff6b00', '#10b981', '#3b82f6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        } else {
          // Call backend to mark complete
          api.post('/dashboard/onboard').then(() => {
            onComplete();
          });
        }
      };
      frame();
    }
  }, [isAllDone, checking, onComplete]);

  const steps = [
    {
      id: 'resume',
      title: 'Upload your first resume',
      done: isResumeDone,
      icon: <FileText className="w-5 h-5" />,
      action: () => window.location.href = '/resumes', // Simple redirect
    },
    {
      id: 'app',
      title: 'Add your first application',
      done: isAppDone,
      icon: <Briefcase className="w-5 h-5" />,
      action: () => onActionClick('ADD_APP'),
    },
    {
      id: 'goal',
      title: 'Set your weekly goals',
      done: isGoalDone,
      icon: <Target className="w-5 h-5" />,
      action: () => window.location.href = '/goals', 
    },
    {
      id: 'dsa',
      title: 'Log your first DSA problem',
      done: isDSADone,
      icon: <Code className="w-5 h-5" />,
      action: () => onActionClick('LOG_DSA'),
    },
    {
      id: 'network',
      title: 'Add a networking contact',
      done: isNetworkDone,
      icon: <Users className="w-5 h-5" />,
      action: () => onActionClick('ADD_CONTACT'),
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto mt-12"
    >
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="text-lg font-semibold text-white">Setup Progress</h2>
              <p className="text-sm text-slate-400 mt-1">Let's get your workspace set up for placement season.</p>
            </div>
            <button 
              onClick={() => {
                api.post('/dashboard/onboard').then(() => onComplete());
              }}
              className="text-xs text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            >
              Skip Setup
            </button>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-4">
            <motion.div 
              className="bg-[#ff6b00] h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(totalDone / 5) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-slate-400">Progress</span>
            <span className="text-sm font-bold text-white">{totalDone}/5 Tasks</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {steps.map((step, idx) => (
            <div 
              key={step.id}
              onClick={step.action}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors ${step.done ? 'opacity-50 grayscale bg-transparent' : 'hover:bg-white/5'}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-slate-400'}`}>
                {step.done ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-lg ${step.done ? 'bg-transparent' : 'bg-[#ff6b00]/10 text-[#ff6b00]'}`}>
                  {step.icon}
                </div>
                <span className={`font-medium ${step.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                  {step.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default OnboardingFlow;
