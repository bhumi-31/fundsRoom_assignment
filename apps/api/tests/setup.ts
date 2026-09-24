import { beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/db/prisma.js';

beforeAll(async () => {
  // Ensure DB connection is ready
});

afterAll(async () => {
  await prisma.$disconnect();
});
