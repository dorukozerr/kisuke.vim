import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

import { McpServerConfig } from '~/types';
import { mcpConfigSchema } from '~/schemas';

const configDir = join(homedir(), '.config', 'kisuke');
const mcpConfigPath = join(configDir, 'mcp-config.json');

export const getMcpConfig = async () => {
  try {
    if (!existsSync(mcpConfigPath)) return { servers: {} };

    return mcpConfigSchema.parse(
      JSON.parse(await readFile(mcpConfigPath, 'utf-8'))
    );
  } catch {
    return { servers: {} };
  }
};

export const getEnabledMcpServers = async (): Promise<McpServerConfig[]> => {
  const config = await getMcpConfig();
  if (!config.servers) return [];

  return Object.values(config.servers).filter(
    (serverConfig) => serverConfig.enabled
  );
};
