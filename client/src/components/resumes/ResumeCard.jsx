import { motion } from 'framer-motion';
import { Eye, Edit2, MoreVertical, Download, Copy, Trash2, Calendar, FileText, AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';

export default function ResumeCard({ resume, alerts = [], onPreview, onEdit, onDelete, onDuplicate, onGenerateCoverLetter, onMaintenanceWizard }) {
  const [showMenu, setShowMenu] = useState(false);

  const isActive = resume.isActive !== false;
  const shortlistRate = resume.performance?.totalApplications > 0 
    ? Math.round((resume.performance.shortlistedCount / resume.performance.totalApplications) * 100) 
    : 0;

  const rateColor = shortlistRate > 20 ? 'text-emerald-400' : shortlistRate > 10 ? 'text-amber-400' : 'text-red-400';
  
  // Calculate ring color based on ATS Score
  const atsScore = resume.analysis?.atsScore || 0;
  const atsColor = atsScore >= 80 ? '#10b981' : atsScore >= 60 ? '#f59e0b' : '#ef4444';
  const strokeDashoffset = 126 - (126 * atsScore) / 100; // 126 is approx 2 * pi * r (r=20)

  const isDecaying = new Date() - new Date(resume.updatedAt) > 30 * 24 * 60 * 60 * 1000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden relative group transition-all ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}
    >
      {/* Thumbnail Area */}
      <div className="h-48 bg-slate-900 relative border-b border-white/5 overflow-hidden">
        {resume.thumbnailUrl ? (
          <img src={resume.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover opacity-80" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-700">
            <FileText className="w-16 h-16 opacity-20" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
          {isDecaying && (
            <button 
              onClick={() => onMaintenanceWizard?.(resume)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-500/90 text-white border border-red-500/30 backdrop-blur-md shadow-lg shadow-red-500/20 hover:scale-105 transition-transform flex items-center gap-1 tooltip tooltip-left"
              data-tip="Resume hasn't been updated in 30 days. Click to run Maintenance Wizard."
            >
              <Clock className="w-3 h-3" /> Decay Alert
            </button>
          )}
          <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
            v{resume.version || 1}
          </span>
          {!isActive && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-500/20 text-slate-300 border border-slate-500/30 backdrop-blur-md">
              Superseded
            </span>
          )}
        </div>

        {/* ATS Gauge Overlay */}
        <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md rounded-full p-1 border border-white/10 shadow-lg cursor-pointer hover:scale-105 transition-transform">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-700" />
              <circle 
                cx="24" cy="24" r="20" 
                stroke={atsColor} 
                strokeWidth="4" fill="none" 
                strokeDasharray="126" 
                strokeDashoffset={strokeDashoffset} 
                className="transition-all duration-1000 ease-out" 
              />
            </svg>
            <span className="absolute text-xs font-bold text-white">{atsScore > 0 ? atsScore : '--'}</span>
          </div>
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button onClick={() => onPreview(resume)} className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-colors tooltip" data-tip="Preview">
            <Eye className="w-5 h-5" />
          </button>
          <button onClick={() => onEdit(resume)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl shadow-lg transition-colors backdrop-blur-md tooltip" data-tip="Edit Info">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        {/* Health Alerts Indicator */}
        {alerts.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-red-500/20 text-red-400 p-1.5 rounded-lg border border-red-500/30 backdrop-blur-md tooltip" data-tip={`${alerts.length} health issue(s) detected`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-white truncate pr-4 text-lg">{resume.name || resume.originalName}</h3>
          
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                  <button className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button onClick={() => { setShowMenu(false); onDuplicate(resume); }} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2">
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                  <button onClick={() => { setShowMenu(false); onGenerateCoverLetter?.(resume); }} className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Generate Cover Letter
                  </button>
                  <div className="h-px bg-white/10 my-1"></div>
                  <button onClick={() => { setShowMenu(false); onDelete(resume); }} className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4 h-6 overflow-hidden">
          {resume.tags && resume.tags.length > 0 ? (
            resume.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300 rounded border border-slate-700">
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">No tags</span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(resume.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex flex-col items-end">
             <span className={`font-medium ${rateColor}`}>{shortlistRate}% shortlist</span>
             <span className="text-[10px] opacity-70">used {resume.performance?.totalApplications || 0} times</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
