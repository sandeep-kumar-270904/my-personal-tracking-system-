import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutGrid, List, Clock, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

import KanbanView from '../components/applications/KanbanView';
import TableView from '../components/applications/TableView';
import TimelineView from '../components/applications/TimelineView';
import ApplicationDetailDrawer from '../components/applications/ApplicationDetailDrawer';
import ConfirmModal from '../components/ConfirmModal';
import EmptyState from '../components/EmptyState';

const fetchApplications = async () => {
  const res = await api.get('/applications');
  return res.data;
};

const ApplicationsPage = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('kanban'); // kanban, table, timeline
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null);
  const [editingApp, setEditingApp] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ['applications'],
    queryFn: fetchApplications,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingApp) {
        return await api.put(`/applications/${editingApp._id}`, formData);
      } else {
        return await api.post('/applications', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['applications']);
      queryClient.invalidateQueries(['dashboardData']);
      toast.success(editingApp ? 'Application updated!' : 'Application added!');
      setIsModalOpen(false);
      setEditingApp(null);
    },
    onError: () => {
      toast.error('Failed to save application');
    }
  });

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

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await api.put(`/applications/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['applications']);
      queryClient.invalidateQueries(['dashboardData']);
      toast.success('Status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  const filteredApps = applications.filter(app => {
    const matchesSearch = app.company.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  const handleStatusChange = (id, newStatus) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  // Form State
  const [formData, setFormData] = useState({
    company: '', role: '', status: 'Applied', appliedDate: new Date().toISOString().split('T')[0], link: '', notes: ''
  });

  // Open modal for new
  const handleAddNew = () => {
    setEditingApp(null);
    setFormData({
      company: '', role: '', status: 'Applied', appliedDate: new Date().toISOString().split('T')[0], link: '', notes: ''
    });
    setIsModalOpen(true);
  };

  // Set form data when editingApp changes
  if (editingApp && formData.company !== editingApp.company && isModalOpen) {
    setFormData({
      company: editingApp.company,
      role: editingApp.role,
      status: editingApp.status,
      appliedDate: new Date(editingApp.appliedDate).toISOString().split('T')[0],
      link: editingApp.link || '',
      notes: editingApp.notes || ''
    });
  }

  const handleFormSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <div className="h-10 w-64 bg-white/5 animate-pulse rounded-lg mb-8"></div>
        <div className="flex gap-4 overflow-x-hidden">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="min-w-[280px] h-[500px] bg-white/5 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <EmptyState icon={LayoutGrid} heading="Error" subtext="Failed to load applications." />;
  }

  return (
    <>
      <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Applications</h1>
            <p className="text-slate-400">Track and manage your job applications pipeline.</p>
          </div>
          <button onClick={handleAddNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Application
          </button>
        </header>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-4 items-center justify-between mb-6 bg-[#13141f] p-3 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff6b00] w-48 transition-colors"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-[#ff6b00] transition-colors appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="Applied">Applied</option>
              <option value="OA">Online Assessment</option>
              <option value="Interview">Interview</option>
              <option value="Selected">Offer</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-[#ff6b00] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#ff6b00] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'timeline' ? 'bg-[#ff6b00] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              title="Timeline View"
            >
              <Clock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {filteredApps.length === 0 ? (
            <EmptyState 
              icon={LayoutGrid} 
              heading="No applications found" 
              subtext={applications.length === 0 ? "Start tracking your job hunt today." : "Try adjusting your filters."} 
              ctaText={applications.length === 0 ? "Add Your First Application" : null}
              ctaAction={applications.length === 0 ? handleAddNew : null}
            />
          ) : (
            <>
              {viewMode === 'kanban' && <KanbanView applications={filteredApps} onStatusChange={handleStatusChange} onAppClick={handleAppClick} />}
              {viewMode === 'table' && <TableView applications={filteredApps} onAppClick={handleAppClick} />}
              {viewMode === 'timeline' && <div className="h-full overflow-y-auto pb-20"><TimelineView applications={filteredApps} onAppClick={handleAppClick} /></div>}
            </>
          )}
        </div>
      </div>

      {/* Drawer */}
      <ApplicationDetailDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        app={selectedApp} 
        onEdit={handleEditClick}
        onDelete={(id) => {
          setIsDrawerOpen(false);
          handleDeleteClick(id);
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!appToDelete}
        onClose={() => setAppToDelete(null)}
        onConfirm={() => deleteMutation.mutate(appToDelete)}
        title="Delete Application"
        message="Are you sure you want to delete this application? This action cannot be undone."
      />

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#13141f] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white">
                  {editingApp ? 'Edit Application' : 'New Application'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company</label>
                    <input 
                      type="text" 
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="input-field py-2.5 px-4" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Role</label>
                    <input 
                      type="text" 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="input-field py-2.5 px-4" 
                      required 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="input-field py-2.5 px-4 appearance-none"
                    >
                      <option value="Applied">Applied</option>
                      <option value="OA">Online Assessment (OA)</option>
                      <option value="Interview">Interview</option>
                      <option value="Selected">Offer</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date Applied</label>
                    <input 
                      type="date" 
                      value={formData.appliedDate}
                      onChange={(e) => setFormData({...formData, appliedDate: e.target.value})}
                      className="input-field py-2.5 px-4 [color-scheme:dark]" 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Job Link URL</label>
                  <input 
                    type="url" 
                    value={formData.link}
                    onChange={(e) => setFormData({...formData, link: e.target.value})}
                    className="input-field py-2.5 px-4" 
                    placeholder="https://"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="input-field py-2.5 px-4 min-h-[100px] resize-y" 
                    placeholder="Interview details, contact info..."
                  ></textarea>
                </div>

                <div className="flex justify-end pt-4 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary px-5 py-2.5 text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saveMutation.isPending}
                    className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {saveMutation.isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                    {editingApp ? 'Save Changes' : 'Add Application'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ApplicationsPage;
