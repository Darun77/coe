# Technical Documentation & Algorithmic Formulation

## 1. Problem Formulation & Multi-Objective Model

Let $O = \{o_1, o_2, \dots, o_N\}$ be the set of parcel orders to be fulfilled by a fleet of riders $K = \{k_1, k_2, \dots, k_M\}$.

Each order $o_i$ is defined by:
- Geo-coordinates: $(lat_i, lng_i)$
- Physical Weight & Volume: $w_i \ge 0$ (kg), $v_i \ge 0$ ($m^3$)
- COD Cash value: $c_i \ge 0$ ($)
- Return-to-Origin flag & dual window: $r_i \in \{0, 1\}$, $[RTO_{ready, i}, RTO_{deadline, i}]$
- Delivery SLA dual window: $[TW_{start, i}, TW_{end, i}]$
- Product Category: $cat_i \in \{\text{Standard}, \text{Hazmat}, \text{Food}, \text{Fragile}, \text{ColdChain}\}$

Each rider $k_m$ has:
- Weight & Volume capacities: $CAP_{weight}, CAP_{volume}$
- Cash carrying security ceiling: $CAP_{cash} = \$1,000$ (with mid-route vault drop reset)
- Urban vehicle speed: $s_{avg} = 30 \text{ km/h } (0.5 \text{ km/min})$

---

## 2. Product Incompatibility Matrix $\mathcal{I}(cat_i, cat_j)$

Defined as a binary relation $\mathcal{I}: \text{Category} \times \text{Category} \to \{0, 1\}$ where $1$ indicates forbidden co-loading:

$$\mathcal{I}(Hazmat, Food) = 1, \quad \mathcal{I}(Hazmat, Fragile) = 1, \quad \mathcal{I}(Hazmat, ColdChain) = 1$$

$$\forall o_i, o_j \in R_k, \quad \mathcal{I}(cat_i, cat_j) = 0$$

---

## 3. Mathematical Objective & Financial Cost Function

Minimize the multi-objective total cost function $Z$:

$$\min Z = w_1 \cdot D_{total} + w_2 \cdot P_{SLA} + w_3 \cdot P_{Cash} + w_4 \cdot P_{Incompat} + w_5 \cdot E_{CO2} + w_6 \cdot C_{Total}$$

Where:
- $D_{total} = \sum_{k} \sum_{(i, j) \in R_k} d(i, j) + \text{ReTripDistance}$: Driving distance including failed RTO re-trips.
- $P_{SLA} = \sum_{i} \max(0, ServiceStart_i - TW_{end, i}) \times \$35$: SLA breach penalty.
- $P_{Cash} = \sum_{k} \text{Breaches}_k \times \$200$: CIT cash insurance penalty.
- $P_{Incompat} = \sum_{k} \text{Violations}_k \times \$500$: Product contamination hazard fee.
- $E_{CO2} = D_{driving} \times 0.211 \text{ kg/km} + T_{idling} \times 0.6 \text{ kg/hr}$: Carbon footprint.
- $C_{Total} = D_{driving} \times \$1.35/\text{km} + T_{duration} \times \$20/\text{hr} + P_{SLA} + P_{Cash} + P_{Incompat} + P_{RTO\_retrip}$.

---

## 4. Multi-Slot Parallel Insertion Algorithm with Dual Windows & 2-Opt

```
Algorithm: Parallel Dual-Window Constraint Insertion Engine (PDWCIE)
Input: Orders O, Fleet Riders K, Compatibility Matrix I, Depot D
Output: Set of Compliant Optimized Routes R

1. Sort orders O by TW_end ascending, RTO_ready, and distance from Depot D.
2. Initialize active route pool R_m = { rider: K[m], orders: [] } for m in 1..|K|.
3. For each order o_i in O:
4.     best_route = None, best_slot = None, min_score = infinity
5.     For each route r in R:
6.         If routeHasIncompatibility(r.orders, o_i): continue
7.         If sum(weight) + o_i.weight > r.rider.maxWeight: continue
8.         If sum(volume) + o_i.volume > r.rider.maxVolume: continue
9.         
10.        For slot_pos in 0..len(r.orders):
11.            candidate = insert o_i at slot_pos in r.orders
12.            (cash_ok, vault_drops) = checkCashVaultFeasibility(candidate, r.rider.maxCash)
13.            if not cash_ok: continue
14.            
15.            (feasible, dist, idle_min) = evaluateDualWindowTiming(depot, candidate)
16.            if not feasible: continue
17.            
18.            score = dist + 0.10 * idle_min + 4.0 * vault_drops
19.            if score < min_score:
20.                min_score = score
21.                best_route = r
22.                best_slot = slot_pos
23.                
24.     If best_route is found:
25.         Insert o_i at best_slot in best_route.orders
26.     Else:
27.         Open new route with extra rider and assign o_i.
28.
29. For each route r in R:
30.     r.orders = optimizeRoute2Opt(depot, r.orders)
31. Return R
```

---

## 5. Statistical Benchmark Framework (`scripts/run_experiments.py`)

The Python benchmark CLI executes 10 random seeds ($[42, 101, 202, 303, 404, 505, 606, 707, 808, 909]$) across 5 order volumes ($N \in [25, 50, 100, 200, 500]$), computing mean $\mu$, standard deviation $\sigma$, and 95% Confidence Interval $CI_{95} = 1.96 \cdot \frac{\sigma}{\sqrt{N_{seeds}}}$.
