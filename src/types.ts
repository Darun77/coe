export type ProductCategory = 'Standard' | 'Hazmat' | 'Food' | 'Fragile' | 'ColdChain';

export interface Depot {
  lat: number;
  lng: number;
  name: string;
}

export interface ParcelOrder {
  id: string;
  customerName: string;
  lat: number;
  lng: number;
  weightKg: number;
  volumeM3: number;
  codAmount: number;
  isRTO: boolean;
  rtoReadyTime: number; // minutes from shift start (0-480)
  twStart: number;      // minutes from shift start
  twEnd: number;        // minutes from shift start
  category: ProductCategory;
  status: 'Pending' | 'InTransit' | 'Delivered' | 'Returned';
  assignedRiderId?: string;
  estimatedArrival?: number;
}

export interface Rider {
  id: string;
  name: string;
  vehicleType: 'EVVan' | 'DieselVan' | 'CargoBike';
  maxWeightKg: number;
  maxVolumeM3: number;
  maxCodCash: number;
  currentCash: number;
  currentWeight: number;
  currentVolume: number;
  status: 'Available' | 'OnRoute' | 'CashCapReached';
}

export interface RouteStop {
  order: ParcelOrder;
  stopSequence: number;
  estimatedArrivalMin: number;
  accumulatedCash: number;
  isSlaBreach: boolean;
  isRtoEarly: boolean;
  hasIncompatibilityError: boolean;
}

export interface CalculatedRoute {
  id: string;
  rider: Rider;
  stops: RouteStop[];
  totalDistanceKm: number;
  totalDurationMin: number;
  totalCodCash: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  hasCashBreach: boolean;
  hasIncompatibilityViolation: boolean;
  slaBreachCount: number;
  rtoEarlyCount: number;
  color: string;
}

export interface BatchMetrics {
  name: string;
  totalDistanceKm: number;
  slaOnTimePercent: number;
  slaBreachCount: number;
  cashBreachCount: number;
  incompatibilityErrors: number;
  rtoEarlyErrors: number;
  co2EmissionsKg: number;
  numRoutes: number;
  totalCostDollars: number;
}

export type ActiveTab = 'dispatcher' | 'comparison' | 'failure_lab' | 'rider_view' | 'analytics' | 'documentation';

export interface FailureScenario {
  id: string;
  title: string;
  severity: 'High' | 'Critical' | 'Medium';
  description: string;
  baselineBehavior: string;
  engineMitigation: string;
  affectedOrderIds: string[];
}
