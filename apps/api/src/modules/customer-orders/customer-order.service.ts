import { prisma } from '../../db/prisma.js';
import { reserveInventoryAtomic } from '../inventory/inventory.service.js';
import { CreateCustomerOrderInput } from './customer-order.schema.js';
import { CustomerOrderStatus, LedgerReason } from '@prisma/client';
import { ApiError } from '../../utils/apiError.js';
import { emitInventoryEvent } from '../events/event.emitter.js';

export async function createCustomerOrder(input: CreateCustomerOrderInput, salesUserId: string) {
  const { customerRef, itemId, locationId, batch, quantity, idempotencyKey } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Create order reservation record first
    const order = await tx.customerOrder.create({
      data: {
        customerRef,
        itemId,
        locationId,
        quantity,
        status: CustomerOrderStatus.RESERVED,
        salesUserId,
      },
      include: {
        item: true,
        location: true,
        salesUser: { select: { id: true, email: true, role: true } },
      },
    });

    // 2. Perform atomic inventory reservation
    await reserveInventoryAtomic(
      {
        itemId,
        locationId,
        batch,
        quantity,
        idempotencyKey,
        refType: 'CUSTOMER_ORDER',
        refId: order.id,
      },
      salesUserId
    );

    emitInventoryEvent('order:created', { id: order.id, customerRef });
    return order;
  });
}

export async function getCustomerOrders(filter?: { salesUserId?: string }) {
  const where: any = {};
  if (filter?.salesUserId) where.salesUserId = filter.salesUserId;

  return prisma.customerOrder.findMany({
    where,
    include: {
      item: true,
      location: true,
      salesUser: { select: { id: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * CANCEL ORDER & RELEASE RESERVED STOCK
 * Atomically transitions order to CANCELLED and decrements reservedQty
 * on the InventoryBalance, writing a RELEASE ledger entry.
 */
export async function cancelCustomerOrder(orderId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    // 1. Fetch order
    const order = await tx.customerOrder.findUnique({
      where: { id: orderId },
      include: { item: true, location: true },
    });

    if (!order) {
      throw ApiError.notFound(`Customer order ${orderId} not found`);
    }

    if (order.status === CustomerOrderStatus.CANCELLED) {
      throw ApiError.conflict(
        `Order ${orderId} is already cancelled`,
        'ORDER_ALREADY_CANCELLED'
      );
    }

    // 2. Find the original reservation ledger entry or lookup batch from InventoryBalance
    const reservationLedger = await tx.stockLedger.findFirst({
      where: {
        refType: 'CUSTOMER_ORDER',
        refId: orderId,
        reason: LedgerReason.RESERVE,
      },
    });

    let batch = reservationLedger?.batch;
    if (!batch) {
      const balanceMatch = await tx.inventoryBalance.findFirst({
        where: { itemId: order.itemId, locationId: order.locationId },
      });
      batch = balanceMatch?.batch || 'BATCH-2026-B1';
    }

    // 3. Release reserved qty on InventoryBalance
    await tx.inventoryBalance.updateMany({
      where: {
        itemId: order.itemId,
        locationId: order.locationId,
        batch,
      },
      data: {
        reservedQty: { decrement: order.quantity },
      },
    });

    // 4. Write RELEASE ledger entry
    await tx.stockLedger.create({
      data: {
        itemId: order.itemId,
        locationId: order.locationId,
        batch,
        delta: 0, // Release changes reservedQty, not physicalQty
        reason: LedgerReason.RELEASE,
        refType: 'CUSTOMER_ORDER_CANCEL',
        refId: orderId,
        idempotencyKey: `CANCEL-${orderId}`,
        createdBy: userId,
      },
    });

    // 5. Update order status to CANCELLED
    const cancelled = await tx.customerOrder.update({
      where: { id: orderId },
      data: { status: CustomerOrderStatus.CANCELLED },
      include: {
        item: true,
        location: true,
        salesUser: { select: { id: true, email: true, role: true } },
      },
    });

    emitInventoryEvent('order:cancelled', { id: orderId });
    emitInventoryEvent('inventory:updated', {
      itemId: order.itemId,
      locationId: order.locationId,
      batch,
    });

    return cancelled;
  });
}
