import type { Depot, ParcelOrder, Rider, CalculatedRoute, RouteStop, BatchMetrics, ProductCategory } from '../types';

const ROUTE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#34d399'];

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
 * 1. Partitions orders by incompatibility groups (Hazmat, Food/Cold, General).
 * 2. Enforces COD Cash Cap ($1,000 max) as a hard constraint per route.
 * 3. Synchronizes RTO readiness windows (arrives when customer is ready).
 * 4. Optimizes time-window insertion to maximize SLA compliance while minimizing total mileage.
 */
export function runConstraintAwareEngine(depot: Depot, riders: Rider[], orders: ParcelOrder[]): { routes: CalculatedRoute[]; metrics: BatchMetrics } {
  const unassigned = [...orders];
  
  // Sort orders by SLA end time and location urgency
  unassigned.sort((a, b) => {
    if (a.twEnd !== b.twEnd) return a.twEnd - b.twEnd;
    const distA = haversineDistanceKm(depot.lat, depot.lng, a.lat, a.lng);
    const distB = haversineDistanceKm(depot.lat, depot.lng, b.lat, b.lng);
    return distA - distB;
  });
  
  const routes: CalculatedRoute[] = [];
  let riderIndex = 0;
  
  while (unassigned.length > 0) {
    const rider = riders[riderIndex % riders.length];
    riderIndex++;
    
    let currLat = depot.lat;
    let currLng = depot.lng;
    let currWeight = 0;
    let currVolume = 0;
    let currCash = 0;
    let currTimeMin = 0;
    
    const routeOrders: ParcelOrder[] = [];
    
    while (unassigned.length > 0) {
      let bestIdx = -1;
      let bestScore = Infinity;
      
      for (let i = 0; i < unassigned.length; i++) {
        const ord = unassigned[i];
        
        // 1. Strict Product Incompatibility Hard Rule
        if (routeHasIncompatibility(routeOrders, ord)) continue;
        
        // 2. Physical & COD Cash Hard Caps
        if (currWeight + ord.weightKg > rider.maxWeightKg) continue;
        if (currVolume + ord.volumeM3 > rider.maxVolumeM3) continue;
        if (currCash + ord.codAmount > rider.maxCodCash) continue;
        
        // 3. Travel Distance & Arrival Calculation
        const dist = haversineDistanceKm(currLat, currLng, ord.lat, ord.lng);
        const travelTime = dist / 0.5; // 30 km/h avg speed
        const arrivalTime = currTimeMin + travelTime;
        
        // SLA & RTO penalties for soft scoring
        const slaLatePenalty = Math.max(0, arrivalTime - ord.twEnd) * 10;
        const rtoWaitPenalty = ord.isRTO && arrivalTime < ord.rtoReadyTime ? (ord.rtoReadyTime - arrivalTime) * 2 : 0;
        
        const score = dist + slaLatePenalty + rtoWaitPenalty;
        
        if (score < bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      }
      
      if (bestIdx === -1) break;
      
      const selected = unassigned.splice(bestIdx, 1)[0];
      const dist = haversineDistanceKm(currLat, currLng, selected.lat, selected.lng);
      
      routeOrders.push(selected);
      currWeight += selected.weightKg;
      currVolume += selected.volumeM3;
      currCash += selected.codAmount;
      
      const travelTime = dist / 0.5;
      const arrivalTime = currTimeMin + travelTime;
      
      // If RTO item is not yet ready, courier waits or adjusts time
      if (selected.isRTO && arrivalTime < selected.rtoReadyTime) {
        currTimeMin = selected.rtoReadyTime + 5;
      } else {
        currTimeMin = arrivalTime + 5;
      }
      
      currLat = selected.lat;
      currLng = selected.lng;
    }
    
    if (routeOrders.length > 0) {
      routes.push(buildCalculatedRoute(depot, rider, routeOrders, routes.length));
    }
  }
  
  const metrics = calculateMetrics('Constraint-Aware Engine', routes, orders.length);
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
    
    const travelTimeMin = legDist / 0.5;
    let arrivalTime = currTimeMin + travelTimeMin;
    
    let isRtoEarly = false;
    if (ord.isRTO && arrivalTime < ord.rtoReadyTime) {
      isRtoEarly = true;
      rtoEarlyCount++;
      // Courier waits until ready time
      arrivalTime = ord.rtoReadyTime;
    }
    
    currTimeMin = arrivalTime + 5;
    currLat = ord.lat;
    currLng = ord.lng;
    accumCash += ord.codAmount;
    totalWeight += ord.weightKg;
    totalVol += ord.volumeM3;
    
    const isSlaBreach = arrivalTime > ord.twEnd;
    if (isSlaBreach) slaBreachCount++;
    
    let hasIncomp = false;
    if (i > 0) {
      hasIncomp = checkIncompatibility(routeOrders[i - 1].category, ord.category);
      if (hasIncomp) hasIncompatibilityViolation = true;
    }
    
    if (accumCash > rider.maxCodCash) {
      hasCashBreach = true;
    }
    
    stops.push({
      order: { ...ord, estimatedArrival: Math.round(arrivalTime) },
      stopSequence: i + 1,
      estimatedArrivalMin: Math.round(arrivalTime),
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
  const totalCostDollars = parseFloat((totalDistanceKm * 1.30 + routes.length * 40).toFixed(2));
  
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
