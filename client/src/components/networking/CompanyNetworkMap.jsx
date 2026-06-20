import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Target, Users } from 'lucide-react';

const CompanyNetworkMap = ({ companies, onCreateContact }) => {
  if (!companies) return null;

  // Sort: active applications with no contacts first (gap), then connection strength descending
  const sortedCompanies = [...companies].sort((a, b) => {
    if (a.applicationCount > 0 && a.contactCount === 0) return -1;
    if (b.applicationCount > 0 && b.contactCount === 0) return 1;
    return b.strongConnectionCount - a.strongConnectionCount;
  });

  const hasGap = sortedCompanies.some(c => c.applicationCount > 0 && c.contactCount === 0);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Company Network Map</h2>
      </div>

      {hasGap && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
          <AlertCircle className="text-red-400 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-red-200 text-sm font-medium">Coverage Gap Detected</p>
            <p className="text-red-300/80 text-xs mt-1">
              You have applied to companies where you know nobody. Consider reaching out to alumni to boost your chances.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {sortedCompanies.map((comp) => {
          const isGap = comp.applicationCount > 0 && comp.contactCount === 0;
          return (
            <motion.div
              key={comp.company}
              whileHover={{ y: -2 }}
              className={`bg-[#13141f] rounded-xl p-4 border relative ${isGap ? 'border-red-500/50' : 'border-white/10'}`}
            >
              {comp.hasInsiderIntel && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#13141f]" title="Has Insider Intel" />
              )}
              <h4 className="font-semibold text-white truncate text-sm" title={comp.company}>{comp.company}</h4>
              
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1"><Users size={12}/> Contacts</span>
                  <span className="text-white font-medium">{comp.contactCount}</span>
                </div>
                {comp.contactCount > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Strong/Close</span>
                    <span className="text-emerald-400 font-medium">{comp.strongConnectionCount}</span>
                  </div>
                )}
                {comp.applicationCount > 0 && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="text-slate-400 flex items-center gap-1"><Target size={12}/> Apps</span>
                    <span className="text-blue-400 font-medium">{comp.applicationCount}</span>
                  </div>
                )}
              </div>

              {isGap && (
                <button
                  onClick={() => onCreateContact(comp.company)}
                  className="mt-3 w-full text-[10px] uppercase font-bold tracking-wider py-1.5 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition-colors"
                >
                  Add Contact
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyNetworkMap;
