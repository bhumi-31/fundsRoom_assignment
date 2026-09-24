import { TransferStatus } from '@prisma/client';
import { ApiError } from '../../utils/apiError.js';

export function validateTransferTransition(currentStatus: TransferStatus, targetStatus: TransferStatus): void {
  if (currentStatus === TransferStatus.REQUESTED && targetStatus === TransferStatus.DISPATCHED) {
    return; // Valid: REQUESTED -> DISPATCHED
  }

  if (currentStatus === TransferStatus.DISPATCHED && targetStatus === TransferStatus.RECEIVED) {
    return; // Valid: DISPATCHED -> RECEIVED
  }

  if (currentStatus === TransferStatus.RECEIVED) {
    throw ApiError.conflict(
      `Transfer is already in final RECEIVED state and cannot be modified further.`,
      'TRANSFER_ALREADY_RECEIVED'
    );
  }

  throw ApiError.badRequest(
    `Invalid status transition from '${currentStatus}' to '${targetStatus}'. Allowed flow: REQUESTED -> DISPATCHED -> RECEIVED`,
    'INVALID_TRANSFER_TRANSITION'
  );
}
