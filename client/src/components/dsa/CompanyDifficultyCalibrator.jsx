import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, ChevronRight, AlertTriangle } from 'lucide-react';

const TARGET_TIERS = [
  { id: 't1', name: 'Tier 1 (FAANG / HFT)', label: 'Google, Meta, Jane Street', diffShift: 1 },
  { id: 't2', name: 'Tier 2 (Unicorns / Big Tech)', label: 'Uber, Stripe, Airbnb', diffShift: 0.5 },
  { id: 't3', name: 'Tier 3 (Fortune 500)', label: 'Cisco, Oracle, Banks', diffShift: 0 }
];

const CompanyDifficultyCalibrator = () => {
  const [selectedTier, setSelectedTier] = useState('t3');

  const getShiftedDifficulty = (baseDiff) => {
    const tier = TARGET_TIERS.find(t => t.id === selectedTier);
    if (!tier || tier.diffShift === 0) return baseDiff;

    if (tier.diffShift === 1) {
      if (baseDiff === 'EASY') return 'EASY (Expect MEDIUM)';
      if (baseDiff === 'MEDIUM') return 'MEDIUM (Expect HARD)';
      if (baseDiff === 'HARD') return 'HARD (Expect UNSEEN PATTERNS)';
    }
    return baseDiff;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-indigo-400" />
        <h2 className="text-xl font-bold text-white">Company Calibrator</h2>
      </div>
      <p className="text-sm text-gray-400 mb-6">Select your target company tier to calibrate standard problem difficulty to their expectations.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {TARGET_TIERS.map(tier => (
          <button
            key={tier.id}
            onClick={() => setSelectedTier(tier.id)}
            className={`p-4 rounded-xl border text-left transition-all ${selectedTier === tier.id ? 'bg-indigo-900/20 border-indigo-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
          >
            <h3 className={`font-bold ${selectedTier === tier.id ? 'text-indigo-400' : 'text-gray-300'}`}>{tier.name}</h3>
            <p className="text-xs text-gray-500 mt-1">{tier.label}</p>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTier}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-gray-800 rounded-xl p-4 border border-gray-700"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h4 className="text-sm font-bold text-white">Difficulty Calibration Active</h4>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-900 rounded-lg">
              <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Standard Easy</span>
              <span className="text-sm text-emerald-400 font-medium">{getShiftedDifficulty('EASY')}</span>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg">
              <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Standard Medium</span>
              <span className="text-sm text-amber-400 font-medium">{getShiftedDifficulty('MEDIUM')}</span>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg">
              <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Standard Hard</span>
              <span className="text-sm text-rose-400 font-medium">{getShiftedDifficulty('HARD')}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CompanyDifficultyCalibrator;
