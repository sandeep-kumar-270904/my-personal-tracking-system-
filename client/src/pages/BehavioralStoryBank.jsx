import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Book, Plus, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BehavioralStoryBank() {
  const [stories, setStories] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await axios.get('/api/interviews/stories');
      setStories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setStories([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
              <Book className="w-8 h-8 mr-3 text-indigo-500" /> Behavioral Story Bank
            </h1>
            <p className="text-gray-400 mt-1">Your structured experiences, ready for any interview.</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-lg shadow-indigo-900/20"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Story
          </button>
        </div>

        {/* Warning if no failure story */}
        {!stories.some(s => s.themes && s.themes.includes('failure and learning')) && stories.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl flex items-start">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-400">Cover Gaps: Missing Failure Story</h4>
              <p className="text-sm text-amber-200 mt-1">Most companies ask about a time you failed. Build a "Failure and Learning" story before your next interview.</p>
            </div>
          </div>
        )}

        {/* Story List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(story => (
            <div key={story._id} className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-indigo-500/50 transition-colors">
              <h3 className="font-bold text-lg text-white mb-2">{story.title}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {story.themes && story.themes.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-800 text-xs rounded text-gray-300 capitalize border border-gray-700">
                    {t}
                  </span>
                ))}
              </div>
              <div className="space-y-2 mb-4">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase">Situation</span>
                  <p className="text-sm text-gray-300 line-clamp-2">{story.situation}</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-500 uppercase">Result</span>
                  <p className="text-sm text-emerald-400 line-clamp-2">{story.result}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-800 flex justify-between items-center text-sm">
                <div className="flex items-center text-gray-400">
                  <span className="font-bold text-white mr-1">{story.strengthScore}</span> / 100 Strength
                </div>
                <div className="text-gray-500">
                  Used {story.usedInInterviews?.length || 0} times
                </div>
              </div>
            </div>
          ))}
          
          {stories.length === 0 && !isCreating && (
            <div className="col-span-full py-20 text-center text-gray-500">
              <Book className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Your story bank is empty. Start adding your experiences using the STAR format.</p>
            </div>
          )}
        </div>
      </div>

      {/* Creator Modal */}
      <AnimatePresence>
        {isCreating && (
          <StoryCreatorModal onClose={() => setIsCreating(false)} onRefresh={fetchStories} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StoryCreatorModal({ onClose, onRefresh }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ title: '', situation: '', task: '', action: '', result: '' });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/interviews/stories', formData);
      setAnalysis(res.data.analysis);
      setStep(6); // Analysis step
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
          <h2 className="text-xl font-bold text-white">Create STAR Story</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">Cancel</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Story Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" placeholder="e.g. Led backend rewrite under deadline" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Situation (S)</label>
                <p className="text-sm text-gray-500 mb-2">What was happening? What was the context?</p>
                <textarea rows="4" value={formData.situation} onChange={e => setFormData({...formData, situation: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" placeholder="Our database was crashing during peak load..." />
              </div>
              <button onClick={handleNext} disabled={!formData.title || !formData.situation} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-4 disabled:opacity-50">Next: Task</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Task (T)</label>
                <p className="text-sm text-gray-500 mb-2">What were you specifically responsible for?</p>
                <textarea rows="4" value={formData.task} onChange={e => setFormData({...formData, task: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" placeholder="I was tasked with migrating to a new cluster without downtime..." />
              </div>
              <button onClick={handleNext} disabled={!formData.task} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-4 disabled:opacity-50">Next: Action</button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Action (A)</label>
                <p className="text-sm text-gray-500 mb-2">What exactly did YOU do? Step by step.</p>
                <textarea rows="5" value={formData.action} onChange={e => setFormData({...formData, action: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" placeholder="1. I analyzed the query logs. 2. I set up a read replica..." />
              </div>
              <button onClick={handleNext} disabled={!formData.action} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-4 disabled:opacity-50">Next: Result</button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Result (R)</label>
                <p className="text-sm text-gray-500 mb-2">What was the quantifiable outcome?</p>
                <textarea rows="4" value={formData.result} onChange={e => setFormData({...formData, result: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg p-3 text-white focus:border-indigo-500 outline-none" placeholder="We reduced downtime by 99% and handled 10x traffic..." />
              </div>
              <button onClick={handleSubmit} disabled={!formData.result || loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl mt-4 disabled:opacity-50">
                {loading ? 'AI Analyzing Story...' : 'Finish & Analyze'}
              </button>
            </div>
          )}

          {step === 6 && analysis && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-gray-950 p-4 rounded-xl border border-gray-800">
                <div className="text-lg text-white font-bold">Story Strength</div>
                <div className={`text-2xl font-black ${analysis.strengthScore >= 80 ? 'text-emerald-500' : analysis.strengthScore >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {analysis.strengthScore} <span className="text-sm text-gray-500 font-normal">/ 100</span>
                </div>
              </div>

              {analysis.missingElements?.length > 0 && (
                <div className="bg-rose-900/10 border border-rose-500/20 p-4 rounded-xl">
                  <h4 className="font-bold text-rose-400 mb-2 text-sm uppercase tracking-wider">Missing Elements</h4>
                  <ul className="list-disc list-inside text-sm text-gray-300">
                    {analysis.missingElements.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-bold text-indigo-400 mb-2 text-sm uppercase tracking-wider">AI Improved Version</h4>
                <div className="bg-indigo-900/10 border border-indigo-500/20 p-4 rounded-xl text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">
                  {analysis.improvedVersion}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { onRefresh(); onClose(); }} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl">Keep My Original</button>
                <button onClick={() => { onRefresh(); onClose(); }} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center">Accept AI Version <CheckCircle className="w-4 h-4 ml-2" /></button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
