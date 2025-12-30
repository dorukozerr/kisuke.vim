import { stdOutput } from '~/index';
import { getHistory, getSession } from '~/utils/file-operations';

export const resumeLastSessionHandler = async () => {
  const { sessions } = await getHistory();

  const lastSession = sessions[sessions.length - 1];
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
      total_count: sessions.length,
      current_index: sessions.length - 1
    },
    payload: session
  });
};
