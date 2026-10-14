import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, BookOpen } from 'lucide-react';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQ = async () => {
      try {
        const res = await axios.get('/api/interviews/question-bank');
        setQuestions(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQ();
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-500 animate-pulse">Loading question bank...</div>;

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-gray-400 mb-2">Personal Question Bank</h3>
        <p className="max-w-md mx-auto text-sm">
          This is where your real interview experiences turn into an exclusive prep library. 
          When you log questions during a debrief, they appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search your past questions..." 
            className="w-full bg-gray-950 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white focus:border-indigo-500 outline-none"
          />
        </div>
        <button className="flex items-center px-4 py-2 bg-gray-800 text-gray-300 rounded-lg ml-4 hover:bg-gray-700">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {questions.map(q => (
          <div key={q._id} className="p-5 bg-gray-950 border border-gray-800 rounded-xl hover:border-indigo-500/30 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-medium text-white">{q.question}</h3>
              <div className="flex space-x-2">
                <span className="px-2 py-1 bg-gray-900 text-xs text-gray-400 rounded border border-gray-800">{q.category}</span>
                <span className="px-2 py-1 bg-gray-900 text-xs text-gray-400 rounded border border-gray-800">{q.difficulty}</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500 mb-3">
              Asked at <span className="font-semibold text-gray-300">{q.company}</span> • {q.roundType}
            </div>
            
            {q.userAnswer && (
              <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-800/50">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">Your Answer</p>
                <p className="text-sm text-gray-300 italic">"{q.userAnswer}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
