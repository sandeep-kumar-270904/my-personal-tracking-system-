import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, ExternalLink, Clock, Building2, AlertCircle } from 'lucide-react';

const TableView = ({ applications, onAppClick }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'appliedDate', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedApps = [...applications].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];
    
    if (sortConfig.key === 'appliedDate') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Applied': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'OA': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      case 'Interview': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Selected': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/5 text-slate-300 border-white/10';
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5 text-sm uppercase tracking-wider text-slate-400">
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('company')}>
                <div className="flex items-center gap-2">Company {sortConfig.key === 'company' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>)}</div>
              </th>
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('role')}>
                <div className="flex items-center gap-2">Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>)}</div>
              </th>
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-2">Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>)}</div>
              </th>
              <th className="p-4 cursor-pointer hover:text-white" onClick={() => handleSort('appliedDate')}>
                <div className="flex items-center gap-2">Applied Date {sortConfig.key === 'appliedDate' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>)}</div>
              </th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedApps.map((app, idx) => {
              const isGhosted = app.status === 'Applied' && (new Date() - new Date(app.appliedDate)) / (1000 * 60 * 60 * 24) > 14;
              return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  key={app._id} 
                  onClick={() => onAppClick(app)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-white transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-white">{app.company}</span>
                      {isGhosted && <AlertCircle className="w-4 h-4 text-amber-500" title="Ghosted? No update in 14 days" />}
                    </div>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">{app.role}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> {new Date(app.appliedDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onAppClick(app); }}
                      className="text-sm font-medium text-[#00f0ff] hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      View Details
                    </button>
                  </td>
                </motion.tr>
              );
            })}
            {applications.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">No applications found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
