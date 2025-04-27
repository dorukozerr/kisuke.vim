import { Anthropic } from '@anthropic-ai/sdk';

import { getConfig } from '../utils/file-operations';

export const getAIClient = async () => {
  const configFile = await getConfig();

  return new Anthropic({ apiKey: configFile.apiKeys.anthropic });
};
