import { homedir } from 'os';
import { join } from 'path';

import { Client, ClientOptions } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  Implementation,
  ListRootsRequestSchema,
  ListRootsResult
} from '@modelcontextprotocol/sdk/types.js';
import { jsonSchema, Tool, tool } from 'ai';

import { cwd } from '~/utils/cwd';
import { writeMcpLog } from '~/utils/file-operations';
import { requestApproval } from '~/utils/request-approval';

// Singleton state
let cachedClients: {
  filesystemClient: Client;
  memoryClient: Client;
  gitClient: Client;
  tools: Record<string, Tool>;
} | null = null;
let initializedCwd: string | null = null;

const createClient = (
  implementation: Implementation = {
    name: 'Kisuke MCP Client',
    version: '0.0.1-development'
  },
  config: ClientOptions = { capabilities: {} }
) => new Client(implementation, config);

const setupRootsHandler = (client: Client, roots: ListRootsResult) =>
  client.setRequestHandler(ListRootsRequestSchema, () => roots);

const initializeClients = async () => {
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

  const gitClient = createClient({
    name: 'Kisuke MCP Client - Git MCP',
    version: '0.0.1-development'
  });

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

  const gitTransport = new StdioClientTransport({
    command: 'uvx',
    args: ['mcp-server-git', '--repository', cwd.path]
  });

  await Promise.all([
    filesystemClient.connect(filesystemTransport),
    memoryClient.connect(memoryTransport),
    gitClient.connect(gitTransport)
  ]);

  setupRootsHandler(filesystemClient, {
    roots: [
      // {
      //   uri: `file://${join(homedir(), '.sandbox/temp/')}`,
      //   name: 'Sandbox Temp Path'
      // }
    ]
  });
  await filesystemClient.sendRootsListChanged();

  const tools = await convertAndMergeMCPTools({
    filesystemClient,
    memoryClient,
    gitClient
  });

  return { filesystemClient, memoryClient, gitClient, tools };
};

export const closeMcpClients = async () => {
  if (!cachedClients) return;

  await Promise.all([
    cachedClients.filesystemClient.close(),
    cachedClients.memoryClient.close(),
    cachedClients.gitClient.close()
  ]);

  cachedClients = null;
  initializedCwd = null;
};

export const mcpClients = async () => {
  const currentCwd = cwd.path;

  // Return cached clients if cwd hasn't changed
  if (cachedClients && initializedCwd === currentCwd) {
    return cachedClients;
  }

  // Close existing clients if cwd changed
  if (cachedClients && initializedCwd !== currentCwd) {
    await closeMcpClients();
  }

  // Initialize new clients
  cachedClients = await initializeClients();
  initializedCwd = currentCwd;

  return cachedClients;
};

const convertAndMergeMCPTools = async (clients: Record<string, Client>) => {
  const RESTRICTED_TOOLS = [
    'write_file',
    'edit_file',
    'create_directory',
    'move_file'
  ];

  const tools: Record<string, Tool> = {};

  for (const [k, v] of Object.entries(clients)) {
    const clientTools = (await v.listTools()).tools;

    for (const mcpTool of clientTools) {
      tools[mcpTool.name] = tool({
        description: mcpTool.description ?? undefined,
        inputSchema: jsonSchema(mcpTool.inputSchema),
        outputSchema: mcpTool.outputSchema
          ? jsonSchema(mcpTool.outputSchema)
          : undefined,
        execute: async (args) => {
          if (RESTRICTED_TOOLS.includes(mcpTool.name) || k === 'gitClient')
            if (
              !(await requestApproval(
                `${mcpTool.name} - ${JSON.stringify(args)}`
              ))
            )
              return ['User did not approved tool execution'];

          const result = await v.callTool({
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
