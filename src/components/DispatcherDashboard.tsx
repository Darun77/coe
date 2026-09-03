import React, { useState } from 'react';
import type { Depot, CalculatedRoute, ParcelOrder, Rider } from '../types';
import { MapView } from './MapView';
import { 
  Truck, DollarSign, Clock, ShieldAlert, RefreshCw, Layers, CheckCircle2, AlertTriangle, ArrowRight, Play
} from 'lucide-react';

interface DispatcherDashboardProps {
  depot: Depot;
  riders: Rider[];
  orders: ParcelOrder[];
  routes: CalculatedRoute[];
  activeEngineName: string;
  onRunEngine: () => void;
  onRunBaseline: () => void;
}

export const DispatcherDashboard: React.FC<DispatcherDashboardProps> = ({
  depot,
  orders,
  routes,
  activeEngineName,
  onRunEngine,
  onRunBaseline,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | undefined>(routes[0]?.id);

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];

  const totalDistance = routes.reduce((sum, r) => sum + r.totalDistanceKm, 0);
  const totalCashCollected = routes.reduce((sum, r) => sum + r.totalCodCash, 0);
  const totalSlaBreaches = routes.reduce((sum, r) => sum + r.slaBreachCount, 0);
  const totalCashBreaches = routes.reduce((sum, r) => (r.hasCashBreach ? sum + 1 : sum), 0);
  const totalIncompErrors = routes.reduce((sum, r) => (r.hasIncompatibilityViolation ? sum + 1 : sum), 0);

  const slaOnTimeRate = (100 * (1 - totalSlaBreaches / Math.max(1, orders.length))).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Mode Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100">Dispatcher Control Center</h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              activeEngineName.includes('Constraint')
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              Active Solver: {activeEngineName}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time batching, cash limit tracking, and product isolation manifest manager.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRunBaseline}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
              activeEngineName.includes('Baseline')
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            Naive Baseline (Greedy)
          </button>

          <button
            onClick={onRunEngine}
            className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
              activeEngineName.includes('Constraint')
                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            Constraint-Aware Engine
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Fleet Distance</span>
            <Truck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">{totalDistance.toFixed(1)} km</div>
          <div className="text-[11px] text-slate-400 mt-1">Across {routes.length} active routes</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>On-Time SLA Delivery</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{slaOnTimeRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">{totalSlaBreaches} late SLA breaches</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>COD Cash Collected</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">${totalCashCollected.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalCashBreaches > 0 ? (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {totalCashBreaches} Cash Cap Breaches
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> All routes under $1k cap
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Product Isolation</span>
            <ShieldAlert className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2">
            {totalIncompErrors > 0 ? (
              <span className="text-red-400">{totalIncompErrors} Errors</span>
            ) : (
              <span className="text-emerald-400">100% Isolated</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Hazmat / Food separation</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>RTO Reverse Pickups</span>
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-2">
            {orders.filter((o) => o.isRTO).length} Parcels
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Readiness time synchronized</div>
        </div>

      </div>

      {/* Main Content Layout: Map + Route Manifest */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
        
        {/* Left Column: Interactive Canvas Map (7 cols) */}
        <div className="lg:col-span-7 h-full">
          <MapView
            depot={depot}
            routes={routes}
            orders={orders}
            selectedRouteId={selectedRouteId}
            onSelectRoute={(id) => setSelectedRouteId(id)}
          />
        </div>

        {/* Right Column: Route Selector & Manifest Details (5 cols) */}
        <div className="lg:col-span-5 h-full bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between overflow-hidden">
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            
            {/* Route Selector Header */}
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2">Active Rider Manifests</h3>
              <div className="grid grid-cols-1 gap-2">
                {routes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRouteId(r.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedRouteId === r.id
                        ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-lg'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }}></span>
                        <span className="font-bold text-xs text-slate-100">{r.rider.name}</span>
                        {r.hasCashBreach && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            CASH CAP BREACH
                          </span>
                        )}
                        {r.hasIncompatibilityViolation && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            HAZMAT ERROR
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{r.stops.length} Stops</span>
                        <span>•</span>
                        <span>{r.totalDistanceKm} km</span>
                        <span>•</span>
                        <span>COD: ${r.totalCodCash}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Route Stop Timeline */}
            {selectedRoute && (
              <div className="border-t border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Stop Sequence for {selectedRoute.rider.name}
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Cap: ${selectedRoute.totalCodCash} / ${selectedRoute.rider.maxCodCash}
                  </span>
                </div>

                {/* COD Cash Capacity Bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all ${
                      selectedRoute.hasCashBreach
                        ? 'bg-red-500'
                        : selectedRoute.totalCodCash > 800
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{
                      width: `${Math.min(100, (selectedRoute.totalCodCash / selectedRoute.rider.maxCodCash) * 100)}%`,
                    }}
                  ></div>
                </div>

                {/* Stop Items Timeline */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {selectedRoute.stops.map((stop) => (
                    <div
                      key={stop.order.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                        stop.isSlaBreach
                          ? 'bg-red-950/30 border-red-800/50 text-slate-200'
                          : stop.hasIncompatibilityError
                          ? 'bg-purple-950/30 border-purple-800/50 text-slate-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center text-[10px]">
                          {stop.stopSequence}
                        </span>
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            <span>{stop.order.id}</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400">
                              {stop.order.category}
                            </span>
                            {stop.order.isRTO && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-500/20 text-purple-400 font-semibold">
                                RTO
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Arrival: min {stop.estimatedArrivalMin} (SLA window: {stop.order.twStart}-{stop.order.twEnd}m)
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {stop.order.codAmount > 0 && (
                          <div className="font-bold text-amber-400 text-xs">+${stop.order.codAmount}</div>
                        )}
                        <div className="text-[10px] text-slate-500">Run: ${stop.accumulatedCash}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
