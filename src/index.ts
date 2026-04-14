// import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
// import { NodeSDK } from '@opentelemetry/sdk-node';
// import { LangfuseExporter } from 'langfuse-vercel';
import { z, ZodError } from 'zod';

import 'dotenv/config';
import { deleteSessionHandler } from '#/handlers/delete-session';
import { initializeHandler } from '#/handlers/initialize';
import { loadSessionsHandler } from '#/handlers/load-sessions';
import { newSessionHandler } from '#/handlers/new-session';
import { nextSessionHandler } from '#/handlers/next-session';
import { previousSessionHandler } from '#/handlers/previous-session';
import { promptHandler } from '#/handlers/prompt';
import { restoreSessionHandler } from '#/handlers/restore-session';
import { resumeLastSessionHandler } from '#/handlers/resume-last-session';
import { clientPayloadSchema } from '#/schemas';
import type { ServerPayload } from '#/types';
import { writeError } from '#/utils/file-operations';
import { resolveRequestApproval } from '#/utils/request-approval';

const stdin = process.stdin;
const stdout = process.stdout;

stdin.resume();
stdin.setEncoding('utf-8');

// const sdk = new NodeSDK({
//   traceExporter: new LangfuseExporter(),
//   instrumentations: [getNodeAutoInstrumentations()]
// });
//
// sdk.start();

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
      case 'next_session':
        nextSessionHandler(payload);
        break;
      case 'previous_session':
        previousSessionHandler(payload);
        break;
      case 'request_approval_response':
        resolveRequestApproval(payload);
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
            : 'Unknown client payload error... ${String(error)}'
    });
  }
});

export const stdOutput = (reply: ServerPayload) =>
  stdout.write(JSON.stringify(reply) + '\n');

// export const cleanup = async () => await Promise.all([sdk.shutdown()]);

// process.on('SIGINT', cleanup);
// process.on('SIGTERM', cleanup);
// process.on('exit', cleanup);
