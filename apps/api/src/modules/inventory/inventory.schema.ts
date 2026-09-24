import { z } from 'zod';
import { LedgerReason } from '@prisma/client';

export const reserveInventorySchema = z.object({
  body: z.object({
    itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
    locationId: z.string().uuid({ message: 'locationId must be a valid UUID' }),
    batch: z.string().min(1, { message: 'batch is required' }),
    quantity: z.number().int().positive({ message: 'quantity must be a positive integer' }),
    idempotencyKey: z.string().min(1, { message: 'idempotencyKey is required' }),
    refType: z.string().optional(),
    refId: z.string().optional(),
  }),
});

export const addStockReceiptSchema = z.object({
  body: z.object({
    itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
    locationId: z.string().uuid({ message: 'locationId must be a valid UUID' }),
    batch: z.string().min(1, { message: 'batch is required' }),
    quantity: z.number().int().positive({ message: 'quantity must be a positive integer' }),
    idempotencyKey: z.string().min(1, { message: 'idempotencyKey is required' }),
  }),
});

export const getInventoryQuerySchema = z.object({
  query: z.object({
    locationId: z.string().uuid().optional(),
    itemId: z.string().uuid().optional(),
  }),
});

export type ReserveInventoryInput = z.infer<typeof reserveInventorySchema>['body'];
export type AddStockReceiptInput = z.infer<typeof addStockReceiptSchema>['body'];
