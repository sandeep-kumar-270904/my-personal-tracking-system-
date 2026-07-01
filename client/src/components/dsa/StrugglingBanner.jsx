import React from 'react';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StrugglingBanner = ({ topics = [] }) => {
  const navigate = useNavigate();

  // Find the weakest topic (lowest accuracy or highest weaknessScore)
  // assuming topics look like: { topic: "Dynamic Programming", accuracy: 30, solved: 10 }
  if (!topics || topics.length === 0) return null;

  const strugglingTopics = topics.filter(t => t.accuracy < 50 && t.solved > 0);
  if (strugglingTopics.length === 0) return null;

  const weakest = strugglingTopics.sort((a, b) => a.accuracy - b.accuracy)[0];

  return (
    <div className="bg-gradient-to-r from-rose-500/10 to-[#13141f] border border-rose-500/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center mb-8">
      <div className="flex items-center gap-4 mb-4 sm:mb-0">
        <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">Struggling with {weakest.topic}?</h3>
          <p className="text-slate-400 text-sm">Your accuracy is {weakest.accuracy}%. Review patterns before doing more hard problems.</p>
        </div>
      </div>
      <button 
        onClick={() => navigate(`/resources?search=${encodeURIComponent(weakest.topic)}`)}
        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        View PrepHub Resources <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default StrugglingBanner;
