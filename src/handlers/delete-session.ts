import { randomBytes } from 'crypto';
import { unlink } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

import { stdOutput } from '~/index';
import { DeleteSessionPayload } from '~/types';
import { getHistory, getSession, writeFile } from '~/utils/file-operations';
import { initialSessionData } from '~/utils/initials';

const configDir = join(homedir(), '.config', 'kisuke');

export const deleteSessionHandler = async ({
  payload
}: DeleteSessionPayload) => {
  const history = await getHistory();

  history.sessions = history.sessions.filter(({ id }) => id !== payload);

  await unlink(join(configDir, `${payload}.json`));

  if (history.sessions.length === 0) {
    const sessionId = randomBytes(16).toString('hex');

    history.sessions = [{ id: sessionId, name: sessionId }];

    await Promise.all([
      writeFile(
        'history.json',
        JSON.stringify({ sessions: [{ id: sessionId, name: sessionId }] })
      ),
      writeFile(`${sessionId}.json`, JSON.stringify(initialSessionData))
    ]);
  } else {
    await writeFile('history.json', JSON.stringify(history));
  }

  const lastSession = history.sessions[history.sessions.length - 1];
  if (!lastSession) {
    stdOutput({ type: 'error', payload: 'Session not found.' });
    return;
  }

  const session = await getSession(lastSession.id);
  if (!session) {
    stdOutput({ type: 'error', payload: 'Session not found.' });
    return;
  }

  stdOutput({
    type: 'resume_last_session',
    session_info: {
      id: lastSession.id,
      name: lastSession.name,
      total_count: history.sessions.length,
      current_index: history.sessions.length - 1
    },
    payload: session
  });
};
