import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, List, Filter, Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

import KanbanView from '../components/applications/KanbanView';
import TableView from '../components/applications/TableView';
import NetworkGraphView from '../components/applications/NetworkGraphView';
import AnalyticsTab from '../components/applications/AnalyticsTab';
import ApplicationDetailDrawer from '../components/applications/ApplicationDetailDrawer';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import ImportModal from '../components/applications/ImportModal';
import AddApplicationModal from '../components/applications/AddApplicationModal';
import StatsBar from '../components/applications/StatsBar';
import Toolbar from '../components/applications/Toolbar';
import SuggestionsPanel from '../components/applications/SuggestionsPanel';
import WeeklyReviewWizard from '../components/applications/WeeklyReviewWizard';
import BattlePlanWizard from '../components/applications/BattlePlanWizard';
import StatsBar from '../components/applications/StatsBar';
import Toolbar from '../components/applications/Toolbar';

const fetchApplications = async ({ queryKey }) => {
  const [_key, params] = queryKey;
  const queryString = new URLSearchParams(params).toString();
  const res = await api.get(`/applications?${queryString}`);
  return res.data;
};

const ApplicationsPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [viewMode, setViewMode] = useState('table'); // kanban, table
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);
  const [editingApp, setEditingApp] = useState(null);

  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isWeeklyReviewOpen, setIsWeeklyReviewOpen] = useState(false);
  const [isBattlePlanOpen, setIsBattlePlanOpen] = useState(false);

  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20';
  const statusFilter = searchParams.get('status') || 'All';
  const sourceFilter = searchParams.get('source') || 'All';
  const priorityFilter = searchParams.get('priority') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'dateApplied';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const needsFollowUp = searchParams.get('needsFollowUp') === 'true';
  const isDead = searchParams.get('isDead') === 'true';
  const isArchived = searchParams.get('isArchived') === 'true';

  const [isGoalDismissed, setIsGoalDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(`goal_dismissed_${new Date().toISOString().split('T')[0]}`)) {
      setIsGoalDismissed(true);
    }
  }, []);

  const { data: goalsData } = useQuery({
    queryKey: ['weeklyGoals'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });
  
  const weeklyGoal = goalsData?.goals?.find(g => g.type === 'WEEKLY');
  const isWednesdayOrLater = new Date().getDay() >= 3 || new Date().getDay() === 0;

  const handleExportPDF = async () => {
    try {
      const res = await api.get('/applications/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Applications_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      toast.error('Failed to export PDF');
    }
  };

  const handleShareLink = async () => {
    try {
      const params = Object.fromEntries(searchParams.entries());
      const res = await api.post('/applications/share', { filters: params });
      navigator.clipboard.writeText(res.data.url);
      toast.success('Share link copied to clipboard!');
    } catch (e) {
      toast.error('Failed to generate share link');
    }
  };

  const queryParams = { page, limit, status: statusFilter, source: sourceFilter, priority: priorityFilter, search: searchQuery, sortBy, sortOrder, isDead, isArchived };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['applications', queryParams],
    queryFn: fetchApplications,
    keepPreviousData: true
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const res = await api.get('/applications/suggestions');
      return res.data;
    }
  });

  const { data: latestReviewData } = useQuery({
    queryKey: ['latestReview'],
    queryFn: async () => {
      const res = await api.get('/applications/weekly-review');
      return res.data;
    }
  });

  const pendingSuggestionsCount = suggestionsData?.filter(s => !s.isDismissed)?.length || 0;
  const lastReviewedAt = latestReviewData?.latestReview?.createdAt;
  const daysSinceReview = lastReviewedAt ? Math.floor((new Date() - new Date(lastReviewedAt)) / (1000 * 60 * 60 * 24)) : 100;
  const needsReviewNudge = daysSinceReview > 10;

  const applications = data?.applications || [];
  const totalCount = data?.totalCount || 0;

  // Follow-up intelligence filter (applied locally if needsFollowUp is true, but better to do it via API or filter here)
  const displayApps = needsFollowUp ? applications.filter(app => {
    const today = new Date();
    const applied = new Date(app.dateApplied);
    const diffTime = Math.abs(today - applied);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (app.status === 'APPLIED' && diffDays > 7) return true;
    if (app.followUpDate && new Date(app.followUpDate) <= today) return true;
    return false;
  }) : applications;

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['applications']);
      queryClient.invalidateQueries(['dashboardData']);
      toast.success('Application deleted');
      setAppToDelete(null);
      setIsDrawerOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete application');
    }
  });

  const handleAppClick = (app) => {
    setSelectedApp(app);
    setIsDrawerOpen(true);
  };

  const handleEditClick = (app) => {
    setIsDrawerOpen(false);
    setEditingApp(app);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setAppToDelete(id);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col space-y-6">
        {/* Section 1: Page Header with Live Stats Bar */}
        <header>
          {/* Goal Banner */}
          {weeklyGoal && isWednesdayOrLater && weeklyGoal.applications < weeklyGoal.applicationsTarget && !isGoalDismissed && (
            <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl p-3 mb-4 flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm text-blue-200 font-medium">You're at {weeklyGoal.applications}/{weeklyGoal.applicationsTarget} applications this week — {weeklyGoal.applicationsTarget - weeklyGoal.applications} more to hit your goal by Sunday.</span>
                <div className="w-full bg-black/20 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (weeklyGoal.applications / weeklyGoal.applicationsTarget) * 100)}%` }}></div>
                </div>
              </div>
              <button onClick={() => {
                localStorage.setItem(`goal_dismissed_${new Date().toISOString().split('T')[0]}`, 'true');
                setIsGoalDismissed(true);
              }} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4 text-blue-200" />
              </button>
            </div>
          )}
          {weeklyGoal && weeklyGoal.applications >= weeklyGoal.applicationsTarget && !isGoalDismissed && (
             <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 mb-4 flex justify-between items-center">
               <span className="text-sm text-emerald-300 font-medium">Weekly goal hit! 🎯 {weeklyGoal.applications}/{weeklyGoal.applicationsTarget} applications this week</span>
               <button onClick={() => setIsGoalDismissed(true)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-4 h-4 text-emerald-300" /></button>
             </div>
          )}

          {needsReviewNudge && (
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-3 mb-4 flex justify-between items-center cursor-pointer hover:bg-purple-500/30 transition-colors" onClick={() => setIsWeeklyReviewOpen(true)}>
              <div className="flex items-center gap-3">
                <span className="text-xl">📅</span>
                <span className="text-sm text-purple-200 font-medium">It's been a while since your last weekly review. Take 2 minutes to reflect on your progress!</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-end mb-4">
            <div>
              <div className="flex items-center gap-4 mb-1">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  Applications
                  <span className="text-sm font-normal text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {totalCount} Total
                  </span>
                </h1>
                {lastReviewedAt && (
                  <span className="text-xs text-slate-500 font-medium mt-1">
                    Last reviewed: {new Date(lastReviewedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsBattlePlanOpen(true)} className="btn-secondary flex items-center gap-2 border-[#ff6b00]/30 text-[#ff6b00] hover:bg-[#ff6b00]/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
                Battle Plan
              </button>
              <button onClick={() => setIsWeeklyReviewOpen(true)} className="btn-secondary flex items-center gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                Weekly Review
              </button>
              <div className="relative group">
                <button className="btn-secondary flex items-center gap-2 relative" onClick={() => setIsSuggestionsOpen(!isSuggestionsOpen)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                  Suggestions
                  {pendingSuggestionsCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#1a1b26]">
                      {pendingSuggestionsCount}
                    </span>
                  )}
                </button>
                {isSuggestionsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#1a1b26] border border-white/10 rounded-xl shadow-xl z-50">
                    <SuggestionsPanel />
                  </div>
                )}
              </div>
              <div className="relative group">
                <button className="btn-secondary flex items-center gap-2">
                  <Download className="w-4 h-4" /> Export / Share
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-[#1a1b26] border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden">
                  <button onClick={handleExportPDF} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">Export as PDF</button>
                  <button onClick={handleShareLink} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">Share as link</button>
                  <button onClick={() => setIsImportModalOpen(true)} className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">Import CSV</button>
                </div>
              </div>
              <button onClick={() => { setEditingApp(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" /> New Application
              </button>
            </div>
          </div>
          <StatsBar />
        </header>

        {/* Section 2: Toolbar */}
        <Toolbar 
          searchParams={searchParams} 
          setSearchParams={setSearchParams} 
          viewMode={viewMode} 
          setViewMode={setViewMode} 
        />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#ff6b00] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : isError ? (
            <EmptyState icon={LayoutGrid} heading="Error" subtext="Failed to load applications." />
          ) : displayApps.length === 0 ? (
            <EmptyState 
              icon={LayoutGrid} 
              heading="No applications found" 
              subtext="Try adjusting your filters or add a new application." 
              ctaText="Reset Filters"
              ctaAction={() => setSearchParams({})}
            />
          ) : (
            <>
              {viewMode === 'kanban' && <KanbanView applications={displayApps} />}
              {viewMode === 'network' && <NetworkGraphView applications={displayApps} />}
              {viewMode === 'analytics' && <AnalyticsTab applications={displayApps} />}
              {viewMode === 'table' && (
                <TableView 
                  applications={displayApps} 
                  totalCount={totalCount}
                  hasEnoughDataForPrediction={data?.hasEnoughDataForPrediction}
                  page={parseInt(page)}
                  limit={parseInt(limit)}
                  setSearchParams={setSearchParams}
                  onAppClick={handleAppClick} 
                />
              )}
            </>
          )}
        </div>
      </div>

      <ApplicationDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        applicationId={selectedApp?._id} 
        onEdit={() => handleEditClick(selectedApp)}
        onDelete={() => handleDeleteClick(selectedApp?._id)}
      />

      <ConfirmModal
        isOpen={!!appToDelete}
        onClose={() => setAppToDelete(null)}
        onConfirm={() => deleteMutation.mutate(appToDelete)}
        title="Delete Application"
        message="Are you sure you want to delete this application? This action cannot be undone."
      />

      {isModalOpen && (
        <AddApplicationModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          editingApp={editingApp}
        />
      )}

      {isImportModalOpen && (
        <ImportModal 
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}

      {isWeeklyReviewOpen && <WeeklyReviewWizard onClose={() => setIsWeeklyReviewOpen(false)} />}
      {isBattlePlanOpen && <BattlePlanWizard onClose={() => setIsBattlePlanOpen(false)} />}
    </>
  );
};

export default ApplicationsPage;
