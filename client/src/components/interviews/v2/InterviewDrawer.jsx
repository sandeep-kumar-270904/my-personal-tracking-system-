import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Brain, Target, BookOpen, MessageSquare, AlertTriangle, Calendar, Send, Play } from 'lucide-react';
import axios from 'axios';
import SystemDesignCanvas from './SystemDesignCanvas';

export default function InterviewDrawer({ interview, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState('prep');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (interview) {
      loadDetails();
    }
  }, [interview]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/interviews/${interview._id}`);
      setDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!interview) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-full md:w-[520px] bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-gray-950">
        <div>
          <h2 className="text-2xl font-bold text-white">{interview.company}</h2>
          <p className="text-gray-400">{interview.role} • {interview.roundType}</p>
        </div>
        <div className="flex space-x-2">
          {interview.status !== 'COMPLETED' && (
            <button onClick={() => window.open(`/interviews/${interview._id}/live-notes`, '_blank')} className="p-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg text-sm font-bold flex items-center">
              <Play className="w-4 h-4 mr-1" /> Live Notes
            </button>
          )}
          <button onClick={onClose} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-gray-950 px-6 space-x-6 overflow-x-auto hide-scrollbar">
        {['prep', 'debrief', 'questions', 'intel'].map(t => (
          <button 
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-4 text-sm font-medium capitalize border-b-2 whitespace-nowrap transition-colors ${
              activeTab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            <div className="h-32 bg-gray-800 rounded w-full"></div>
          </div>
        ) : (
          <>
            {activeTab === 'prep' && <PrepTab details={details} interview={interview} />}
            {activeTab === 'debrief' && <DebriefTab details={details} interview={interview} onRefresh={loadDetails} />}
            {activeTab === 'questions' && <QuestionsTab details={details} />}
            {activeTab === 'intel' && <IntelTab details={details} interview={interview} />}
          </>
        )}
      </div>
    </motion.div>
  );
}

// --- PREP TAB ---
function PrepTab({ details, interview }) {
  const [optimalState, setOptimalState] = useState(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [communicationText, setCommunicationText] = useState('');
  const [communications, setCommunications] = useState([]);
  
  useEffect(() => {
    // Mock optimal state fetch
    axios.get('/api/interviews/optimal-state').then(res => setOptimalState(res.data)).catch(console.error);
  }, []);

  const handleLogComm = async () => {
    try {
      const res = await axios.post(`/api/interviews/${interview._id}/communications`, { content: communicationText, direction: 'INBOUND' });
      setCommunications([...communications, res.data.communication]);
      setCommunicationText('');
    } catch(e) { console.error(e); }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* I3: Optimal State (shown if upcoming) */}
      {interview.status !== 'COMPLETED' && optimalState && (
        <div className="bg-emerald-900/10 border border-emerald-500/30 p-4 rounded-xl">
          <h4 className="font-bold text-emerald-400 mb-1 flex items-center">
            <Target className="w-4 h-4 mr-2" /> Optimal State Optimizer
          </h4>
          <p className="text-sm text-emerald-200/70">{optimalState.protocol}</p>
        </div>
      )}

      {/* I6: Logistics */}
      {interview.status !== 'COMPLETED' && (
        <div className="bg-gray-800 p-4 rounded-xl">
          <h4 className="font-bold text-white mb-3">Interview Day Logistics</h4>
          <div className="space-y-2">
            {interview.platform === 'ZOOM' || interview.platform === 'MEET' ? (
              <>
                <label className="flex items-center space-x-2 text-sm text-gray-300"><input type="checkbox" className="rounded" /> <span>Test internet connection</span></label>
                <label className="flex items-center space-x-2 text-sm text-gray-300"><input type="checkbox" className="rounded" /> <span>Confirm meeting link</span></label>
                <label className="flex items-center space-x-2 text-sm text-gray-300"><input type="checkbox" className="rounded" /> <span>Charge laptop</span></label>
                <label className="flex items-center space-x-2 text-sm text-gray-300"><input type="checkbox" className="rounded" /> <span>Find quiet room</span></label>
              </>
            ) : (
              <>
                <label className="flex items-center space-x-2 text-sm text-gray-300"><input type="checkbox" className="rounded" /> <span>Confirm office address</span></label>
                <label className="flex items-center space-x-2 text-sm text-gray-300"><input type="checkbox" className="rounded" /> <span>Plan route</span></label>
              </>
            )}
          </div>
        </div>
      )}

      {/* I5: System Design Prep */}
      {interview.roundType === 'SYSTEM_DESIGN' && (
        <div className="bg-indigo-900/10 border border-indigo-500/30 p-5 rounded-xl">
          <h4 className="font-bold text-indigo-400 mb-2 flex items-center"><Brain className="w-5 h-5 mr-2" /> System Design Prep</h4>
          <p className="text-sm text-gray-300 mb-4">Recommended Framework: Clarify -> Capacity -> High Level -> Deep Dive</p>
          <button onClick={() => setShowCanvas(true)} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg">
            Practice on Canvas
          </button>
        </div>
      )}

      {/* I2: Communications */}
      <div>
        <h4 className="font-bold text-white mb-3 flex items-center"><MessageSquare className="w-4 h-4 mr-2" /> Communications</h4>
        <div className="space-y-3 mb-3">
          {communications.map((c, i) => (
            <div key={i} className="bg-gray-800 p-3 rounded-lg text-sm">
              <span className="text-xs text-gray-500 block mb-1">{c.communicationType} • {new Date(c.communicatedAt).toLocaleDateString()}</span>
              <p className="text-gray-300 line-clamp-2">{c.content}</p>
            </div>
          ))}
        </div>
        <textarea rows="2" value={communicationText} onChange={e=>setCommunicationText(e.target.value)} placeholder="Paste email/message from recruiter here..." className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm text-white" />
        <button onClick={handleLogComm} className="mt-2 text-sm bg-gray-800 text-white px-3 py-1.5 rounded hover:bg-gray-700">Analyze & Log</button>
      </div>

      {showCanvas && <SystemDesignCanvas problemType="System Design Practice" interviewId={interview._id} onClose={() => setShowCanvas(false)} />}
    </div>
  );
}

// --- DEBRIEF TAB ---
function DebriefTab({ details, interview, onRefresh }) {
  const [formData, setFormData] = useState({
    performanceRating: interview.performanceRating || 5,
    stressLevel: interview.stressLevel || 5,
    debrief: interview.debrief || (interview.liveNotes?.map(n => `[${n.tag}] ${n.text}`).join('\n') || ''),
    outcome: interview.outcome || 'AWAITING_RESULT',
  });
  const [saving, setSaving] = useState(false);
  const [thankYouDraft, setThankYouDraft] = useState('');

  const generateThankYou = async () => {
    const res = await axios.post(`/api/interviews/${interview._id}/communications/thank-you`);
    setThankYouDraft(res.data.body);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await axios.post(`/api/interviews/${interview._id}/debrief`, formData);
      onRefresh();
    } catch(err) { console.error(err); } 
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* I7: Negotiation Readiness if passed */}
      {interview.outcome === 'PASSED' && (
        <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl mb-6">
          <h4 className="font-bold text-emerald-400 mb-2">Negotiation Readiness</h4>
          <p className="text-sm text-emerald-200/80 mb-3">You performed exceptionally well. The AI has generated a negotiation playbook based on your specific strong signals.</p>
          <button className="text-sm font-bold bg-emerald-600 px-3 py-1.5 rounded text-white hover:bg-emerald-500">View Playbook</button>
        </div>
      )}

      {/* I9: Visual Timeline of Live Notes */}
      {interview.liveNotes && interview.liveNotes.length > 0 && (
        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
          <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Live Notes Timeline</h4>
          <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-800">
            {interview.liveNotes.map((n, i) => (
              <div key={i} className={`flex-1 ${n.tag==='GREEN'?'bg-emerald-500':n.tag==='RED'?'bg-rose-500':n.tag==='YELLOW'?'bg-amber-500':'bg-blue-500'} mr-[1px]`}></div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">Notes synced from the live widget have been pre-populated in your debrief below.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Performance: {formData.performanceRating}/10</label>
        <input type="range" min="1" max="10" value={formData.performanceRating} onChange={e => setFormData({...formData, performanceRating: parseInt(e.target.value)})} className="w-full accent-indigo-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Stress Level: {formData.stressLevel}/10</label>
        <input type="range" min="1" max="10" value={formData.stressLevel} onChange={e => setFormData({...formData, stressLevel: parseInt(e.target.value)})} className="w-full accent-rose-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Debrief / Notes</label>
        <textarea rows="6" value={formData.debrief} onChange={e => setFormData({...formData, debrief: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-sm" placeholder="How did it go?"></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Outcome</label>
        <select value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
          <option value="PENDING">Pending (Scheduled)</option>
          <option value="AWAITING_RESULT">Awaiting Result</option>
          <option value="PASSED">Passed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <button onClick={handleSubmit} disabled={saving} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl">
        {saving ? 'Submitting...' : 'Submit Debrief'}
      </button>

      {/* I2: Thank you generator */}
      {interview.status === 'COMPLETED' && (
        <div className="pt-6 border-t border-gray-800">
          <h4 className="font-bold text-white mb-2">Follow-up</h4>
          {thankYouDraft ? (
            <textarea readOnly value={thankYouDraft} rows="4" className="w-full bg-gray-900 text-gray-300 text-sm p-3 rounded-lg border border-gray-700 mb-2" />
          ) : (
            <button onClick={generateThankYou} className="flex items-center text-sm bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-white">
              <Send className="w-4 h-4 mr-2" /> Generate Thank You Email
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// --- QUESTIONS TAB ---
function QuestionsTab({ details }) {
  return (
    <div className="space-y-4">
      {details.questions?.length > 0 ? details.questions.map(q => (
        <div key={q._id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-white">{q.question}</h4>
            <span className="text-xs bg-gray-900 text-gray-400 px-2 py-1 rounded">{q.category}</span>
          </div>
          <p className="text-sm text-gray-400 mt-2">Your answer: {q.userAnswer || 'Not logged'}</p>
        </div>
      )) : (
        <p className="text-gray-500 text-sm text-center py-8">No questions logged for this interview yet.</p>
      )}
    </div>
  );
}

// --- INTEL TAB ---
function IntelTab({ details, interview }) {
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (interview.interviewerName) {
      fetchIntel();
    }
  }, [interview.interviewerName]);

  const fetchIntel = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`/api/interviews/${interview._id}/interviewer-intel`);
      setIntel(res.data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* I4: Interviewer Intel */}
      <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl">
        <h4 className="font-bold text-white mb-4">Interviewer Intelligence</h4>
        {!interview.interviewerName ? (
          <p className="text-sm text-gray-500">Add an interviewer name in the edit screen to unlock specific intelligence.</p>
        ) : loading ? (
          <p className="text-sm text-gray-500 animate-pulse">Analyzing LinkedIn patterns...</p>
        ) : intel ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Profile</p>
              <p className="text-white font-medium">{intel.name}</p>
              <p className="text-sm text-gray-400">{intel.seniorityLevel} at {intel.company}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Typical Focus</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {intel.typicalQuestionFocus.map((f, i) => <span key={i} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">{f}</span>)}
              </div>
            </div>
            <div className="bg-indigo-900/10 border border-indigo-500/20 p-3 rounded-lg">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Prep Notes</p>
              <p className="text-sm text-indigo-200/80 leading-relaxed">{intel.notes}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Aggregate Intel */}
      <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
        <h4 className="font-bold text-white mb-2 text-sm">Global Anonymous Database</h4>
        <p className="text-sm text-gray-400">Other students who interviewed with someone matching this profile were asked 14 system design questions and 2 behavioral questions.</p>
      </div>
    </div>
  );
}
