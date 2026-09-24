'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { fetchApi } from '@/lib/api-client';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkOrders = async () => {
    try {
      const res: any = await fetchApi('/work-orders');
      setWorkOrders(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  if (loading) {
    return <div className="p-12 text-center font-mono font-black animate-pulse">COMPUTING WORK ORDER SHORTAGES...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#FFB800] border-3 border-[#0A0A0A] p-4 shadow-neo">
        <h2 className="text-2xl font-black uppercase text-[#0A0A0A]">
          WORK ORDERS & SHORTAGE COMPUTATION ENGINE
        </h2>
        <p className="text-xs font-mono font-bold uppercase text-gray-800">
          SHORTAGE = MAX(REQUIRED_QTY - AVAILABLE_AT_LOCATION, 0) // COMPUTED ON READ
        </p>
      </div>

      <BadgeCard title="ACTIVE WORK ORDERS MATRIX" variant="amber">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-3 border-[#0A0A0A] bg-[#0A0A0A] text-white">
                <th className="p-3">WORK ORDER ID</th>
                <th className="p-3">ITEM</th>
                <th className="p-3">LOCATION</th>
                <th className="p-3 text-right">REQUIRED</th>
                <th className="p-3 text-right">AVAILABLE</th>
                <th className="p-3 text-right">SHORTAGE</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map((wo) => (
                <tr key={wo.id} className="border-b-2 border-[#0A0A0A]">
                  <td className="p-3 font-bold">{wo.id.slice(0, 8)}...</td>
                  <td className="p-3">{wo.item?.name}</td>
                  <td className="p-3">{wo.location?.name}</td>
                  <td className="p-3 text-right font-bold">{wo.requiredQty}</td>
                  <td className="p-3 text-right font-bold">{wo.availableAtLocation}</td>
                  <td className="p-3 text-right">
                    {wo.hasShortage ? (
                      <span className="px-2 py-1 bg-[#FF4D4D] text-white font-black border-2 border-[#0A0A0A]">
                        ⚠ {wo.shortage} SHORTAGE
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-[#3DDC84] text-[#0A0A0A] font-black border-2 border-[#0A0A0A]">
                        ✓ FULLY STOCKED
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold uppercase">{wo.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BadgeCard>
    </div>
  );
}
