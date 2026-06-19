import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

import ResumeStatsBar from '../components/resumes/ResumeStatsBar';
import Toolbar from '../components/resumes/Toolbar';
import ResumeCard from '../components/resumes/ResumeCard';
import UploadModal from '../components/resumes/UploadModal';
import PreviewModal from '../components/resumes/PreviewModal';
import CoverLetterGenerator from '../components/resumes/CoverLetterGenerator';
import CoverLettersSection from '../components/resumes/CoverLettersSection';
import LinkedInImportModal from '../components/resumes/LinkedInImportModal';
import ABTestingDashboardModal from '../components/resumes/ABTestingDashboardModal';
import ResumeBuilderModal from '../components/resumes/ResumeBuilderModal';
import BatchScoreModal from '../components/resumes/BatchScoreModal';
import MaintenanceWizardModal from '../components/resumes/MaintenanceWizardModal';
import HealthMonitorAlerts from '../components/resumes/HealthMonitorAlerts';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import DSASkillSuggestionPanel from '../components/resumes/DSASkillSuggestionPanel';
import { FileText } from 'lucide-react';

export default function ResumesPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [showABTestModal, setShowABTestModal] = useState(false);
  const [showResumeBuilderModal, setShowResumeBuilderModal] = useState(false);
  const [showBatchScoreModal, setShowBatchScoreModal] = useState(false);
  const [maintenanceWizardResume, setMaintenanceWizardResume] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [deleteResume, setDeleteResume] = useState(null);
  const [coverLetterResume, setCoverLetterResume] = useState(null);

  // Queries
  const { data: resumes = [], isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const res = await api.get('/resumes');
      return res.data;
    },
    refetchInterval: (data) => data?.some(r => r.isAnalyzing) ? 3000 : false
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['resumeStats'],
    queryFn: async () => {
      const res = await api.get('/resumes/stats');
      return res.data;
    }
  });

  const { data: healthAlerts = [] } = useQuery({
    queryKey: ['healthAlerts'],
    queryFn: async () => {
      const { data } = await api.get('/resumes/health-alerts');
      return data;
    }
  });

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    resumes.forEach(r => r.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [resumes]);

  // Filter and Sort Logic
  const filteredResumes = useMemo(() => {
    let result = [...resumes];
    const q = searchParams.get('q')?.toLowerCase();
    const tag = searchParams.get('tag');
    const sort = searchParams.get('sort') || 'lastUsedAt';
    const showAllVersions = searchParams.get('allVersions') === 'true';

    // Grouping by lineage to only show latest versions unless showAllVersions is true
    if (!showAllVersions) {
      const lineages = new Map();
      result.forEach(r => {
        const key = r.parentResumeId || r._id;
        if (!lineages.has(key) || lineages.get(key).version < r.version) {
          lineages.set(key, r);
        }
      });
      result = Array.from(lineages.values());
    }

    if (q) {
      result = result.filter(r => 
        (r.name || r.originalName || '').toLowerCase().includes(q) ||
        r.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    if (tag) {
      result = result.filter(r => r.tags?.includes(tag));
    }

    result.sort((a, b) => {
      if (sort === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sort === 'atsScore') return (b.analysis?.atsScore || 0) - (a.analysis?.atsScore || 0);
      if (sort === 'name') return (a.name || a.originalName).localeCompare(b.name || b.originalName);
      // Default: lastUsedAt
      const aUsed = a.performance?.lastUsedAt ? new Date(a.performance.lastUsedAt) : new Date(a.createdAt);
      const bUsed = b.performance?.lastUsedAt ? new Date(b.performance.lastUsedAt) : new Date(b.createdAt);
      return bUsed - aUsed;
    });

    return result;
  }, [resumes, searchParams]);

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id) => await api.delete(`/resumes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['resumes']);
      queryClient.invalidateQueries(['resumeStats']);
      toast.success('Resume deleted successfully');
      setDeleteResume(null);
      setPreviewResume(null); // Close preview if open
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete resume');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id) => await api.post(`/resumes/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries(['resumes']);
      toast.success('Resume duplicated successfully');
    },
    onError: () => toast.error('Failed to duplicate resume')
  });

  // Handlers
  const handleDelete = () => {
    if (deleteResume) deleteMutation.mutate(deleteResume._id);
  };

  const handleDuplicate = (resume) => {
    duplicateMutation.mutate(resume._id);
  };

  const handleDownload = (resume) => {
    if (resume.fileUrl) {
      window.open(resume.fileUrl, '_blank');
    } else {
      toast.error("File URL not found");
    }
  };

  const currentPreviewVersions = useMemo(() => {
    if (!previewResume) return [];
    const parentId = previewResume.parentResumeId || previewResume._id;
    return resumes.filter(r => r._id === parentId || r.parentResumeId === parentId)
                  .sort((a, b) => b.version - a.version);
  }, [previewResume, resumes]);

  const { data: goalData } = useQuery({
    queryKey: ['goalsProgress'],
    queryFn: async () => {
      const res = await api.get('/goals');
      return res.data;
    }
  });

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-[1600px] mx-auto min-h-screen pb-32">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Resumes & ATS Analysis</h1>
          <p className="text-slate-400 max-w-3xl leading-relaxed">
            Manage your tailored resumes, compare versions, and let our AI score your resume against ATS systems to find strengths and missing keywords.
          </p>
        </div>
        
        {/* V4 RX5: Goals Driven Targets Indicator */}
        {goalData && goalData.goal && (
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col gap-2 min-w-[250px]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium tracking-wide uppercase text-xs">Weekly Target</span>
              <span className="text-white font-bold">{goalData.progress?.resumeHealth || 0} / {goalData.goal.resumeHealthTarget || 2} <span className="text-slate-500 font-normal">High Scoring Resumes</span></span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((goalData.progress?.resumeHealth || 0) / (goalData.goal.resumeHealthTarget || 2)) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Health Alerts */}
      <HealthMonitorAlerts />

      {/* Stats Bar */}
      <ResumeStatsBar stats={stats} isLoading={statsLoading} />

      {/* Toolbar */}
      <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 backdrop-blur-md">
        <Toolbar tags={allTags} setShowUploadModal={setShowUploadModal} setShowLinkedInModal={setShowLinkedInModal} setShowABTestModal={setShowABTestModal} setShowResumeBuilderModal={setShowResumeBuilderModal} setShowBatchScoreModal={setShowBatchScoreModal} />
      </div>

      {/* Resumes Grid */}
      {resumesLoading ? (
        <div className="flex items-center justify-center py-32">
           <div className="w-10 h-10 border-4 border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : filteredResumes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredResumes.map(resume => (
              <ResumeCard 
                key={resume._id} 
                resume={resume} 
                alerts={healthAlerts?.filter(a => (a.resumeId?._id || a.resumeId) === resume._id)}
                onPreview={() => setPreviewResume(resume)}
                onEdit={() => toast("Edit metadata feature coming soon!")}
                onDelete={() => setDeleteResume(resume)}
                onDuplicate={() => handleDuplicate(resume._id)}
                onGenerateCoverLetter={() => setCoverLetterResume(resume)}
                onMaintenanceWizard={() => setMaintenanceWizardResume(resume)}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <EmptyState 
          icon={FileText}
          title="No Resumes Found"
          description={searchParams.get('q') ? "Try adjusting your search or filters." : "Upload your first resume to get an AI ATS score and start tracking its performance."}
          action={{
            label: 'Upload Resume',
            onClick: () => setShowUploadModal(true)
          }}
        />
      )}

      {/* Cover Letters Section */}
      <CoverLettersSection />

      {/* Modals */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        existingResumes={resumes}
        onSuccess={() => {
          queryClient.invalidateQueries(['resumes']);
          queryClient.invalidateQueries(['resumeStats']);
        }}
      />

      <LinkedInImportModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
        existingResumes={resumes}
        onSuccess={() => {
          queryClient.invalidateQueries(['resumes']);
          queryClient.invalidateQueries(['resumeStats']);
        }}
      />

      <ABTestingDashboardModal
        isOpen={showABTestModal}
        onClose={() => setShowABTestModal(false)}
        existingResumes={resumes}
      />

      <DSASkillSuggestionPanel />

      <ResumeBuilderModal
        isOpen={showResumeBuilderModal}
        onClose={() => setShowResumeBuilderModal(false)}
        existingResume={previewResume || resumes[0]} // If none previewed, use first as template
      />

      <BatchScoreModal
        isOpen={showBatchScoreModal}
        onClose={() => setShowBatchScoreModal(false)}
        resumes={resumes}
        onTailorRequest={(resumeId, company, role) => {
           const r = resumes.find(r => r._id === resumeId);
           setPreviewResume(r);
           toast.success(`Tailor for ${company} - ${role}. Go to Tailor tab!`);
        }}
      />

      <MaintenanceWizardModal
        isOpen={!!maintenanceWizardResume}
        onClose={() => setMaintenanceWizardResume(null)}
        resume={maintenanceWizardResume}
      />

      <PreviewModal
        isOpen={!!previewResume}
        onClose={() => setPreviewResume(null)}
        resume={previewResume}
        versions={currentPreviewVersions}
        onDownload={handleDownload}
        onDelete={(res) => { setDeleteResume(res); setPreviewResume(null); }}
      />

      <ConfirmModal
        isOpen={!!deleteResume}
        onClose={() => setDeleteResume(null)}
        onConfirm={handleDelete}
        title="Delete Resume"
        message={`Are you sure you want to delete "${deleteResume?.name || deleteResume?.originalName}"? This will also remove its version history and performance stats. This action cannot be undone.`}
        confirmText={deleteMutation.isLoading ? "Deleting..." : "Delete Resume"}
        isDestructive={true}
      />

      <CoverLetterGenerator
        isOpen={!!coverLetterResume}
        onClose={() => setCoverLetterResume(null)}
        resume={coverLetterResume}
      />
    </div>
  );
}
