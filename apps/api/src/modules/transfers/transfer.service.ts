import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { LedgerReason, TransferStatus } from '@prisma/client';
import { validateTransferTransition } from './transfer.state-machine.js';
import { CreateTransferInput, UpdateTransferStatusInput } from './transfer.schema.js';
import { emitInventoryEvent } from '../events/event.emitter.js';

export async function createTransfer(input: CreateTransferInput) {
  const { sourceLocationId, destLocationId, itemId, quantity } = input;

  if (sourceLocationId === destLocationId) {
    throw ApiError.badRequest('Source and destination locations cannot be identical');
  }

  const transfer = await prisma.transfer.create({
    data: {
      sourceLocationId,
      destLocationId,
      itemId,
      quantity,
      status: TransferStatus.REQUESTED,
    },
    include: {
      sourceLocation: true,
      destLocation: true,
      item: true,
    },
  });

  emitInventoryEvent('transfer:updated', { id: transfer.id, status: transfer.status });
  return transfer;
}

export async function getTransfers(filter?: { locationId?: string }) {
  const where: any = {};
  if (filter?.locationId) {
    where.OR = [
      { sourceLocationId: filter.locationId },
      { destLocationId: filter.locationId },
    ];
  }

  return prisma.transfer.findMany({
    where,
    include: {
      sourceLocation: true,
      destLocation: true,
      item: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * ATOMIC TRANSFER STATE TRANSITION ENGINE
 */
export async function transitionTransferStatus(
  transferId: string,
  input: UpdateTransferStatusInput,
  userId: string
) {
  const { status: targetStatus, batch, idempotencyKey } = input;

  return prisma.$transaction(async (tx) => {
    // 1. Fetch Transfer & Validate existence
    const transfer = await tx.transfer.findUnique({
      where: { id: transferId },
      include: { sourceLocation: true, destLocation: true, item: true },
    });

    if (!transfer) {
      throw ApiError.notFound(`Transfer request ${transferId} not found`);
    }

    // 2. State Machine Rule Validation
    validateTransferTransition(transfer.status, targetStatus);

    // 3. Check Idempotency Key
    const existingLedger = await tx.stockLedger.findUnique({
      where: { idempotencyKey },
    });

    if (existingLedger) {
      return tx.transfer.findUnique({
        where: { id: transferId },
        include: { sourceLocation: true, destLocation: true, item: true },
      });
    }

    if (targetStatus === TransferStatus.DISPATCHED) {
      // DISPATCHED: Deduct physical stock from SOURCE location. Destination stock is untouched!
      const sourceBalance = await tx.inventoryBalance.findUnique({
        where: {
          itemId_locationId_batch: {
            itemId: transfer.itemId,
            locationId: transfer.sourceLocationId,
            batch,
          },
        },
      });

      const available = (sourceBalance?.physicalQty || 0) - (sourceBalance?.reservedQty || 0);

      if (!sourceBalance || available < transfer.quantity) {
        throw ApiError.conflict(
          `Cannot dispatch transfer: Source location has insufficient available inventory (${available} < ${transfer.quantity})`,
          'INSUFFICIENT_TRANSFER_STOCK'
        );
      }

      // Deduct physical qty from source
      await tx.inventoryBalance.update({
        where: { id: sourceBalance.id },
        data: { physicalQty: { decrement: transfer.quantity } },
      });

      // Write DISPATCH ledger entry
      await tx.stockLedger.create({
        data: {
          itemId: transfer.itemId,
          locationId: transfer.sourceLocationId,
          batch,
          delta: -transfer.quantity,
          reason: LedgerReason.DISPATCH,
          refType: 'TRANSFER_DISPATCH',
          refId: transfer.id,
          idempotencyKey,
          createdBy: userId,
        },
      });

      // Update transfer record
      const updatedTransfer = await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.DISPATCHED,
          dispatchedAt: new Date(),
        },
        include: { sourceLocation: true, destLocation: true, item: true },
      });

      emitInventoryEvent('transfer:updated', { id: transferId, status: TransferStatus.DISPATCHED });
      return updatedTransfer;
    }

    if (targetStatus === TransferStatus.RECEIVED) {
      // RECEIVED: Increase physical stock at DESTINATION location. Must already be DISPATCHED.
      const updatedDestBalance = await tx.inventoryBalance.upsert({
        where: {
          itemId_locationId_batch: {
            itemId: transfer.itemId,
            locationId: transfer.destLocationId,
            batch,
          },
        },
        update: {
          physicalQty: { increment: transfer.quantity },
        },
        create: {
          itemId: transfer.itemId,
          locationId: transfer.destLocationId,
          batch,
          physicalQty: transfer.quantity,
          reservedQty: 0,
        },
      });

      // Write RECEIVE_TRANSFER ledger entry
      await tx.stockLedger.create({
        data: {
          itemId: transfer.itemId,
          locationId: transfer.destLocationId,
          batch,
          delta: transfer.quantity,
          reason: LedgerReason.RECEIVE_TRANSFER,
          refType: 'TRANSFER_RECEIVE',
          refId: transfer.id,
          idempotencyKey,
          createdBy: userId,
        },
      });

      // Update transfer record
      const updatedTransfer = await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: TransferStatus.RECEIVED,
          receivedAt: new Date(),
        },
        include: { sourceLocation: true, destLocation: true, item: true },
      });

      emitInventoryEvent('transfer:updated', { id: transferId, status: TransferStatus.RECEIVED });
      return updatedTransfer;
    }

    throw ApiError.badRequest(`Unsupported transition status: ${targetStatus}`);
  });
}
