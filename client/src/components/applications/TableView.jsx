import { useState } from 'react';
import { MoreVertical, Edit2, Trash2, Clock, ChevronLeft, ChevronRight, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import api from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  APPLIED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  OA_PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  OA_DONE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  INTERVIEW_SCHEDULED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  SHORTLISTED: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  OFFER: 'bg-green-500/10 text-green-500 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20'
};

const PRIORITY_COLORS = {
  HIGH: 'bg-red-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-gray-500'
};

const TableView = ({ applications, onAppClick, totalCount, page, limit, setSearchParams }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  
  const handleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map(app => app._id));
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} applications?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/applications/${id}`)));
      toast.success(`Deleted ${selectedIds.length} applications`);
      setSelectedIds([]);
      // A full app refetch will happen if we invalidate queries, but here we can just reload or rely on the parent
      window.location.reload(); 
    } catch (err) {
      toast.error('Failed to delete some applications');
    }
  };

  const changePage = (newPage) => {
    setSearchParams(prev => {
      const p = Object.fromEntries(prev.entries());
      p.page = newPage.toString();
      return p;
    });
  };

  const changeLimit = (newLimit) => {
    setSearchParams(prev => {
      const p = Object.fromEntries(prev.entries());
      p.limit = newLimit.toString();
      p.page = '1';
      return p;
    });
  };

  return (
    <div className="bg-[#13141f] rounded-2xl border border-white/5 shadow-lg flex flex-col h-full">
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#ff6b00]/10 border-b border-[#ff6b00]/20 p-3 flex items-center justify-between">
          <span className="text-[#ff6b00] font-medium text-sm">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <button onClick={handleBulkDelete} className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-3 py-1.5 rounded text-sm font-medium transition-colors">
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500 font-bold bg-white/[0.02]">
              <th className="p-4 w-12 text-center cursor-pointer" onClick={handleSelectAll}>
                {selectedIds.length === applications.length && applications.length > 0 ? <CheckSquare className="w-4 h-4 text-[#ff6b00]" /> : <Square className="w-4 h-4 text-slate-500" />}
              </th>
              <th className="p-4 font-bold text-slate-400">Company</th>
              <th className="p-4 font-bold text-slate-400">Role</th>
              <th className="p-4 font-bold text-slate-400">Status</th>
              <th className="p-4 font-bold text-slate-400">Source</th>
              <th className="p-4 font-bold text-slate-400">Date Applied</th>
              <th className="p-4 font-bold text-slate-400">Priority</th>
              <th className="p-4 font-bold text-slate-400">Resume</th>
              <th className="p-4 font-bold text-slate-400">Days Since</th>
              <th className="p-4 font-bold text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {applications.map((app) => {
              const daysSince = differenceInDays(new Date(), new Date(app.dateApplied));
              const needsFollowUp = app.status === 'APPLIED' && daysSince > 7;
              
              return (
                <tr 
                  key={app._id} 
                  onClick={() => onAppClick(app)}
                  className={`group hover:bg-white/[0.02] transition-colors cursor-pointer ${needsFollowUp ? 'border-l-2 border-l-amber-500 bg-amber-500/[0.02]' : ''}`}
                >
                  <td className="p-4 text-center" onClick={(e) => toggleSelect(app._id, e)}>
                    {selectedIds.includes(app._id) ? <CheckSquare className="w-4 h-4 text-[#ff6b00]" /> : <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={`https://logo.clearbit.com/${app.company.replace(/ /g, '').toLowerCase()}.com`} alt={app.company} className="w-8 h-8 rounded-lg bg-white/10" onError={(e) => { e.target.style.display = 'none'; }} />
                      <span className="font-semibold text-white">{app.company}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">{app.role}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md border ${STATUS_COLORS[app.status]}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{app.source}</td>
                  <td className="p-4 text-slate-400 text-sm">{new Date(app.dateApplied).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[app.priority] || PRIORITY_COLORS.MEDIUM}`}></div>
                      <span className="text-xs text-slate-400">{app.priority}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-400 text-sm">{app.resumeId?.name || 'None'}</td>
                  <td className="p-4 text-sm font-medium">
                    <span className={daysSince > 14 && app.status === 'APPLIED' ? 'text-red-400' : 'text-slate-400'}>
                      {daysSince} days
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                      {needsFollowUp && (
                        <button className="text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded hover:bg-amber-500/30 transition-colors mr-2">
                          Follow up
                        </button>
                      )}
                      <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-white/5 p-4 flex items-center justify-between bg-[#13141f] rounded-b-2xl">
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            Showing {applications.length} of {totalCount} applications
          </span>
          <select 
            value={limit}
            onChange={(e) => changeLimit(e.target.value)}
            className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-[#ff6b00]"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button 
            disabled={page <= 1}
            onClick={() => changePage(page - 1)}
            className="p-1.5 bg-white/5 text-slate-400 rounded hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            disabled={page * limit >= totalCount}
            onClick={() => changePage(page + 1)}
            className="p-1.5 bg-white/5 text-slate-400 rounded hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableView;
