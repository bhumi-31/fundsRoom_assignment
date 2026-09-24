'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api-client';

export default function InventoryPage() {
  const [balances, setBalances] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [batch, setBatch] = useState('BATCH-2026-N1');
  const [quantity, setQuantity] = useState(50);

  const loadData = async () => {
    try {
      const [balRes, ledRes]: [any, any] = await Promise.all([
        fetchApi('/inventory/balances').catch(() => []),
        fetchApi('/inventory/ledger').catch(() => []),
      ]);
      const balList = Array.isArray(balRes) ? balRes : [];
      const ledList = Array.isArray(ledRes) ? ledRes : [];
      setBalances(balList);
      setLedger(ledList);

      if (balList.length > 0) {
        setSelectedLocationId(balList[0].locationId);
        setSelectedItemId(balList[0].itemId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await fetchApi('/inventory/receipt', {
        method: 'POST',
        body: JSON.stringify({
          locationId: selectedLocationId,
          itemId: selectedItemId,
          batch,
          quantity: Number(quantity),
          idempotencyKey: `RECEIPT-${selectedItemId}-${selectedLocationId}-${batch}-${Date.now()}`,
        }),
      });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to receive stock.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-mono font-black animate-pulse">LOADING INVENTORY ENGINE...</div>;
  }

  const uniqueLocations = Array.from(new Set(balances.map((b) => JSON.stringify({ id: b.locationId, name: b.locationName })))).map((s) => JSON.parse(s));
  const uniqueItems = Array.from(new Set(balances.map((b) => JSON.stringify({ id: b.itemId, name: b.itemName })))).map((s) => JSON.parse(s));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#A9D9F2] border-3 border-[#0A0A0A] p-4 shadow-neo flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-[#0A0A0A]">
            INVENTORY BALANCES & DOUBLE-ENTRY LEDGER
          </h2>
          <p className="text-xs font-mono font-bold uppercase text-gray-800">
            OPS / ADMIN AUTHORIZED // IMMUTABLE APPEND-ONLY STOCKLEDGER AS SOURCE OF TRUTH
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          + RECEIVE NEW STOCK
        </Button>
      </div>

      {/* Interactive Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#F5F1E8] border-3 border-[#0A0A0A] p-6 shadow-neo space-y-4">
            <div className="flex items-center justify-between border-b-3 border-[#0A0A0A] pb-3">
              <h3 className="text-xl font-black uppercase text-[#0A0A0A]">
                📦 RECEIVE NEW STOCK SHIPMENT
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 border-2 border-[#0A0A0A] bg-[#FF4D4D] text-white font-black text-sm shadow-neo-sm hover:translate-x-0.5 hover:translate-y-0.5"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 border-2 border-[#0A0A0A] bg-[#FF4D4D] text-white font-mono text-xs font-bold uppercase">
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleAddStock} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-black uppercase mb-1">TARGET WAREHOUSE LOCATION</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                >
                  {uniqueLocations.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">ITEM TO RECEIVE</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                >
                  {uniqueItems.map((item: any) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">BATCH CODE / NUMBER</label>
                <input
                  type="text"
                  required
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1">QUANTITY RECEIVED</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                  {submitting ? 'WRITING LEDGER ENTRY...' : 'POST STOCK RECEIPT →'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  <tr key={b.id} className="border-b-2 border-[#0A0A0A] hover:bg-white/60">
                    <td className="p-2 font-bold">{b.itemName}</td>
                    <td className="p-2">{b.batch}</td>
                    <td className="p-2 text-right font-bold">{b.physicalQty}</td>
                    <td className="p-2 text-right text-red-600 font-bold">{b.reservedQty}</td>
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
                  <tr key={l.id} className="border-b-2 border-[#0A0A0A] hover:bg-white/60">
                    <td className="p-2 font-bold">
                      <span className="px-1.5 py-0.5 border border-[#0A0A0A] bg-[#FFB800]/20">{l.reason}</span>
                    </td>
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
