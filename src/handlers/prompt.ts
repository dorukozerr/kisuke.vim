import { readFile } from 'fs/promises';

import { stdOutput } from '~/index';
import { PromptPayload } from '~/types';
// import { generateSessionName, sendStreamResponse } from '~/lib/ai-operations';
import {
  // getHistory,
  getSession
  // writeFile
} from '~/utils/file-operations';
import { streamHandler } from '~/llm';

export const promptHandler = async ({
  sessionId,
  context: eventContext,
  payload
}: PromptPayload) => {
  // const history = await getHistory();
  const session = await getSession(sessionId);

  const context: {
    fileName: string;
    content: string;
    type: 'all' | 'block';
  }[] = [];

  if (!session) {
    stdOutput({ type: 'error', payload: 'Session not found.' });

    return;
  }

  if (eventContext) {
    await Promise.all(
      eventContext.map(async (entry) => {
        if (entry.scope === 'all') {
          const fileContent = await readFile(entry.file_path, 'utf-8');

          context.push({
            fileName: entry.file_path,
            content: fileContent,
            type: 'all'
          });
        } else if (entry.scope === 'block') {
          context.push({
            fileName: entry.file_path,
            content: entry.highlighted_code ?? '',
            type: 'block'
          });
        }
      })
    );
  }

  await streamHandler(context, payload, session, sessionId);

  //   const isSuccess = await sendStreamResponse(
  //     context,
  //     payload,
  //     session,
  //     sessionId
  //   );
  //
  //   if (session.messages.length === 1 && isSuccess) {
  //     const sessionName = await generateSessionName(payload);
  //
  //     history.sessions = history.sessions.map((session) =>
  //       session.id === sessionId
  //         ? {
  //             ...session,
  //             name: `${new Date().toLocaleDateString()} - ${sessionName}`
  //           }
  //         : session
  //     );
  //
  //     await writeFile('history.json', JSON.stringify(history));
  //   }
};
