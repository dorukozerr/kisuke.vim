import { stdOutput } from '~/index';

export const sandboxHandler = async () => {
  stdOutput({ type: 'response', payload: 'stream_start' });
  stdOutput({ type: 'response', payload: 'sandbox' });
  stdOutput({ type: 'response', payload: 'stream_end' });
};
