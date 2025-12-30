import { stdOutput } from '~/index';
import { RestoreSessionPayload } from '~/types';
import { getHistory, getSession } from '~/utils/file-operations';

export const restoreSessionHandler = async ({
  payload
}: RestoreSessionPayload) => {
  const [{ sessions }, session] = await Promise.all([
    getHistory(),
    getSession(payload)
  ]);

  const sessionInfo = sessions.find(({ id }) => id === payload);
  const sessionIndex = sessions.findIndex(({ id }) => id === payload);

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
