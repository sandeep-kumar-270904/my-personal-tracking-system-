import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import useDSASessionStore from '../store/dsaSessionStore';
import { RefreshCw, Play, ShieldCheck, Activity, Calendar, Settings, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import CommandBar from '../components/dsa/CommandBar';
import TodaysMission from '../components/dsa/TodaysMission';
import TopicMasteryGrid from '../components/dsa/TopicMasteryGrid';
import PatternIntelligencePanel from '../components/dsa/PatternIntelligencePanel';
import StreakHeatmap from '../components/dsa/StreakHeatmap';
import WeaknessRadar from '../components/dsa/WeaknessRadar';
import CompanyPrepView from '../components/dsa/CompanyPrepView';
import StrugglingBanner from '../components/dsa/StrugglingBanner';
import ProblemLog from '../components/dsa/ProblemLog';
import QuickLogModal from '../components/dsa/QuickLogModal';
import SessionSummaryModal from '../components/dsa/SessionSummaryModal';
import StudySessionTracker from '../components/dsa/StudySessionTracker';

// V2 Addons
import LeetCodeSyncModal from '../components/dsa/LeetCodeSyncModal';
import MockInterviewSimulator from '../components/dsa/MockInterviewSimulator';
import InterviewReadinessReport from '../components/dsa/InterviewReadinessReport';
import KnowledgeGraphViewer from '../components/dsa/KnowledgeGraphViewer';
import PeerBenchmarkingView from '../components/dsa/PeerBenchmarkingView';
import PeakPerformanceCard from '../components/dsa/PeakPerformanceCard';
import PatternTrainingFlashcards from '../components/dsa/PatternTrainingFlashcards';
import InterviewCountdownBanner from '../components/dsa/InterviewCountdownBanner';

// V3 Addons
import BehavioralInsightsCard from '../components/dsa/BehavioralInsightsCard';
import ContestCalibrationCard from '../components/dsa/ContestCalibrationCard';
import MasteryTrajectoryProjector from '../components/dsa/MasteryTrajectoryProjector';
import StudyGroupPanel from '../components/dsa/StudyGroupPanel';
import DifficultyCalibrationScatter from '../components/dsa/DifficultyCalibrationScatter';
import MistakeLibraryModal from '../components/dsa/MistakeLibraryModal';
import InterviewDSASignals from '../components/dsa/InterviewDSASignals';
import PersonalizedCurriculumTimeline from '../components/dsa/PersonalizedCurriculumTimeline';

// V5 Addons
import DiagnosticFlow from '../components/dsa/v5/DiagnosticFlow';
import PatternMasteryGrid from '../components/dsa/v5/PatternMasteryGrid';
import ThinkingVelocityChart from '../components/dsa/v5/ThinkingVelocityChart';
import BlindImplementationModule from '../components/dsa/v5/BlindImplementationModule';
import PressureSimulationSession from '../components/dsa/v5/PressureSimulationSession';
import CompanyDifficultyCalibrator from '../components/dsa/v5/CompanyDifficultyCalibrator';
import PatternDisguiseDrill from '../components/dsa/v5/PatternDisguiseDrill';
import StuckProtocolModal from '../components/dsa/v5/StuckProtocolModal';
import OrcaSidebar from '../components/dsa/v5/OrcaSidebar';
import ActiveRecallNotesCard from '../components/dsa/v5/ActiveRecallNotesCard';
import WeeklyHonestReport from '../components/dsa/v5/WeeklyHonestReport';
import PlacementCountdownCalibrator from '../components/dsa/v5/PlacementCountdownCalibrator';
import AvoidanceLockModal from '../components/dsa/v5/AvoidanceLockModal';
import MonthlyCalibrationInterview from '../components/dsa/v5/MonthlyCalibrationInterview';
import InterviewEveProtocolModal from '../components/dsa/v5/InterviewEveProtocolModal';
import DSATrackerWidget from '../components/prephub/DSATrackerWidget';

const DSAPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const sessionStore = useDSASessionStore();

  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isSessionSummaryOpen, setIsSessionSummaryOpen] = useState(false);
  const [initialLogTitle, setInitialLogTitle] = useState('');

  // V2 Modal States
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isMockSimulatorOpen, setIsMockSimulatorOpen] = useState(false);
  const [isReadinessReportOpen, setIsReadinessReportOpen] = useState(false);

  // V3 Modal States
  const [isMistakeLibraryOpen, setIsMistakeLibraryOpen] = useState(false);

  // V5 States
  const [needsDiagnostic, setNeedsDiagnostic] = useState(!localStorage.getItem('v5_diagnostic_done'));
  const [primaryView, setPrimaryView] = useState('pattern');
  const [isBlindImplOpen, setIsBlindImplOpen] = useState(false);
  const [isPressureSessionOpen, setIsPressureSessionOpen] = useState(false);
  const [isStuckProtocolOpen, setIsStuckProtocolOpen] = useState(false);
  const [isOrcaSidebarOpen, setIsOrcaSidebarOpen] = useState(false);
  const [isWeeklyReportOpen, setIsWeeklyReportOpen] = useState(false);
  const [isAvoidanceLockOpen, setIsAvoidanceLockOpen] = useState(false);
  const [isMonthlyCalibrationOpen, setIsMonthlyCalibrationOpen] = useState(false);
  const [isInterviewEveOpen, setIsInterviewEveOpen] = useState(false);

  const mockPatterns = [
    { _id: '1', patternName: 'Two Pointer', masteryLevel: 'INTERMEDIATE', solvedCount: 15, weaknessScore: 40, description: 'Using two pointers to iterate through an array or list.' },
    { _id: '2', patternName: 'Sliding Window', masteryLevel: 'BEGINNER', solvedCount: 5, weaknessScore: 75, description: 'Creating a window that slides over an array to find a subset.' },
    { _id: '3', patternName: 'Fast & Slow Pointers', masteryLevel: 'ADVANCED', solvedCount: 12, weaknessScore: 20, description: 'Cycle detection and middle element.' }
  ];

  // Handle Alt+D shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setIsQuickLogOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Parse deep links
  useEffect(() => {
    if (searchParams.get('logProblem') === 'true') {
      const title = searchParams.get('title');
      if (title) setInitialLogTitle(title);
      setIsQuickLogOpen(true);
      
      // Clean up URL so refresh doesn't reopen it
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dsa', 'overview'],
    queryFn: async () => {
      const res = await api.get('/dsa/overview');
      return res.data;
    }
  });

  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/dsa/study-session/start');
      return res.data;
    },
    onSuccess: () => {
      sessionStore.startSession();
      queryClient.invalidateQueries(['dsa']);
    }
  });

  const handleStartSession = () => {
    if (!sessionStore.isActive) {
      startSessionMutation.mutate();
    }
  };

  const handleEndSessionClick = () => {
    setIsSessionSummaryOpen(true);
  };

  const handleReviewProblem = (prob) => {
    setInitialLogTitle(prob.title);
    setIsQuickLogOpen(true);
  };
  // DiagnosticFlow has been bypassed for ease of development.
  // if (needsDiagnostic) {
  //   return <DiagnosticFlow onComplete={() => {
  //     localStorage.setItem('v5_diagnostic_done', 'true');
  //     setNeedsDiagnostic(false);
  //   }} />;
  // }
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen text-gray-200">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">DSA Intelligence</h1>
          <p className="text-gray-400">Track real progress, identify weaknesses, and prepare for target companies. <kbd className="bg-gray-800 px-2 py-0.5 rounded text-xs ml-2">Alt + D</kbd> to quick log.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dsa/command-center')} 
            className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-xl transition-colors font-bold flex items-center gap-2"
          >
            <Activity className="w-4 h-4" /> Command Center
          </button>
          <button 
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors font-bold flex items-center gap-2"
            onClick={() => toast.success("Scheduling your week based on Peak Performance hours and Interview targets...")}
          >
            <Calendar className="w-4 h-4" /> Schedule Week
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsSyncModalOpen(true)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <RefreshCw className="w-4 h-4" /> Sync LeetCode/GFG
          </button>
          <button onClick={() => setIsMockSimulatorOpen(true)} className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <Play className="w-4 h-4" /> Mock Interview
          </button>
          <button onClick={() => setIsReadinessReportOpen(true)} className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <ShieldCheck className="w-4 h-4" /> Am I Ready?
          </button>
          <button onClick={() => setIsPressureSessionOpen(true)} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <Activity className="w-4 h-4" /> Pressure Mode
          </button>
          <button onClick={() => setIsStuckProtocolOpen(true)} className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            <AlertCircle className="w-4 h-4" /> I'm Stuck
          </button>
          <button onClick={() => setIsOrcaSidebarOpen(true)} className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            ORCA Sheet
          </button>
          <button onClick={() => setIsBlindImplOpen(true)} className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            Blind Code
          </button>
          <button onClick={() => setIsMistakeLibraryOpen(true)} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            Mistakes
          </button>
          
          <div className="w-px h-6 bg-gray-800 mx-2 self-center"></div>
          
          {/* Developer Toggles for V5 Modals */}
          <button onClick={() => setIsWeeklyReportOpen(true)} className="px-3 py-1 bg-gray-800 text-gray-400 rounded-md text-xs hover:text-white">Wkly Report</button>
          <button onClick={() => setIsAvoidanceLockOpen(true)} className="px-3 py-1 bg-gray-800 text-gray-400 rounded-md text-xs hover:text-white">Avoidance</button>
          <button onClick={() => setIsMonthlyCalibrationOpen(true)} className="px-3 py-1 bg-gray-800 text-gray-400 rounded-md text-xs hover:text-white">Monthly Cal</button>
          <button onClick={() => setIsInterviewEveOpen(true)} className="px-3 py-1 bg-gray-800 text-gray-400 rounded-md text-xs hover:text-white">Intv Eve</button>
        </div>
      </div>

      <CommandBar 
        overview={overview} 
        onOpenQuickLog={(title) => {
          setInitialLogTitle(title);
          setIsQuickLogOpen(true);
        }}
        onStartSession={handleStartSession}
      />

      <StrugglingBanner topics={overview?.topicBreakdown || []} />

      <PlacementCountdownCalibrator />

      <InterviewCountdownBanner 
        interview={{ companyName: 'Mock Company', interviewDate: new Date(Date.now() + 86400000 * 5), prepPlan: [] }} 
      />

      <TodaysMission 
        onLogProblem={(rec) => {
          setInitialLogTitle(rec?.problem?.title || '');
          setIsQuickLogOpen(true);
        }}
        onReviewProblem={handleReviewProblem}
        onStartSession={handleStartSession}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <MasteryTrajectoryProjector />
        <ThinkingVelocityChart />
      </div>

      <div className="mb-8">
        <ActiveRecallNotesCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <PersonalizedCurriculumTimeline />
        </div>
        <div>
          <DSATrackerWidget activeTopic={
            overview?.topicBreakdown?.filter(t => t.accuracy < 50 && t.solved > 0)?.sort((a, b) => a.accuracy - b.accuracy)?.[0]?.topic || "Dynamic Programming"
          } />
        </div>
      </div>

      <div className="mb-8">
        <StudyGroupPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-1 inline-flex">
            <button
              onClick={() => setPrimaryView('pattern')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors \${primaryView === 'pattern' ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Pattern View
            </button>
            <button
              onClick={() => setPrimaryView('topic')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors \${primaryView === 'topic' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Topic View
            </button>
          </div>
          {primaryView === 'pattern' ? (
            <PatternMasteryGrid patterns={mockPatterns} />
          ) : (
            <TopicMasteryGrid topics={overview?.topicBreakdown || []} />
          )}
          <BehavioralInsightsCard />
          <KnowledgeGraphViewer />
          <WeaknessRadar />
          <InterviewDSASignals />
          <PeerBenchmarkingView />
        </div>
        <div className="space-y-8">
          <ContestCalibrationCard />
          <DifficultyCalibrationScatter />
          <PatternIntelligencePanel />
          <PatternTrainingFlashcards />
          <PatternDisguiseDrill />
          <PeakPerformanceCard />
          <CompanyDifficultyCalibrator />
          <CompanyPrepView />
        </div>
      </div>

      <StreakHeatmap />
      <ProblemLog />

      {/* Modals & Trackers */}
      <StudySessionTracker onEndSession={handleEndSessionClick} />
      
      <QuickLogModal 
        isOpen={isQuickLogOpen} 
        onClose={() => {
          setIsQuickLogOpen(false);
          setInitialLogTitle('');
        }}
        initialTitle={initialLogTitle}
      />

      <SessionSummaryModal 
        isOpen={isSessionSummaryOpen}
        onClose={() => setIsSessionSummaryOpen(false)}
      />

      <LeetCodeSyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)} 
      />

      <MockInterviewSimulator 
        isOpen={isMockSimulatorOpen} 
        onClose={() => setIsMockSimulatorOpen(false)} 
      />

      <InterviewReadinessReport 
        isOpen={isReadinessReportOpen} 
        onClose={() => setIsReadinessReportOpen(false)} 
      />

      <MistakeLibraryModal 
        isOpen={isMistakeLibraryOpen} 
        onClose={() => setIsMistakeLibraryOpen(false)} 
      />

      <BlindImplementationModule 
        isOpen={isBlindImplOpen} 
        onClose={() => setIsBlindImplOpen(false)} 
        problemTitle={initialLogTitle || "Recent Problem"} 
      />

      <PressureSimulationSession 
        isOpen={isPressureSessionOpen} 
        onClose={() => setIsPressureSessionOpen(false)} 
        problemTitle={initialLogTitle || "Mock Session"} 
      />

      <StuckProtocolModal 
        isOpen={isStuckProtocolOpen} 
        onClose={() => setIsStuckProtocolOpen(false)} 
      />

      <OrcaSidebar 
        isOpen={isOrcaSidebarOpen} 
        onClose={() => setIsOrcaSidebarOpen(false)} 
      />

      <WeeklyHonestReport 
        isOpen={isWeeklyReportOpen} 
        onClose={() => setIsWeeklyReportOpen(false)} 
      />

      <AvoidanceLockModal 
        isOpen={isAvoidanceLockOpen} 
        onClose={() => setIsAvoidanceLockOpen(false)} 
      />

      <MonthlyCalibrationInterview 
        isOpen={isMonthlyCalibrationOpen} 
        onClose={() => setIsMonthlyCalibrationOpen(false)} 
      />

      <InterviewEveProtocolModal 
        isOpen={isInterviewEveOpen} 
        onClose={() => setIsInterviewEveOpen(false)} 
      />

    </div>
  );
};

export default DSAPage;
