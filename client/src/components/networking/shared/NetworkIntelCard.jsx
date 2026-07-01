import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Quote } from 'lucide-react';

const NetworkIntelCard = ({ company, insights = [], onAskForIntel }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Lightbulb className="w-4 h-4 text-indigo-400" />
          </div>
          <h4 className="text-white font-medium">Network Intel</h4>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          None of your contacts have shared intel about {company} yet.
        </p>
        <button
          onClick={onAskForIntel}
          className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Ask a contact for intel
        </button>
      </div>
    );
  }

  // Aggregate insights by type or just list them
  return (
    <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Lightbulb className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h4 className="text-indigo-200 font-medium">Based on intel from {new Set(insights.map(i => i.contactName)).size} contacts</h4>
          <p className="text-xs text-indigo-300/70">What your network says about {company}</p>
        </div>
      </div>

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div key={idx} className="p-3 bg-black/20 rounded-lg border border-white/5">
            <div className="flex items-start gap-2">
              <Quote className="w-3 h-3 text-indigo-400 mt-1 shrink-0" />
              <div>
                <p className="text-sm text-slate-200">{insight.content}</p>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-300">{insight.contactName}</span>
                  <span>•</span>
                  <span className="uppercase tracking-wider">{insight.insightType?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NetworkIntelCard;
