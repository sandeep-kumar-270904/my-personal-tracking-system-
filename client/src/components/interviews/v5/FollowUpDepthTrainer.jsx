import React, { useState } from 'react';
import axios from 'axios';
import { Brain, CornerDownRight, CheckCircle } from 'lucide-react';

export default function FollowUpDepthTrainer() {
  const [level, setLevel] = useState(0);
  const [question, setQuestion] = useState("Explain how a Hash Map works under the hood.");
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);

  const submitAnswer = async () => {
    setLoading(true);
    try {
      if (level === 2) {
        // Final level, get evaluation
        const res = await axios.post('/api/interviews/training/follow-up-depth', {
          questionAsked: history[0].question,
          initialAnswer: history[0].answer,
          followUpQuestion: question,
          followUpAnswer: answer
        });
        setHistory([...history, { question, answer }]);
        setEvaluation(res.data);
      } else {
        // Mocking LLM follow-up generation
        const nextQ = level === 0 
          ? "You mentioned it uses an array. How exactly does the hash function map a key to an array index, and what happens if two keys map to the same index?"
          : "If we use chaining for collisions, what is the worst-case time complexity for lookup, and how can modern implementations (like in Java 8) mitigate this?";
        setHistory([...history, { question, answer }]);
        setQuestion(nextQ);
        setAnswer("");
        setLevel(level + 1);
      }
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const reset = () => {
    setLevel(0);
    setHistory([]);
    setQuestion("Explain how a Hash Map works under the hood.");
    setAnswer("");
    setEvaluation(null);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl text-white">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Brain className="w-6 h-6 mr-2 text-purple-400" />
        Follow-Up Depth Endurance
      </h2>
      <p className="text-gray-400 mb-6 text-sm">Survive 3 layers of questioning to prove your depth.</p>

      <div className="space-y-4 mb-6">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-2 opacity-60">
            <div className="bg-purple-900/10 border border-purple-500/20 p-3 rounded-lg text-sm text-purple-200">
              <span className="font-bold">Level {idx + 1}:</span> {item.question}
            </div>
            <div className="bg-gray-800 p-3 rounded-lg text-sm text-gray-300 ml-4 flex items-start">
              <CornerDownRight className="w-4 h-4 mr-2 mt-0.5" /> {item.answer}
            </div>
          </div>
        ))}
      </div>

      {!evaluation ? (
        <div className="space-y-4">
          <div className="bg-purple-900/30 border border-purple-500/50 p-4 rounded-xl shadow-lg">
            <p className="text-sm font-bold text-purple-300 mb-1">Level {level + 1} Question:</p>
            <p className="text-lg font-medium">{question}</p>
          </div>
          <textarea 
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 min-h-[120px]"
            placeholder="Type your detailed answer here..."
            disabled={loading}
          />
          <button 
            onClick={submitAnswer} 
            disabled={!answer || loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-bold rounded-lg text-white"
          >
            {loading ? 'Processing...' : 'Submit Answer'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 p-6 rounded-xl border border-emerald-500/30 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-2xl font-bold mb-2">Depth Score: {evaluation.depthScore}/100</h3>
          <p className="text-sm text-gray-300 mb-4">{evaluation.feedbackText}</p>
          <div className="flex justify-center space-x-4 text-xs mb-6">
            <span className="bg-gray-900 px-3 py-1 rounded">Reasoning: {evaluation.reasoningClarity}</span>
            <span className={`px-3 py-1 rounded ${evaluation.tradeoffMentioned ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
              Trade-offs: {evaluation.tradeoffMentioned ? 'Included' : 'Missed'}
            </span>
          </div>
          <button onClick={reset} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 font-bold rounded-lg">Try Another Topic</button>
        </div>
      )}
    </div>
  );
}
