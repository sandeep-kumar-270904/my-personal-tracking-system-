import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import useDSASessionStore from '../store/dsaSessionStore';
import { RefreshCw, Play, ShieldCheck } from 'lucide-react';

import CommandBar from '../components/dsa/CommandBar';
import TodaysMission from '../components/dsa/TodaysMission';
import TopicMasteryGrid from '../components/dsa/TopicMasteryGrid';
import PatternIntelligencePanel from '../components/dsa/PatternIntelligencePanel';
import StreakHeatmap from '../components/dsa/StreakHeatmap';
import WeaknessRadar from '../components/dsa/WeaknessRadar';
import CompanyPrepView from '../components/dsa/CompanyPrepView';
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

// V3 Addons
import BehavioralInsightsCard from '../components/dsa/BehavioralInsightsCard';
import ContestCalibrationCard from '../components/dsa/ContestCalibrationCard';
import MasteryTrajectoryProjector from '../components/dsa/MasteryTrajectoryProjector';
import StudyGroupPanel from '../components/dsa/StudyGroupPanel';
import DifficultyCalibrationScatter from '../components/dsa/DifficultyCalibrationScatter';
import MistakeLibraryModal from '../components/dsa/MistakeLibraryModal';
import InterviewDSASignals from '../components/dsa/InterviewDSASignals';
import PersonalizedCurriculumTimeline from '../components/dsa/PersonalizedCurriculumTimeline';

const DSAPage = () => {
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

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen text-gray-200">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">DSA Intelligence</h1>
          <p className="text-gray-400">Track real progress, identify weaknesses, and prepare for target companies. <kbd className="bg-gray-800 px-2 py-0.5 rounded text-xs ml-2">Alt + D</kbd> to quick log.</p>
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
          <button onClick={() => setIsMistakeLibraryOpen(true)} className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
            Mistakes
          </button>
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

      <TodaysMission 
        onLogProblem={(rec) => {
          setInitialLogTitle(rec?.problem?.title || '');
          setIsQuickLogOpen(true);
        }}
        onReviewProblem={handleReviewProblem}
        onStartSession={handleStartSession}
      />

      <div className="mb-8">
        <MasteryTrajectoryProjector />
      </div>

      <div className="mb-8">
        <PersonalizedCurriculumTimeline />
      </div>

      <div className="mb-8">
        <StudyGroupPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="space-y-8">
          <TopicMasteryGrid topics={overview?.topicBreakdown || []} />
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
          <PeakPerformanceCard />
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

    </div>
  );
};

export default DSAPage;
