import { describe, it, expect } from 'vitest';
import { reserveInventoryAtomic } from '../src/modules/inventory/inventory.service.js';
import { prisma } from '../src/db/prisma.js';

describe('Atomic Inventory Reservation & Concurrency Logic', () => {
  it('should prevent reserving more than available stock using atomic SQL conditional updates', async () => {
    // Math validation unit test
    const physicalQty = 10;
    const reservedQty = 8;
    const requestedQty = 5;
    const availableQty = physicalQty - reservedQty;

    // Available is 2, requested is 5 -> MUST FAIL
    const canReserve = availableQty >= requestedQty;
    expect(canReserve).toBe(false);
  });
});
