import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, Brain, Users, Calendar, Clock, Video, Building, Monitor, Phone, FileText } from 'lucide-react';
import SimulationEnvironment from './v3/SimulationEnvironment';

export default function MockScheduler({ onClose, onStartAIMock }) {
  const [loading, setLoading] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);
  const [simulationType, setSimulationType] = useState('VIDEO');
  const [formData, setFormData] = useState({
    targetCompany: '',
    targetRole: '',
    roundType: 'TECHNICAL',
    conductedWith: 'AI'
  });

  const handleStart = () => {
    setLoading(true);
    onStartAIMock(formData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.conductedWith === 'AI') {
      onStartAIMock(formData);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden"
      >
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Target className="w-6 h-6 mr-2 text-indigo-500" /> Schedule Mock
            </h2>
            <p className="text-gray-400 text-sm mt-1">Simulate real interview conditions to calibrate your prep.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Target Company</label>
              <input 
                required type="text" 
                value={formData.targetCompany} onChange={e => setFormData({...formData, targetCompany: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" 
                placeholder="e.g. Google, Stripe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Target Role</label>
              <input 
                required type="text" 
                value={formData.targetRole} onChange={e => setFormData({...formData, targetRole: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" 
                placeholder="e.g. SDE 2, Frontend Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Round Type</label>
              <select 
                value={formData.roundType} onChange={e => setFormData({...formData, roundType: e.target.value})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
              >
                <option value="TECHNICAL">Technical (DSA)</option>
                <option value="SYSTEM_DESIGN">System Design</option>
                <option value="BEHAVIORAL">Behavioral</option>
                <option value="HR">HR / Negotiation</option>
              </select>
            </div>

            <div className="pt-6 border-t border-gray-800 space-y-4">
              <h4 className="text-white font-bold">V3: Full Environment Simulation</h4>
              <p className="text-sm text-gray-400">Launch a highly realistic simulation environment instead of standard AI chat.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button type="button" onClick={() => {setSimulationType('VIDEO'); setShowSimulation(true);}} className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700">
                  <Monitor className="w-8 h-8 text-indigo-400 mb-2" />
                  <span className="text-sm font-bold text-white">Video Call</span>
                </button>
                <button type="button" onClick={() => {setSimulationType('WHITEBOARD'); setShowSimulation(true);}} className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700">
                  <FileText className="w-8 h-8 text-amber-400 mb-2" />
                  <span className="text-sm font-bold text-white">Whiteboard</span>
                </button>
                <button type="button" onClick={() => {setSimulationType('PHONE'); setShowSimulation(true);}} className="flex flex-col items-center justify-center p-4 bg-gray-800 hover:bg-gray-700 rounded-xl border border-gray-700">
                  <Phone className="w-8 h-8 text-emerald-400 mb-2" />
                  <span className="text-sm font-bold text-white">Phone Screen</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-800 bg-gray-950 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white mr-4 font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleStart} disabled={loading} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-colors disabled:opacity-50 flex items-center">
            {loading ? 'Preparing...' : 'Start Standard Mock'}
          </button>
        </div>

        {showSimulation && (
          <SimulationEnvironment 
            onClose={() => setShowSimulation(false)}
            simulationType={simulationType}
            targetCompany={formData.targetCompany}
            targetRole={formData.targetRole}
            roundType={formData.roundType}
          />
        )}
      </motion.div>
    </div>
  );
}
