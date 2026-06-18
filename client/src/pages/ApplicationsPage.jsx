import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, List, Filter, Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

import KanbanView from '../components/applications/KanbanView';
import TableView from '../components/applications/TableView';
import ApplicationDetailDrawer from '../components/applications/ApplicationDetailDrawer';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';
import ImportModal from '../components/applications/ImportModal';
import AddApplicationModal from '../components/applications/AddApplicationModal';
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

  // Extract params
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20';
  const statusFilter = searchParams.get('status') || 'All';
  const sourceFilter = searchParams.get('source') || 'All';
  const priorityFilter = searchParams.get('priority') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'dateApplied';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const needsFollowUp = searchParams.get('needsFollowUp') === 'true';

  const queryParams = { page, limit, status: statusFilter, source: sourceFilter, priority: priorityFilter, search: searchQuery, sortBy, sortOrder };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['applications', queryParams],
    queryFn: fetchApplications,
    keepPreviousData: true
  });

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
          <div className="flex justify-between items-end mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                Applications
                <span className="text-sm font-normal text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  {totalCount} Total
                </span>
              </h1>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsImportModalOpen(true)} className="btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" /> Import CSV
              </button>
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
              {viewMode === 'table' && (
                <TableView 
                  applications={displayApps} 
                  totalCount={totalCount}
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
    </>
  );
};

export default ApplicationsPage;
