import { prisma } from '../../db/prisma.js';
import { reserveInventoryAtomic } from '../inventory/inventory.service.js';
import { CreateCustomerOrderInput } from './customer-order.schema.js';
import { CustomerOrderStatus } from '@prisma/client';
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
