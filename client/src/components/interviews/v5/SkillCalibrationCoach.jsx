import React, { useState } from 'react';
import axios from 'axios';
import { Target, TrendingUp, TrendingDown, ChevronRight, CheckCircle } from 'lucide-react';

export default function SkillCalibrationCoach() {
  const [step, setStep] = useState('PRE_INTERVIEW'); // PRE_INTERVIEW -> POST_INTERVIEW -> RESULTS
  const [skills, setSkills] = useState([
    { skillName: 'React.js', confidence: 80, interviewerProbeDepth: 0, performedWell: true },
    { skillName: 'System Design', confidence: 60, interviewerProbeDepth: 0, performedWell: true },
    { skillName: 'Kubernetes', confidence: 40, interviewerProbeDepth: 0, performedWell: true }
  ]);
  const [loading, setLoading] = useState(false);
  const [evaluations, setEvaluations] = useState(null);
  
  const handlePreInterviewChange = (idx, val) => {
    const updated = [...skills];
    updated[idx].confidence = val;
    setSkills(updated);
  };

  const handlePostInterviewChange = (idx, field, val) => {
    const updated = [...skills];
    updated[idx][field] = val;
    setSkills(updated);
  };

  const submitPreInterview = async () => {
    setLoading(true);
    try {
      // Mocking interview ID
      await axios.post('/api/interviews/training/skill-calibration', { interviewId: 'mock-123', skills });
      setStep('POST_INTERVIEW');
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const submitPostInterview = async () => {
    setLoading(true);
    try {
      const res = await axios.patch('/api/interviews/training/skill-calibration/mock-123', { skills });
      setEvaluations(res.data);
      setStep('RESULTS');
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Target className="w-6 h-6 mr-2 text-fuchsia-400" />
        Skill Calibration
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Most students fail because they claim an 8/10 on a skill but perform at a 4/10 when probed. Calibrate your confidence against reality.</p>

      {step === 'PRE_INTERVIEW' && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl">
            <h3 className="font-bold text-gray-300 mb-4">Pre-Interview: Rate your claimed confidence</h3>
            {skills.map((s, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-bold text-fuchsia-300">{s.skillName}</span>
                  <span className="text-gray-400">{s.confidence}/100</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={s.confidence} 
                  onChange={e => handlePreInterviewChange(i, parseInt(e.target.value))}
                  className="w-full accent-fuchsia-500"
                />
              </div>
            ))}
          </div>
          <button onClick={submitPreInterview} disabled={loading} className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 font-bold rounded-lg transition-colors">
            {loading ? 'Saving...' : 'Lock In Pre-Interview Confidence'}
          </button>
        </div>
      )}

      {step === 'POST_INTERVIEW' && (
        <div className="space-y-6">
          <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl">
            <h3 className="font-bold text-gray-300 mb-4">Post-Interview: Reality Check</h3>
            {skills.map((s, i) => (
              <div key={i} className="mb-6 border-b border-gray-700 pb-4 last:border-0">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-bold text-fuchsia-300 text-lg">{s.skillName}</span>
                  <span className="text-gray-500">Claimed: {s.confidence}/100</span>
                </div>
                
                <div className="mb-3">
                  <label className="text-xs text-gray-400 font-bold uppercase block mb-1">How deep did the interviewer probe?</label>
                  <input 
                    type="range" min="0" max="100" value={s.interviewerProbeDepth} 
                    onChange={e => handlePostInterviewChange(i, 'interviewerProbeDepth', parseInt(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center text-sm">
                    <input type="radio" checked={s.performedWell} onChange={() => handlePostInterviewChange(i, 'performedWell', true)} className="mr-2 accent-emerald-500" />
                    I handled the depth well
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="radio" checked={!s.performedWell} onChange={() => handlePostInterviewChange(i, 'performedWell', false)} className="mr-2 accent-rose-500" />
                    I struggled at this depth
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button onClick={submitPostInterview} disabled={loading} className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-500 font-bold rounded-lg transition-colors">
            {loading ? 'Analyzing Calibration...' : 'Run Calibration Check'}
          </button>
        </div>
      )}

      {step === 'RESULTS' && evaluations && (
        <div className="space-y-4">
          <div className="bg-gray-800 border border-gray-700 p-5 rounded-xl">
            <h3 className="text-xl font-bold mb-4 flex items-center text-emerald-400"><CheckCircle className="mr-2" /> Calibration Matrix</h3>
            
            <div className="space-y-3">
              {evaluations.map(e => (
                <div key={e._id} className="bg-gray-900 p-4 rounded-lg flex justify-between items-center border border-gray-800">
                  <div>
                    <p className="font-bold text-white">{e.skillName}</p>
                    <p className="text-xs text-gray-400">Claimed: {e.preInterviewConfidence} | Probed: {e.interviewerProbeDepth}</p>
                  </div>
                  <div>
                    {e.gapScore < 0 ? (
                      <span className="flex items-center text-rose-400 font-bold bg-rose-900/30 px-3 py-1 rounded">
                        <TrendingDown className="w-4 h-4 mr-1" /> Overconfident (Dunning-Kruger)
                      </span>
                    ) : e.interviewerProbeDepth < e.preInterviewConfidence ? (
                      <span className="flex items-center text-amber-400 font-bold bg-amber-900/30 px-3 py-1 rounded">
                        Tested Below Claimed
                      </span>
                    ) : (
                      <span className="flex items-center text-emerald-400 font-bold bg-emerald-900/30 px-3 py-1 rounded">
                        <TrendingUp className="w-4 h-4 mr-1" /> Perfectly Calibrated
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 bg-fuchsia-900/20 p-4 rounded-lg border border-fuchsia-500/30">
              <p className="text-sm text-fuchsia-200">
                <span className="font-bold uppercase tracking-wider block mb-1 text-fuchsia-400">Strategy Adjustment</span>
                You are overconfident in Kubernetes. In your next interview, tone down your claimed expertise on the resume, or spend the next 24 hours closing the depth gap.
              </p>
            </div>
          </div>
          <button onClick={() => setStep('PRE_INTERVIEW')} className="w-full py-2 bg-gray-700 hover:bg-gray-600 font-bold rounded-lg text-white">
            Reset Coach
          </button>
        </div>
      )}
    </div>
  );
}
