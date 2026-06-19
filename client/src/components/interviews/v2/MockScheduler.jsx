import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Target, Brain, Users } from 'lucide-react';

export default function MockScheduler({ onClose, onStartAIMock }) {
  const [formData, setFormData] = useState({
    targetCompany: '',
    targetRole: '',
    roundType: 'TECHNICAL',
    conductedWith: 'AI'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.conductedWith === 'AI') {
      onStartAIMock(formData);
    } else {
      // In a real implementation we'd hit the API to save standard mock
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
      >
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

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Conducted With</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => setFormData({...formData, conductedWith: 'AI'})}
                className={`p-3 rounded-lg border text-left flex items-center ${formData.conductedWith === 'AI' ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'}`}
              >
                <Brain className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-bold text-sm text-white">AI Evaluator</div>
                  <div className="text-xs opacity-70">Instant simulation</div>
                </div>
              </button>
              <button 
                type="button"
                onClick={() => setFormData({...formData, conductedWith: 'PEER'})}
                className={`p-3 rounded-lg border text-left flex items-center ${formData.conductedWith === 'PEER' ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300' : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'}`}
              >
                <Users className="w-5 h-5 mr-2" />
                <div>
                  <div className="font-bold text-sm text-white">Peer / Mentor</div>
                  <div className="text-xs opacity-70">Log an external session</div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 transition-all">
              {formData.conductedWith === 'AI' ? 'Start AI Mock Now' : 'Schedule Mock Session'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
