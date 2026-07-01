import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Filter, Plus, FileText, Brain, Target, BarChart2, BookOpen, Flag, Building, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

import LiveStatsBar from '../components/interviews/v2/LiveStatsBar';
import UpcomingInterviewsStrip from '../components/interviews/v2/UpcomingInterviewsStrip';
import InterviewPipeline from '../components/interviews/v2/InterviewPipeline';
import InterviewList from '../components/interviews/v2/InterviewList';
import InterviewDrawer from '../components/interviews/v2/InterviewDrawer';
import QuestionBank from '../components/interviews/v2/QuestionBank';
import InsightsPanel from '../components/interviews/v2/InsightsPanel';
import PerformanceAnalytics from '../components/interviews/v2/PerformanceAnalytics';
import MockScheduler from '../components/interviews/v2/MockScheduler';
import AIMockFlow from '../components/interviews/v2/AIMockFlow';
import CompanyProcessModal from '../components/interviews/v3/CompanyProcessModal';
import InterviewPrepSidebar from '../components/prephub/InterviewPrepSidebar';

export default function InterviewsV2Page() {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline', 'list', 'analytics', 'questions'
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMockSchedulerOpen, setIsMockSchedulerOpen] = useState(false);
  const [isAIMockActive, setIsAIMockActive] = useState(false);
  const [mockConfig, setMockConfig] = useState(null);

  const [stats, setStats] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [insights, setInsights] = useState([]);
  const [synthesisReports, setSynthesisReports] = useState([]);
  const [showSynthesis, setShowSynthesis] = useState(false);
  const [showCompanyProcess, setShowCompanyProcess] = useState(false);
  const [generatingPortfolio, setGeneratingPortfolio] = useState(false);
  const [psychProfile, setPsychProfile] = useState(null);
  const [certifications, setCertifications] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, intRes, upcRes, insRes, synRes, psychRes, certRes] = await Promise.all([
        axios.get('/api/interviews/stats'),
        axios.get('/api/interviews'),
        axios.get('/api/interviews/upcoming'),
        axios.get('/api/interviews/insights'),
        axios.get('/api/interviews/synthesis'),
        axios.get('/api/interviews/psychology-profile'),
        axios.get('/api/interviews/certifications')
      ]);
      setStats(statsRes.data);
      setInterviews(intRes.data.interviews || []);
      setUpcoming(upcRes.data || []);
      setInsights(insRes.data || []);
      setSynthesisReports(synRes.data || []);
      setPsychProfile(psychRes.data || null);
      setCertifications(certRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneratePortfolio = async () => {
    setGeneratingPortfolio(true);
    try {
      const res = await axios.post('/api/interviews/generate-portfolio');
      // In real life, convert res.data.html to blob/download.
      // For V3 mockup, we create a fake download link.
      const blob = new Blob([res.data.html], {type: 'text/html'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Interview_Portfolio.html';
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setGeneratingPortfolio(false);
    }
  };

  const openDrawer = (interview) => {
    setSelectedInterview(interview);
    setIsDrawerOpen(true);
  };

  const startAIMock = (config) => {
    setMockConfig(config);
    setIsMockSchedulerOpen(false);
    setIsAIMockActive(true);
  };

  if (isAIMockActive) {
    return <AIMockFlow config={mockConfig} onExit={() => setIsAIMockActive(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Section 1: Header & Live Stats */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Interviews</h1>
            <p className="text-gray-400 mt-1">Intelligence, tracking, and prep</p>
          </div>
          <div className="flex space-x-3">
            <Link 
              to="/interviews/stories"
              className="flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Story Bank
            </Link>
            <Link 
              to="/interviews/command-center"
              className="flex items-center px-4 py-2 bg-indigo-900/30 text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-900/50 transition-colors"
            >
              <Activity className="w-4 h-4 mr-2" />
              Command Center
            </Link>
            <button 
              onClick={() => setShowSynthesis(true)}
              className="flex items-center px-4 py-2 bg-gray-800 text-amber-400 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Flag className="w-4 h-4 mr-2" />
              My Journey
            </button>
            <button 
              onClick={() => setShowCompanyProcess(true)}
              className="flex items-center px-4 py-2 bg-gray-800 text-teal-400 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Building className="w-4 h-4 mr-2" />
              Processes
            </button>
            <button 
              onClick={handleGeneratePortfolio}
              disabled={generatingPortfolio}
              className="flex items-center px-4 py-2 bg-gray-800 text-fuchsia-400 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              {generatingPortfolio ? 'Generating...' : 'Portfolio'}
            </button>
            <button 
              onClick={() => setIsMockSchedulerOpen(true)}
              className="flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30 hover:bg-indigo-600/30 transition-colors"
            >
              <Target className="w-4 h-4 mr-2" />
              Schedule Mock
            </button>
            <button className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shadow-lg shadow-emerald-900/20">
              <Plus className="w-4 h-4 mr-2" />
              Log Interview
            </button>
          </div>
        </div>

        {stats && <LiveStatsBar stats={stats} />}

        {/* Section 2: Upcoming Strip */}
        <UpcomingInterviewsStrip upcoming={upcoming} onCardClick={openDrawer} />

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            
            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-900 p-1 rounded-xl border border-gray-800 overflow-x-auto">
              {['pipeline', 'list', 'analytics', 'questions', 'psychology', 'certifications'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-4 whitespace-nowrap text-sm font-medium rounded-lg transition-colors capitalize ${
                    activeTab === tab ? 'bg-gray-800 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`}
                >
                  {tab === 'pipeline' && <Calendar className="w-4 h-4 inline mr-2" />}
                  {tab === 'list' && <FileText className="w-4 h-4 inline mr-2" />}
                  {tab === 'analytics' && <BarChart2 className="w-4 h-4 inline mr-2" />}
                  {tab === 'questions' && <Brain className="w-4 h-4 inline mr-2" />}
                  {tab === 'psychology' && <Brain className="w-4 h-4 inline mr-2 text-indigo-400" />}
                  {tab === 'certifications' && <Target className="w-4 h-4 inline mr-2 text-emerald-400" />}
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 min-h-[500px]">
              {activeTab === 'pipeline' && <InterviewPipeline interviews={interviews} onCardClick={openDrawer} />}
              {activeTab === 'list' && <InterviewList interviews={interviews} onCardClick={openDrawer} />}
              {activeTab === 'analytics' && <PerformanceAnalytics stats={stats} />}
              {activeTab === 'questions' && <QuestionBank />}
              {activeTab === 'psychology' && <PsychologyProfile psychProfile={psychProfile} />}
              {activeTab === 'certifications' && <CompetencyMatrix certifications={certifications} />}
            </div>

          </div>

          {/* Section 7: Insights Sidebar */}
          <div className="lg:col-span-1">
            <InsightsPanel insights={insights} onDismiss={() => fetchData()} />
            <InterviewPrepSidebar />
          </div>
        </div>

      </div>

      {/* Section 5: Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <InterviewDrawer 
            interview={selectedInterview} 
            onClose={() => setIsDrawerOpen(false)} 
            onRefresh={fetchData}
          />
        )}
      </AnimatePresence>

      {/* Section 9: Mock Scheduler Modal */}
      <AnimatePresence>
        {isMockSchedulerOpen && (
          <MockScheduler 
            onClose={() => setIsMockSchedulerOpen(false)}
            onStartAIMock={startAIMock}
          />
        )}
      </AnimatePresence>

      {/* Section 8: Synthesis Reports Modal */}
      <AnimatePresence>
        {showSynthesis && (
          <SynthesisModal 
            reports={synthesisReports} 
            onClose={() => setShowSynthesis(false)} 
            onRefresh={fetchData}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompanyProcess && (
          <CompanyProcessModal onClose={() => setShowCompanyProcess(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function PsychologyProfile({ psychProfile }) {
  if (!psychProfile) return <div className="text-gray-500">Loading profile...</div>;
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Brain className="w-6 h-6 mr-2 text-indigo-500" /> My Interview Psychology
          </h2>
          <p className="text-gray-400 text-sm mt-1">AI-derived patterns from your past interviews.</p>
        </div>
        <div className="bg-indigo-900/30 text-indigo-400 border border-indigo-500/30 px-3 py-1 rounded-lg font-mono text-sm">
          Confidence: {psychProfile.profileConfidence}%
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 space-y-4">
          <h3 className="font-bold text-gray-300">Core Patterns</h3>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Warm-Up Pattern</span>
            <span className="text-white bg-gray-800 px-2 py-1 rounded text-xs">{psychProfile.warmUpPattern.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Endurance</span>
            <span className="text-white bg-gray-800 px-2 py-1 rounded text-xs">{psychProfile.endurancePattern.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Pressure Response</span>
            <span className="text-white bg-gray-800 px-2 py-1 rounded text-xs">{psychProfile.pressureResponse.replace(/_/g, ' ')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Interviewer Response</span>
            <span className="text-white bg-gray-800 px-2 py-1 rounded text-xs">{psychProfile.interviewerResponsePattern.replace(/_/g, ' ')}</span>
          </div>
        </div>

        <div className="bg-gray-950 p-5 rounded-xl border border-gray-800 space-y-4">
          <h3 className="font-bold text-gray-300">Tactical Recommendations</h3>
          {Object.entries(psychProfile.tacticalRecommendations || {}).map(([key, value]) => (
            <div key={key}>
              <span className="text-xs text-indigo-400 uppercase font-bold tracking-wider">{key}</span>
              <p className="text-sm text-gray-300 mt-1">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CompetencyMatrix({ certifications }) {
  if (!certifications || certifications.length === 0) return <div className="text-gray-500">No certifications yet.</div>;
  
  const levels = {
    'DEVELOPING': 'bg-gray-800 text-gray-400 border-gray-700',
    'COMPETENT': 'bg-indigo-900/30 text-indigo-400 border-indigo-500/30',
    'PROFICIENT': 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30',
    'EXPERT': 'bg-amber-900/30 text-amber-400 border-amber-500/30'
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Target className="w-6 h-6 mr-2 text-emerald-500" /> Skill Certifications
        </h2>
        <p className="text-gray-400 text-sm mt-1">Verified competencies based on consistent interview performance.</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {certifications.map(c => (
          <div key={c._id || c.competency} className={`p-4 rounded-xl border ${levels[c.level]} flex flex-col justify-between min-h-[120px]`}>
            <span className="text-sm font-bold block mb-2">{c.competency.replace(/_/g, ' ')}</span>
            <div className="flex justify-between items-end">
              <span className="text-xs uppercase tracking-wider font-bold opacity-80">{c.level}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SynthesisModal({ reports, onClose, onRefresh }) {
  const [loading, setLoading] = useState(false);

  const triggerSynthesis = async () => {
    setLoading(true);
    try {
      await axios.post('/api/interviews/synthesis');
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <Flag className="w-6 h-6 mr-2 text-amber-500" /> My Interview Journey
        </h2>

        {reports.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400 mb-4">Complete 5 interviews to unlock your first synthesis report.</p>
            <button onClick={triggerSynthesis} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
              {loading ? 'Generating...' : 'Force Generate Draft (Dev)'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map(r => (
              <div key={r._id} className="bg-gray-950 p-5 rounded-xl border border-gray-800">
                <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                  <h3 className="font-bold text-white">Milestone: {r.interviewCount} Interviews</h3>
                  <span className="text-xs text-gray-500">{new Date(r.generatedAt).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider">Strongest Area</span>
                    <p className="text-sm text-gray-300">{r.strongestArea}</p>
                  </div>
                  <div>
                    <span className="text-xs text-rose-500 font-bold uppercase tracking-wider">Weakest Area</span>
                    <p className="text-sm text-gray-300">{r.weakestArea}</p>
                  </div>
                  <div>
                    <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">Biggest Improvement</span>
                    <p className="text-sm text-gray-300">{r.biggestImprovement}</p>
                  </div>
                  <div>
                    <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">Top Priority</span>
                    <p className="text-sm text-gray-300">{r.topPriority}</p>
                  </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <p className="text-sm text-gray-400 italic">{r.fullReport}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
