// import { createMCPClient } from '@ai-sdk/mcp';
import { Client } from '@modelcontextprotocol/sdk/client';
// import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { writeTempJson } from '~/utils/file-operations';

export const mcpClient = async () => {
  // const transport = new Experimental_StdioMCPTransport({
  //   command: 'npx',
  //   args: ['-y', '@modelcontextprotocol/server-filesystem', '~/.sandbox/temp/']
  // });
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

  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem']
  });

  await client.connect(transport);

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

  // const stdioClient = await createMCPClient({
  //   name: 'Kisuke MCP Client',
  //   version: '0.0.1-development',
  //   transport
  // });

  return client;
};
