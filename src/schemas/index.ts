import { z } from 'zod';

const baseConfigSchema = z.object({
  apiKeys: z.object({
    anthropic: z.string(),
    google: z.string(),
    openai: z.string(),
    xai: z.string()
  })
});

export const configSchema = z
  .discriminatedUnion('provider', [
    baseConfigSchema.extend({
      provider: z.literal('anthropic'),
      model: z
        .enum([
          'claude-opus-4-6',
          'claude-opus-4-5-20251101',
          'claude-opus-4-5',
          'claude-opus-4-20250514',
          'claude-opus-4-1-20250805',
          'claude-opus-4-1',
          'claude-opus-4-0',
          'claude-sonnet-4-5-20250929',
          'claude-sonnet-4-5',
          'claude-sonnet-4-20250514',
          'claude-sonnet-4-0',
          'claude-haiku-4-5-20251001',
          'claude-haiku-4-5',
          'claude-3-7-sonnet-20250219',
          'claude-3-7-sonnet-latest',
          'claude-3-5-haiku-20241022',
          'claude-3-5-haiku-latest',
          'claude-3-haiku-20240307'
        ])
        .or(z.string().max(0))
    }),
    baseConfigSchema.extend({
      provider: z.literal('google'),
      model: z
        .enum([
          'gemini-3-pro-preview',
          'gemini-3-flash-preview',
          'gemini-2.5-pro',
          'gemini-2.5-pro-exp-03-25',
          'gemini-2.5-flash',
          'gemini-2.5-flash-lite',
          'gemini-2.5-flash-lite-preview-09-2025',
          'gemini-2.5-flash-preview-04-17',
          'gemini-2.5-flash-preview-09-2025',
          'gemini-2.0-flash',
          'gemini-2.0-flash-001',
          'gemini-2.0-flash-lite',
          'gemini-2.0-flash-exp',
          'gemini-2.0-flash-thinking-exp-01-21',
          'gemini-2.0-pro-exp-02-05',
          'gemini-1.5-pro',
          'gemini-1.5-pro-latest',
          'gemini-1.5-pro-001',
          'gemini-1.5-pro-002',
          'gemini-1.5-flash',
          'gemini-1.5-flash-latest',
          'gemini-1.5-flash-001',
          'gemini-1.5-flash-002',
          'gemini-1.5-flash-8b',
          'gemini-1.5-flash-8b-latest',
          'gemini-1.5-flash-8b-001',
          'gemini-pro-latest',
          'gemini-flash-latest',
          'gemini-flash-lite-latest',
          'gemini-exp-1206',
          'gemma-3-27b-it',
          'gemma-3-12b-it'
        ])
        .or(z.string().max(0))
    }),
    baseConfigSchema.extend({
      provider: z.literal('openai'),
      model: z
        .enum([
          'o3',
          'o3-2025-04-16',
          'o3-mini',
          'o3-mini-2025-01-31',
          'o1',
          'o1-2024-12-17',
          'gpt-5.2',
          'gpt-5.2-chat-latest',
          'gpt-5.2-pro',
          'gpt-5.1',
          'gpt-5.1-chat-latest',
          'gpt-5.1-codex',
          'gpt-5.1-codex-mini',
          'gpt-5.1-codex-max',
          'gpt-5',
          'gpt-5-2025-08-07',
          'gpt-5-chat-latest',
          'gpt-5-codex',
          'gpt-5-pro',
          'gpt-5-pro-2025-10-06',
          'gpt-5-mini',
          'gpt-5-mini-2025-08-07',
          'gpt-5-nano',
          'gpt-5-nano-2025-08-07',
          'gpt-4.1',
          'gpt-4.1-2025-04-14',
          'gpt-4.1-mini',
          'gpt-4.1-mini-2025-04-14',
          'gpt-4.1-nano',
          'gpt-4.1-nano-2025-04-14',
          'gpt-4o',
          'gpt-4o-2024-05-13',
          'gpt-4o-2024-08-06',
          'gpt-4o-2024-11-20',
          'gpt-4o-mini',
          'gpt-4o-mini-2024-07-18',
          'chatgpt-4o-latest',
          'gpt-4-turbo',
          'gpt-4-turbo-2024-04-09',
          'gpt-4',
          'gpt-4-0613',
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-0125',
          'gpt-3.5-turbo-1106'
        ])
        .or(z.string().max(0))
    }),
    baseConfigSchema.extend({
      provider: z.literal('xai'),
      model: z
        .enum([
          'grok-4',
          'grok-4-0709',
          'grok-4-latest',
          'grok-4-fast-reasoning',
          'grok-4-fast-non-reasoning',
          'grok-4-1-fast-reasoning',
          'grok-4-1-fast-non-reasoning',
          'grok-code-fast-1',
          'grok-3',
          'grok-3-latest',
          'grok-3-fast',
          'grok-3-fast-latest',
          'grok-3-mini',
          'grok-3-mini-latest',
          'grok-3-mini-fast',
          'grok-3-mini-fast-latest',
          'grok-2',
          'grok-2-1212',
          'grok-2-latest',
          'grok-2-vision',
          'grok-2-vision-1212',
          'grok-2-vision-latest',
          'grok-vision-beta',
          'grok-beta'
        ])
        .or(z.string().max(0))
    })
  ])
  .or(baseConfigSchema);

