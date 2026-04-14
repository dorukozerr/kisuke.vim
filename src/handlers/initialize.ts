import { stdOutput } from '#/index';
import { cwd } from '#/utils/cwd';
import {
  getConfig,
  getHistory,
  getMCPClientRootsConfig,
  writeFile
} from '#/utils/file-operations';
import { requestApproval } from '#/utils/request-approval';

export const initializeHandler = async () => {
  const [config, history, mcpClientRootsConfig] = await Promise.all([
    getConfig(),
    getHistory(),
    getMCPClientRootsConfig()
  ]);

  if (!config || !history || !('provider' in config) || !('model' in config)) {
    stdOutput({
      type: 'initialize',
      payload: 'not_configured'
    });
  } else if (
    (config.provider === 'anthropic' && !config.apiKeys.anthropic) ||
    (config.provider === 'openai' && !config.apiKeys.openai) ||
    (config.provider === 'google' && !config.apiKeys.google) ||
    (config.provider === 'xai' && !config.apiKeys.xai)
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

    if (!('roots' in (mcpClientRootsConfig ?? {})))
      throw new Error('Invalid MCP Roots config');

    let updatedRootsConf = mcpClientRootsConfig ?? {};

    if (!mcpClientRootsConfig?.roots.includes(cwd.path)) {
      const accessGranted = await requestApproval(
        `Do you allow to give file system permissions for current directory - ${cwd}`
      );

      updatedRootsConf = {
        cwd: { dir: cwd.path, accessGranted },
        roots: [
          ...(mcpClientRootsConfig?.roots ?? []),
          ...(accessGranted ? [cwd.path] : [])
        ]
      };
    } else if ('cwd' in updatedRootsConf) {
      updatedRootsConf.cwd = { dir: cwd.path, accessGranted: false };
    }

    await writeFile(
      'mcp-client-roots-config.json',
      JSON.stringify(updatedRootsConf)
    );
  }
};
