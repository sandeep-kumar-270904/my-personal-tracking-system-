import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileQuestion, Star, ThumbsUp, Plus } from 'lucide-react';

export default function QuestionBankBuilder() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [newQuestion, setNewQuestion] = useState('');
  const [newTarget, setNewTarget] = useState('ENGINEER');
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    fetchBank();
  }, []);

  const fetchBank = async () => {
    try {
      const res = await axios.get('/api/interviews/training/question-bank');
      setQuestions(res.data);
    } catch(e) { console.error(e); }
  };

  const addQuestion = async () => {
    if(!newQuestion) return;
    setEvaluating(true);
    try {
      // It auto-categorizes and returns quality score logic on backend
      await axios.post('/api/interviews/training/question-bank', { question: newQuestion, interviewerType: newTarget });
      setNewQuestion('');
      fetchBank();
    } catch(e) { console.error(e); } finally { setEvaluating(false); }
  };

  const filtered = filter === 'ALL' ? questions : questions.filter(q => q.interviewerType === filter);

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FileQuestion className="w-6 h-6 mr-2 text-amber-400" />
        Reverse Interview Question Bank
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Curate the perfect questions to ask at the end of your interviews to leave a lasting impression.</p>

      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {['ALL', 'ENGINEER', 'MANAGER', 'HR', 'FOUNDER'].map(f => (
          <button 
            key={f} 
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${filter === f ? 'bg-amber-500 text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {filtered.map(q => (
          <div key={q._id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-amber-400 bg-amber-900/20 px-2 py-0.5 rounded uppercase">{q.questionCategory.replace(/_/g, ' ')}</span>
              <div className="flex space-x-3 text-xs text-gray-400">
                <span className="flex items-center"><Star className={`w-3 h-3 mr-1 ${q.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} /> Used: {q.timesUsed}</span>
                <span className="flex items-center text-emerald-400"><ThumbsUp className="w-3 h-3 mr-1" /> Reactions: {q.positiveReactionCount}</span>
              </div>
            </div>
            <p className="text-sm font-medium">{q.question}</p>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No questions for this target yet.</p>}
      </div>

      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl">
        <h4 className="font-bold text-sm mb-3">Build a Custom Question</h4>
        <div className="flex space-x-3 mb-3">
          <select value={newTarget} onChange={e => setNewTarget(e.target.value)} className="bg-gray-900 border border-gray-700 rounded text-sm px-3 py-2 focus:outline-none">
            <option value="ENGINEER">For Engineer</option>
            <option value="MANAGER">For Manager</option>
            <option value="HR">For HR</option>
            <option value="FOUNDER">For Founder</option>
          </select>
          <input 
            type="text" 
            value={newQuestion} 
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="e.g. What is the biggest challenge your team faces..." 
            className="flex-grow bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <button onClick={addQuestion} disabled={!newQuestion || evaluating} className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded flex justify-center items-center disabled:opacity-50">
          {evaluating ? 'Evaluating Quality...' : <><Plus className="w-4 h-4 mr-1" /> Evaluate & Add to Bank</>}
        </button>
      </div>
    </div>
  );
}
