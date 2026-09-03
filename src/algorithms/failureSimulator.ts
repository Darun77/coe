import type { Depot, ParcelOrder, Rider, CalculatedRoute, BatchMetrics } from '../types';
import { runBaselineAlgorithm } from './baseline';
import { runConstraintAwareEngine } from './constraintAwareEngine';

export function runFailureScenarioSimulation(
  scenarioId: string,
  depot: Depot,
  riders: Rider[],
  orders: ParcelOrder[]
): {
  scenarioName: string;
  baseline: { routes: CalculatedRoute[]; metrics: BatchMetrics };
  engine: { routes: CalculatedRoute[]; metrics: BatchMetrics };
  diagnosticLog: string[];
} {
  const modifiedOrders = JSON.parse(JSON.stringify(orders)) as ParcelOrder[];
  const modifiedRiders = JSON.parse(JSON.stringify(riders)) as Rider[];
  const log: string[] = [];

  switch (scenarioId) {
    case 'SCENARIO_COD_OVERRUN':
      log.push('Injected Scenario: High-value COD Cluster Spike ($1,350 total COD in single zone).');
      // Set high COD cash values for 4 close orders
      modifiedOrders[3].codAmount = 400;
      modifiedOrders[11].codAmount = 350;
      modifiedOrders[18].codAmount = 300;
      modifiedOrders[26].codAmount = 300;
      break;

    case 'SCENARIO_HAZMAT_FOOD':
      log.push('Injected Scenario: Co-located Hazmat solvents and Fresh Organic Produce.');
      // Force adjacent orders to be Hazmat and Food
      modifiedOrders[1].category = 'Hazmat';
      modifiedOrders[7].category = 'Food';
      modifiedOrders[14].category = 'Hazmat';
      modifiedOrders[30].category = 'Food';
      break;

    case 'SCENARIO_RTO_LAG':
      log.push('Injected Scenario: Delayed RTO Customer Item Readiness (Ready at Minute 240 / 14:00).');
      modifiedOrders[21].isRTO = true;
      modifiedOrders[21].rtoReadyTime = 240; // 14:00 PM
      modifiedOrders[34].isRTO = true;
      modifiedOrders[34].rtoReadyTime = 300; // 15:00 PM
      break;

    case 'SCENARIO_FLEET_SHORTAGE':
      log.push('Injected Scenario: Sudden 40% Fleet Reductions (2 Riders Sick).');
      modifiedRiders.splice(0, 2); // Remove 2 riders
      break;

    default:
      log.push('Standard Baseline vs Engine Comparison.');
      break;
  }

  const baseline = runBaselineAlgorithm(depot, modifiedRiders, modifiedOrders);
  const engine = runConstraintAwareEngine(depot, modifiedRiders, modifiedOrders);

  log.push(`Baseline Result: ${baseline.metrics.slaBreachCount} SLA breaches, ${baseline.metrics.cashBreachCount} COD breaches, ${baseline.metrics.incompatibilityErrors} Hazmat/Food co-loads.`);
  log.push(`Engine Result: ${engine.metrics.slaBreachCount} SLA breaches, ${engine.metrics.cashBreachCount} COD breaches, ${engine.metrics.incompatibilityErrors} Hazmat/Food co-loads.`);

  return {
    scenarioName: scenarioId,
    baseline,
    engine,
    diagnosticLog: log,
  };
}
