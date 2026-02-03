import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { writeTempJson } from '~/utils/file-operations';

export const mcpClient = async () => {
  const client = new Client(
    {
      name: 'Kisuke MCP Client',
      version: '0.0.1-development',
      description: 'Kisuke internal MCP client testing'
    },
    {
      capabilities: {
        roots: { listChanged: true }
      }
    }
  );

  const fileSystemMCPTransport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem']
  });

  await client.connect(fileSystemMCPTransport);

  client.setRequestHandler(ListRootsRequestSchema, (...params) => {
    writeTempJson({ wtffff: params });

    return {
      roots: [
        {
          uri: 'file:///home/softboi/.sandbox/temp/',
          name: 'Sandbox Temp Path'
        }
      ]
    };
  });

  client.sendRootsListChanged();

  return client;
};
