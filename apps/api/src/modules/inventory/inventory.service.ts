import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { LedgerReason } from '@prisma/client';
import { ReserveInventoryInput, AddStockReceiptInput } from './inventory.schema.js';
import { emitInventoryEvent } from '../events/event.emitter.js';

export async function getInventoryBalances(filter?: { locationId?: string; itemId?: string }) {
  const where: any = {};
  if (filter?.locationId) where.locationId = filter.locationId;
  if (filter?.itemId) where.itemId = filter.itemId;

  const balances = await prisma.inventoryBalance.findMany({
    where,
    include: {
      item: true,
      location: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return balances.map((b) => ({
    id: b.id,
    itemId: b.itemId,
    itemSku: b.item.sku,
    itemName: b.item.name,
    itemCategory: b.item.category,
    locationId: b.locationId,
    locationName: b.location.name,
    batch: b.batch,
    physicalQty: b.physicalQty,
    reservedQty: b.reservedQty,
    availableQty: b.physicalQty - b.reservedQty,
    isLowStock: b.physicalQty - b.reservedQty <= 20,
    updatedAt: b.updatedAt,
  }));
}

export async function getStockLedgerHistory(filter?: { locationId?: string; itemId?: string }) {
  const where: any = {};
  if (filter?.locationId) where.locationId = filter.locationId;
  if (filter?.itemId) where.itemId = filter.itemId;

  return prisma.stockLedger.findMany({
    where,
    include: {
      item: true,
      location: true,
      user: {
        select: { id: true, email: true, role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}

/**
 * ATOMIC RESERVATION ENGINE
 * Uses conditional SQL UPDATE inside Prisma $transaction to guarantee zero race conditions.
 * UPDATE InventoryBalance SET reservedQty = reservedQty + $qty WHERE itemId=$1 AND locationId=$2 AND batch=$3 AND (physicalQty - reservedQty) >= $qty
 */
export async function reserveInventoryAtomic(input: ReserveInventoryInput, userId: string) {
  const { itemId, locationId, batch, quantity, idempotencyKey, refType, refId } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Idempotency Check: if key already exists, return previous record
    const existingLedger = await tx.stockLedger.findUnique({
      where: { idempotencyKey },
    });

    if (existingLedger) {
      const balance = await tx.inventoryBalance.findUnique({
        where: { itemId_locationId_batch: { itemId, locationId, batch } },
      });
      return {
        idempotent: true,
        ledgerId: existingLedger.id,
        balance,
      };
    }

    // 2. Atomic SQL Conditional Update
    const updatedCount: number = await tx.$executeRaw`
      UPDATE "InventoryBalance"
      SET "reservedQty" = "reservedQty" + ${quantity},
          "updatedAt" = NOW()
      WHERE "itemId" = ${itemId}
        AND "locationId" = ${locationId}
        AND "batch" = ${batch}
        AND ("physicalQty" - "reservedQty") >= ${quantity}
    `;

    if (updatedCount === 0) {
      throw ApiError.conflict(
        `Insufficient available inventory for item ${itemId} at location ${locationId} (batch ${batch})`,
        'INSUFFICIENT_STOCK'
      );
    }

    // 3. Append to StockLedger (Source of Truth)
    const ledgerEntry = await tx.stockLedger.create({
      data: {
        itemId,
        locationId,
        batch,
        delta: 0, // Reservation increases reservedQty, physical delta is 0
        reason: LedgerReason.RESERVE,
        refType: refType || 'RESERVATION',
        refId: refId || null,
        idempotencyKey,
        createdBy: userId,
      },
    });

    // 4. Fetch updated projection
    const updatedBalance = await tx.inventoryBalance.findUnique({
      where: { itemId_locationId_batch: { itemId, locationId, batch } },
      include: { item: true, location: true },
    });

    emitInventoryEvent('inventory:updated', {
      itemId,
      locationId,
      batch,
      availableQty: (updatedBalance?.physicalQty || 0) - (updatedBalance?.reservedQty || 0),
    });

    return {
      idempotent: false,
      ledgerId: ledgerEntry.id,
      balance: updatedBalance,
    };
  });
}

/**
 * RECEIPT ENGINE: Adds stock to InventoryBalance & writes to StockLedger
 */
export async function addStockReceipt(input: AddStockReceiptInput, userId: string) {
  const { itemId, locationId, batch, quantity, idempotencyKey } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Idempotency Check
    const existingLedger = await tx.stockLedger.findUnique({
      where: { idempotencyKey },
    });

    if (existingLedger) {
      const balance = await tx.inventoryBalance.findUnique({
        where: { itemId_locationId_batch: { itemId, locationId, batch } },
      });
      return { idempotent: true, ledgerId: existingLedger.id, balance };
    }

    // 2. Upsert InventoryBalance
    const updatedBalance = await tx.inventoryBalance.upsert({
      where: { itemId_locationId_batch: { itemId, locationId, batch } },
      update: {
        physicalQty: { increment: quantity },
      },
      create: {
        itemId,
        locationId,
        batch,
        physicalQty: quantity,
        reservedQty: 0,
      },
      include: { item: true, location: true },
    });

    // 3. Create StockLedger entry
    const ledgerEntry = await tx.stockLedger.create({
      data: {
        itemId,
        locationId,
        batch,
        delta: quantity,
        reason: LedgerReason.RECEIPT,
        refType: 'STOCK_RECEIPT',
        idempotencyKey,
        createdBy: userId,
      },
    });

    emitInventoryEvent('inventory:updated', {
      itemId,
      locationId,
      batch,
      availableQty: updatedBalance.physicalQty - updatedBalance.reservedQty,
    });

    return { idempotent: false, ledgerId: ledgerEntry.id, balance: updatedBalance };
  });
}
