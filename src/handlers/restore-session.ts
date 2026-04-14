import { stdOutput } from '#/index';
import type { RestoreSessionPayload } from '#/types';
import { getHistory, getSession } from '#/utils/file-operations';

export const restoreSessionHandler = async ({
  payload
}: RestoreSessionPayload) => {
  const [history, session] = await Promise.all([
    getHistory(),
    getSession(payload)
  ]);

  if (history && session) {
    const sessionInfo = history.sessions.find(({ id }) => id === payload);
    const sessionIndex = history.sessions.findIndex(({ id }) => id === payload);

    if (!session || !sessionInfo) {
      stdOutput({ type: 'error', payload: 'Session not found.' });
      return;
    }

    stdOutput({
      type: 'restore_session',
      session_info: {
        id: sessionInfo.id,
        name: sessionInfo.name,
        total_count: history.sessions.length,
        current_index: sessionIndex
      },
      payload: session
    });
  }
};
