import { randomUUID } from 'crypto';

import { stdOutput } from '#/index';
import type { RequestApprovalResponsePayload } from '#/types';

const pendingApprovals = new Map<
  string,
  {
    resolve: (approved: boolean) => void;
    timeout: NodeJS.Timeout;
  }
>();

const APPROVAL_TIMEOUT_MS = 30 * 1000; // 30 seconds

let approvalQueue: Promise<boolean> = Promise.resolve(true);

const requestApprovalInternal = (message: string) =>
  new Promise<boolean>((resolve) => {
    const requestId = `${Date.now()}-${randomUUID()}`;

    const timeout = setTimeout(() => {
      pendingApprovals.delete(requestId);
      resolve(false);
    }, APPROVAL_TIMEOUT_MS);

    pendingApprovals.set(requestId, { resolve, timeout });

    stdOutput({
      type: 'request_approval',
      requestId,
      message
    });
  });

export const requestApproval = (message: string) => {
  approvalQueue = approvalQueue
    .catch(() => false)
    .then(() => requestApprovalInternal(message));

  return approvalQueue;
};

export const resolveRequestApproval = ({
  requestId,
  approved
}: RequestApprovalResponsePayload) => {
  const pending = pendingApprovals.get(requestId);
  if (!pending) return;

  clearTimeout(pending.timeout);

  pending.resolve(approved);
  pendingApprovals.delete(requestId);
};

export const clearPendingApprovals = () => {
  for (const { resolve, timeout } of Array.from(pendingApprovals.values())) {
    clearTimeout(timeout);
    resolve(false);
  }

  pendingApprovals.clear();
};
