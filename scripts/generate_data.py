#!/usr/bin/env python3
"""
Synthetic Data Generation Script for Parcel Logistics (COD & RTO Batching)
Generates realistic orders with coordinates, weight, volume, COD values,
RTO readiness times, dual time windows, and product category tags.
"""

import json
import random
import os

def generate_dataset(num_orders=100, seed=42):
    random.seed(seed)
    
    categories = ["Standard", "Hazmat", "Food", "Fragile", "ColdChain"]
    category_weights = [0.45, 0.15, 0.15, 0.15, 0.10]
    
    # Depot location (Center of Metro Region)
    depot = {"lat": 12.9716, "lng": 77.5946, "name": "Central Logistics Hub"}
    
    orders = []
    for i in range(1, num_orders + 1):
        # Generate points within ~12km of depot
        lat_offset = (random.random() - 0.5) * 0.12
        lng_offset = (random.random() - 0.5) * 0.12
        
        category = random.choices(categories, weights=category_weights)[0]
        
        # 35% COD orders
        is_cod = random.random() < 0.35
        cod_amount = round(random.uniform(50.0, 450.0), 2) if is_cod else 0.0
        
        # 22% RTO reverse pickups
        is_rto = random.random() < 0.22
        rto_ready = random.randint(30, 210) if is_rto else 0
        rto_deadline = min(480, rto_ready + random.randint(120, 240)) if is_rto else 480
        
        # Delivery SLA time windows (minutes from dispatch start 0 to 480 mins / 8 hrs)
        tw_start = random.randint(0, 240)
        tw_duration = random.choice([90, 120, 180])
        tw_end = min(480, tw_start + tw_duration)
        
        weight = round(random.uniform(0.5, 14.0), 1)
        volume = round(random.uniform(0.005, 0.05), 3)
        
        orders.append({
            "id": f"ORD-{i:04d}",
            "customerName": f"Customer #{i} ({category})",
            "lat": round(depot["lat"] + lat_offset, 6),
            "lng": round(depot["lng"] + lng_offset, 6),
            "weightKg": weight,
            "volumeM3": volume,
            "codAmount": cod_amount,
            "isRTO": is_rto,
            "rtoReadyTime": rto_ready,
            "rtoDeadline": rto_deadline,
            "twStart": tw_start,
            "twEnd": tw_end,
            "category": category,
            "status": "Pending"
        })
        
    riders = [
        {"id": "RIDER-01", "name": "Rider Alpha (EV Van)", "vehicleType": "EVVan", "maxWeightKg": 250, "maxVolumeM3": 2.2, "maxCodCash": 1000},
        {"id": "RIDER-02", "name": "Rider Bravo (EV Van)", "vehicleType": "EVVan", "maxWeightKg": 250, "maxVolumeM3": 2.2, "maxCodCash": 1000},
        {"id": "RIDER-03", "name": "Rider Charlie (Hazmat Van)", "vehicleType": "DieselVan", "maxWeightKg": 350, "maxVolumeM3": 3.0, "maxCodCash": 1000},
        {"id": "RIDER-04", "name": "Rider Delta (Cold Van)", "vehicleType": "EVVan", "maxWeightKg": 200, "maxVolumeM3": 1.8, "maxCodCash": 1000},
        {"id": "RIDER-05", "name": "Rider Echo (Cargo Bike)", "vehicleType": "CargoBike", "maxWeightKg": 75, "maxVolumeM3": 0.7, "maxCodCash": 500},
    ]
    
    dataset = {
        "depot": depot,
        "riders": riders,
        "orders": orders
    }
    
    return dataset

if __name__ == "__main__":
    os.makedirs("src/data", exist_ok=True)
    data = generate_dataset(100, seed=42)
    with open("src/data/generated_orders.json", "w") as f:
        json.dump(data, f, indent=2)
    print(f"Successfully generated 100 realistic orders in src/data/generated_orders.json")

