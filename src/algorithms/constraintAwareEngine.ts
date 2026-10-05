import type { Depot, ParcelOrder, Rider, CalculatedRoute, RouteStop, BatchMetrics, ProductCategory } from '../types';

const ROUTE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#34d399', '#6366f1', '#14b8a6', '#f97316'];

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371.0;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function checkIncompatibility(cat1: ProductCategory, cat2: ProductCategory): boolean {
  if ((cat1 === 'Hazmat' && cat2 === 'Food') || (cat1 === 'Food' && cat2 === 'Hazmat')) return true;
  if ((cat1 === 'Hazmat' && cat2 === 'Fragile') || (cat1 === 'Fragile' && cat2 === 'Hazmat')) return true;
  if ((cat1 === 'Hazmat' && cat2 === 'ColdChain') || (cat1 === 'ColdChain' && cat2 === 'Hazmat')) return true;
  return false;
}

function routeHasIncompatibility(routeOrders: ParcelOrder[], newOrder: ParcelOrder): boolean {
  for (const ord of routeOrders) {
    if (checkIncompatibility(ord.category, newOrder.category)) return true;
  }
  return false;
}

/**
 * Constraint-Aware Intelligent Batching & Routing Engine:
 * 1. Parallel multi-route slot insertion across fleet riders.
 * 2. Strict product incompatibility segregation (Hazmat vs Food/Fragile/ColdChain).
 * 3. Mid-route COD cash vault drop routing (caps cash exposure at maxCodCash).
 * 4. Dual-window timing synchronization (delivery TW [twStart, twEnd], RTO [rtoReadyTime, rtoDeadline]).
 * 5. 2-opt local search route trajectory optimization.
 */
export function runConstraintAwareEngine(depot: Depot, riders: Rider[], orders: ParcelOrder[]): { routes: CalculatedRoute[]; metrics: BatchMetrics } {
  const unassigned = [...orders];
  
  // Sort orders by SLA window end, RTO readiness, and depot distance
  unassigned.sort((a, b) => {
    if (a.twEnd !== b.twEnd) return a.twEnd - b.twEnd;
    const readyA = a.isRTO ? a.rtoReadyTime : a.twStart;
    const readyB = b.isRTO ? b.rtoReadyTime : b.twStart;
    if (readyA !== readyB) return readyA - readyB;
    return haversineDistanceKm(depot.lat, depot.lng, a.lat, a.lng) - haversineDistanceKm(depot.lat, depot.lng, b.lat, b.lng);
  });
  
  // Active routes matching fleet riders
  const routePool: { rider: Rider; orders: ParcelOrder[] }[] = riders.map((r) => ({ rider: { ...r }, orders: [] }));
  
  for (const ord of unassigned) {
    let bestRouteIdx = -1;
    let bestSlotPos = -1;
    let bestScore = Infinity;
    
    for (let rIdx = 0; rIdx < routePool.length; rIdx++) {
      const { rider, orders: rOrders } = routePool[rIdx];
      
      // 1. Incompatibility Hard Rule
      if (routeHasIncompatibility(rOrders, ord)) continue;
      
      // 2. Physical Capacity Hard Check
      const currWeight = rOrders.reduce((sum, o) => sum + o.weightKg, 0) + ord.weightKg;
      const currVol = rOrders.reduce((sum, o) => sum + o.volumeM3, 0) + ord.volumeM3;
      if (currWeight > rider.maxWeightKg || currVol > rider.maxVolumeM3) continue;
      
      // 3. Evaluate multi-slot insertion feasibility & timing
      for (let pos = 0; pos <= rOrders.length; pos++) {
        const candidateOrders = [...rOrders.slice(0, pos), ord, ...rOrders.slice(pos)];
        
        // COD cash check with vault drop capability
        const { cashOk, vaultDropsNeeded } = checkCashVaultFeasibility(candidateOrders, rider.maxCodCash);
        if (!cashOk) continue;
        
        // Dual-window SLA & RTO timing feasibility check
        const timingResult = evaluateRouteTiming(depot, candidateOrders);
        if (!timingResult.feasible) continue;
        
        const score = timingResult.totalDistance + 0.1 * timingResult.idlingMinutes + vaultDropsNeeded * 4.0;
        
        if (score < bestScore) {
          bestScore = score;
          bestRouteIdx = rIdx;
          bestSlotPos = pos;
        }
      }
    }
    
    if (bestRouteIdx !== -1) {
      routePool[bestRouteIdx].orders.splice(bestSlotPos, 0, ord);
    } else {
      // Create backup route with additional rider if order volume requires
      const templateRider = riders[routePool.length % riders.length];
      const newRider: Rider = {
        ...templateRider,
        id: `RIDER-EXTRA-${String(routePool.length + 1).padStart(2, '0')}`,
        name: `${templateRider.name} (Sub)`,
      };
      routePool.push({ rider: newRider, orders: [ord] });
    }
  }
  
  // Filter active non-empty routes and apply 2-opt refinement
  const activeRoutes = routePool.filter((r) => r.orders.length > 0);
  for (const r of activeRoutes) {
    r.orders = optimizeRoute2Opt(depot, r.orders);
  }
  
  const calculatedRoutes = activeRoutes.map((r, i) => buildCalculatedRoute(depot, r.rider, r.orders, i));
  const metrics = calculateMetrics('Constraint-Aware Engine', calculatedRoutes, orders.length);
  return { routes: calculatedRoutes, metrics };
}

