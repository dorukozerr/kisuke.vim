import { stdOutput } from '~/index';
import { InitializePayload } from '~/types';
// import { cwd } from '~/utils/cwd';
import {
  getConfig,
  getHistory,
  getMCPClientRootsConfig,
  writeFile
} from '~/utils/file-operations';
import { requestApproval } from '~/utils/request-approval';

export const initializeHandler = async ({ cwd }: InitializePayload) => {
  const [config, history, mcpClientRootsConfig] = await Promise.all([
    getConfig(),
    getHistory(),
    getMCPClientRootsConfig()
  ]);

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

    let updatedRootsConf = mcpClientRootsConfig;

    if (!mcpClientRootsConfig.roots.includes(cwd)) {
      const accessGranted = await requestApproval(
        `Do you allow to give file system permissions for current directory - ${cwd}`
      );

      updatedRootsConf = {
        cwd: { dir: cwd, accessGranted },
        roots: [...mcpClientRootsConfig.roots, ...(accessGranted ? [cwd] : [])]
      };
    } else {
      updatedRootsConf.cwd = { dir: cwd, accessGranted: true };
    }

    await writeFile(
      'mcp-client-roots-config.json',
      JSON.stringify(updatedRootsConf)
    );
  }
};
