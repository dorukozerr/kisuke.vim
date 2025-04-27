import { RestoreSessionEvent } from '../types';
import { getHistory, getSession } from '../utils/file-operations';
import { stdOutput } from '..';

export const restoreSessionHandler = async (event: RestoreSessionEvent) => {
  const [{ sessions }, session] = await Promise.all([
    getHistory(),
    getSession(event.payload)
  ]);

  const sessionInfo = sessions.find(({ id }) => id === event.payload);
  const sessionIndex = sessions.findIndex(({ id }) => id === event.payload);

  if (!session || !sessionInfo) {
    stdOutput({ type: 'error', payload: 'Session not found.' });

    return;
  }

  stdOutput({
    type: 'restore_session',
    session_info: {
      id: sessionInfo.id,
      name: sessionInfo.name,
      total_count: sessions.length,
      current_index: sessionIndex
    },
    payload: session
  });
};
