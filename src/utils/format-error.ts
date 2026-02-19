import { z, ZodError } from 'zod';

export const formatError = (e: unknown) =>
  e instanceof ZodError
    ? z.prettifyError(e)
    : e instanceof Error
      ? `${e.name} - ${e.message} - ${e.stack}`
      : String(e);
