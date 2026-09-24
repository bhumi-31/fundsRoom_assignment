'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { StockVisualizer3D } from '@/components/3d/stock-visualizer';
import { fetchApi } from '@/lib/api-client';

export default function DashboardOverviewPage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [balRes, woRes, trRes]: [any, any, any] = await Promise.all([
        fetchApi('/inventory/balances'),
        fetchApi('/work-orders').catch(() => []),
        fetchApi('/transfers').catch(() => []),
      ]);
      setBalances(balRes || []);
      setWorkOrders(woRes || []);
      setTransfers(trRes || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Subscribe to SSE stream for live updates
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    const eventSource = new EventSource(`${apiBase}/events`);

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'inventory:updated' || payload.type === 'work-order:updated') {
          loadDashboardData();
        }
      } catch (err) {}
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const totalPhysical = balances.reduce((sum, b) => sum + b.physicalQty, 0);
  const totalReserved = balances.reduce((sum, b) => sum + b.reservedQty, 0);
  const totalAvailable = totalPhysical - totalReserved;
  const lowStockItems = balances.filter((b) => b.isLowStock);

  if (loading) {
    return (
      <div className="p-12 text-center font-mono font-black text-xl uppercase tracking-widest animate-pulse">
        ⚡ INITIALIZING FORGE-OS ENGINE...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Headline Banner */}
      <div className="bg-[#FFB800] border-3 border-[#0A0A0A] p-4 shadow-neo flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#0A0A0A]">
            SYSTEM OVERVIEW & REAL-TIME STOCK TELEMETRY
          </h2>
          <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#0A0A0A]">
            LIVE SSE EVENT STREAM ACTIVE // DOUBLE-ENTRY LEDGER BACKED
          </p>
        </div>
        <div className="px-3 py-1 bg-white border-3 border-[#0A0A0A] font-mono text-xs font-black">
          ● REAL-TIME FEED
        </div>
      </div>

      {/* KPI Badge Card Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <BadgeCard title="TOTAL PHYSICAL STOCK" variant="amber">
          <div className="text-4xl font-black font-mono">{totalPhysical}</div>
          <p className="text-xs font-mono font-bold text-gray-800 uppercase mt-1">
            UNITS ACROSS ALL HUBS
          </p>
        </BadgeCard>

        <BadgeCard title="RESERVED STOCK" variant="pink">
          <div className="text-4xl font-black font-mono">{totalReserved}</div>
          <p className="text-xs font-mono font-bold text-gray-800 uppercase mt-1">
            ALLOCATED TO ORDERS
          </p>
        </BadgeCard>

        <BadgeCard title="AVAILABLE STOCK" variant="sky">
          <div className="text-4xl font-black font-mono">{totalAvailable}</div>
          <p className="text-xs font-mono font-bold text-gray-800 uppercase mt-1">
            READY FOR DISPATCH
          </p>
        </BadgeCard>

        <BadgeCard title="SHORTAGE ALERTS" variant={lowStockItems.length > 0 ? 'red' : 'green'}>
          <div className="text-4xl font-black font-mono">{lowStockItems.length}</div>
          <p className="text-xs font-mono font-bold text-gray-800 uppercase mt-1">
            ITEMS BELOW THRESHOLD
          </p>
        </BadgeCard>
      </div>

      {/* Visual Moment 2: 3D Stock Bins Visualizer Widget */}
      <BadgeCard title="3D REAL-TIME WAREHOUSE STOCK VISUALIZER" variant="white">
        <StockVisualizer3D
          items={balances.map((b) => ({
            locationName: b.locationName,
            itemName: b.itemName,
            physicalQty: b.physicalQty,
            reservedQty: b.reservedQty,
          }))}
        />
      </BadgeCard>

      {/* Recent Inventory Balance Table */}
      <BadgeCard title="INVENTORY BALANCES (CACHED PROJECTION)" variant="sky">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-3 border-[#0A0A0A] bg-[#0A0A0A] text-white">
                <th className="p-3">ITEM SKU</th>
                <th className="p-3">NAME</th>
                <th className="p-3">LOCATION</th>
                <th className="p-3">BATCH</th>
                <th className="p-3 text-right">PHYSICAL</th>
                <th className="p-3 text-right">RESERVED</th>
                <th className="p-3 text-right">AVAILABLE</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => (
                <tr key={b.id} className="border-b-2 border-[#0A0A0A] hover:bg-white/60">
                  <td className="p-3 font-bold">{b.itemSku}</td>
                  <td className="p-3">{b.itemName}</td>
                  <td className="p-3">{b.locationName}</td>
                  <td className="p-3">{b.batch}</td>
                  <td className="p-3 text-right font-bold">{b.physicalQty}</td>
                  <td className="p-3 text-right text-red-600 font-bold">{b.reservedQty}</td>
                  <td className="p-3 text-right font-black text-green-700">
                    {b.availableQty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BadgeCard>
    </div>
  );
}
