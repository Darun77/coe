import React, { useState } from 'react';
import type { Depot, Rider, ParcelOrder } from '../types';
import { FAILURE_SCENARIOS } from '../data/mockData';
import { runFailureScenarioSimulation } from '../algorithms/failureSimulator';
import { AlertTriangle, ShieldCheck, XCircle, Info } from 'lucide-react';

interface FailureLabProps {
  depot: Depot;
  riders: Rider[];
  orders: ParcelOrder[];
}

export const FailureLab: React.FC<FailureLabProps> = ({ depot, riders, orders }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(FAILURE_SCENARIOS[0].id);

  const selectedScenario = FAILURE_SCENARIOS.find((s) => s.id === selectedScenarioId) || FAILURE_SCENARIOS[0];

  const simulationResult = runFailureScenarioSimulation(selectedScenarioId, depot, riders, orders);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Operational Failure Mode & Stress Test Lab</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Stress Test Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulate realistic edge cases and test how naive heuristics break compared to constraint-aware engine mitigations.
          </p>
        </div>
      </div>

      {/* Scenario Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FAILURE_SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => setSelectedScenarioId(sc.id)}
            className={`p-4 rounded-2xl border text-left transition-all space-y-2 flex flex-col justify-between ${
              selectedScenarioId === sc.id
                ? 'bg-amber-500/10 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  sc.severity === 'Critical'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {sc.severity} Severity
                </span>
                {selectedScenarioId === sc.id && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                )}
              </div>
              <h3 className="font-bold text-xs text-slate-100 mt-2">{sc.title}</h3>
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-2">{sc.description}</div>
          </button>
        ))}
      </div>

      {/* Selected Scenario Breakdown Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-6 shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100">{selectedScenario.title}</h3>
          <p className="text-xs text-slate-400 mt-1">{selectedScenario.description}</p>
        </div>

        {/* Side-by-Side Failure vs Mitigation Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Baseline Failure Box */}
          <div className="bg-slate-950/60 border border-red-500/40 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4" /> Baseline Heuristic Outcome
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 font-semibold">
                FAILED
              </span>
            </div>
            <p className="text-xs text-slate-300">{selectedScenario.baselineBehavior}</p>
            <div className="bg-red-950/40 border border-red-800/40 p-3 rounded-lg text-xs text-red-300 font-mono">
              <div>SLA Breaches: {simulationResult.baseline.metrics.slaBreachCount}</div>
              <div>Cash Violations: {simulationResult.baseline.metrics.cashBreachCount}</div>
              <div>Product Incompatibilities: {simulationResult.baseline.metrics.incompatibilityErrors}</div>
            </div>
          </div>

          {/* Engine Mitigation Box */}
          <div className="bg-slate-950/60 border border-emerald-500/40 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Constraint-Aware Engine Mitigation
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold">
                PASSED
              </span>
            </div>
            <p className="text-xs text-slate-300">{selectedScenario.engineMitigation}</p>
            <div className="bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-lg text-xs text-emerald-300 font-mono">
              <div>SLA Breaches: {simulationResult.engine.metrics.slaBreachCount}</div>
              <div>Cash Violations: {simulationResult.engine.metrics.cashBreachCount} (Capped & Routed)</div>
              <div>Product Incompatibilities: {simulationResult.engine.metrics.incompatibilityErrors} (100% Isolated)</div>
            </div>
          </div>

        </div>

        {/* Real-time Diagnostic Log */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
            <Info className="w-3.5 h-3.5 text-blue-400" /> Live Simulation Diagnostic Trace
          </div>
          <div className="font-mono text-xs text-slate-400 space-y-1">
            {simulationResult.diagnosticLog.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-slate-600">&gt;</span>
                <span className="text-slate-300">{line}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
