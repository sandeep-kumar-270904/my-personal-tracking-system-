import { useState } from 'react';
import { Target, Search, Mic, CheckCircle2, ChevronRight, MessageSquare, Loader2, PlayCircle } from 'lucide-react';
import api from '../../services/api';

export default function InterviewPredictorTab({ resume }) {
  const [jd, setJd] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [practiceAnswer, setPracticeAnswer] = useState('');

  const handlePredict = async () => {
    setIsPredicting(true);
    setPredictions(null);
    try {
      const { data } = await api.post(`/resumes/${resume._id}/predicted-questions`, { jobDescription: jd });
      setPredictions(data);
    } catch (err) {
      console.error('Prediction failed', err);
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!predictions && !isPredicting ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400"><MessageSquare className="w-5 h-5"/></div>
            <div>
              <h4 className="font-semibold text-white">Interview Question Predictor</h4>
              <p className="text-xs text-slate-400">Paste a Job Description (optional) to predict hard questions.</p>
            </div>
          </div>
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            rows={4}
            placeholder="Paste Job Description here (or leave blank to analyze resume generally)..."
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-4 text-slate-300 text-sm focus:ring-2 focus:ring-pink-500/50 outline-none custom-scrollbar mb-4"
          />
          <button 
            onClick={handlePredict} 
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <PlayCircle className="w-4 h-4" /> Predict Questions
          </button>
        </div>
      ) : isPredicting ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-4" />
          <p className="text-pink-400 font-medium">Analyzing claims and predicting questions...</p>
        </div>
      ) : (
        <div className="flex h-[500px] gap-4">
          {/* Questions List */}
          <div className="w-1/3 bg-slate-950 border border-white/5 rounded-xl overflow-y-auto">
            <div className="p-4 border-b border-white/5 bg-slate-900 sticky top-0 flex justify-between items-center z-10">
              <h4 className="text-white font-semibold text-sm">Predicted Questions</h4>
              <button onClick={() => setPredictions(null)} className="text-xs text-slate-400 hover:text-white transition-colors">Reset</button>
            </div>
            <div className="p-2 space-y-1">
              {predictions.questions?.map((q, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveQuestion(q); setPracticeAnswer(''); }}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${activeQuestion === q ? 'bg-pink-500/20 text-pink-100 border border-pink-500/30' : 'text-slate-300 hover:bg-white/5 border border-transparent'}`}
                >
                  <p className="line-clamp-2">{q.question}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Practice Area */}
          <div className="flex-1 bg-slate-950 border border-white/5 rounded-xl flex flex-col overflow-hidden">
            {activeQuestion ? (
              <>
                <div className="p-5 border-b border-white/5 bg-slate-900/50">
                   <h3 className="text-lg font-medium text-white mb-2">{activeQuestion.question}</h3>
                   <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-md">
                     <Target className="w-3.5 h-3.5"/> <span>Why they'll ask: {activeQuestion.reasoning}</span>
                   </div>
                </div>
                
                <div className="flex-1 p-5 overflow-y-auto space-y-4">
                   <div>
                     <h4 className="text-sm font-semibold text-slate-400 mb-2">Suggested Answer Strategy (STAR)</h4>
                     <p className="text-sm text-slate-300 bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">{activeQuestion.suggestedStrategy}</p>
                   </div>
                   
                   <div>
                     <h4 className="text-sm font-semibold text-slate-400 mb-2">Practice Your Answer</h4>
                     <textarea
                       value={practiceAnswer}
                       onChange={e => setPracticeAnswer(e.target.value)}
                       placeholder="Type your answer here to practice..."
                       className="w-full h-32 bg-slate-900 border border-white/10 rounded-xl p-4 text-slate-300 text-sm focus:outline-none focus:border-pink-500/50 resize-none"
                     />
                   </div>
                </div>
                
                <div className="p-4 border-t border-white/5 bg-slate-900 flex justify-end">
                  <button className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4"/> End Practice
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <p>Select a question from the left to practice</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
