import { z } from 'zod';

import {
  clientPayloadSchema,
  configSchema,
  historySchema,
  mcpConfigSchema,
  mcpServerConfigSchema,
  serverPayloadSchema,
  sessionSchema
} from '~/schemas';

export type Config = z.infer<typeof configSchema>;
export type History = z.infer<typeof historySchema>;
export type Session = z.infer<typeof sessionSchema>;
export type ClientPayload = z.infer<typeof clientPayloadSchema>;
export type ServerPayload = z.infer<typeof serverPayloadSchema>;
export type McpServerConfig = z.infer<typeof mcpServerConfigSchema>;
export type McpConfig = z.infer<typeof mcpConfigSchema>;

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
