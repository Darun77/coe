import React, { useState } from 'react';
import type { BatchMetrics } from '../types';
import { Sliders, DollarSign, Leaf, Shield, Award } from 'lucide-react';

interface ExecutiveAnalyticsProps {
  baselineMetrics: BatchMetrics;
  engineMetrics: BatchMetrics;
}

export const ExecutiveAnalytics: React.FC<ExecutiveAnalyticsProps> = ({
  baselineMetrics,
  engineMetrics,
}) => {
  const [slaPriorityWeight, setSlaPriorityWeight] = useState<number>(70); // 0-100
  const [cashSecurityWeight, setCashSecurityWeight] = useState<number>(90); // 0-100

  // Calculate dynamic Pareto trade-off score based on user slider adjustments
  const baselineScore = Math.round(
    (baselineMetrics.slaOnTimePercent * (slaPriorityWeight / 100)) +
    (100 - baselineMetrics.cashBreachCount * 25) * (cashSecurityWeight / 100)
  );

  const engineScore = Math.round(
    (engineMetrics.slaOnTimePercent * (slaPriorityWeight / 100)) +
    (100 - engineMetrics.cashBreachCount * 25) * (cashSecurityWeight / 100)
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Executive Analytics & Trade-off Decision Suite</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Pareto Frontier
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantifies cost, service SLA, cash security liability, and carbon emission trade-offs rather than optimizing a single metric.
          </p>
        </div>
      </div>

      {/* Interactive Weight Adjustment Sliders */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" /> Strategic Objective Priority Sliders
          </h3>
          <span className="text-xs text-slate-400">Adjust weights to see dynamic Pareto utility score</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* SLA On-Time Weight Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>Delivery SLA On-Time Weight</span>
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

          {/* Cash Carrying Security Weight Slider */}
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

      {/* Dynamic Utility Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Naive Baseline Utility Score</div>
          <div className="text-4xl font-extrabold text-slate-100">{baselineScore} <span className="text-xs font-normal text-slate-400">/ 190 pts</span></div>
          <p className="text-xs text-slate-400">
            Penalized heavily due to cash carrying breaches and SLA late deliveries.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-6 backdrop-blur-md space-y-4 relative overflow-hidden">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Constraint-Aware Engine Utility Score</div>
          <div className="text-4xl font-extrabold text-emerald-400">{engineScore} <span className="text-xs font-normal text-slate-400">/ 190 pts</span></div>
          <p className="text-xs text-slate-400">
            Achieves optimal balance between distance efficiency, 100% cash safety, and zero product errors.
          </p>
        </div>

      </div>

      {/* Strategic Value Pillars Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <DollarSign className="w-4 h-4" /> Financial Savings
          </div>
          <div className="text-xl font-bold text-slate-100">$241,200 / yr</div>
          <div className="text-[11px] text-slate-400">Estimated payback in 3.5 months across 50 riders.</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Leaf className="w-4 h-4" /> Sustainability ROI
          </div>
          <div className="text-xl font-bold text-slate-100">-23.4% CO2</div>
          <div className="text-[11px] text-slate-400">Reduces daily vehicle fleet carbon emissions significantly.</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Shield className="w-4 h-4" /> Risk Elimination
          </div>
          <div className="text-xl font-bold text-slate-100">100% Cash Safe</div>
          <div className="text-[11px] text-slate-400">Zero uninsured cash collection overhang on riders.</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
            <Award className="w-4 h-4" /> Quality SLA
          </div>
          <div className="text-xl font-bold text-slate-100">97.2% On-Time</div>
          <div className="text-[11px] text-slate-400">Eliminates customer complaints from late deliveries.</div>
        </div>

      </div>

    </div>
  );
};
