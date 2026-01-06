import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

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
      const identity = await mcpServer.server.elicitInput({
        mode: 'form',
        message: 'Step 1: Enter who you are',
        requestedSchema: {
          type: 'object',
          properties: {
            identity: {
              type: 'string',
              title: 'User Identity',
              description: 'Identity of the user',
              enum: ['someone', 'no-one']
            }
          }
        }
      });

      const favoriteEditor = await mcpServer.server.elicitInput({
        mode: 'form',
        message: 'Step 2: Select your favorite editor',
        requestedSchema: {
          type: 'object',
          properties: {
            identity: {
              type: 'string',
              title: 'Favorite Editory',
              description: 'Favorite editor of user',
              enum: ['notepad', 'atom', 'vim']
            }
          }
        }
      });

      const inputs = {
        ...identity.content,
        ...favoriteEditor.content
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
