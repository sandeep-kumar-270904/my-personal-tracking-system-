import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, X, Save, CheckCircle } from 'lucide-react';
import api from '../../../services/api';

const OrcaSidebar = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    objective: '',
    requirements: '',
    constraints: '',
    approach: ''
  });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    try {
      await api.post('/dsa/orca/save', formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[90] md:hidden"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-96 bg-gray-900 border-l border-gray-800 shadow-2xl z-[100] flex flex-col"
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
                  <Anchor className="w-4 h-4" />
                </div>
                <h2 className="font-bold text-white tracking-wide">ORCA Framework</h2>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
              <div>
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Objective</label>
                <textarea 
                  value={formData.objective}
                  onChange={(e) => setFormData({...formData, objective: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 min-h-[80px]"
                  placeholder="What is the exact goal in one sentence?"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Requirements</label>
                <textarea 
                  value={formData.requirements}
                  onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-amber-500 min-h-[100px]"
                  placeholder="- Must handle negatives?\n- Can array be empty?\n- Sorted or unsorted?"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Constraints</label>
                <textarea 
                  value={formData.constraints}
                  onChange={(e) => setFormData({...formData, constraints: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-rose-500 min-h-[80px]"
                  placeholder="O(n) time, O(1) space?"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">Approach</label>
                <textarea 
                  value={formData.approach}
                  onChange={(e) => setFormData({...formData, approach: e.target.value})}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[150px]"
                  placeholder="1. Initialize two pointers...\n2. While left < right...\n3. Return max area"
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
              <button 
                onClick={handleSave}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${isSaved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
              >
                {isSaved ? <><CheckCircle className="w-5 h-5" /> Saved to Notes</> : <><Save className="w-5 h-5" /> Save ORCA Note</>}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OrcaSidebar;
