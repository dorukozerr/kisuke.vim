import { getConfig, getHistory } from '../utils/file-operations';
import { stdOutput } from '..';

export const initializeHandler = async () => {
  const [config, history] = await Promise.all([getConfig(), getHistory()]);

  if (!config.provider || !config.model) {
    stdOutput({
      type: 'initialize',
      payload: 'not_configured'
    });
  } else if (
    (config.provider === 'anthropic' && !config.apiKeys.anthropicApiKey) ||
    (config.provider === 'openai' && !config.apiKeys.openai) ||
    (config.provider === 'google' && !config.apiKeys.google)
  ) {
    stdOutput({
      type: 'initialize',
      payload: 'missing_api_key',
      provider: config.provider,
      model: config.model
    });
  } else {
    stdOutput({
      type: 'initialize',
      payload: 'eligible',
      provider: config.provider,
      model: config.model,
      session_count: history.sessions.length
    });
  }
};
