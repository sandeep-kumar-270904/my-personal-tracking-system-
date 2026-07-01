import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { estimateTakeHome } from './TakeHomeEstimator';
import { Calendar, AlertTriangle, ShieldAlert, BadgeDollarSign, MapPin, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import OfferCriteriaSettings, { checkOfferFit } from './OfferCriteriaSettings';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const formatMoney = (value) => {
  if (!value) return '-';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
};

const CITY_TIERS = {
  tier1: ['bangalore', 'bengaluru', 'mumbai', 'delhi', 'ncr', 'gurgaon', 'noida'],
  tier2: ['pune', 'hyderabad', 'chennai', 'kolkata', 'ahmedabad'],
  // Default to tier3/hometown if not matched
};

const getColMultiplier = (location) => {
  if (!location) return 1.30; // Default hometown assumption
  const loc = location.toLowerCase();
  if (CITY_TIERS.tier1.some(city => loc.includes(city))) return 1.0;
  if (CITY_TIERS.tier2.some(city => loc.includes(city))) return 1.15;
  return 1.30; // Tier 3
};

const OfferComparisonView = ({ offers, isReadOnly = false }) => {
  const [colAdjusted, setColAdjusted] = useState(false);
  const pendingOffers = offers
    .filter(o => o.status === 'pending_decision' || o.status === 'on_hold')
    .sort((a, b) => {
      // Sort by deadline urgency
      if (!a.decision_deadline) return 1;
      if (!b.decision_deadline) return -1;
      return new Date(a.decision_deadline) - new Date(b.decision_deadline);
    });

  const { data: criteria = [] } = useQuery({
    queryKey: ['offer-criteria'],
    queryFn: async () => {
      const res = await api.get('/offer-criteria');
      return res.data;
    }
  });

  const fetchBenchmark = async (role_title) => {
    try {
      const res = await api.get(`/offers/benchmarks?role_title=${encodeURIComponent(role_title)}`);
      return res.data;
    } catch (e) {
      return { available: false };
    }
  };

  // Pre-fetch benchmarks for the roles present in pendingOffers
  const [benchmarks, setBenchmarks] = useState({});
  
  useEffect(() => {
    pendingOffers.forEach(async (offer) => {
      if (offer.role_title && !benchmarks[offer.role_title]) {
        const data = await fetchBenchmark(offer.role_title);
        setBenchmarks(prev => ({ ...prev, [offer.role_title]: data }));
      }
    });
  }, [pendingOffers]);

  if (pendingOffers.length < 2) return null;

  return (
    <div className={`mt-8 mb-8 ${isReadOnly ? 'max-w-7xl mx-auto p-4' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <BadgeDollarSign className="w-5 h-5 text-[#00f0ff]" /> Compare Pending Offers
        </h3>
        
        <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
          <input type="checkbox" checked={colAdjusted} onChange={(e) => setColAdjusted(e.target.checked)} className="w-4 h-4 rounded border-white/20 text-[#00f0ff] bg-transparent" />
          <span className="text-xs text-slate-300 font-bold">Adjust for Cost of Living</span>
        </label>
      </div>

      {!isReadOnly && <OfferCriteriaSettings />}
      
      {/* V6: Basic-Percentage Insight */}
      {pendingOffers.length >= 2 && pendingOffers.every(o => o.base_salary && o.ctc_annual) && (() => {
        const hasDifferingBasic = pendingOffers.some((o1, i, arr) => 
          i > 0 && Math.abs((o1.base_salary * 0.5 / o1.ctc_annual) - (arr[0].base_salary * 0.5 / arr[0].ctc_annual)) > 0.05
        );
        if (hasDifferingBasic) {
          return (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
              <span className="font-bold text-blue-400">Salary Structure Insight:</span> These offers have significantly different portions of CTC allocated to Basic Pay. Higher Basic generally means more PF accumulation over time, but lower immediate take-home pay.
            </div>
          );
        }
        return null;
      })()}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-x-auto pb-4">
        {pendingOffers.map((offer, idx) => {
          const takeHome = estimateTakeHome(offer.ctc_annual, offer.base_salary, offer.variable_bonus);
          const isUrgent = offer.decision_deadline && new Date(offer.decision_deadline) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

          return (
            <motion.div 
              key={offer._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card rounded-2xl border ${isUrgent ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 bg-[#13141f]'} flex flex-col min-w-[300px]`}
            >
              {/* Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-white text-lg">{offer.company_name}</h4>
                    <p className="text-[#00f0ff] text-sm">{offer.role_title}</p>
                    {offer.location && (
                      <p className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {offer.location}
                      </p>
                    )}
                  </div>
                  {isUrgent && (
                    <div className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Urgent
                    </div>
                  )}
                </div>
                {offer.decision_deadline && (
                  <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${isUrgent ? 'text-amber-400' : 'text-slate-400'}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    Deadline: {new Date(offer.decision_deadline).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* CTC Breakdown */}
              <div className="p-5 space-y-3 flex-1">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total CTC</span>
                  <span className="text-2xl font-bold text-emerald-400">{formatMoney(offer.ctc_annual)}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Base Salary</span>
                    <span className="font-medium text-white">{formatMoney(offer.base_salary)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Variable/Bonus</span>
                    <span className="font-medium text-white">{formatMoney(offer.variable_bonus)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Joining Bonus</span>
                    <span className="font-medium text-white">{formatMoney(offer.joining_bonus)}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-400">Stocks / RSU</span>
                    <span className="font-medium text-white">{formatMoney(offer.stocks_rsu_value)}</span>
                  </div>
                </div>

                {/* Recurring CTC by year (v6) */}
                {(offer.joining_bonus > 0 || offer.stocks_rsu_value > 0) && (
                  <div className="mt-3 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs">
                    <p className="text-indigo-400 font-bold mb-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> Recurring CTC from Year 2
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-[10px]">Excludes 1-time & unvested RSUs</span>
                      <span className="text-white font-bold text-sm">
                        ~{formatMoney(offer.ctc_annual - (offer.joining_bonus || 0) - (offer.stocks_rsu_value || 0))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Bond Warning */}
                {offer.has_bond && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-400">Service Bond: {offer.bond_duration_months} Months</p>
                      <p className="text-[10px] text-red-300 mt-0.5">Penalty: {formatMoney(offer.bond_penalty_amount)}</p>
                    </div>
                  </div>
                )}

                {/* Benchmark vs Offer */}
                {benchmarks[offer.role_title]?.available && (
                  <div className="mt-4 p-3 bg-[#00f0ff]/5 border border-[#00f0ff]/10 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-wider flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Market Benchmark
                      </p>
                      <p className="text-[9px] text-slate-500">Based on {benchmarks[offer.role_title].count} offers</p>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-2">
                      <div className="text-slate-400 flex flex-col">
                        <span className="text-[9px] uppercase">Median</span>
                        <span className="font-bold text-white">{formatMoney(benchmarks[offer.role_title].median)}</span>
                      </div>
                      <div className="text-emerald-400 flex flex-col items-end">
                        <span className="text-[9px] uppercase">Top 25%</span>
                        <span className="font-bold text-white">{formatMoney(benchmarks[offer.role_title].p75)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Objective Fit-Check */}
                {criteria.length > 0 && !isReadOnly && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Criteria Match</p>
                    {checkOfferFit(offer, criteria).map((fit, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-slate-300">{fit.name}</span>
                        {fit.isMet ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Take Home Estimate */}
              {offer.offer_type !== 'internship' && (
                <div className="p-5 bg-black/20 rounded-b-2xl border-t border-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Est. Take-Home Pay</p>
                    {colAdjusted && (
                      <span className="text-[9px] bg-[#00f0ff]/10 text-[#00f0ff] px-2 py-0.5 rounded border border-[#00f0ff]/20">
                        {getColMultiplier(offer.location)}x Multiplier
                      </span>
                    )}
                  </div>
                  
                  {/* Detailed CTC Breakdown Walkthrough */}
                  <details className="mb-3 group">
                    <summary className="text-[10px] text-slate-400 cursor-pointer hover:text-white transition-colors flex items-center gap-1 font-bold tracking-wide outline-none">
                      <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                      WHERE DOES MY CTC GO?
                    </summary>
                    <div className="mt-2 space-y-2 p-3 bg-[#0a0b14] rounded-lg border border-white/5 text-[10px]">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Step 1: Stated CTC</span>
                        <span className="font-mono">{formatMoney(takeHome.breakdown.step1_ctc)}</span>
                      </div>
                      <div className="border-l border-white/10 ml-1.5 pl-3 space-y-1 my-1">
                        <div className="text-slate-500 italic">- Employer Deductions you never see</div>
                        <div className="flex justify-between text-slate-400">
                          <span>Employer PF (includes EPS)</span>
                          <span className="text-red-400 font-mono">-{formatMoney(takeHome.breakdown.employerDeductions.pf)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Gratuity (Locked for 5 yrs)</span>
                          <span className="text-red-400 font-mono">-{formatMoney(takeHome.breakdown.employerDeductions.gratuity)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-slate-300 font-bold border-t border-white/10 pt-1">
                        <span>Step 2: Gross Salary</span>
                        <span className="font-mono text-[#00f0ff]">{formatMoney(takeHome.breakdown.step2_gross)}</span>
                      </div>
                      <div className="border-l border-white/10 ml-1.5 pl-3 space-y-1 my-1">
                        <div className="text-slate-500 italic">- Employee Deductions from your pay</div>
                        <div className="flex justify-between text-slate-400">
                          <span>Employee PF</span>
                          <span className="text-red-400 font-mono">-{formatMoney(takeHome.breakdown.employeeDeductions.pf)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Professional Tax</span>
                          <span className="text-red-400 font-mono">-{formatMoney(takeHome.breakdown.employeeDeductions.pt)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Income Tax (TDS estimate)</span>
                          <span className="text-red-400 font-mono">-{formatMoney(takeHome.newRegime.tax)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-white font-bold border-t border-white/10 pt-1">
                        <span>Step 3: Annual Take-Home</span>
                        <span className="font-mono text-emerald-400">{formatMoney(takeHome.newRegime.annualEstimate)}</span>
                      </div>
                      <div className="mt-2 p-2 bg-slate-800/50 rounded border border-slate-700/50 text-slate-400 text-[9px] leading-tight">
                        <span className="font-bold text-amber-500">Note on PF:</span> A significant portion of the Employer PF contribution (8.33% of Basic) goes to the Employee Pension Scheme (EPS), which is locked until retirement age and cannot be easily withdrawn early. Current labour codes also dictate minimum Basic pay ratios.
                      </div>
                    </div>
                  </details>

                  <div className="flex justify-between items-center gap-3">
                    <div className="flex-1 bg-white/5 p-3 rounded-lg border border-white/5">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider mb-1">Old Regime</p>
                      <div className="text-base font-bold text-slate-300">
                        ~{formatMoney(colAdjusted ? takeHome.oldRegime.monthlyEstimate * getColMultiplier(offer.location) : takeHome.oldRegime.monthlyEstimate)} <span className="text-[9px] font-medium text-slate-500">/ mo</span>
                      </div>
                    </div>
                    <div className="flex-1 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                      <p className="text-[9px] text-blue-400 uppercase tracking-wider mb-1">New Regime</p>
                      <div className="text-base font-bold text-blue-400">
                        ~{formatMoney(colAdjusted ? takeHome.newRegime.monthlyEstimate * getColMultiplier(offer.location) : takeHome.newRegime.monthlyEstimate)} <span className="text-[9px] font-medium text-blue-500/70">/ mo</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-[9px] text-slate-500 mt-3 leading-tight">
                    *Disclaimer: Old regime typically favors those claiming significant deductions (HRA, 80C); New regime has lower slabs but fewer deductions. {colAdjusted ? 'Adjusted figures are a rough multiplier based on city tier to reflect purchasing power. ' : ''}Not a definitive financial calculator. Actuals vary.
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OfferComparisonView;
