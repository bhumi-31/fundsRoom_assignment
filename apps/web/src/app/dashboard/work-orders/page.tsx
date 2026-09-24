'use client';

import React, { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/ui/badge-card';
import { Button } from '@/components/ui/button';
import { fetchApi } from '@/lib/api-client';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [requiredQty, setRequiredQty] = useState(25);

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      try {
        const woRes = await fetchApi('/work-orders');
        setWorkOrders(woRes || []);
      } catch (e: any) {
        console.warn('Work orders fetch notice:', e.message);
      }

      try {
        const balRes = await fetchApi('/inventory/balances');
        const list = balRes || [];
        setBalances(list);

        if (list.length > 0) {
          setSelectedLocationId((prev) => prev || list[0].locationId);
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
    loadWorkOrders();
  }, []);

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await fetchApi('/work-orders', {
        method: 'POST',
        body: JSON.stringify({
          locationId: selectedLocationId,
          itemId: selectedItemId,
          requiredQty: Number(requiredQty),
        }),
      });
      setShowModal(false);
      loadWorkOrders();
    } catch (err: any) {
      setError(err.message || 'Failed to create work order.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await fetchApi(`/work-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadWorkOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to update work order status');
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-mono font-black animate-pulse">COMPUTING WORK ORDER SHORTAGES...</div>;
  }

  // Fallback lists if balances is not populated
  const uniqueLocations = Array.from(
    new Set(balances.map((b) => JSON.stringify({ id: b.locationId, name: b.locationName })))
  ).map((s) => JSON.parse(s));

  const uniqueItems = Array.from(
    new Set(balances.map((b) => JSON.stringify({ id: b.itemId, name: b.itemName })))
  ).map((s) => JSON.parse(s));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#FFB800] border-3 border-[#0A0A0A] p-4 shadow-neo flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase text-[#0A0A0A]">
            WORK ORDERS & SHORTAGE COMPUTATION ENGINE
          </h2>
          <p className="text-xs font-mono font-bold uppercase text-gray-800">
            ADMIN ROLE AUTHORIZED // SHORTAGE = MAX(REQUIRED_QTY - AVAILABLE_AT_LOCATION, 0)
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          + CREATE WORK ORDER
        </Button>
      </div>

      {/* Interactive Neobrutalist Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#F5F1E8] border-3 border-[#0A0A0A] p-6 shadow-neo space-y-4">
            <div className="flex items-center justify-between border-b-3 border-[#0A0A0A] pb-3">
              <h3 className="text-xl font-black uppercase text-[#0A0A0A]">
                ⚡ CREATE NEW WORK ORDER
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

            <form onSubmit={handleCreateWorkOrder} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block font-black uppercase mb-1">TARGET WAREHOUSE LOCATION</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
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
                <label className="block font-black uppercase mb-1">ITEM REQUIRED</label>
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
                <label className="block font-black uppercase mb-1">REQUIRED QUANTITY</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={requiredQty}
                  onChange={(e) => setRequiredQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border-3 border-[#0A0A0A] bg-white font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
                  {submitting ? 'DISPATCHING WORK ORDER...' : 'CONFIRM & ISSUE WORK ORDER →'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
                  CANCEL
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                <th className="p-3">STATUS & TRANSITION</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.length > 0 ? (
                workOrders.map((wo) => (
                  <tr key={wo.id} className="border-b-2 border-[#0A0A0A] hover:bg-white/60">
                    <td className="p-3 font-bold">{wo.id.slice(0, 8)}...</td>
                    <td className="p-3 font-bold">{wo.item?.name}</td>
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
                    <td className="p-3 font-bold uppercase">
                      <select
                        value={wo.status}
                        onChange={(e) => handleStatusChange(wo.id, e.target.value)}
                        className={`px-2 py-1 border-2 border-[#0A0A0A] font-mono text-xs font-black focus:outline-none cursor-pointer ${
                          wo.status === 'COMPLETED'
                            ? 'bg-[#3DDC84] text-black'
                            : wo.status === 'IN_PROGRESS'
                            ? 'bg-[#FFB800] text-black'
                            : 'bg-white text-black'
                        }`}
                      >
                        <option value="ASSIGNED">ASSIGNED</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center font-bold text-gray-600">
                    NO WORK ORDERS CREATED YET. CLICK "+ CREATE WORK ORDER" ABOVE.
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
