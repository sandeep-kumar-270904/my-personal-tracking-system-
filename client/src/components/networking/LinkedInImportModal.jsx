import React, { useState } from 'react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Check, AlertTriangle, Users } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const LinkedInImportModal = ({ onClose, onImportComplete }) => {
  const [step, setStep] = useState(1);
  const [parsedData, setParsedData] = useState([]);
  const [report, setReport] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const determineContactType = (title = '', gradYear = null) => {
    title = title.toLowerCase();
    if (title.includes('recruiter') || title.includes('talent') || title.includes('hr')) return 'RECRUITER';
    if (title.includes('founder') || title.includes('ceo')) return 'FOUNDER';
    if (gradYear && new Date().getFullYear() - gradYear <= 3) return 'SENIOR_STUDENT';
    return 'ENGINEER';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // LinkedIn typical columns: First Name, Last Name, Email Address, Company, Position, Connected On
        const contacts = results.data.map((row, i) => {
          const type = determineContactType(row['Position'] || row['Title']);
          return {
            id: i,
            firstName: row['First Name'] || '',
            lastName: row['Last Name'] || '',
            email: row['Email Address'] || row['Email'] || '',
            company: row['Company'] || '',
            role: row['Position'] || row['Title'] || '',
            connectedOn: row['Connected On'] || '',
            contactType: type,
            selected: true
          };
        }).filter(c => c.firstName || c.lastName);
        
        setParsedData(contacts);
        setSelectedIds(new Set(contacts.map(c => c.id)));
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === parsedData.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(parsedData.map(c => c.id)));
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const updateType = (id, newType) => {
    setParsedData(prev => prev.map(c => c.id === id ? { ...c, contactType: newType } : c));
  };

  const handleStep1Next = async () => {
    setIsLoading(true);
    try {
      const selectedContacts = parsedData.filter(c => selectedIds.has(c.id));
      const { data } = await api.post('/networking/contacts/import', { contacts: selectedContacts });
      setReport(data);
      // Auto-select probables and new, deselect exact matches
      const defaultSelected = new Set([
        ...data.probableMatches.map(m => m.imported.importId),
        ...data.newContacts.map(m => m.importId)
      ]);
      setSelectedIds(defaultSelected);
      setStep(2);
    } catch (err) {
      toast.error('Failed to analyze contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      // Gather all selected from report
      const toImport = [];
      if (report) {
        [...report.exactMatches, ...report.probableMatches].forEach(match => {
          if (selectedIds.has(match.imported.importId)) toImport.push(match.imported);
        });
        report.newContacts.forEach(c => {
          if (selectedIds.has(c.importId)) toImport.push(c);
        });
      }

      if (toImport.length === 0) {
        toast.error('No contacts selected for import');
        setIsLoading(false);
        return;
      }

      await api.post('/networking/contacts/bulk-create', { contacts: toImport });
      await api.post('/networking/analyze');
      toast.success(`${toImport.length} contacts imported successfully!`);
      onImportComplete();
    } catch (err) {
      toast.error('Failed to import contacts');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0a0a0f] border border-white/10 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#13141f]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-400" />
            Import from LinkedIn
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {step === 1 && (
            <div className="space-y-6">
              {!parsedData.length ? (
                <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center relative hover:border-blue-500/50 hover:bg-blue-500/5 transition-all">
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <Upload className="mx-auto mb-4 text-slate-400" size={32} />
                  <h3 className="text-lg font-semibold text-white mb-2">Upload LinkedIn Connections CSV</h3>
                  <p className="text-sm text-slate-400">Settings & Privacy &gt; Data Privacy &gt; Get a copy of your data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-[#13141f] p-3 rounded-lg border border-white/5">
                    <span className="text-sm text-slate-300">
                      Found <strong className="text-white">{parsedData.length}</strong> contacts.
                      ({parsedData.filter(c=>c.contactType==='RECRUITER').length} Recruiters, {parsedData.filter(c=>c.contactType==='ENGINEER').length} Engineers)
                    </span>
                    <button onClick={toggleSelectAll} className="text-sm text-blue-400 hover:text-blue-300">
                      {selectedIds.size === parsedData.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full text-sm text-left text-slate-300">
                      <thead className="text-xs uppercase bg-[#13141f] text-slate-400">
                        <tr>
                          <th className="px-4 py-3 w-10"></th>
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Company</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Map to Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedData.map((row) => (
                          <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="px-4 py-3">
                              <input 
                                type="checkbox" 
                                checked={selectedIds.has(row.id)} 
                                onChange={() => toggleSelect(row.id)} 
                                className="accent-[#ff6b00]"
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-white">{row.firstName} {row.lastName}</td>
                            <td className="px-4 py-3">{row.company}</td>
                            <td className="px-4 py-3 truncate max-w-[200px]" title={row.role}>{row.role}</td>
                            <td className="px-4 py-3">
                              <select 
                                value={row.contactType} 
                                onChange={(e) => updateType(row.id, e.target.value)}
                                className="bg-[#0a0a0f] border border-white/10 rounded px-2 py-1 text-xs outline-none focus:border-[#ff6b00]"
                              >
                                <option value="ENGINEER">Engineer</option>
                                <option value="RECRUITER">Recruiter</option>
                                <option value="ALUMNI">Alumni</option>
                                <option value="SENIOR_STUDENT">Senior Student</option>
                                <option value="FOUNDER">Founder</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && report && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <h3 className="text-sm font-bold text-blue-300">Deduplication Report</h3>
                <p className="text-sm text-blue-200/80 mt-1">Review the matches below before creating new contacts.</p>
              </div>

              {report.exactMatches.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-400 flex items-center gap-2">
                    <Check size={16} /> Exact Matches (Skip suggested)
                  </h4>
                  <div className="bg-[#13141f] border border-white/10 rounded-lg p-2 max-h-40 overflow-y-auto">
                    {report.exactMatches.map(m => (
                      <div key={m.imported.importId} className="flex items-center gap-3 p-2 border-b border-white/5 last:border-0 opacity-60 hover:opacity-100">
                        <input type="checkbox" checked={selectedIds.has(m.imported.importId)} onChange={() => toggleSelect(m.imported.importId)} />
                        <span className="text-sm text-white">{m.imported.firstName} {m.imported.lastName}</span>
                        <span className="text-xs text-slate-400">{m.imported.company}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {report.probableMatches.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <AlertTriangle size={16} /> Probable Matches (Review needed)
                  </h4>
                  <div className="bg-[#13141f] border border-amber-500/20 rounded-lg p-2 max-h-40 overflow-y-auto">
                    {report.probableMatches.map(m => (
                      <div key={m.imported.importId} className="flex items-center gap-3 p-2 border-b border-white/5 last:border-0">
                        <input type="checkbox" checked={selectedIds.has(m.imported.importId)} onChange={() => toggleSelect(m.imported.importId)} className="accent-amber-500" />
                        <div>
                          <p className="text-sm text-white">{m.imported.firstName} {m.imported.lastName} <span className="text-xs text-slate-400">({m.imported.company})</span></p>
                          <p className="text-[10px] text-amber-300">Matches existing: {m.existing.name} ({m.existing.company})</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-emerald-400">New Contacts ({report.newContacts.length})</h4>
                <div className="bg-[#13141f] border border-emerald-500/20 rounded-lg p-2 max-h-60 overflow-y-auto">
                  {report.newContacts.map(c => (
                    <div key={c.importId} className="flex items-center gap-3 p-2 border-b border-white/5 last:border-0">
                      <input type="checkbox" checked={selectedIds.has(c.importId)} onChange={() => toggleSelect(c.importId)} className="accent-emerald-500" />
                      <span className="text-sm text-white">{c.firstName} {c.lastName}</span>
                      <span className="text-xs text-slate-400">{c.company}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-[#13141f] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors font-medium">
            Cancel
          </button>
          {step === 1 && parsedData.length > 0 && (
            <button 
              onClick={handleStep1Next}
              disabled={isLoading || selectedIds.size === 0}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              {isLoading ? 'Analyzing...' : 'Next Step'}
            </button>
          )}
          {step === 2 && (
            <button 
              onClick={handleImport}
              disabled={isLoading}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
            >
              {isLoading ? 'Importing...' : 'Confirm Import'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default LinkedInImportModal;
