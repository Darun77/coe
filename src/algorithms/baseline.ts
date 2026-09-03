import type { Depot, ParcelOrder, Rider, CalculatedRoute, RouteStop, BatchMetrics, ProductCategory } from '../types';

const ROUTE_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#14b8a6'];

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

/**
 * Naive Baseline Solver:
 * Clusters parcels purely based on nearest neighbor geographical proximity and physical weight/volume limits.
 * Intentionally IGNORES product incompatibilities, COD cash accumulation caps, SLA delivery time windows, and RTO readiness windows.
 */
export function runBaselineAlgorithm(depot: Depot, riders: Rider[], orders: ParcelOrder[]): { routes: CalculatedRoute[]; metrics: BatchMetrics } {
  const unassigned = [...orders];
  const routes: CalculatedRoute[] = [];
  
  let riderIndex = 0;
  
  while (unassigned.length > 0) {
    const rider = riders[riderIndex % riders.length];
    riderIndex++;
    
    let currLat = depot.lat;
    let currLng = depot.lng;
    let currWeight = 0;
    let currVolume = 0;
    
    const routeOrders: ParcelOrder[] = [];
    
    while (unassigned.length > 0) {
      let nearestIdx = -1;
      let nearestDist = Infinity;
      
      for (let i = 0; i < unassigned.length; i++) {
        const ord = unassigned[i];
        if (currWeight + ord.weightKg <= rider.maxWeightKg && currVolume + ord.volumeM3 <= rider.maxVolumeM3) {
          const d = haversineDistanceKm(currLat, currLng, ord.lat, ord.lng);
          if (d < nearestDist) {
            nearestDist = d;
            nearestIdx = i;
          }
        }
      }
      
      if (nearestIdx === -1) break;
      
      const selected = unassigned.splice(nearestIdx, 1)[0];
      routeOrders.push(selected);
      currWeight += selected.weightKg;
      currVolume += selected.volumeM3;
      currLat = selected.lat;
      currLng = selected.lng;
    }
    
    if (routeOrders.length > 0) {
      routes.push(buildCalculatedRoute(depot, rider, routeOrders, routes.length));
    }
  }
  
  const metrics = calculateMetrics('Naive Distance Baseline', routes, orders.length);
  return { routes, metrics };
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
    
    const travelTimeMin = legDist / 0.5; // 30 km/h avg speed
    currTimeMin += travelTimeMin + 5; // 5 min service stop
    
    currLat = ord.lat;
    currLng = ord.lng;
    accumCash += ord.codAmount;
    totalWeight += ord.weightKg;
    totalVol += ord.volumeM3;
    
    const isSlaBreach = currTimeMin > ord.twEnd;
    if (isSlaBreach) slaBreachCount++;
    
    const isRtoEarly = ord.isRTO && currTimeMin < ord.rtoReadyTime;
    if (isRtoEarly) rtoEarlyCount++;
    
    let hasIncomp = false;
    if (i > 0) {
      hasIncomp = checkIncompatibility(routeOrders[i - 1].category, ord.category);
      if (hasIncomp) hasIncompatibilityViolation = true;
    }
    
    if (accumCash > rider.maxCodCash) {
      hasCashBreach = true;
    }
    
    stops.push({
      order: { ...ord, estimatedArrival: Math.round(currTimeMin) },
      stopSequence: i + 1,
      estimatedArrivalMin: Math.round(currTimeMin),
      accumulatedCash: accumCash,
      isSlaBreach,
      isRtoEarly,
      hasIncompatibilityError: hasIncomp,
    });
  }
  
  totalDist += haversineDistanceKm(currLat, currLng, depot.lat, depot.lng);
  
  return {
    id: `ROUTE-BASE-${routeIndex + 1}`,
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
  const totalCostDollars = parseFloat((totalDistanceKm * 1.45 + routes.length * 45).toFixed(2));
  
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
