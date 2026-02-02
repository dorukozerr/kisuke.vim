import { stdOutput } from '~/index';
import { getHistory, getSession, writeTempJson } from '~/utils/file-operations';

export const resumeLastSessionHandler = async () => {
  const { sessions } = await getHistory();

  await writeTempJson({
    label: 'testing 1',
    type: 'resume_last_session'
  });

  const lastSession = sessions[sessions.length - 1];
  if (!lastSession) {
    stdOutput({ type: 'error', payload: 'Session not found.' });
    return;
  }

  await writeTempJson({
    label: 'testing 2',
    type: 'resume_last_session',
    lastSession
  });
  const session = await getSession(lastSession.id);
  if (!session) {
    stdOutput({ type: 'error', payload: 'Session not found.' });
    return;
  }

  await writeTempJson({
    label: 'testing 3',
    type: 'resume_last_session',
    lastSession,
    session
  });

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
