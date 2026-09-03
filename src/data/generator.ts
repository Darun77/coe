import type { Depot, ParcelOrder, Rider, ProductCategory } from '../types';

export const CENTRAL_DEPOT: Depot = {
  lat: 12.9716,
  lng: 77.5946,
  name: 'Central Parcel Logistics Hub',
};

export const INITIAL_RIDERS: Rider[] = [
  { id: 'RIDER-01', name: 'Rider Alpha (EV Van)', vehicleType: 'EVVan', maxWeightKg: 250, maxVolumeM3: 2.2, maxCodCash: 1000, currentCash: 0, currentWeight: 0, currentVolume: 0, status: 'Available' },
  { id: 'RIDER-02', name: 'Rider Bravo (EV Van)', vehicleType: 'EVVan', maxWeightKg: 250, maxVolumeM3: 2.2, maxCodCash: 1000, currentCash: 0, currentWeight: 0, currentVolume: 0, status: 'Available' },
  { id: 'RIDER-03', name: 'Rider Charlie (Hazmat Van)', vehicleType: 'DieselVan', maxWeightKg: 350, maxVolumeM3: 3.0, maxCodCash: 1000, currentCash: 0, currentWeight: 0, currentVolume: 0, status: 'Available' },
  { id: 'RIDER-04', name: 'Rider Delta (Cold Van)', vehicleType: 'EVVan', maxWeightKg: 200, maxVolumeM3: 1.8, maxCodCash: 1000, currentCash: 0, currentWeight: 0, currentVolume: 0, status: 'Available' },
  { id: 'RIDER-05', name: 'Rider Echo (Cargo Bike)', vehicleType: 'CargoBike', maxWeightKg: 75, maxVolumeM3: 0.7, maxCodCash: 500, currentCash: 0, currentWeight: 0, currentVolume: 0, status: 'Available' },
];

export function generateSyntheticOrders(count: number = 60, seed: number = 42): ParcelOrder[] {
  const categories: ProductCategory[] = ['Standard', 'Hazmat', 'Food', 'Fragile', 'ColdChain'];
  const categoryWeights = [0.45, 0.15, 0.15, 0.15, 0.10];
  
  const orders: ParcelOrder[] = [];
  
  // Simple deterministic PRNG for reproducible synthetic data
  let currentSeed = seed;
  const pseudoRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
  
  for (let i = 1; i <= count; i++) {
    const latOffset = (pseudoRandom() - 0.5) * 0.12;
    const lngOffset = (pseudoRandom() - 0.5) * 0.12;
    
    const catRand = pseudoRandom();
    let cumulative = 0;
    let category: ProductCategory = 'Standard';
    for (let c = 0; c < categories.length; c++) {
      cumulative += categoryWeights[c];
      if (catRand <= cumulative) {
        category = categories[c];
        break;
      }
    }
    
    const isCOD = pseudoRandom() < 0.35;
    const codAmount = isCOD ? Math.round(50 + pseudoRandom() * 400) : 0;
    
    const isRTO = pseudoRandom() < 0.22;
    const rtoReadyTime = isRTO ? Math.floor(30 + pseudoRandom() * 210) : 0;
    
    const twStart = Math.floor(pseudoRandom() * 240);
    const twDuration = Math.floor(60 + pseudoRandom() * 120);
    const twEnd = Math.min(480, twStart + twDuration);
    
    const weightKg = parseFloat((0.5 + pseudoRandom() * 14).toFixed(1));
    const volumeM3 = parseFloat((0.005 + pseudoRandom() * 0.05).toFixed(3));
    
    orders.push({
      id: `ORD-${String(i).padStart(4, '0')}`,
      customerName: `Customer #${i} (${category})`,
      lat: parseFloat((CENTRAL_DEPOT.lat + latOffset).toFixed(6)),
      lng: parseFloat((CENTRAL_DEPOT.lng + lngOffset).toFixed(6)),
      weightKg,
      volumeM3,
      codAmount,
      isRTO,
      rtoReadyTime,
      twStart,
      twEnd,
      category,
      status: 'Pending',
    });
  }
  
  return orders;
}
