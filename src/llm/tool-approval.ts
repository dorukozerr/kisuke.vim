import { Tool, ToolExecutionOptions } from 'ai';

import { stdOutput } from '~/index';
import { ToolApprovalResponsePayload } from '~/types';

type PendingApproval = {
  resolve: (approved: boolean) => void;
  timeout: NodeJS.Timeout;
};

const pendingApprovals = new Map<string, PendingApproval>();

const APPROVAL_TIMEOUT_MS = 30 * 1000; // 30 seconds

const requestApproval = (toolCallId: string, toolName: string, args: unknown) =>
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

export const withApproval = <T extends Record<string, Tool>>(tools: T): T =>
  Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => [
      name,
      {
        ...tool,
        execute: async (args: unknown, context: ToolExecutionOptions) => {
          const approved = await requestApproval(
            context.toolCallId,
            name,
            args
          );

          if (!approved) return '[Tool denied by user]';

          return tool.execute?.(args, context);
        }
      }
    ])
  ) as unknown as T;
