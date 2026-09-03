# Technical Documentation & Algorithm Formulation

## 1. Problem Formulation

Let $O = \{o_1, o_2, \dots, o_N\}$ be the set of parcel orders to be fulfilled by a fleet of riders $K = \{k_1, k_2, \dots, k_M\}$.

Each order $o_i$ is characterized by:
- Geo-coordinates: $(lat_i, lng_i)$
- Weight: $w_i \ge 0$ (kg)
- Volume: $v_i \ge 0$ ($m^3$)
- COD Cash value: $c_i \ge 0$ ($)
- Return-to-Origin flag: $r_i \in \{0, 1\}$
- RTO Readiness time: $R_i \ge 0$ (minutes from dispatch start)
- Promised Time Window: $[TW_{start, i}, TW_{end, i}]$
- Product Category: $cat_i \in \{\text{Standard}, \text{Hazmat}, \text{Food}, \text{Fragile}, \text{ColdChain}\}$

Each rider $k_m$ has:
- Weight capacity: $CAP_{weight}$
- Volume capacity: $CAP_{volume}$
- Cash carrying security limit: $CAP_{cash}$ (e.g. $1,000)
- Average vehicle speed: $s_{avg}$ (30 km/h urban)

---

## 2. Product Incompatibility Matrix $\mathcal{I}(cat_i, cat_j)$

Defined as a binary relation $\mathcal{I}: \text{Category} \times \text{Category} \to \{0, 1\}$ where $1$ indicates incompatibility:

$$\mathcal{I}(Hazmat, Food) = 1, \quad \mathcal{I}(Hazmat, Fragile) = 1, \quad \mathcal{I}(ColdChain, Hazmat) = 1$$

Two orders $o_i$ and $o_j$ can be assigned to the same route $R_k$ if and only if:
$$\forall o_i, o_j \in R_k, \quad \mathcal{I}(cat_i, cat_j) = 0$$

---

## 3. Mathematical Objective Function

Minimize the total cost function $Z$:

$$\min Z = w_1 \cdot D_{total} + w_2 \cdot P_{SLA} + w_3 \cdot P_{Cash} + w_4 \cdot P_{Incompat} + w_5 \cdot E_{CO2}$$

Where:
- $D_{total} = \sum_{k} \sum_{(i, j) \in R_k} d(i, j)$ is total Euclidean / Manhattan distance (km).
- $P_{SLA} = \sum_{i} \max(0, Arrival_i - TW_{end, i}) \times \lambda_{SLA}$ is the time-window violation penalty.
- $P_{Cash} = \sum_{k} \max\left(0, \sum_{i \in R_k} c_i - CAP_{cash}\right) \times \lambda_{Cash}$ is cash cap breach penalty.
- $P_{Incompat} = \infty \times \sum_{k} \sum_{i, j \in R_k} \mathcal{I}(cat_i, cat_j)$ is hard constraint indicator penalty.
- $E_{CO2} = D_{total} \times 0.211 \text{ kg/km}$ is carbon emission.

---

## 4. Constraint-Aware Heuristic Algorithm Specification

### Algorithm 1: Partitioned Time-Window Parallel Insertion (PTWPI)

```
Input: Orders O, Riders K, Incompatibility Matrix I
Output: Set of Feasible Routes R

1.  Partition O into compatible sets S_1, S_2, ... S_P based on matrix I
2.  For each partition S_p:
3.      Sort orders in S_p by TW_start ascending, then distance from depot
4.      Initialize empty route list R_p
5.      For each order o_i in S_p:
6.          best_route = None, best_cost = infinity
7.          For each route r in R_p:
8.              For each insertion position p in 0..len(r):
9.                  If Feasible(r, o_i, p):
10.                     cost = ComputeInsertionCost(r, o_i, p)
11.                     If cost < best_cost:
12.                         best_cost = cost
13.                         best_route = (r, position p)
14.         If best_route is not None:
15.             Insert o_i into best_route at position p
16.         Else:
17.             Create new route r_new with rider k_next
18.             Insert o_i into r_new
19. Return union of all partition routes R
```

---

## 5. System Architecture & API Specification

### Data Structures (`src/types.ts`)
```typescript
export interface ParcelOrder {
  id: string;
  customerName: string;
  lat: number;
  lng: number;
  weightKg: number;
  volumeM3: number;
  codAmount: number;
  isRTO: boolean;
  rtoReadyTime: number; // minutes from shift start
  twStart: number;      // minutes from shift start
  twEnd: number;        // minutes from shift start
  category: 'Standard' | 'Hazmat' | 'Food' | 'Fragile' | 'ColdChain';
  status: 'Pending' | 'InTransit' | 'Delivered' | 'Returned';
}

export interface Rider {
  id: string;
  name: string;
  vehicleType: 'CargoBike' | 'EVVan' | 'DieselVan';
  maxWeightKg: number;
  maxVolumeM3: number;
  maxCodCash: number;
}
```
