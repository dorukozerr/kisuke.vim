import { Event, Output } from './types';
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
    const event = JSON.parse(data) as Event;

    // TODO: Maybe convert this to object and call event.type as key, idk
    if (event.type === 'initialize') initializeHandler();
    if (event.type === 'prompt') promptHandler(event);
    if (event.type === 'new_session') newSessionHandler();
    if (event.type === 'resume_last_session') resumeLastSessionHandler();
    if (event.type === 'load_sessions') loadSessionsHandler();
    if (event.type === 'restore_session') restoreSessionHandler(event);
    if (event.type === 'delete_session') deleteSessionHandler(event);
  } catch (error) {
    await writeError(error, 'std');

    stdOutput({
      type: 'error',
      payload: `Unknown server error, ${
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack
            }
          : String(error)
      }`
    });
  }
});

export const stdOutput = (reply: Output) => {
  stdout.write(JSON.stringify(reply) + '\n');
};
