import { z } from 'zod';
import { TransferStatus } from '@prisma/client';

export const createTransferSchema = z.object({
  body: z.object({
    sourceLocationId: z.string().uuid({ message: 'sourceLocationId must be a valid UUID' }),
    destLocationId: z.string().uuid({ message: 'destLocationId must be a valid UUID' }),
    itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
    batch: z.string().optional(),
    quantity: z.number().int().positive({ message: 'quantity must be a positive integer' }),
  }),
});

export const updateTransferStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'id must be a valid UUID' }),
  }),
  body: z.object({
    status: z.nativeEnum(TransferStatus, { errorMap: () => ({ message: 'Status must be DISPATCHED or RECEIVED' }) }),
    batch: z.string().min(1, { message: 'batch is required' }),
    idempotencyKey: z.string().min(1, { message: 'idempotencyKey is required' }),
  }),
});

export type CreateTransferInput = z.infer<typeof createTransferSchema>['body'];
export type UpdateTransferStatusInput = z.infer<typeof updateTransferStatusSchema>['body'];
