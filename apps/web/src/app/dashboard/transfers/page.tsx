'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api-client';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [selectedDestId, setSelectedDestId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(25);

  const loadTransfers = async () => {
    setLoading(true);
    try {
      try {
        const trRes = await fetchApi('/transfers');
        setTransfers(trRes || []);
      } catch (e: any) {
        console.warn('Transfers fetch notice:', e.message);
      }

      try {
        const balRes = await fetchApi('/inventory/balances');
        const list = balRes || [];
        setBalances(list);

        if (list.length >= 2) {
          setSelectedSourceId((prev) => prev || list[0].locationId);
          setSelectedDestId((prev) => prev || list[1].locationId);
          setSelectedItemId((prev) => prev || list[0].itemId);
        } else if (list.length === 1) {
          setSelectedSourceId((prev) => prev || list[0].locationId);
          setSelectedItemId((prev) => prev || list[0].itemId);
        }
      } catch (e: any) {
        console.warn('Balances fetch notice:', e.message);
      }
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

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    if (selectedSourceId === selectedDestId) {
      setError('Source and Destination locations must be different.');
      setSubmitting(false);
      return;
    }

    try {
      await fetchApi('/transfers', {
        method: 'POST',
        body: JSON.stringify({
          sourceLocationId: selectedSourceId,
          destLocationId: selectedDestId,
          itemId: selectedItemId,
          batch: 'BATCH-2026-A1',
          quantity: Number(quantity),
        }),
      });
      setShowModal(false);
      loadTransfers();
    } catch (err: any) {
      setError(err.message || 'Failed to create transfer request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-mono font-black animate-pulse">LOADING TRANSFER STATE MACHINE...</div>;
  }

  const uniqueLocations = Array.from(
    new Set(balances.map((b) => JSON.stringify({ id: b.locationId, name: b.locationName })))
  ).map((s) => JSON.parse(s));

  const uniqueItems = Array.from(
    new Set(balances.map((b) => JSON.stringify({ id: b.itemId, name: b.itemName })))
  ).map((s) => JSON.parse(s));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#A9D9F2] border-3 border-[#0A0A0A] p-4 shadow-neo flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-[#0A0A0A]">
            INTERNAL WAREHOUSE TRANSFER STATE MACHINE
          </h2>
          <p className="text-xs font-mono font-bold uppercase text-gray-800">
            OPS ROLE AUTHORIZED // STRICT LIFECYCLE: REQUESTED → DISPATCHED → RECEIVED
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          + REQUEST NEW TRANSFER
        </Button>
      </div>

      {/* Interactive Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#F5F1E8] border-3 border-[#0A0A0A] p-6 shadow-neo space-y-4">
            <div className="flex items-center justify-between border-b-3 border-[#0A0A0A] pb-3">
              <h3 className="text-xl font-black uppercase text-[#0A0A0A]">
                🚚 REQUEST INTERNAL STOCK TRANSFER
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

            <form onSubmit={handleCreateTransfer} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-black uppercase mb-1">ITEM TO TRANSFER</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                >
                  {uniqueItems.length > 0 ? (
                    uniqueItems.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))
                  ) : (
                    <option value="00000000-0000-0000-0000-000000000002">Microcontroller Chip (Item 1)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">SOURCE WAREHOUSE LOCATION</label>
                <select
                  value={selectedSourceId}
                  onChange={(e) => setSelectedSourceId(e.target.value)}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                >
                  {uniqueLocations.length > 0 ? (
                    uniqueLocations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))
                  ) : (
                    <option value="00000000-0000-0000-0000-000000000001">Main Warehouse (Location 1)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">DESTINATION WAREHOUSE LOCATION</label>
                <select
                  value={selectedDestId}
                  onChange={(e) => setSelectedDestId(e.target.value)}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                >
                  {uniqueLocations.length > 0 ? (
                    uniqueLocations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))
                  ) : (
                    <option value="00000000-0000-0000-0000-000000000002">West Coast Depot (Location 2)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-black uppercase mb-1">TRANSFER QUANTITY</label>
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
                  {submitting ? 'CREATING TRANSFER REQUEST...' : 'SUBMIT TRANSFER REQUEST →'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              {transfers.length > 0 ? (
                transfers.map((t) => (
                  <tr key={t.id} className="border-b-2 border-[#0A0A0A] hover:bg-white/60">
                    <td className="p-3 font-bold">{t.id.slice(0, 8)}...</td>
                    <td className="p-3 font-bold">{t.item?.name}</td>
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
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center font-bold text-gray-600">
                    NO TRANSFERS REQUESTED YET. CLICK "+ REQUEST NEW TRANSFER" ABOVE.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </BadgeCard>
    </div>
  );
}
