import { randomBytes } from 'crypto';

import { getHistory, writeFile } from '../utils/file-operations';
import { initialSessionData } from '../utils/initials';
import { stdOutput } from '..';

export const newSessionHandler = async () => {
  const { sessions } = await getHistory();

  const sessionId = randomBytes(16).toString('hex');

  sessions.push({ id: sessionId, name: sessionId });

  await Promise.all([
    writeFile('history.json', JSON.stringify({ sessions })),
    writeFile(`${sessionId}.json`, JSON.stringify(initialSessionData))
  ]);

  stdOutput({
    type: 'new_session',
    totalSessions: sessions.length,
    current_session: sessions.length,
    session_info: {
      id: sessionId,
      name: sessionId,
      total_count: sessions.length,
      current_index: sessions.length - 1
    },
    payload: initialSessionData
  });
};
