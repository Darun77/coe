import React, { useRef, useEffect, useState } from 'react';
import type { Depot, CalculatedRoute, ParcelOrder } from '../types';
import { RefreshCw, DollarSign } from 'lucide-react';

interface MapViewProps {
  depot: Depot;
  routes: CalculatedRoute[];
  orders: ParcelOrder[];
  selectedRouteId?: string;
  onSelectRoute?: (routeId: string) => void;
  onSelectOrder?: (order: ParcelOrder) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  depot,
  routes,
  orders,
  selectedRouteId,
  onSelectOrder,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredOrder, setHoveredOrder] = useState<ParcelOrder | null>(null);

  // Compute bounding box coordinates
  let minLat = depot.lat - 0.08;
  let maxLat = depot.lat + 0.08;
  let minLng = depot.lng - 0.08;
  let maxLng = depot.lng + 0.08;

  orders.forEach((o) => {
    if (o.lat < minLat) minLat = o.lat;
    if (o.lat > maxLat) maxLat = o.lat;
    if (o.lng < minLng) minLng = o.lng;
    if (o.lng > maxLng) maxLng = o.lng;
  });

  const padLat = (maxLat - minLat) * 0.1;
  const padLng = (maxLng - minLng) * 0.1;
  minLat -= padLat;
  maxLat += padLat;
  minLng -= padLng;
  maxLng += padLng;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Coordinate translation helper
    const toScreenX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * width;
    const toScreenY = (lat: number) => height - ((lat - minLat) / (maxLat - minLat)) * height;

    // 1. Draw Map Background Grid & Roads
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 2. Draw Routes (Polylines)
    routes.forEach((route) => {
      if (route.stops.length === 0) return;
      const isSelected = selectedRouteId === route.id;
      
      ctx.beginPath();
      ctx.strokeStyle = isSelected ? '#ffffff' : route.color;
      ctx.lineWidth = isSelected ? 4 : 2;
      ctx.setLineDash(isSelected ? [] : [6, 4]);

      const depotX = toScreenX(depot.lng);
      const depotY = toScreenY(depot.lat);

      ctx.moveTo(depotX, depotY);

      route.stops.forEach((stop) => {
        const x = toScreenX(stop.order.lng);
        const y = toScreenY(stop.order.lat);
        ctx.lineTo(x, y);
      });

      // Return to depot
      ctx.lineTo(depotX, depotY);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 3. Draw Depot Marker
    const depotX = toScreenX(depot.lng);
    const depotY = toScreenY(depot.lat);

    ctx.fillStyle = '#3b82f6'; // blue-500
    ctx.beginPath();
    ctx.arc(depotX, depotY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HUB', depotX, depotY + 4);

    // 4. Draw Order Nodes
    orders.forEach((ord) => {
      const x = toScreenX(ord.lng);
      const y = toScreenY(ord.lat);

      let nodeColor = '#64748b'; // slate-500
      if (ord.category === 'Hazmat') nodeColor = '#ef4444'; // red
      else if (ord.category === 'Food') nodeColor = '#10b981'; // green
      else if (ord.category === 'ColdChain') nodeColor = '#06b6d4'; // cyan
      else if (ord.category === 'Fragile') nodeColor = '#f59e0b'; // amber

      // Draw node circle
      ctx.fillStyle = nodeColor;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();

      if (ord.codAmount > 0) {
        ctx.strokeStyle = '#facc15'; // yellow ring for COD
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (ord.isRTO) {
        ctx.strokeStyle = '#a855f7'; // purple ring for RTO
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

  }, [depot, routes, orders, selectedRouteId, minLat, maxLat, minLng, maxLng]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    const toScreenX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * canvas.width;
    const toScreenY = (lat: number) => canvas.height - ((lat - minLat) / (maxLat - minLat)) * canvas.height;

    let found: ParcelOrder | null = null;
    for (const ord of orders) {
      const ox = toScreenX(ord.lng);
      const oy = toScreenY(ord.lat);
      const dist = Math.hypot(clickX - ox, clickY - oy);
      if (dist <= 10) {
        found = ord;
        break;
      }
    }
    setHoveredOrder(found);
  };

  const handleCanvasClick = () => {
    if (hoveredOrder && onSelectOrder) {
      onSelectOrder(hoveredOrder);
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
      
      {/* Map Control Bar */}
      <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2.5 border-b border-slate-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Central Depot
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Hazmat
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Food
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> COD Cash ($)
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> RTO Return
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing {routes.length} Active Routes | {orders.length} Parcels
        </div>
      </div>

      {/* Interactive Canvas Map */}
      <div className="relative flex-1 bg-slate-900">
        <canvas
          ref={canvasRef}
          width={900}
          height={550}
          onMouseMove={handleCanvasMouseMove}
          onClick={handleCanvasClick}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Hover Tooltip Card */}
        {hoveredOrder && (
          <div className="absolute bottom-4 left-4 bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-1 z-20">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span>{hoveredOrder.id}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">
                {hoveredOrder.category}
              </span>
            </div>
            <p className="text-slate-400">{hoveredOrder.customerName}</p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-300">
              <span>Weight: {hoveredOrder.weightKg}kg</span>
              <span>•</span>
              <span>SLA: {hoveredOrder.twStart}-{hoveredOrder.twEnd}m</span>
            </div>
            {hoveredOrder.codAmount > 0 && (
              <div className="text-amber-400 font-semibold flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> COD Cash: ${hoveredOrder.codAmount}
              </div>
            )}
            {hoveredOrder.isRTO && (
              <div className="text-purple-400 font-semibold flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> RTO Ready: {hoveredOrder.rtoReadyTime} min
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};
