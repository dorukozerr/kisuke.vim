import { stdOutput } from '~/index';
import { PreviousSessionPayload } from '~/types';
import { getHistory, getSession } from '~/utils/file-operations';

export const previousSessionHandler = async ({
  currentSessionId
}: PreviousSessionPayload) => {
  const { sessions } = await getHistory();
  if (sessions.length < 2)
    return stdOutput({
      type: 'error',
      payload:
        sessions.length === 0
          ? 'No sessions available.'
          : 'Only one session available. Cannot navigate to previous session.'
    });

  const currentIndex = sessions.findIndex(({ id }) => id === currentSessionId);

  if (currentIndex === -1)
    return stdOutput({ type: 'error', payload: 'Current session not found.' });

  const previousIndex = (currentIndex - 1 + sessions.length) % sessions.length;

  const previousSessionInfo = sessions[previousIndex];
  if (!previousSessionInfo)
    return stdOutput({ type: 'error', payload: 'Previous session not found.' });

  const previousSession = await getSession(previousSessionInfo.id);
  if (!previousSession)
    return stdOutput({ type: 'error', payload: 'Previous session not found.' });

  stdOutput({
    type: 'previous_session',
    session_info: {
      id: previousSessionInfo.id,
      name: previousSessionInfo.name,
      total_count: sessions.length,
      current_index: previousIndex
    },
    payload: previousSession
  });
};
