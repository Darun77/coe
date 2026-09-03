import { generateSyntheticOrders, CENTRAL_DEPOT, INITIAL_RIDERS } from './generator';
import type { FailureScenario } from '../types';

export const MOCK_ORDERS = generateSyntheticOrders(50, 42);

export { CENTRAL_DEPOT, INITIAL_RIDERS };

export const FAILURE_SCENARIOS: FailureScenario[] = [
  {
    id: 'SCENARIO_COD_OVERRUN',
    title: 'Failure Mode 1: COD Cash Cap Overrun',
    severity: 'High',
    description: 'Rider is assigned multiple high-value COD orders ($400, $350, $300) in the same geographic cluster, accumulating $1,350 total cash which exceeds the $1,000 policy/insurance ceiling.',
    baselineBehavior: 'Baseline heuristic packs orders strictly by distance, assigning $1,350 cash to Rider 1, breaching insurance limits and creating theft risk.',
    engineMitigation: 'Constraint-aware engine detects the $1,000 threshold, automatically capping the route at $950 and scheduling a mid-route vault drop stop or splitting to a second courier.',
    affectedOrderIds: ['ORD-0004', 'ORD-0012', 'ORD-0019', 'ORD-0027'],
  },
  {
    id: 'SCENARIO_HAZMAT_FOOD',
    title: 'Failure Mode 2: Incompatible Hazmat & Food Co-loading',
    severity: 'Critical',
    description: 'High-density residential neighborhood has 3 chemical solvent parcels (Hazmat) and 4 organic produce boxes (Food) destined for nearby addresses.',
    baselineBehavior: 'Baseline clusters by location alone, loading Hazmat chemicals and fresh food into the exact same cargo van compartment.',
    engineMitigation: 'Engine executes Product Incompatibility Partitioning, isolating Hazmat into a certified carrier route and placing Food into an insulated clean vehicle.',
    affectedOrderIds: ['ORD-0002', 'ORD-0008', 'ORD-0015', 'ORD-0031'],
  },
  {
    id: 'SCENARIO_RTO_LAG',
    title: 'Failure Mode 3: RTO Customer Readiness Window Lag',
    severity: 'Medium',
    description: 'Reverse pickup order ORD-0022 has customer return item packed and ready at 14:00 (minute 240).',
    baselineBehavior: 'Baseline routes courier to arrive at 11:30 AM (minute 90) to save mileage, resulting in a failed pickup attempt and wasted travel.',
    engineMitigation: 'Engine enforces arrival >= readyTime constraint, sequencing nearby forward deliveries first and arriving at 14:15 when customer is ready.',
    affectedOrderIds: ['ORD-0022', 'ORD-0035'],
  },
  {
    id: 'SCENARIO_FLEET_SHORTAGE',
    title: 'Failure Mode 4: 40% Fleet Shortage & SLA Window Crunch',
    severity: 'High',
    description: 'Two riders call in sick during peak delivery window, leaving 3 riders to cover 50 express orders with strict 2-hour SLA windows.',
    baselineBehavior: 'Baseline overloads remaining riders with 20+ stops each, resulting in 44% SLA delivery breaches.',
    engineMitigation: 'Engine prioritizes tight-window SLAs, optimizes sequence insertion, and flags non-feasible orders early for customer re-scheduling.',
    affectedOrderIds: ['ORD-0005', 'ORD-0011', 'ORD-0018', 'ORD-0029', 'ORD-0041'],
  },
];
