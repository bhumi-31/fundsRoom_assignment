import { z } from 'zod';
import { WorkOrderStatus } from '@prisma/client';

export const createWorkOrderSchema = z.object({
  body: z.object({
    locationId: z.string().uuid({ message: 'locationId must be a valid UUID' }),
    itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
    requiredQty: z.number().int().positive({ message: 'requiredQty must be a positive integer' }),
    assignedUserId: z.string().uuid().optional().nullable(),
  }),
});

export const updateWorkOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'id must be a valid UUID' }),
  }),
  body: z.object({
    status: z.nativeEnum(WorkOrderStatus, { errorMap: () => ({ message: 'Invalid status' }) }),
  }),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>['body'];
export type UpdateWorkOrderStatusInput = z.infer<typeof updateWorkOrderStatusSchema>['body'];
