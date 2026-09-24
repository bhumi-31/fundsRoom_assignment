import { prisma } from '../../db/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { CreateWorkOrderInput, UpdateWorkOrderStatusInput } from './work-order.schema.js';
import { emitInventoryEvent } from '../events/event.emitter.js';

export async function createWorkOrder(input: CreateWorkOrderInput) {
  const { locationId, itemId, requiredQty, assignedUserId } = input;

  const workOrder = await prisma.workOrder.create({
    data: {
      locationId,
      itemId,
      requiredQty,
      assignedUserId: assignedUserId || null,
    },
    include: {
      location: true,
      item: true,
      assignedUser: { select: { id: true, email: true, role: true } },
    },
  });

  emitInventoryEvent('work-order:updated', { id: workOrder.id, status: workOrder.status });
  return computeWorkOrderWithShortage(workOrder);
}

export async function getWorkOrders(filter?: { locationId?: string }) {
  const where: any = {};
  if (filter?.locationId) where.locationId = filter.locationId;

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      location: true,
      item: true,
      assignedUser: { select: { id: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return Promise.all(workOrders.map((wo) => computeWorkOrderWithShortage(wo)));
}

export async function updateWorkOrderStatus(id: string, input: UpdateWorkOrderStatusInput) {
  const existing = await prisma.workOrder.findUnique({ where: { id } });

  if (!existing) {
    throw ApiError.notFound(`Work order ${id} not found`);
  }

  const updated = await prisma.workOrder.update({
    where: { id },
    data: { status: input.status },
    include: {
      location: true,
      item: true,
      assignedUser: { select: { id: true, email: true, role: true } },
    },
  });

  emitInventoryEvent('work-order:updated', { id: updated.id, status: updated.status });
  return computeWorkOrderWithShortage(updated);
}

/**
 * Shortage calculation rule: shortage = max(requiredQty - availableAtLocation, 0)
 */
async function computeWorkOrderWithShortage(workOrder: any) {
  const balances = await prisma.inventoryBalance.findMany({
    where: {
      itemId: workOrder.itemId,
      locationId: workOrder.locationId,
    },
  });

  const availableAtLocation = balances.reduce(
    (sum, b) => sum + Math.max(0, b.physicalQty - b.reservedQty),
    0
  );

  const shortage = Math.max(0, workOrder.requiredQty - availableAtLocation);

  return {
    ...workOrder,
    availableAtLocation,
    shortage,
    hasShortage: shortage > 0,
  };
}