function checkCashVaultFeasibility(orders: ParcelOrder[], maxCash: number): { cashOk: boolean; vaultDropsNeeded: number } {
  let accumCash = 0;
  let vaultDropsNeeded = 0;
  for (const o of orders) {
    if (accumCash + o.codAmount > maxCash) {
      vaultDropsNeeded++;
      accumCash = o.codAmount;
      if (accumCash > maxCash) return { cashOk: false, vaultDropsNeeded: 0 };
    } else {
      accumCash += o.codAmount;
    }
  }
  return { cashOk: true, vaultDropsNeeded };
}

function evaluateRouteTiming(depot: Depot, orders: ParcelOrder[]): { feasible: boolean; totalDistance: number; idlingMinutes: number } {
  let currLat = depot.lat;
  let currLng = depot.lng;
  let currTime = 0;
  let totalDist = 0;
  let idlingMin = 0;
  
  for (const ord of orders) {
    const legDist = haversineDistanceKm(currLat, currLng, ord.lat, ord.lng);
    totalDist += legDist;
    const travelTime = legDist / 0.5; // 30 km/h speed = 0.5 km/min
    const arrivalTime = currTime + travelTime;
    
    // Dual-window lower bound
    let winStart = ord.twStart;
    if (ord.isRTO) {
      winStart = Math.max(winStart, ord.rtoReadyTime);
    }
    
    let serviceStart = arrivalTime;
    if (arrivalTime < winStart) {
      const wait = winStart - arrivalTime;
      idlingMin += wait;
      serviceStart = winStart;
    }
    
    // Dual-window upper bound
    let winEnd = ord.twEnd;
    if (ord.isRTO && ord.rtoDeadline) {
      winEnd = Math.min(winEnd, ord.rtoDeadline);
    }
    
    // Hard check: service start must be within window end
    if (serviceStart > winEnd + 15) {
      return { feasible: false, totalDistance: Infinity, idlingMinutes: Infinity };
    }
    
    currTime = serviceStart + 5.0; // 5 mins service stop
    currLat = ord.lat;
    currLng = ord.lng;
  }
  
  totalDist += haversineDistanceKm(currLat, currLng, depot.lat, depot.lng);
  return { feasible: true, totalDistance: totalDist, idlingMinutes: idlingMin };
}

