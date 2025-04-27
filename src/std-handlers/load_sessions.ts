import { getHistory } from '../utils/file-operations';
import { stdOutput } from '..';

export const loadSessionsHandler = async () => {
  const { sessions } = await getHistory();

  stdOutput({ type: 'load_sessions', payload: sessions.reverse() });
};
