import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BrainCircuit, Activity, Target, Network, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

import HealthMonitorAlerts from '../components/resumes/HealthMonitorAlerts';
import OutcomeLearningSection from '../components/resumes/OutcomeLearningSection';

export default function ResumeIntelligenceDashboard() {
  const [selectedResumeId, setSelectedResumeId] = useState('');

  const { data: resumes = [] } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await api.get('/resumes');
      return res.data;
    }
  });

  const { data: goalData } = useQuery({
    queryKey: ['goalsProgress'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen pb-32">
      <div className="flex items-center gap-4">
        <Link to="/resumes" className="p-2 bg-slate-900 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-indigo-400" />
            Unified Intelligence Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Your centralized command center for resume health, goals, and AI-driven insights.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Goals & Health */}
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" /> Goal Progress
            </h2>
            {goalData && goalData.goal ? (
              <div className="bg-slate-900 border border-white/10 rounded-xl p-5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-300 font-medium tracking-wide">Weekly Resume Health Target</span>
                  <span className="text-emerald-400 font-bold text-lg">{goalData.progress?.resumeHealth || 0} / {goalData.goal.resumeHealthTarget || 2}</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: \`\${Math.min(100, ((goalData.progress?.resumeHealth || 0) / (goalData.goal.resumeHealthTarget || 2)) * 100)}%\` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-3">Target: Score 80+ on ATS Scans</p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No goals set yet.</p>
            )}
          </section>

          <section className="glass-card p-6 rounded-2xl border border-white/5">
            <HealthMonitorAlerts />
          </section>
        </div>

        {/* Right Column - Insights & Offer Leverage */}
        <div className="space-y-6">
          <section className="glass-card p-6 rounded-2xl border border-white/5">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-400" /> Resume Insights
            </h2>
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Select Resume to Analyze</label>
              <select 
                value={selectedResumeId} 
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="" disabled>Select a Resume</option>
                {resumes.map(r => (
                  <option key={r._id} value={r._id}>{r.name || r.originalName}</option>
                ))}
              </select>
            </div>
            
            {selectedResumeId ? (
              <OutcomeLearningSection resumeId={selectedResumeId} />
            ) : (
              <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-white/5">
                <p className="text-slate-500 text-sm">Select a resume to view AI insights on what's working.</p>
              </div>
            )}
          </section>

          <section className="glass-card p-6 rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-500/10 to-purple-500/5">
            <h2 className="text-xl font-bold text-white mb-2">Offer Leverage</h2>
            <p className="text-sm text-indigo-200/80 mb-4">
              Received an offer? Head over to the Offers page to generate AI-driven negotiation leverage points based on your resume.
            </p>
            <Link to="/offers" className="w-full inline-flex justify-center items-center py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors">
              Go to Offers Page
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
