import { z } from 'zod';

const sessionInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  total_count: z.number(),
  current_index: z.number()
});

const sessionSchema = z.object({
  messages: z.array(
    z.object({
      sender: z.enum(['kisuke', 'user']),
      message: z.string()
    })
  )
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
    type: z.literal('error'),
    payload: z.string()
  })
]);
