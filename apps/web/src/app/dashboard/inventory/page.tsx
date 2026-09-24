'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { fetchApi } from '@/lib/api-client';

export default function InventoryPage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [balRes, ledRes]: [any, any] = await Promise.all([
        fetchApi('/inventory/balances'),
        fetchApi('/inventory/ledger'),
      ]);
      setBalances(balRes || []);
      setLedger(ledRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <div className="p-12 text-center font-mono font-black animate-pulse">LOADING INVENTORY ENGINE...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#A9D9F2] border-3 border-[#0A0A0A] p-4 shadow-neo">
        <h2 className="text-2xl font-black uppercase text-[#0A0A0A]">
          INVENTORY BALANCES & DOUBLE-ENTRY LEDGER
        </h2>
        <p className="text-xs font-mono font-bold uppercase text-gray-800">
          IMMUTABLE APPEND-ONLY STOCKLEDGER AS SOURCE OF TRUTH
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Balances */}
        <BadgeCard title="PHYSICAL VS RESERVED BALANCES" variant="sky">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-3 border-[#0A0A0A] bg-[#0A0A0A] text-white">
                  <th className="p-2">ITEM</th>
                  <th className="p-2">BATCH</th>
                  <th className="p-2 text-right">PHYSICAL</th>
                  <th className="p-2 text-right">RESERVED</th>
                  <th className="p-2 text-right">AVAILABLE</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((b) => (
                  <tr key={b.id} className="border-b-2 border-[#0A0A0A]">
                    <td className="p-2 font-bold">{b.itemName}</td>
                    <td className="p-2">{b.batch}</td>
                    <td className="p-2 text-right">{b.physicalQty}</td>
                    <td className="p-2 text-right text-red-600">{b.reservedQty}</td>
                    <td className="p-2 text-right font-black text-green-700">{b.availableQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BadgeCard>

        {/* Ledger Audit */}
        <BadgeCard title="STOCK LEDGER AUDIT HISTORY" variant="white">
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-3 border-[#0A0A0A] bg-[#0A0A0A] text-white">
                  <th className="p-2">REASON</th>
                  <th className="p-2">DELTA</th>
                  <th className="p-2">IDEMPOTENCY KEY</th>
                  <th className="p-2">TIME</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((l) => (
                  <tr key={l.id} className="border-b-2 border-[#0A0A0A]">
                    <td className="p-2 font-bold">{l.reason}</td>
                    <td className={`p-2 font-black ${l.delta >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {l.delta > 0 ? `+${l.delta}` : l.delta}
                    </td>
                    <td className="p-2 font-mono text-[10px] truncate max-w-[120px]">{l.idempotencyKey}</td>
                    <td className="p-2 text-[10px]">{new Date(l.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BadgeCard>
      </div>
    </div>
  );
}
