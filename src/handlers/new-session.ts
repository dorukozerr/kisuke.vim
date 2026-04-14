import { randomBytes } from 'crypto';

import { stdOutput } from '#/index';
import { getHistory, writeFile } from '#/utils/file-operations';
import { INITIAL_SESSION_DATA } from '#/utils/initials';

export const newSessionHandler = async () => {
  const history = await getHistory();

  if (history) {
    const { sessions } = history;

    const sessionId = randomBytes(16).toString('hex');

    sessions.push({ id: sessionId, name: sessionId });

    await Promise.all([
      writeFile('history.json', JSON.stringify({ sessions })),
      writeFile(`${sessionId}.json`, JSON.stringify(INITIAL_SESSION_DATA))
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
      payload: INITIAL_SESSION_DATA
    });
  }
};
