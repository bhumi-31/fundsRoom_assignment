import { z } from 'zod';
import { CustomerOrderStatus } from '@prisma/client';

export const createCustomerOrderSchema = z.object({
  body: z.object({
    customerRef: z.string().min(1, { message: 'customerRef is required' }),
    itemId: z.string().uuid({ message: 'itemId must be a valid UUID' }),
    locationId: z.string().uuid({ message: 'locationId must be a valid UUID' }),
    batch: z.string().min(1, { message: 'batch is required' }),
    quantity: z.number().int().positive({ message: 'quantity must be a positive integer' }),
    idempotencyKey: z.string().min(1, { message: 'idempotencyKey is required' }),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: 'id must be a valid UUID' }),
  }),
  body: z.object({
    status: z.nativeEnum(CustomerOrderStatus),
  }),
});

export type CreateCustomerOrderInput = z.infer<typeof createCustomerOrderSchema>['body'];
