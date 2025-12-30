import { Output } from './types';
import { ZodError, z } from 'zod';
import { clientPayloadSchema } from './schemas';
import { writeError } from './utils/file-operations';
import { initializeHandler } from './std-handlers/initialize';
import { promptHandler } from './std-handlers/prompt';
import { newSessionHandler } from './std-handlers/new-session';
import { resumeLastSessionHandler } from './std-handlers/resume-last-session';
import { loadSessionsHandler } from './std-handlers/load_sessions';
import { restoreSessionHandler } from './std-handlers/restore-session';
import { deleteSessionHandler } from './std-handlers/delete-session';

const stdin = process.stdin;
const stdout = process.stdout;

stdin.resume();
stdin.setEncoding('utf-8');

stdin.on('data', async (data: string) => {
  try {
    const payload = clientPayloadSchema.parse(JSON.parse(data));

    switch (payload.type) {
      case 'initialize':
        initializeHandler();
        break;
      case 'prompt':
        promptHandler(payload);
        break;
      case 'new_session':
        newSessionHandler();
        break;
      case 'resume_last_session':
        resumeLastSessionHandler();
        break;
      case 'load_sessions':
        loadSessionsHandler();
        break;
      case 'restore_session':
        restoreSessionHandler(payload);
        break;
      case 'delete_session':
        deleteSessionHandler(payload);
        break;
    }
  } catch (error) {
    await writeError(
      error instanceof ZodError
        ? z.treeifyError(error)
        : error instanceof Error
          ? `${error.name} - ${error.message}`
          : error,
      'client_payload'
    );

    stdOutput({
      type: 'error',
      payload:
        error instanceof ZodError
          ? 'Invalid client payload'
          : error instanceof Error
            ? `${error.name} - ${error.message}`
            : 'Unknown client payload error'
    });
  }
});

export const stdOutput = (reply: Output) => {
  stdout.write(JSON.stringify(reply) + '\n');
};
