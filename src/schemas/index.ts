import { z } from 'zod';

const baseConfigSchema = z.object({
  apiKeys: z.object({
    anthropic: z.string(),
    google: z.string(),
    openai: z.string(),
    grok: z.string()
  })
});

export const configSchema = z.discriminatedUnion('provider', [
  baseConfigSchema.extend({
    provider: z.literal('anthropic'),
    model: z.enum([
      'opus-4-1',
      'opus-4',
      'sonnet-4-5',
      'sonnet-4',
      'sonnet-3.7',
      'haiku-3.7',
      'opus-3.7'
    ])
  }),
  baseConfigSchema.extend({
    provider: z.literal('google'),
    model: z.enum(['gemini-2.5-pro', 'gemini-2.5-flash'])
  }),
  baseConfigSchema.extend({
    provider: z.literal('openai'),
    model: z.enum([
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo'
    ])
  }),
  baseConfigSchema.extend({
    provider: z.literal('grok'),
    model: z.literal('grok-4')
  })
]);

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

const contextSchema = z.object({
  file_path: z.string(),
  scope: z.enum(['all', 'block']),
  highlighted_code: z.string().optional()
});

export const clientPayloadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('initialize')
  }),
  z.object({
    type: z.literal('new_session')
  }),
  z.object({
    type: z.literal('prompt'),
    payload: z.string(),
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
  })
]);
