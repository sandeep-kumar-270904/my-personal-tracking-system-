import React, { useState } from 'react';
import axios from 'axios';
import { FileText, ChevronRight, Activity } from 'lucide-react';

export default function DetailCalibrationTrainer() {
  const [question, setQuestion] = useState("What happens when you type google.com into your browser?");
  const [budget, setBudget] = useState("2-minute answer");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const questions = [
    { q: "What happens when you type google.com into your browser?", b: "2-minute answer" },
    { q: "What is the difference between TCP and UDP?", b: "30-second answer" },
    { q: "Explain how you would architect a global chat application.", b: "Deep dive — 5+ minutes" }
  ];

  const submitAnswer = async () => {
    setLoading(true);
    try {
      const res = await axios.post('/api/interviews/training/detail-calibration', {
        questionAsked: question,
        studentAnswer: answer
      });
      setEvaluation(res.data);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const nextQuestion = () => {
    const next = questions[Math.floor(Math.random() * questions.length)];
    setQuestion(next.q);
    setBudget(next.b);
    setAnswer("");
    setEvaluation(null);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-indigo-400" />
        Detail Calibration
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Stop rambling or being too brief. Match your depth to the question's implicit budget.</p>

      {!evaluation ? (
        <div className="space-y-4">
          <div className="bg-indigo-900/20 border border-indigo-500/30 p-5 rounded-xl">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-500 uppercase">Question</span>
              <span className="text-xs font-bold text-indigo-400 bg-indigo-900/40 px-2 py-1 rounded">Budget: {budget}</span>
            </div>
            <p className="text-lg font-medium">{question}</p>
          </div>
          
          <textarea 
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-gray-300 min-h-[150px] focus:outline-none focus:border-indigo-500"
            placeholder={`Type your ${budget} here...`}
            disabled={loading}
          />

          <button onClick={submitAnswer} disabled={!answer || loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded-lg transition-colors">
            {loading ? 'Analyzing Depth...' : 'Submit for Calibration'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Activity className={`w-12 h-12 mb-3 ${evaluation.aiDepthAssessment === 'JUST_RIGHT' ? 'text-emerald-400' : 'text-amber-400'}`} />
            <h3 className="text-2xl font-bold mb-1">
              {evaluation.aiDepthAssessment === 'JUST_RIGHT' ? 'Perfectly Calibrated' : 
               evaluation.aiDepthAssessment === 'TOO_BRIEF' ? 'Too Brief' : 'Too Detailed'}
            </h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">{evaluation.interviewerSimulatedReaction}</p>
          </div>
          <button onClick={nextQuestion} className="w-full py-2 bg-gray-700 hover:bg-gray-600 font-bold rounded-lg flex items-center justify-center">
            Next Scenario <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
}