export const historySchema = z.object({
  sessions: z.array(
    z.object({
      id: z.string(),
      name: z.string()
    })
  )
});

export const sessionSchema = z.object({
  messages: z.array(
    z.discriminatedUnion('sender', [
      z.object({
        sender: z.literal('Kisuke'),
        message: z.string()
      }),
      z.object({
        sender: z.literal('User'),
        message: z.string(),
        referenceCount: z.number().optional()
      })
    ])
  )
});

const sessionInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  total_count: z.number(),
  current_index: z.number()
});

export const mcpClientRootsConfigSchema = z.object({
  cwd: z.object({
    dir: z.string().nullable(),
    accessGranted: z.boolean()
  }),
  roots: z.array(z.string())
});

const contextSchema = z.object({
  file_path: z.string(),
  scope: z.enum(['all', 'block']),
  highlighted_code: z.string().optional()
});

export const clientPayloadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('initialize'),
    cwd: z.string()
  }),
  z.object({
    type: z.literal('new_session')
  }),
  z.object({
    type: z.literal('prompt'),
    prompt: z.string(),
    sessionId: z.string(),
    context: z.array(contextSchema).optional()
  }),
  z.object({
    type: z.literal('resume_last_session')
  }),
  z.object({
    type: z.literal('load_sessions')
  }),
  z.object({
    type: z.literal('restore_session'),
    payload: z.string()
  }),
  z.object({
    type: z.literal('delete_session'),
    payload: z.string()
  }),
  z.object({
    type: z.literal('next_session'),
    currentSessionId: z.string()
  }),
  z.object({
    type: z.literal('previous_session'),
    currentSessionId: z.string()
  }),
  z.object({
    type: z.literal('request_approval_response'),
    requestId: z.string(),
    approved: z.boolean()
  })
]);

export const serverPayloadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('initialize'),
    payload: z.enum(['not_configured', 'missing_api_key', 'eligible']),
    provider: z.string().optional(),
    model: z.string().optional(),
    session_count: z.number().optional()
  }),
  z.object({
    type: z.literal('new_session'),
    totalSessions: z.number(),
    current_session: z.number(),
    session_info: sessionInfoSchema,
    payload: sessionSchema
  }),
  z.object({
    type: z.literal('response'),
    payload: z.string()
  }),
  z.object({
    type: z.literal('resume_last_session'),
    session_info: sessionInfoSchema,
    payload: sessionSchema
  }),
  z.object({
    type: z.literal('load_sessions'),
    payload: z.array(
      z.object({
        id: z.string(),
        name: z.string()
      })
    )
  }),
  z.object({
    type: z.literal('restore_session'),
    session_info: sessionInfoSchema,
    payload: sessionSchema
  }),
  z.object({
    type: z.literal('next_session'),
    session_info: sessionInfoSchema,
    payload: sessionSchema
  }),
  z.object({
    type: z.literal('previous_session'),
    session_info: sessionInfoSchema,
    payload: sessionSchema
  }),
  z.object({
    type: z.literal('error'),
    payload: z.string()
  }),
  z.object({
    type: z.literal('sandbox'),
    payload: z.string()
  }),
  z.object({
    type: z.literal('mcp_elicitation'),
    message: z.string(),
    schema: z.unknown()
  }),
  z.object({
    type: z.literal('request_approval'),
    requestId: z.string(),
    message: z.string()
  })
]);
