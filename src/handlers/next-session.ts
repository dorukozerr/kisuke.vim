import { stdOutput } from '~/index';
import { NextSessionPayload } from '~/types';
import { getHistory, getSession } from '~/utils/file-operations';

export const nextSessionHandler = async ({
  currentSessionId
}: NextSessionPayload) => {
  const { sessions } = await getHistory();
  if (sessions.length < 2)
    return stdOutput({
      type: 'error',
      payload:
        sessions.length === 0
          ? 'No sessions available.'
          : 'Only one session available. Cannot navigate to next session.'
    });

  const currentIndex = sessions.findIndex(({ id }) => id === currentSessionId);

  if (currentIndex === -1)
    return stdOutput({ type: 'error', payload: 'Current session not found.' });

  const nextIndex = (currentIndex + 1) % sessions.length;

  const nextSessionInfo = sessions[(currentIndex + 1) % sessions.length];
  if (!nextSessionInfo)
    return stdOutput({ type: 'error', payload: 'Next session not found.' });

  const nextSession = await getSession(nextSessionInfo.id);
  if (!nextSession)
    return stdOutput({ type: 'error', payload: 'Next session not found.' });

  stdOutput({
    type: 'next_session',
    session_info: {
      id: nextSessionInfo.id,
      name: nextSessionInfo.name,
      total_count: sessions.length,
      current_index: nextIndex
    },
    payload: nextSession
  });
};
