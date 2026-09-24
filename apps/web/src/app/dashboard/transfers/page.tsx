'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api-client';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransfers = async () => {
    try {
      const res: any = await fetchApi('/transfers');
      setTransfers(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransfers();
  }, []);

  const handleTransition = async (id: string, targetStatus: 'DISPATCHED' | 'RECEIVED') => {
    try {
      await fetchApi(`/transfers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: targetStatus,
          batch: 'BATCH-2026-A1',
          idempotencyKey: `TR-TRANSITION-${id}-${targetStatus}-${Date.now()}`,
        }),
      });
      loadTransfers();
    } catch (err: any) {
      alert(err.message || 'Transition failed');
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-mono font-black animate-pulse">LOADING TRANSFER STATE MACHINE...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#A9D9F2] border-3 border-[#0A0A0A] p-4 shadow-neo">
        <h2 className="text-2xl font-black uppercase text-[#0A0A0A]">
          INTERNAL WAREHOUSE TRANSFER STATE MACHINE
        </h2>
        <p className="text-xs font-mono font-bold uppercase text-gray-800">
          STRICT LIFECYCLE: REQUESTED → DISPATCHED → RECEIVED // ATOMIC INVENTORY MOVEMENTS
        </p>
      </div>

      <BadgeCard title="ACTIVE TRANSFER LIFECYCLE TRACKER" variant="sky">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b-3 border-[#0A0A0A] bg-[#0A0A0A] text-white">
                <th className="p-3">TRANSFER ID</th>
                <th className="p-3">ITEM</th>
                <th className="p-3">SOURCE</th>
                <th className="p-3">DESTINATION</th>
                <th className="p-3 text-right">QTY</th>
                <th className="p-3">CURRENT STATUS</th>
                <th className="p-3 text-center">ACTION TRANSITION</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((t) => (
                <tr key={t.id} className="border-b-2 border-[#0A0A0A]">
                  <td className="p-3 font-bold">{t.id.slice(0, 8)}...</td>
                  <td className="p-3">{t.item?.name}</td>
                  <td className="p-3">{t.sourceLocation?.name}</td>
                  <td className="p-3">{t.destLocation?.name}</td>
                  <td className="p-3 text-right font-bold">{t.quantity}</td>
                  <td className="p-3 font-black">
                    <span
                      className={`px-2 py-1 border-2 border-[#0A0A0A] ${
                        t.status === 'RECEIVED'
                          ? 'bg-[#3DDC84] text-black'
                          : t.status === 'DISPATCHED'
                          ? 'bg-[#FFB800] text-black'
                          : 'bg-white text-black'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {t.status === 'REQUESTED' && (
                      <Button variant="amber" size="sm" onClick={() => handleTransition(t.id, 'DISPATCHED')}>
                        DISPATCH STOCK →
                      </Button>
                    )}
                    {t.status === 'DISPATCHED' && (
                      <Button variant="sky" size="sm" onClick={() => handleTransition(t.id, 'RECEIVED')}>
                        RECEIVE STOCK ✓
                      </Button>
                    )}
                    {t.status === 'RECEIVED' && (
                      <span className="text-gray-600 font-bold">✓ COMPLETED</span>
                    )}
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
