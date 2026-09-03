import React, { useState } from 'react';
import type { CalculatedRoute } from '../types';
import { Smartphone, DollarSign, RefreshCw, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';

interface RiderViewProps {
  routes: CalculatedRoute[];
}

export const RiderView: React.FC<RiderViewProps> = ({ routes }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(routes[0]?.id || '');
  const [completedStopIds, setCompletedStopIds] = useState<string[]>([]);
  const [rtoVerified, setRtoVerified] = useState<Record<string, boolean>>({});

  const activeRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const toggleStopComplete = (stopId: string) => {
    if (completedStopIds.includes(stopId)) {
      setCompletedStopIds(completedStopIds.filter((id) => id !== stopId));
    } else {
      setCompletedStopIds([...completedStopIds, stopId]);
    }
  };

  const toggleRtoVerify = (orderId: string) => {
    setRtoVerified({ ...rtoVerified, [orderId]: !rtoVerified[orderId] });
  };

  const currentCashCarried = activeRoute?.stops
    .filter((s) => completedStopIds.includes(s.order.id))
    .reduce((sum, s) => sum + s.order.codAmount, 0) || 0;

  const cashCapLimit = activeRoute?.rider.maxCodCash || 1000;
  const cashCapPercent = Math.min(100, (currentCashCarried / cashCapLimit) * 100);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100">Courier Mobile Task Interface</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> Driver App View
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simulates the last-mile courier experience: COD cash tracking, RTO verification, and turn-by-turn manifest.
          </p>
        </div>

        {/* Rider Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Active Courier:</span>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500"
          >
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.rider.name} ({r.stops.length} Stops)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Mobile App Frame Simulation */}
      <div className="flex justify-center">
        
        <div className="w-full max-w-sm bg-slate-950 rounded-[40px] border-4 border-slate-800 p-4 shadow-2xl space-y-4 text-slate-100">
          
          {/* Mobile Top Status Bar */}
          <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400 border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-300">09:41 AM</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-400 font-bold">LOGIX-COURIER</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          </div>

          {/* Courier Profile Bar */}
          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-100">{activeRoute?.rider.name}</div>
              <div className="text-[10px] text-slate-400">{activeRoute?.rider.vehicleType} • Manifest {activeRoute?.id}</div>
            </div>
            <div className="px-2.5 py-1 rounded-xl bg-blue-500/20 text-blue-400 font-bold text-xs">
              {completedStopIds.length} / {activeRoute?.stops.length} Done
            </div>
          </div>

          {/* COD Cash Carrying Gauge */}
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Cash Handled
              </span>
              <span className="font-bold text-amber-400">${currentCashCarried} / ${cashCapLimit}</span>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all ${
                  cashCapPercent >= 100
                    ? 'bg-red-500'
                    : cashCapPercent >= 80
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${cashCapPercent}%` }}
              ></div>
            </div>

            {cashCapPercent >= 80 && (
              <div className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                {cashCapPercent >= 100
                  ? 'CRITICAL: Vault drop stop required before next COD delivery!'
                  : 'Warning: 80% COD cash limit reached.'}
              </div>
            )}
          </div>

          {/* Stop List Checklist */}
          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Delivery Manifest</div>

            {activeRoute?.stops.map((stop) => {
              const isDone = completedStopIds.includes(stop.order.id);
              const isRtoVerified = rtoVerified[stop.order.id];

              return (
                <div
                  key={stop.order.id}
                  className={`p-3 rounded-2xl border transition-all space-y-2 text-xs ${
                    isDone
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStopComplete(stop.order.id)}
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-400 text-white'
                            : 'border-slate-600 hover:border-blue-400'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <div>
                        <span className="font-bold text-slate-100">{stop.order.id}</span>
                        <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
                          {stop.order.category}
                        </span>
                      </div>
                    </div>

                    {stop.order.codAmount > 0 && (
                      <span className="font-bold text-amber-400 text-xs">+${stop.order.codAmount}</span>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-400 pl-7">
                    {stop.order.customerName}
                    <div className="flex items-center gap-2 mt-0.5 text-slate-400">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Est: min {stop.estimatedArrivalMin}</span>
                      <span>(SLA: {stop.order.twStart}-{stop.order.twEnd}m)</span>
                    </div>
                  </div>

                  {/* RTO Special Verification Box */}
                  {stop.order.isRTO && !isDone && (
                    <div className="pl-7 pt-1">
                      <div className="bg-purple-950/40 border border-purple-800/40 p-2 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] text-purple-300 font-semibold flex items-center gap-1">
                          <RefreshCw className="w-3 h-3" /> RTO Return Inspection
                        </span>
                        <button
                          onClick={() => toggleRtoVerify(stop.order.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isRtoVerified
                              ? 'bg-emerald-500 text-white'
                              : 'bg-purple-600 text-white hover:bg-purple-500'
                          }`}
                        >
                          {isRtoVerified ? 'Item Verified ✓' : 'Verify Item'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};
