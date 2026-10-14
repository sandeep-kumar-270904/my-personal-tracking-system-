import React, { useState, useEffect } from 'react';
import { X, Building, Users, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

export default function CompanyProcessModal({ onClose }) {
  const [processes, setProcesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    axios.get('/api/interviews/company-processes')
      .then(res => { setProcesses(res.data); setLoading(false); })
      .catch(err => console.error(err));
  }, []);

  const filtered = processes.filter(p => p.company.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-800 bg-gray-950 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
              <Building className="w-6 h-6 mr-2 text-indigo-500" /> Company Processes
            </h2>
            <p className="text-sm text-gray-400 mt-1">Crowdsourced interview pipelines from verified StudentTracker users.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-800 bg-gray-900">
          <input 
            type="text" 
            placeholder="Search company (e.g. Google)..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-950 space-y-6">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading aggregated data...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No data found for this company yet.</div>
          ) : (
            filtered.map(p => (
              <div key={p._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{p.company}</h3>
                    <p className="text-sm text-gray-400">{p.role}</p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                    <Users className="w-3 h-3 mr-1" /> {p.dataPoints} data points
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">Total Rounds</span>
                    <span className="text-white font-medium">{p.totalRounds}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">Timeline</span>
                    <span className="text-white font-medium flex items-center"><Calendar className="w-3 h-3 mr-1 text-indigo-400"/> {p.typicalTimeline} days</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">OA Platform</span>
                    <span className="text-white font-medium">{p.onlineAssessmentPlatform}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500 uppercase">Typical CTC</span>
                    <span className="text-emerald-400 font-medium font-mono">${(p.typicalCTCFresher/1000).toFixed(0)}k</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-3">Round Sequence</h4>
                  <div className="flex flex-wrap items-center gap-2">
                    {p.roundSequence.map((r, i) => (
                      <React.Fragment key={i}>
                        <div className="bg-gray-800 border border-gray-700 px-3 py-2 rounded-lg text-sm text-gray-300">
                          <span className="font-bold text-indigo-400 mr-2">R{i+1}</span>
                          {r.roundType}
                          <span className="text-xs text-gray-500 ml-2">({r.typicalDuration}m)</span>
                        </div>
                        {i < p.roundSequence.length - 1 && <ArrowRight className="w-4 h-4 text-gray-600" />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
