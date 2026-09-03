import { useState, useMemo } from 'react';
import type { ActiveTab, ParcelOrder } from './types';
import { MOCK_ORDERS, CENTRAL_DEPOT, INITIAL_RIDERS } from './data/mockData';
import { runBaselineAlgorithm } from './algorithms/baseline';
import { runConstraintAwareEngine } from './algorithms/constraintAwareEngine';
import { Navbar } from './components/Navbar';
import { DispatcherDashboard } from './components/DispatcherDashboard';
import { AlgorithmComparison } from './components/AlgorithmComparison';
import { FailureLab } from './components/FailureLab';
import { RiderView } from './components/RiderView';
import { ExecutiveAnalytics } from './components/ExecutiveAnalytics';
import { DocumentationViewer } from './components/DocumentationViewer';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dispatcher');
  const [activeSolver, setActiveSolver] = useState<'engine' | 'baseline'>('engine');
  const [orders] = useState<ParcelOrder[]>(MOCK_ORDERS);

  // Compute baseline and engine results
  const baselineResult = useMemo(
    () => runBaselineAlgorithm(CENTRAL_DEPOT, INITIAL_RIDERS, orders),
    [orders]
  );

  const engineResult = useMemo(
    () => runConstraintAwareEngine(CENTRAL_DEPOT, INITIAL_RIDERS, orders),
    [orders]
  );

  const currentRoutes = activeSolver === 'engine' ? engineResult.routes : baselineResult.routes;
  const activeEngineName = activeSolver === 'engine' ? 'Constraint-Aware Engine' : 'Naive Baseline Heuristic';

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        orderCount={orders.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {activeTab === 'dispatcher' && (
          <DispatcherDashboard
            depot={CENTRAL_DEPOT}
            riders={INITIAL_RIDERS}
            orders={orders}
            routes={currentRoutes}
            activeEngineName={activeEngineName}
            onRunEngine={() => setActiveSolver('engine')}
            onRunBaseline={() => setActiveSolver('baseline')}
          />
        )}

        {activeTab === 'comparison' && (
          <AlgorithmComparison
            baselineMetrics={baselineResult.metrics}
            engineMetrics={engineResult.metrics}
          />
        )}

        {activeTab === 'failure_lab' && (
          <FailureLab
            depot={CENTRAL_DEPOT}
            riders={INITIAL_RIDERS}
            orders={orders}
          />
        )}

        {activeTab === 'rider_view' && (
          <RiderView routes={engineResult.routes} />
        )}

        {activeTab === 'analytics' && (
          <ExecutiveAnalytics
            baselineMetrics={baselineResult.metrics}
            engineMetrics={engineResult.metrics}
          />
        )}

        {activeTab === 'documentation' && (
          <DocumentationViewer />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500">
        LOGIX-AI Parcel Logistics • Constraint-Aware COD & RTO Batching Engine • Engineered for Enterprise Fulfillment
      </footer>

    </div>
  );
}

export default App;
