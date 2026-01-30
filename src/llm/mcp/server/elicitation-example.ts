import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { writeMcpLog } from '~/utils/file-operations';

const mcpServer = new McpServer(
  {
    name: 'kisuke-internal-mcp-server-elicitation',
    version: '0.0.1'
  },
  {
    capabilities: {}
  }
);

mcpServer.registerTool(
  'select_favorite_editor',
  {
    description: 'User selecting their favorite editor',
    inputSchema: {}
  },
  async () => {
    try {
      const elicitationStep1 = await mcpServer.server.elicitInput({
        mode: 'form',
        message: 'Elicitation Form - Step 1',
        requestedSchema: z
          .object({
            step1Field: z
              .enum(['s1v1', 's1v2'])
              .describe('Elicitation Form - Step 1, description')
          })
          .toJSONSchema()
      });

      const elicitationStep2 = await mcpServer.server.elicitInput({
        mode: 'form',
        message: 'Elicitation Form - Step 2',
        requestedSchema: {
          type: 'object',
          properties: {
            step2Field: {
              type: 'string',
              description: 'Elicitation Form - Step 2, description',
              enum: ['s2v1', 's2v2']
            }
          }
        }
      });

      writeMcpLog('elicitation_mcp_server_log', {
        elicitationStep1,
        elicitationStep2
      });

      const inputs = {
        ...elicitationStep1.content,
        ...elicitationStep2.content
      };

      return {
        content: [
          {
            type: 'text',
            text: `Favorite editor updated, !\n\n${JSON.stringify(inputs, null, 2)}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Event creation failed: ${error instanceof Error ? error.message : String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

export const elicititationExmaple = async () => {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
};

try {
  elicititationExmaple();
} catch (error) {
  writeMcpLog(
    'elicititation_mcp_server_error',
    error instanceof Error
      ? `${error.name} - ${error.message}`
      : `Unknown mcp server error ${String(error)}`
  );
}
