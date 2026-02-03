import { stdOutput } from '~/index';
import { getHistory } from '~/utils/file-operations';

export const loadSessionsHandler = async () => {
  const { sessions } = await getHistory();

  stdOutput({ type: 'load_sessions', payload: sessions.reverse() });
};
