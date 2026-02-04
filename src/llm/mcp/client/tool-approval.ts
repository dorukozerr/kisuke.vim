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

export const requestApproval = (
  toolCallId: string,
  toolName: string,
  args: unknown
) =>
  new Promise<boolean>((resolve) => {
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
