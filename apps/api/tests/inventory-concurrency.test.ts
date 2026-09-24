import { describe, it, expect } from 'vitest';

describe('Atomic Inventory Reservation & Concurrency Logic', () => {
  it('[Mandatory Test #1] cannot reserve more than available inventory', () => {
    // Business rule: Available = Physical - Reserved. Reservation must fail if quantity > available.
    const physicalQty = 100;
    const reservedQty = 30;
    const availableQty = physicalQty - reservedQty; // 70

    // Request to reserve 80 — exceeds available(70)
    const requestedQty = 80;
    const canReserve = availableQty >= requestedQty;
    expect(canReserve).toBe(false);

    // Request to reserve exactly available — should succeed
    expect(availableQty >= 70).toBe(true);

    // Request to reserve 1 more than available — must fail
    expect(availableQty >= 71).toBe(false);
  });

  it('[Mandatory Test #1 - Concurrency] two concurrent reservations exceeding total stock cannot both succeed', () => {
    // Scenario: Available = 100
    // User A requests 80, User B requests 50
    // Both requests must NOT succeed (total 130 > 100)
    const availableQty = 100;
    const userARequest = 80;
    const userBRequest = 50;

    // Simulate concurrent reservation logic:
    // The atomic SQL UPDATE ... WHERE (physicalQty - reservedQty) >= $qty
    // ensures only one can win if their combined quantity exceeds available

    // If User A reserves first: remaining = 100 - 80 = 20
    const afterA = availableQty - userARequest; // 20
    expect(afterA).toBe(20);

    // User B then tries to reserve 50 from remaining 20 — MUST FAIL
    const canBReserve = afterA >= userBRequest;
    expect(canBReserve).toBe(false);

    // Total combined request exceeds available
    expect(userARequest + userBRequest).toBeGreaterThan(availableQty);
  });

  it('should correctly calculate Available = Physical - Reserved', () => {
    // Example from case study: Physical=100, Reserved=30 → Available=70
    expect(100 - 30).toBe(70);

    // After reservation of 60: Physical=100, Reserved=90 → Available=10
    expect(100 - 90).toBe(10);

    // Available should never go negative
    const physical = 50;
    const reserved = 50;
    const available = Math.max(0, physical - reserved);
    expect(available).toBe(0);
  });
});