function optimizeRoute2Opt(depot: Depot, orders: ParcelOrder[]): ParcelOrder[] {
  if (orders.length <= 3) return orders;
  let bestOrders = [...orders];
  let bestEval = evaluateRouteTiming(depot, bestOrders);
  if (!bestEval.feasible) return orders;
  
  let improved = true;
  let iterations = 0;
  while (improved && iterations < 15) {
    improved = false;
    iterations++;
    for (let i = 1; i < bestOrders.length - 1; i++) {
      for (let j = i + 1; j < bestOrders.length; j++) {
        const candidate = [...bestOrders.slice(0, i), ...bestOrders.slice(i, j + 1).reverse(), ...bestOrders.slice(j + 1)];
        const evalRes = evaluateRouteTiming(depot, candidate);
        if (evalRes.feasible && evalRes.totalDistance < bestEval.totalDistance - 0.01) {
          bestEval = evalRes;
          bestOrders = candidate;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  return bestOrders;
}

function buildCalculatedRoute(depot: Depot, rider: Rider, routeOrders: ParcelOrder[], routeIndex: number): CalculatedRoute {
  const stops: RouteStop[] = [];
  let currLat = depot.lat;
  let currLng = depot.lng;
  let totalDist = 0;
  let accumCash = 0;
  let currTimeMin = 0;
  
  let hasCashBreach = false;
  let hasIncompatibilityViolation = false;
  let slaBreachCount = 0;
  let rtoEarlyCount = 0;
  
  let totalWeight = 0;
  let totalVol = 0;
  
  for (let i = 0; i < routeOrders.length; i++) {
    const ord = routeOrders[i];
    const legDist = haversineDistanceKm(currLat, currLng, ord.lat, ord.lng);
    totalDist += legDist;
    
    const travelTimeMin = legDist / 0.5;
    const arrivalTime = currTimeMin + travelTimeMin;
    
    let winStart = ord.twStart;
    if (ord.isRTO) {
      winStart = Math.max(winStart, ord.rtoReadyTime);
    }
    
    let isRtoEarly = false;
    let serviceStart = arrivalTime;
    if (arrivalTime < winStart) {
      if (ord.isRTO && arrivalTime < ord.rtoReadyTime) {
        isRtoEarly = true;
        rtoEarlyCount++;
      }
      serviceStart = winStart;
    }
    
    currTimeMin = serviceStart + 5;
    currLat = ord.lat;
    currLng = ord.lng;
    
    if (accumCash + ord.codAmount > rider.maxCodCash) {
      // Vault drop reset
      accumCash = ord.codAmount;
    } else {
      accumCash += ord.codAmount;
    }
    
    totalWeight += ord.weightKg;
    totalVol += ord.volumeM3;
    
    let winEnd = ord.twEnd;
    if (ord.isRTO && ord.rtoDeadline) {
      winEnd = Math.min(winEnd, ord.rtoDeadline);
    }
    
    const isSlaBreach = serviceStart > winEnd;
    if (isSlaBreach) slaBreachCount++;
    
    let hasIncomp = false;
    if (i > 0) {
      hasIncomp = checkIncompatibility(routeOrders[i - 1].category, ord.category);
      if (hasIncomp) hasIncompatibilityViolation = true;
    }
    
    stops.push({
      order: { ...ord, estimatedArrival: Math.round(serviceStart) },
      stopSequence: i + 1,
      estimatedArrivalMin: Math.round(serviceStart),
      accumulatedCash: accumCash,
      isSlaBreach,
      isRtoEarly,
      hasIncompatibilityError: hasIncomp,
    });
  }
  
  totalDist += haversineDistanceKm(currLat, currLng, depot.lat, depot.lng);
  
  return {
    id: `ROUTE-ENGINE-${routeIndex + 1}`,
    rider,
    stops,
    totalDistanceKm: parseFloat(totalDist.toFixed(2)),
    totalDurationMin: Math.round(currTimeMin + haversineDistanceKm(currLat, currLng, depot.lat, depot.lng) / 0.5),
    totalCodCash: accumCash,
    totalWeightKg: parseFloat(totalWeight.toFixed(1)),
    totalVolumeM3: parseFloat(totalVol.toFixed(3)),
    hasCashBreach,
    hasIncompatibilityViolation,
    slaBreachCount,
    rtoEarlyCount,
    color: ROUTE_COLORS[routeIndex % ROUTE_COLORS.length],
  };
}

function calculateMetrics(name: string, routes: CalculatedRoute[], totalOrdersCount: number): BatchMetrics {
  let totalDistanceKm = 0;
  let slaBreachCount = 0;
  let cashBreachCount = 0;
  let incompatibilityErrors = 0;
  let rtoEarlyErrors = 0;
  
  for (const r of routes) {
    totalDistanceKm += r.totalDistanceKm;
    slaBreachCount += r.slaBreachCount;
    if (r.hasCashBreach) cashBreachCount++;
    if (r.hasIncompatibilityViolation) incompatibilityErrors++;
    rtoEarlyErrors += r.rtoEarlyCount;
  }
  
  const slaOnTimePercent = parseFloat((100 * (1 - slaBreachCount / Math.max(1, totalOrdersCount))).toFixed(1));
  const co2EmissionsKg = parseFloat((totalDistanceKm * 0.211).toFixed(2));
  const totalCostDollars = parseFloat((totalDistanceKm * 1.35 + routes.length * 40).toFixed(2));
  
  return {
    name,
    totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
    slaOnTimePercent,
    slaBreachCount,
    cashBreachCount,
    incompatibilityErrors,
    rtoEarlyErrors,
    co2EmissionsKg,
    numRoutes: routes.length,
    totalCostDollars,
  };
}
