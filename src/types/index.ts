import { z } from 'zod';

import {
  clientPayloadSchema,
  configSchema,
  historySchema,
  mcpClientRootsConfigSchema,
  serverPayloadSchema,
  sessionSchema
} from '#/schemas';

export type Config = z.infer<typeof configSchema>;
export type History = z.infer<typeof historySchema>;
export type Session = z.infer<typeof sessionSchema>;
export type ClientPayload = z.infer<typeof clientPayloadSchema>;
export type ServerPayload = z.infer<typeof serverPayloadSchema>;
export type MCPClientRootsConfig = z.infer<typeof mcpClientRootsConfigSchema>;

export type InitializePayload = Extract<ClientPayload, { type: 'initialize' }>;
export type PromptPayload = Extract<ClientPayload, { type: 'prompt' }>;
export type RestoreSessionPayload = Extract<
  ClientPayload,
  { type: 'restore_session' }
>;
export type DeleteSessionPayload = Extract<
  ClientPayload,
  { type: 'delete_session' }
>;
export type NextSessionPayload = Extract<
  ClientPayload,
  { type: 'next_session' }
>;
export type PreviousSessionPayload = Extract<
  ClientPayload,
  { type: 'previous_session' }
>;
export type RequestApprovalResponsePayload = Extract<
  ClientPayload,
  { type: 'request_approval_response' }
>;
