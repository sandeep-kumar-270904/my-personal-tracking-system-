import { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle, LayoutGrid, List } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import QuickAddFab from '../components/QuickAddFab';

// Dashboard Components
import DashboardBanner from '../components/dashboard/DashboardBanner';
import StatCardRow from '../components/dashboard/StatCardRow';
import PipelineKanban from '../components/dashboard/PipelineKanban';
import GoalRings from '../components/dashboard/GoalRings';
import UpcomingStrip from '../components/dashboard/UpcomingStrip';
import UpcomingCampusDrivesStrip from '../components/dashboard/UpcomingCampusDrivesStrip';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import PeerBenchmarkCard from '../components/dashboard/PeerBenchmarkCard';
import AIInsightsBanner from '../components/dashboard/AIInsightsBanner';
import ReadinessGauge from '../components/dashboard/ReadinessGauge';
import StreakAlertBanner from '../components/dashboard/StreakAlertBanner';
import OnboardingFlow from '../components/dashboard/OnboardingFlow';
import { QuickAddModals } from '../components/dashboard/QuickAddModals';
import ShortcutHintCard from '../components/dashboard/ShortcutHintCard';

// Hooks
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const fetchDashboardData = async () => {
  const [statsRes, pipelineRes, upcomingRes, feedRes, heatmapRes, chartsRes, roiRes] = await Promise.all([
    api.get('/dashboard/stats'),
    api.get('/dashboard/pipeline'),
    api.get('/dashboard/upcoming'),
    api.get('/dashboard/activity-feed'),
    api.get('/dashboard/heatmap'),
    api.get('/dashboard/charts'),
    api.get('/applications/roi')
  ]);

  return {
    stats: statsRes.data,
    pipeline: pipelineRes.data,
    upcoming: upcomingRes.data,
    feed: feedRes.data,
    heatmap: heatmapRes.data,
    charts: chartsRes.data,
    roi: roiRes.data
  };
};

const DashboardPage = () => {
  const { user } = useContext(AuthContext);
  const [activeModal, setActiveModal] = useState(null);
  
  // Layout Preference
  const [isCompact, setIsCompact] = useState(() => {
    const saved = localStorage.getItem('dashboardLayout');
    return saved === 'compact';
  });

  useEffect(() => {
    localStorage.setItem('dashboardLayout', isCompact ? 'compact' : 'default');
  }, [isCompact]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });

  const { data: prepAlerts = [] } = useQuery({
    queryKey: ['prepAlerts'],
    queryFn: async () => {
      const res = await api.get('/prephub/alerts');
      return res.data;
    }
  });

  // Keyboard Shortcuts
  useKeyboardShortcuts({
    onAddApplication: () => setActiveModal('ADD_APP'),
    onLogDSA: () => setActiveModal('LOG_DSA'),
    onAddInterview: () => setActiveModal('ADD_INTERVIEW'),
    onNavigateGoals: () => window.location.href = '/goals',
    onNavigateContests: () => window.location.href = '/contests',
    onFocusSearch: () => {
      // If there's a global search bar, focus it. (Not explicitly in dashboard, but good practice)
      const searchInput = document.querySelector('input[type="search"]');
      if (searchInput) searchInput.focus();
    }
  });

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="h-32 bg-white/5 animate-pulse rounded-2xl mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-white/5 animate-pulse rounded-2xl mb-8"></div>
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={AlertCircle} heading="Failed to load dashboard" subtext="There was an error loading your data." />;
  }

  // Onboarding Logic
  const stats = data.stats;
  const isBrandNew = stats.totalApplications === 0 && stats.dsaTopicsTracked === 0 && stats.activeInterviews === 0 && !user?.isOnboarded;

  if (isBrandNew) {
    return (
      <>
        <OnboardingFlow 
          stats={stats} 
          userName={user.name} 
          onComplete={() => refetch()} 
          onActionClick={setActiveModal} 
        />
        <QuickAddModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
      </>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`max-w-[1600px] mx-auto pb-20 ${isCompact ? 'space-y-4' : 'space-y-8'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <DashboardBanner user={user} stats={data.stats} upcoming={data.upcoming} />
        </div>
        
        {/* Layout Toggle */}
        <div className="flex bg-[#1a1b26] rounded-lg p-1 border border-white/5 ml-4">
          <button 
            onClick={() => setIsCompact(false)}
            className={`p-1.5 rounded-md transition-colors ${!isCompact ? 'bg-[#ff6b00] text-white' : 'text-slate-400 hover:text-white'}`}
            title="Default View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setIsCompact(true)}
            className={`p-1.5 rounded-md transition-colors ${isCompact ? 'bg-[#ff6b00] text-white' : 'text-slate-400 hover:text-white'}`}
            title="Compact View"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {prepAlerts.map(alert => (
        <div key={alert._id} className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl p-4 flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            <p className="text-sm text-white font-medium">
              Interview prep required for <span className="font-bold text-blue-400">{alert.company}</span> - {alert.role}!
            </p>
          </div>
          <button 
            onClick={() => window.location.href = `/prephub?syllabusId=${alert._id}`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            Start Syllabus →
          </button>
        </div>
      ))}

      {stats.currentStreak >= 3 && !stats.hasLoggedDSAToday && (
        <StreakAlertBanner streak={stats.currentStreak} onLogClick={() => setActiveModal('LOG_DSA')} />
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="lg:col-span-5">
          <StatCardRow stats={data.stats} />
        </div>
        <div className="lg:col-span-1">
          <ReadinessGauge />
        </div>
      </div>

      <AIInsightsBanner />

      <div className={`grid grid-cols-1 lg:grid-cols-4 ${isCompact ? 'gap-4' : 'gap-8'}`}>
        {/* Left/Center Main Column */}
        <div className={`lg:col-span-3 ${isCompact ? 'space-y-4' : 'space-y-8'}`}>
          <UpcomingCampusDrivesStrip />
          <UpcomingStrip upcoming={data.upcoming} />
          <PipelineKanban pipeline={data.pipeline} />
          <GoalRings goalsData={data.stats?.weeklyGoals} />
          <DashboardCharts charts={data.charts} heatmap={data.heatmap} roi={data.roi} isCompact={isCompact} />
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-1 relative flex flex-col gap-6">
          <PeerBenchmarkCard user={user} />
          <ActivityFeed feed={data.feed} isCompact={isCompact} />
        </div>
      </div>
      
      <QuickAddFab onActionClick={setActiveModal} />
      <QuickAddModals activeModal={activeModal} onClose={() => setActiveModal(null)} />
      <ShortcutHintCard />
    </motion.div>
  );
};

export default DashboardPage;
