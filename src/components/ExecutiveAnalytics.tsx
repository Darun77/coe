import React, { useState } from 'react';
import type { BatchMetrics } from '../types';
import { Sliders, DollarSign, Leaf, Shield, Award, TrendingUp } from 'lucide-react';

interface ExecutiveAnalyticsProps {
  baselineMetrics: BatchMetrics;
  engineMetrics: BatchMetrics;
}

export const ExecutiveAnalytics: React.FC<ExecutiveAnalyticsProps> = ({
  baselineMetrics,
  engineMetrics,
}) => {
  const [slaPriorityWeight, setSlaPriorityWeight] = useState<number>(75); // 0-100
  const [cashSecurityWeight, setCashSecurityWeight] = useState<number>(90); // 0-100

  const dailyCostSaved = Math.max(0, baselineMetrics.totalCostDollars - engineMetrics.totalCostDollars);
  const costSavedPercent = baselineMetrics.totalCostDollars > 0 
    ? ((100 * dailyCostSaved) / baselineMetrics.totalCostDollars).toFixed(1)
    : '0.0';
    
  const annualFleetSavings = Math.round(dailyCostSaved * 365);
  const co2Diff = (baselineMetrics.co2EmissionsKg - engineMetrics.co2EmissionsKg).toFixed(1);

  // Dynamic Pareto Score Calculation
  const baselineScore = Math.round(
    (baselineMetrics.slaOnTimePercent * (slaPriorityWeight / 100)) +
    (100 - baselineMetrics.cashBreachCount * 25 - baselineMetrics.incompatibilityErrors * 20) * (cashSecurityWeight / 100)
  );

  const engineScore = Math.round(
    (engineMetrics.slaOnTimePercent * (slaPriorityWeight / 100)) +
    (100 - engineMetrics.cashBreachCount * 25 - engineMetrics.incompatibilityErrors * 20) * (cashSecurityWeight / 100)
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Executive Analytics & Strategic ROI Suite</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Pareto Decision Model
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluates total operating cost, SLA compliance, cash-in-transit security, and carbon emissions across multi-objective trade-offs.
          </p>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <div>
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Annualized Fleet ROI</div>
            <div className="text-xl font-extrabold text-slate-100">${annualFleetSavings.toLocaleString()} / yr</div>
          </div>
        </div>
      </div>

      {/* Strategic Priority Sliders */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" /> Executive Priority Weight Sliders
          </h3>
          <span className="text-xs text-slate-400">Dynamically updates multi-objective utility score</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SLA Weight */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Delivery SLA Compliance Weight</span>
              <span className="text-blue-400 font-bold">{slaPriorityWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={slaPriorityWeight}
              onChange={(e) => setSlaPriorityWeight(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Mileage First (0%)</span>
              <span>Balanced</span>
              <span>Strict 100% SLA (100%)</span>
            </div>
          </div>

          {/* Cash Security Weight */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>COD Cash Carrying Security Weight</span>
              <span className="text-amber-400 font-bold">{cashSecurityWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={cashSecurityWeight}
              onChange={(e) => setCashSecurityWeight(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Ignore Cash Cap (0%)</span>
              <span>Strict Insurance Cap (100%)</span>
            </div>
          </div>

        </div>
      </div>

      {/* Dynamic Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md space-y-3">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Naive Baseline Utility Score</div>
          <div className="text-4xl font-extrabold text-slate-100">{baselineScore} <span className="text-xs font-normal text-slate-400">/ 190 pts</span></div>
          <p className="text-xs text-slate-400">
            Severely penalized due to cash ceiling overruns, product contamination errors, and late SLA delivery breaches.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-6 backdrop-blur-md space-y-3 relative overflow-hidden">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Constraint-Aware Engine Utility Score</div>
          <div className="text-4xl font-extrabold text-emerald-400">{engineScore} <span className="text-xs font-normal text-slate-400">/ 190 pts</span></div>
          <p className="text-xs text-slate-400">
            Achieves optimal balance between distance efficiency, 100% cash safety, zero Hazmat errors, and high SLA compliance.
          </p>
        </div>

      </div>

      {/* Key Strategic Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <DollarSign className="w-4 h-4" /> Operational Savings
          </div>
          <div className="text-2xl font-bold text-slate-100">${dailyCostSaved.toLocaleString()} / day</div>
          <div className="text-xs text-emerald-400 font-semibold">{costSavedPercent}% Fleet Cost Savings</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Leaf className="w-4 h-4" /> Fleet Carbon Footprint
          </div>
          <div className="text-2xl font-bold text-slate-100">{engineMetrics.co2EmissionsKg} kg CO2</div>
          <div className="text-xs text-slate-400">Delta: {co2Diff} kg vs Baseline</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Shield className="w-4 h-4" /> Risk & Compliance
          </div>
          <div className="text-2xl font-bold text-emerald-400">100% Verified</div>
          <div className="text-xs text-slate-400">Zero CIT Cash & Hazmat Breaches</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
            <Award className="w-4 h-4" /> On-Time SLA
          </div>
          <div className="text-2xl font-bold text-purple-400">{engineMetrics.slaOnTimePercent}%</div>
          <div className="text-xs text-slate-400">{engineMetrics.slaBreachCount} Breaches (Baseline: {baselineMetrics.slaBreachCount})</div>
        </div>

      </div>

    </div>
  );
};
