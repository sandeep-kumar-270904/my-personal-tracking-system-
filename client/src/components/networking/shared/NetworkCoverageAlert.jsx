import React from 'react';
import { motion } from 'framer-motion';
import { Users, AlertTriangle, Search, Plus } from 'lucide-react';

const NetworkCoverageAlert = ({ companyName, applicationRole, onAddContact, onFindAlumni }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h4 className="text-amber-200 font-medium">No contacts at {companyName}</h4>
          <p className="text-amber-200/70 text-sm mt-1">
            You have {applicationRole ? `applied for ${applicationRole}` : 'active applications'} here but know nobody. Alumni networking can increase your interview chances by up to 3x.
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          onClick={onFindAlumni}
          className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Search className="w-3.5 h-3.5" />
          Find Alumni
        </button>
        <button
          onClick={onAddContact}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Contact
        </button>
      </div>
    </motion.div>
  );
};

export default NetworkCoverageAlert;
