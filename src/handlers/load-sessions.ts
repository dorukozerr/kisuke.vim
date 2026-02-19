import { stdOutput } from '~/index';
import { getHistory } from '~/utils/file-operations';

export const loadSessionsHandler = async () => {
  const history = await getHistory();

  if (history)
    stdOutput({ type: 'load_sessions', payload: history.sessions.reverse() });
};
