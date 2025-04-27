import { readFile } from 'fs/promises';

import { PromptEvent } from '../types';
import { stdOutput } from '..';
import { getSession, writeFile, getHistory } from '../utils/file-operations';
import { sendStreamResponse, generateSessionName } from '../lib/ai-client';

export const promptHandler = async (event: PromptEvent) => {
  const history = await getHistory();
  const session = await getSession(event.sessionId);

  const context: {
    fileName: string;
    content: string;
    type: 'all' | 'block';
  }[] = [];

  if (!session) {
    stdOutput({ type: 'error', payload: 'Session not found.' });

    return;
  }

  if (event.context) {
    await Promise.all(
      event.context.map(async (entry) => {
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

  const isSuccess = await sendStreamResponse(
    JSON.stringify(history),
    context,
    event.payload,
    session,
    event.sessionId
  );

  if (session.messages.length === 1 && isSuccess) {
    const sessionName = await generateSessionName(event.payload);

    history.sessions = history.sessions.map((session) =>
      session.id === event.sessionId
        ? {
            ...session,
            name: `${new Date().toLocaleDateString()} - ${sessionName}`
          }
        : session
    );

    await writeFile('history.json', JSON.stringify(history));
  }
};
