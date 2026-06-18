import { useContext } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import QuickAddFab from '../components/QuickAddFab';

// Dashboard Components
import DashboardBanner from '../components/dashboard/DashboardBanner';
import StatCardRow from '../components/dashboard/StatCardRow';
import PipelineKanban from '../components/dashboard/PipelineKanban';
import GoalRings from '../components/dashboard/GoalRings';
import UpcomingStrip from '../components/dashboard/UpcomingStrip';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import ActivityFeed from '../components/dashboard/ActivityFeed';

const fetchDashboardData = async () => {
  const [statsRes, pipelineRes, upcomingRes, feedRes, heatmapRes, chartsRes] = await Promise.all([
    api.get('/dashboard/stats'),
    api.get('/dashboard/pipeline'),
    api.get('/dashboard/upcoming'),
    api.get('/dashboard/activity-feed'),
    api.get('/dashboard/heatmap'),
    api.get('/dashboard/charts')
  ]);

  return {
    stats: statsRes.data,
    pipeline: pipelineRes.data,
    upcoming: upcomingRes.data,
    feed: feedRes.data,
    heatmap: heatmapRes.data,
    charts: chartsRes.data
  };
};

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="h-32 bg-white/5 animate-pulse rounded-2xl mb-8"></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-32 bg-white/5 animate-pulse rounded-2xl"></div>)}
        </div>
        <div className="h-64 bg-white/5 animate-pulse rounded-2xl mb-8"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-48 bg-white/5 animate-pulse rounded-2xl"></div>
            <div className="h-96 bg-white/5 animate-pulse rounded-2xl"></div>
          </div>
          <div className="lg:col-span-1 h-screen bg-white/5 animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={AlertCircle} heading="Failed to load dashboard" subtext="There was an error loading your data." />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1600px] mx-auto pb-20">
      <DashboardBanner user={user} stats={data.stats} upcoming={data.upcoming} />
      
      <StatCardRow stats={data.stats} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left/Center Main Column */}
        <div className="lg:col-span-3 space-y-8">
          <UpcomingStrip upcoming={data.upcoming} />
          
          <PipelineKanban pipeline={data.pipeline} />
          
          <GoalRings goalsData={data.stats?.weeklyGoals} />
          
          <DashboardCharts charts={data.charts} heatmap={data.heatmap} />
        </div>

        {/* Right Sidebar Column */}
        <div className="lg:col-span-1 relative">
          <ActivityFeed feed={data.feed} />
        </div>
      </div>
      
      <QuickAddFab />
    </motion.div>
  );
};

export default DashboardPage;
