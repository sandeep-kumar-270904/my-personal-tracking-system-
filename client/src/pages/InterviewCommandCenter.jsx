import React, { useState, useEffect } from 'react';
import { Shield, Brain, Calendar, Target, Activity, Send, Star, Zap, Network, BookOpen, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

export default function InterviewCommandCenter() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get('/api/interviews/v4/command-center');
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-white animate-pulse">Loading Command Center...</div>;
  if (!data) return <div className="p-8 text-rose-400">Failed to load Command Center.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-gray-400 mt-1">Cross-platform interview intelligence and readiness metrics.</p>
        </div>
        <div className="bg-indigo-900/30 border border-indigo-500/50 px-6 py-3 rounded-2xl flex items-center shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <Activity className="w-6 h-6 text-indigo-400 mr-3" />
          <div>
            <p className="text-xs text-indigo-300 uppercase tracking-widest font-bold">Readiness Score</p>
            <p className="text-2xl font-black text-white">84<span className="text-sm text-gray-500">/100</span></p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Brain className="w-32 h-32 text-indigo-400" />
        </div>
        <h3 className="text-indigo-400 font-bold uppercase tracking-wider text-xs mb-2 flex items-center">
          <Zap className="w-4 h-4 mr-2" /> Daily AI Briefing
        </h3>
        <p className="text-lg text-gray-200 leading-relaxed max-w-4xl relative z-10">
          {data.briefing}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Panel 1: DSA Readiness */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white">DSA Sync</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Prep Plan</span>
              <span className="text-emerald-400 font-bold">{data.dsaReadiness.completion}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Problems Solved</span>
              <span className="text-white font-bold">{data.dsaReadiness.problemsSolved}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Resume Alignment */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg mr-3">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-white">Resume Loop</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Signal Gaps</span>
              <span className="text-amber-400 font-bold">{data.resumeAlignment.gaps} detected</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Last Update</span>
              <span className="text-white">{data.resumeAlignment.lastUpdate}</span>
            </div>
          </div>
        </div>

        {/* Panel 3: Application Pipeline */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg mr-3">
              <Send className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-white">App Pipeline</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Pipelines</span>
              <span className="text-purple-400 font-bold">{data.applicationPipeline.active}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending Results</span>
              <span className="text-white font-bold">{data.applicationPipeline.pending}</span>
            </div>
          </div>
        </div>

        {/* Panel 4: Networking Leverage */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-pink-500/10 rounded-lg mr-3">
              <Network className="w-5 h-5 text-pink-400" />
            </div>
            <h3 className="font-bold text-white">Networking</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Relevant Contacts</span>
              <span className="text-pink-400 font-bold">{data.networkingLeverage.contacts}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Insider Tips</span>
              <span className="text-white font-bold">{data.networkingLeverage.insights}</span>
            </div>
          </div>
        </div>

        {/* Panel 5: Goals Alignment */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-bold text-white">Goals Tracking</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Performance</span>
              <span className="text-amber-400 font-bold">{data.goalsAlignment.performance}/10</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Conversion</span>
              <span className="text-white font-bold">{(data.goalsAlignment.conversion * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Panel 6: Offer Pipeline */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg mr-3">
              <Star className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white">Offer Radar</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Expected Offers</span>
              <span className="text-emerald-400 font-bold">{data.offerPipeline.pendingOffers}</span>
            </div>
            <button className="w-full mt-2 text-xs py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded">
              Prepare Negotiation
            </button>
          </div>
        </div>

        {/* Panel 7: Calendar Health */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-rose-500/10 rounded-lg mr-3">
              <Calendar className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="font-bold text-white">Schedule Health</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Health Score</span>
              <span className="text-rose-400 font-bold">{data.calendarHealth.score}/100</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
              <div className="bg-rose-400 h-2 rounded-full" style={{ width: `${data.calendarHealth.score}%` }}></div>
            </div>
          </div>
        </div>

        {/* Panel 8: PrepHub Bridge */}
        <div className="bg-gray-900 p-5 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg mr-3">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <h3 className="font-bold text-white">PrepHub Intel</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Addressed Gaps</span>
              <span className="text-indigo-400 font-bold">{data.prepHardResources.completed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending Actions</span>
              <span className="text-white font-bold">{data.prepHardResources.recommended}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
