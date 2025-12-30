import {
  ElicitationRequestSchema,
  experimental_createMCPClient as createMCPClient
} from '@ai-sdk/mcp';

import { stdOutput } from '~/index';
import { McpServerConfig } from '~/types';
import { writeMcpLog } from '~/utils/file-operations';

let mcpClient: Awaited<ReturnType<typeof createMCPClient>> | null = null;

/**
 * Initialize MCP client with transport configuration
 */
export const initializeMcpClient = async (serverConfig: McpServerConfig) => {
  try {
    mcpClient = await createMCPClient({
      transport: {
        type: 'sse',
        url: serverConfig.url
      },
      capabilities: {
        elicitation: {}
      }
    });

    // Register elicitation handler - sends request to Vim client
    mcpClient.onElicitationRequest(
      ElicitationRequestSchema,
      async (request) => {
        await writeMcpLog('elicitation_request', {
          message: request.params.message,
          schema: request.params.requestedSchema
        });

        // Send elicitation request to Vim client via stdout
        stdOutput({
          type: 'mcp_elicitation',
          message: request.params.message,
          schema: request.params.requestedSchema
        });

        // For now, auto-decline (user can implement Vim UI for this)
        return {
          action: 'decline' as const
        };
      }
    );

    await writeMcpLog('mcp_client_initialized', { url: serverConfig.url });
    return mcpClient;
  } catch (error) {
    await writeMcpLog('mcp_client_init_error', { error });
    throw error;
  }
};

/**
 * Get tools from MCP server
 */
export const getMcpTools = async () => {
  if (!mcpClient) {
    throw new Error('MCP client not initialized');
  }

  const tools = await mcpClient.tools();
  await writeMcpLog('mcp_tools_fetched', {
    toolNames: Object.keys(tools)
  });

  return tools;
};

/**
 * Close MCP client connection
 */
export const closeMcpClient = async () => {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
    await writeMcpLog('mcp_client_closed', {});
  }
};
