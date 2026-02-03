import { homedir } from 'os';
import { join } from 'path';

import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  ListRootsRequestSchema,
  ListRootsResult
} from '@modelcontextprotocol/sdk/types.js';
import { jsonSchema, Tool, tool } from 'ai';

import { writeMcpLog } from '~/utils/file-operations';
import { requestApproval } from '~/llm/mcp/client/tool-approval';

const createClient = (
  clientInfo = {
    name: 'Kisuke MCP Client',
    version: '0.0.1-development'
  },
  clientConfig = { capabilities: {} }
) => new Client(clientInfo, clientConfig);

const setupRootsHandler = (client: Client, roots: ListRootsResult) =>
  client.setRequestHandler(ListRootsRequestSchema, () => roots);

export const mcpClients = async () => {
  const filesystemClient = createClient(
    {
      name: 'Kisuke MCP Client - Filesystem MCP',
      version: '0.0.1-development'
    },
    { capabilities: { roots: { listChanged: true } } }
  );
  const memoryClient = createClient(
    {
      name: 'Kisuke MCP Client - Memory MCP',
      version: '0.0.1-development'
    },
    { capabilities: { roots: { listChanged: true } } }
  );

  const filesystemTransport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem']
  });

  const memoryTransport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    env: {
      MEMORY_FILE_PATH: join(
        homedir(),
        '.config/kisuke/server-memory/memory.jsonl'
      )
    }
  });

  await Promise.all([
    filesystemClient.connect(filesystemTransport),
    memoryClient.connect(memoryTransport)
  ]);

  setupRootsHandler(filesystemClient, {
    roots: [
      {
        uri: `file://${join(homedir(), '.sandbox/temp/')}`,
        name: 'Sandbox Temp Path'
      }
    ]
  });
  await filesystemClient.sendRootsListChanged();

  const tools = await convertAndMergeMCPTools({
    filesystemClient,
    memoryClient
  });

  return { filesystemClient, memoryClient, tools };
};

const convertAndMergeMCPTools = async (clients: Record<string, Client>) => {
  const RESTRICTED_TOOLS = [
    'write_file',
    'edit_file',
    'create_directory',
    'move_file'
  ];

  const tools: Record<string, Tool> = {};

  for (const client of Object.values(clients)) {
    const clientTools = (await client.listTools()).tools;

    for (const mcpTool of clientTools) {
      tools[mcpTool.name] = tool({
        description: mcpTool.description ?? undefined,
        inputSchema: jsonSchema(mcpTool.inputSchema),
        outputSchema: mcpTool.outputSchema
          ? jsonSchema(mcpTool.outputSchema)
          : undefined,
        execute: async (args) => {
          if (RESTRICTED_TOOLS.includes(mcpTool.name))
            if (
              !(await requestApproval(
                `${mcpTool.name}-${new Date().toJSON()}`,
                mcpTool.name,
                args
              ))
            )
              return ['User did not approved tool execution'];

          const result = await client.callTool({
            name: mcpTool.name,
            arguments: args
          });

          await writeMcpLog(mcpTool.name, result);

          return result.content;
        }
      });
    }
  }

  return tools;
};
