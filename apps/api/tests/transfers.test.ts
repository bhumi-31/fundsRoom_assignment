import { describe, it, expect } from 'vitest';
import { validateTransferTransition } from '../src/modules/transfers/transfer.state-machine.js';
import { TransferStatus } from '@prisma/client';
import { ApiError } from '../src/utils/apiError.js';

describe('Transfer State Machine Rules', () => {
  it('should allow valid linear transition REQUESTED -> DISPATCHED -> RECEIVED', () => {
    expect(() => validateTransferTransition(TransferStatus.REQUESTED, TransferStatus.DISPATCHED)).not.toThrow();
    expect(() => validateTransferTransition(TransferStatus.DISPATCHED, TransferStatus.RECEIVED)).not.toThrow();
  });

  it('should reject invalid direct transition REQUESTED -> RECEIVED', () => {
    expect(() => validateTransferTransition(TransferStatus.REQUESTED, TransferStatus.RECEIVED)).toThrow(ApiError);
  });

  it('should reject same transfer from being RECEIVED twice (Mandatory Test #4)', () => {
    expect(() => validateTransferTransition(TransferStatus.RECEIVED, TransferStatus.RECEIVED)).toThrow(ApiError);
  });
});
