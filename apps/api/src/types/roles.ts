import { Role as PrismaRole } from '@prisma/client';

export type Role = PrismaRole;
export const Role = {
  ADMIN: 'ADMIN' as const,
  OPS: 'OPS' as const,
  SALES: 'SALES' as const,
};
