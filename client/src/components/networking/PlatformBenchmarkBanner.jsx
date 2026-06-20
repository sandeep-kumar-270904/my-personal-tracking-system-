import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, TrendingUp } from 'lucide-react';

const PlatformBenchmarkBanner = () => {
  const [benchmarks, setBenchmarks] = useState(null);

  useEffect(() => {
    const fetchBenchmarks = async () => {
      try {
        const res = await axios.get('/api/networking/benchmarks');
        setBenchmarks(res.data);
      } catch (err) {
        console.error('Failed to fetch benchmarks', err);
      }
    };
    fetchBenchmarks();
  }, []);

  if (!benchmarks) return null;

  return (
    <div className="bg-gradient-to-r from-[#ff6b00]/10 to-[#ff6b00]/5 border border-[#ff6b00]/20 rounded-xl p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#ff6b00]/20 flex items-center justify-center">
          <Target className="w-5 h-5 text-[#ff6b00]" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Overcome the Cold Start</h3>
          <p className="text-sm text-slate-400">
            {benchmarks.percentageStartedZero}% of successful placements started with exactly 0 connections at the target company.
          </p>
        </div>
      </div>
      <div className="text-right hidden md:block">
        <div className="text-2xl font-bold text-white">{benchmarks.avgContactsAtOffer}</div>
        <div className="text-[10px] uppercase font-bold text-slate-500">Avg Contacts at Offer</div>
      </div>
    </div>
  );
};

export default PlatformBenchmarkBanner;
