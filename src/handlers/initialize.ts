import { stdOutput } from '~/index';
import { InitializePayload } from '~/types';
import { cwd } from '~/utils/cwd';
import {
  getConfig,
  getHistory,
  getMCPClientRootsConfig,
  writeTempJson
} from '~/utils/file-operations';

export const initializeHandler = async (payload: InitializePayload) => {
  cwd.path = payload.cwd;

  const [config, history, mcpClientRootsConfig] = await Promise.all([
    getConfig(),
    getHistory(),
    getMCPClientRootsConfig()
  ]);

  await writeTempJson(mcpClientRootsConfig);
  await writeTempJson({ mcpClientRootsConfig });

  if (!config.provider || !config.model) {
    stdOutput({
      type: 'initialize',
      payload: 'not_configured'
    });
  } else if (
    (config.provider === 'anthropic' && !config.apiKeys.anthropic) ||
    (config.provider === 'openai' && !config.apiKeys.openai) ||
    (config.provider === 'google' && !config.apiKeys.google) ||
    (config.provider === 'grok' && !config.apiKeys.grok)
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
