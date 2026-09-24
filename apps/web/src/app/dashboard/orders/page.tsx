'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { fetchApi } from '@/lib/api-client';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      const res: any = await fetchApi('/orders');
      setOrders(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading) {
    return <div className="p-12 text-center font-mono font-black animate-pulse">LOADING CUSTOMER RESERVATIONS...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#FF6FA8] border-3 border-[#0A0A0A] p-4 shadow-neo">
        <h2 className="text-2xl font-black uppercase text-[#0A0A0A]">
          CUSTOMER ORDERS & ATOMIC RESERVATION DESK
        </h2>
        <p className="text-xs font-mono font-bold uppercase text-[#0A0A0A]">
          SALES ROLE ACCESSIBLE // ATOMIC CONDITIONAL RESERVATION ENGINE
        </p>
      </div>

      <BadgeCard title="CUSTOMER RESERVATIONS LOG" variant="pink">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-3 border-[#0A0A0A] bg-[#0A0A0A] text-white">
                <th className="p-3">ORDER ID</th>
                <th className="p-3">CUSTOMER REF</th>
                <th className="p-3">ITEM</th>
                <th className="p-3">LOCATION</th>
                <th className="p-3 text-right">QTY</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">SALES AGENT</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b-2 border-[#0A0A0A]">
                  <td className="p-3 font-bold">{o.id.slice(0, 8)}...</td>
                  <td className="p-3 font-black text-[#0A0A0A]">{o.customerRef}</td>
                  <td className="p-3">{o.item?.name}</td>
                  <td className="p-3">{o.location?.name}</td>
                  <td className="p-3 text-right font-black">{o.quantity}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-[#3DDC84] text-[#0A0A0A] font-black border-2 border-[#0A0A0A]">
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700">{o.salesUser?.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BadgeCard>
    </div>
  );
}
