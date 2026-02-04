import { randomUUID } from 'crypto';

import { stdOutput } from '~/index';
import { ToolApprovalResponsePayload } from '~/types';

const pendingApprovals = new Map<
  string,
  {
    resolve: (approved: boolean) => void;
    timeout: NodeJS.Timeout;
  }
>();

const APPROVAL_TIMEOUT_MS = 30 * 1000; // 30 seconds

// Queue system to serialize approval requests
let approvalQueue: Promise<boolean> = Promise.resolve(true);

const requestApprovalInternal = (toolName: string, args: unknown) =>
  new Promise<boolean>((resolve) => {
    const toolCallId = `${toolName}-${Date.now()}-${randomUUID()}`;

    const timeout = setTimeout(() => {
      pendingApprovals.delete(toolCallId);
      resolve(false);
    }, APPROVAL_TIMEOUT_MS);

    pendingApprovals.set(toolCallId, { resolve, timeout });

    stdOutput({
      type: 'tool_approval_request',
      toolCallId,
      toolName,
      args
    });
  });

export const requestApproval = (toolName: string, args: unknown) => {
  // Chain approval requests to process one at a time
  approvalQueue = approvalQueue
    .catch(() => false)
    .then(() => requestApprovalInternal(toolName, args));

  return approvalQueue;
};

export const resolveToolApproval = ({
  toolCallId,
  approved
}: ToolApprovalResponsePayload) => {
  const pending = pendingApprovals.get(toolCallId);

  if (!pending) return false;

  clearTimeout(pending.timeout);

  pending.resolve(approved);
  pendingApprovals.delete(toolCallId);

  return true;
};

export const clearPendingApprovals = () => {
  for (const { resolve, timeout } of Array.from(pendingApprovals.values())) {
    clearTimeout(timeout);

    resolve(false);
  }

  pendingApprovals.clear();
};
