import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Must be a valid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    role: z.nativeEnum(Role, { errorMap: () => ({ message: 'Role must be ADMIN, OPS, or SALES' }) }),
    assignedLocationId: z.string().uuid().optional().nullable(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email({ message: 'Must be a valid email address' }),
    password: z.string().min(1, { message: 'Password is required' }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
