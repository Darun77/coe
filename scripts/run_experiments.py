#!/usr/bin/env python3
"""
Refined Experiment & Benchmark Script: Simple Baseline vs Constraint-Aware Engine
Quantifies distance saved, SLA compliance %, COD cash breaches,
product incompatibility errors, and CO2 emissions.
"""

import json
import math
import os
from generate_data import generate_dataset

INCOMPATIBILITY_MATRIX = {
    ("Hazmat", "Food"): 1, ("Food", "Hazmat"): 1,
    ("Hazmat", "Fragile"): 1, ("Fragile", "Hazmat"): 1,
    ("Hazmat", "ColdChain"): 1, ("ColdChain", "Hazmat"): 1,
}

def distance(lat1, lng1, lat2, lng2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def is_incompatible(cat1, cat2):
    return INCOMPATIBILITY_MATRIX.get((cat1, cat2), 0) == 1

def check_route_compatibility(route_orders, new_order):
    for o in route_orders:
        if is_incompatible(o["category"], new_order["category"]):
            return False
    return True

# --- 1. Naive Baseline Solver (Greedy Nearest Neighbor & Volume Cap Only) ---
def solve_baseline(depot, riders, orders):
    unassigned = list(orders)
    routes = []
    
    current_rider_idx = 0
    while unassigned:
        rider = riders[current_rider_idx % len(riders)]
        current_rider_idx += 1
        
        route_orders = []
        curr_weight = 0.0
        curr_vol = 0.0
        curr_lat = depot["lat"]
        curr_lng = depot["lng"]
        
        while unassigned:
            best_order = None
            best_dist = float("inf")
            
            for ord_item in unassigned:
                if curr_weight + ord_item["weightKg"] <= rider["maxWeightKg"] and curr_vol + ord_item["volumeM3"] <= rider["maxVolumeM3"]:
                    d = distance(curr_lat, curr_lng, ord_item["lat"], ord_item["lng"])
                    if d < best_dist:
                        best_dist = d
                        best_order = ord_item
            
            if not best_order:
                break
                
            route_orders.append(best_order)
            curr_weight += best_order["weightKg"]
            curr_vol += best_order["volumeM3"]
            curr_lat = best_order["lat"]
            curr_lng = best_order["lng"]
            unassigned.remove(best_order)
            
        if route_orders:
            routes.append({"rider": rider, "orders": route_orders})
            
    return evaluate_solution("Naive Baseline", depot, routes)

# --- 2. Constraint-Aware Intelligent Solver ---
def solve_constraint_aware(depot, riders, orders):
    unassigned = list(orders)
    # Sort orders by time window start & urgency
    unassigned.sort(key=lambda x: (x["twStart"], distance(depot["lat"], depot["lng"], x["lat"], x["lng"])))
    
    routes = []
    rider_idx = 0
    
    while unassigned:
        rider = riders[rider_idx % len(riders)]
        rider_idx += 1
        
        route_orders = []
        curr_weight = 0.0
        curr_vol = 0.0
        curr_cash = 0.0
        curr_lat = depot["lat"]
        curr_lng = depot["lng"]
        curr_time = 0.0 # minutes
        
        while unassigned:
            best_candidate = None
            best_score = float("inf")
            
            for ord_item in unassigned:
                # 1. Product Incompatibility Check
                if not check_route_compatibility(route_orders, ord_item):
                    continue
                    
                # 2. Hard Capacity Checks
                if curr_weight + ord_item["weightKg"] > rider["maxWeightKg"]:
                    continue
                if curr_vol + ord_item["volumeM3"] > rider["maxVolumeM3"]:
                    continue
                if curr_cash + ord_item["codAmount"] > rider["maxCodCash"]:
                    continue
                    
                # 3. Distance & Timing
                d = distance(curr_lat, curr_lng, ord_item["lat"], ord_item["lng"])
                travel_time = d / 0.5 # 30 km/h = 0.5 km/min
                arrival_time = curr_time + travel_time
                
                # Penalize arriving late after TW_end
                late_penalty = max(0, arrival_time - ord_item["twEnd"]) * 5.0
                # Penalize arriving before RTO ready time
                rto_wait_penalty = max(0, ord_item["rtoReadyTime"] - arrival_time) * 2.0 if ord_item["isRTO"] else 0.0
                
                # Multi-objective insertion score
                score = d + late_penalty + rto_wait_penalty
                
                if score < best_score:
                    best_score = score
                    best_candidate = ord_item
                    
            if not best_candidate:
                break
                
            route_orders.append(best_candidate)
            curr_weight += best_candidate["weightKg"]
            curr_vol += best_candidate["volumeM3"]
            curr_cash += best_candidate["codAmount"]
            d = distance(curr_lat, curr_lng, best_candidate["lat"], best_candidate["lng"])
            curr_time += (d / 0.5) + 5.0
            curr_lat = best_candidate["lat"]
            curr_lng = best_candidate["lng"]
            unassigned.remove(best_candidate)
            
        if route_orders:
            routes.append({"rider": rider, "orders": route_orders})
            
    return evaluate_solution("Constraint-Aware Engine", depot, routes)

# --- Metric Evaluation Function ---
def evaluate_solution(name, depot, routes):
    total_dist = 0.0
    sla_breaches = 0
    cash_breaches = 0
    incompatibility_errors = 0
    rto_delay_errors = 0
    total_orders = 0
    
    for r in routes:
        rider = r["rider"]
        route_orders = r["orders"]
        total_orders += len(route_orders)
        
        curr_lat = depot["lat"]
        curr_lng = depot["lng"]
        route_cash = 0.0
        route_time = 0.0
        
        for idx, ord_item in enumerate(route_orders):
            d = distance(curr_lat, curr_lng, ord_item["lat"], ord_item["lng"])
            total_dist += d
            travel_time = d / 0.5
            route_time += travel_time + 5.0
            
            curr_lat = ord_item["lat"]
            curr_lng = ord_item["lng"]
            route_cash += ord_item["codAmount"]
            
            if route_time > ord_item["twEnd"]:
                sla_breaches += 1
                
            if ord_item["isRTO"] and route_time < ord_item["rtoReadyTime"]:
                rto_delay_errors += 1
                
            if idx > 0:
                prev_cat = route_orders[idx-1]["category"]
                if is_incompatible(prev_cat, ord_item["category"]):
                    incompatibility_errors += 1
                    
        if route_cash > rider["maxCodCash"]:
            cash_breaches += 1
            
        total_dist += distance(curr_lat, curr_lng, depot["lat"], depot["lng"])
        
    on_time_rate = round(100.0 * (1.0 - (sla_breaches / max(1, total_orders))), 1)
    co2_kg = round(total_dist * 0.211, 2)
    
    return {
        "name": name,
        "totalDistanceKm": round(total_dist, 2),
        "slaBreachCount": sla_breaches,
        "onTimeSlaPercent": on_time_rate,
        "cashBreachCount": cash_breaches,
        "incompatibilityErrors": incompatibility_errors,
        "rtoDelayErrors": rto_delay_errors,
        "co2EmissionsKg": co2_kg,
        "numRoutes": len(routes)
    }

def main():
    dataset = generate_dataset(100, seed=42)
    depot = dataset["depot"]
    riders = dataset["riders"]
    orders = dataset["orders"]
    
    baseline_res = solve_baseline(depot, riders, orders)
    engine_res = solve_constraint_aware(depot, riders, orders)
    
    dist_saved = round(baseline_res["totalDistanceKm"] - engine_res["totalDistanceKm"], 2)
    dist_saved_pct = round(100.0 * dist_saved / baseline_res["totalDistanceKm"], 1)
    
    report = {
        "baseline": baseline_res,
        "constraintEngine": engine_res,
        "distanceSavedKm": dist_saved,
        "distanceSavedPercent": dist_saved_pct
    }
    
    print("=" * 65)
    print("      PARCEL BATCHING ALGORITHM EXPERIMENT RESULTS")
    print("=" * 65)
    print(f"Metric                        Naive Baseline   Constraint Engine")
    print("-" * 65)
    print(f"Total Distance (km)           {baseline_res['totalDistanceKm']:>14.2f}   {engine_res['totalDistanceKm']:>17.2f}")
    print(f"Distance Saved                {'0.00 km (0%)':>14}   {dist_saved:>11.2f} km ({dist_saved_pct}%)")
    print(f"On-Time SLA Delivery (%)      {baseline_res['onTimeSlaPercent']:>13.1f}%   {engine_res['onTimeSlaPercent']:>16.1f}%")
    print(f"SLA Breach Count              {baseline_res['slaBreachCount']:>14}   {engine_res['slaBreachCount']:>17}")
    print(f"COD Cash Limit Breaches       {baseline_res['cashBreachCount']:>14}   {engine_res['cashBreachCount']:>17}")
    print(f"Product Incompat. Errors     {baseline_res['incompatibilityErrors']:>14}   {engine_res['incompatibilityErrors']:>17}")
    print(f"RTO Early Arrival Errors     {baseline_res['rtoDelayErrors']:>14}   {engine_res['rtoDelayErrors']:>17}")
    print(f"CO2 Emissions (kg)            {baseline_res['co2EmissionsKg']:>14.2f}   {engine_res['co2EmissionsKg']:>17.2f}")
    print(f"Active Vehicle Routes         {baseline_res['numRoutes']:>14}   {engine_res['numRoutes']:>17}")
    print("=" * 65)
    
    with open("src/data/experiment_results.json", "w") as f:
        json.dump(report, f, indent=2)
    print("Results saved to src/data/experiment_results.json")

if __name__ == "__main__":
    main()
