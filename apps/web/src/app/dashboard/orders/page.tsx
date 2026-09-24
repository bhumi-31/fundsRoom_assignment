'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api-client';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [customerRef, setCustomerRef] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [quantity, setQuantity] = useState(10);

  const loadOrders = async () => {
    try {
      const [ordRes, balRes]: [any, any] = await Promise.all([
        fetchApi('/orders'),
        fetchApi('/inventory/balances'),
      ]);
      setOrders(ordRes || []);
      setBalances(balRes || []);

      if (balRes && balRes.length > 0) {
        setSelectedItemId(balRes[0].itemId);
        setSelectedLocationId(balRes[0].locationId);
        setSelectedBatch(balRes[0].batch);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await fetchApi('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerRef,
          itemId: selectedItemId,
          locationId: selectedLocationId,
          batch: selectedBatch,
          quantity: Number(quantity),
          idempotencyKey: `ORD-${customerRef}-${selectedItemId}-${Date.now()}`,
        }),
      });
      setShowModal(false);
      setCustomerRef('');
      loadOrders();
    } catch (err: any) {
      setError(err.message || 'Failed to create reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation? This will release the reserved stock.')) return;
    try {
      await fetchApi(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-mono font-black animate-pulse">LOADING CUSTOMER RESERVATIONS...</div>;
  }

  const uniqueLocations = Array.from(new Set(balances.map((b) => JSON.stringify({ id: b.locationId, name: b.locationName })))).map((s) => JSON.parse(s));
  const uniqueItems = Array.from(new Set(balances.map((b) => JSON.stringify({ id: b.itemId, name: b.itemName })))).map((s) => JSON.parse(s));
  const batchesForSelection = balances.filter(
    (b) => b.itemId === selectedItemId && b.locationId === selectedLocationId
  );

  // Get available qty for selected batch
  const selectedBalance = balances.find(
    (b) => b.itemId === selectedItemId && b.locationId === selectedLocationId && b.batch === selectedBatch
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FF6FA8] border-3 border-[#0A0A0A] p-4 shadow-neo flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-[#0A0A0A]">
            CUSTOMER ORDERS & ATOMIC RESERVATION DESK
          </h2>
          <p className="text-xs font-mono font-bold uppercase text-[#0A0A0A]">
            SALES ROLE AUTHORIZED // ATOMIC CONDITIONAL RESERVATION ENGINE
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          + CREATE CUSTOMER ORDER
        </Button>
      </div>

      {/* Interactive Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#F5F1E8] border-3 border-[#0A0A0A] p-6 shadow-neo space-y-4">
            <div className="flex items-center justify-between border-b-3 border-[#0A0A0A] pb-3">
              <h3 className="text-xl font-black uppercase text-[#0A0A0A]">
                🛒 RESERVE STOCK FOR CUSTOMER
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

            <form onSubmit={handleCreateOrder} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-black uppercase mb-1">CUSTOMER REFERENCE / NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ACME-CORP-2026"
                  value={customerRef}
                  onChange={(e) => setCustomerRef(e.target.value)}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-black uppercase mb-1">ITEM TO RESERVE</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => {
                    setSelectedItemId(e.target.value);
                    const match = balances.find((b) => b.itemId === e.target.value);
                    if (match) {
                      setSelectedLocationId(match.locationId);
                      setSelectedBatch(match.batch);
                    }
                  }}
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
                <label className="block font-black uppercase mb-1">WAREHOUSE LOCATION</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => {
                    setSelectedLocationId(e.target.value);
                    const match = balances.find((b) => b.itemId === selectedItemId && b.locationId === e.target.value);
                    if (match) setSelectedBatch(match.batch);
                  }}
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
                <label className="block font-black uppercase mb-1">BATCH</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                >
                  {batchesForSelection.map((b: any) => (
                    <option key={b.batch} value={b.batch}>
                      {b.batch} (Available: {b.availableQty})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBalance && (
                <div className="p-2 border-2 border-[#0A0A0A] bg-[#A9D9F2]/30 text-[11px] font-bold uppercase">
                  📊 AVAILABLE STOCK: <span className="text-green-700 font-black">{selectedBalance.availableQty}</span> | PHYSICAL: {selectedBalance.physicalQty} | RESERVED: {selectedBalance.reservedQty}
                </div>
              )}

              <div>
                <label className="block font-black uppercase mb-1">RESERVATION QUANTITY</label>
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
                  {submitting ? 'LOCKING INVENTORY...' : 'CONFIRM RESERVATION →'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <th className="p-3 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b-2 border-[#0A0A0A] hover:bg-white/60">
                  <td className="p-3 font-bold">{o.id.slice(0, 8)}...</td>
                  <td className="p-3 font-black text-[#0A0A0A]">{o.customerRef}</td>
                  <td className="p-3 font-bold">{o.item?.name}</td>
                  <td className="p-3">{o.location?.name}</td>
                  <td className="p-3 text-right font-black">{o.quantity}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 font-black border-2 border-[#0A0A0A] ${
                        o.status === 'RESERVED'
                          ? 'bg-[#3DDC84] text-[#0A0A0A]'
                          : 'bg-[#FF4D4D] text-white'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700">{o.salesUser?.email}</td>
                  <td className="p-3 text-center">
                    {o.status === 'RESERVED' && (
                      <Button variant="danger" size="sm" onClick={() => handleCancelOrder(o.id)}>
                        CANCEL
                      </Button>
                    )}
                    {o.status === 'CANCELLED' && (
                      <span className="text-gray-500 font-bold text-[10px]">CANCELLED</span>
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
