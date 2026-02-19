// import { homedir } from 'os';
// import { join } from 'path';
//
// import { Client, ClientOptions } from '@modelcontextprotocol/sdk/client';
// import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
// import {
//   Implementation,
//   ListRootsRequestSchema,
//   ListRootsResult
// } from '@modelcontextprotocol/sdk/types.js';
// import { jsonSchema, Tool, tool } from 'ai';
//
// import { getMCPClientRootsConfig } from '~/utils/file-operations';
// import { writeMcpLog } from '~/utils/file-operations';
// import { requestApproval } from '~/utils/request-approval';
//
// const createClient = (
//   implementation: Implementation = {
//     name: 'Kisuke MCP Client',
//     version: '0.0.1-development'
//   },
//   config: ClientOptions = { capabilities: {} }
// ) => new Client(implementation, config);
//
// const setupRootsHandler = (client: Client, roots: ListRootsResult) =>
//   client.setRequestHandler(ListRootsRequestSchema, () => roots);
//
// export const setupMCPClients = async () => {
//   const filesystemClient = createClient(
//     {
//       name: 'Kisuke MCP Client - Filesystem MCP',
//       version: '0.0.1-development',
//       description: 'Experimenting Filesystem MCP Client'
//     },
//     { capabilities: { roots: { listChanged: true } } }
//   );
//   const memoryClient = createClient(
//     {
//       name: 'Kisuke MCP Client - Memory MCP',
//       version: '0.0.1-development',
//       description: 'Experimenting Memory MCP Client'
//     },
//     { capabilities: { roots: { listChanged: true } } }
//   );
//
//   const gitClient = createClient(
//     {
//       name: 'Kisuke MCP Client - Git MCP',
//       version: '0.0.1-development',
//       description: 'Experimenting Git MCP Client'
//     },
//     { capabilities: { roots: { listChanged: true } } }
//   );
//
//   const filesystemTransport = new StdioClientTransport({
//     command: 'npx',
//     args: ['-y', '@modelcontextprotocol/server-filesystem']
//   });
//
//   const memoryTransport = new StdioClientTransport({
//     command: 'npx',
//     args: ['-y', '@modelcontextprotocol/server-memory'],
//     env: {
//       MEMORY_FILE_PATH: join(
//         homedir(),
//         '.config/kisuke/server-memory/memory.jsonl'
//       )
//     }
//   });
//
//   const rootsConfig = await getMCPClientRootsConfig();
//   const roots = rootsConfig.roots.map((path) => ({ uri: `file://${path}` }));
//
//   const gitTransport = new StdioClientTransport({
//     command: 'uvx',
//     args: ['mcp-server-git']
//   });
//
//   await Promise.all([
//     filesystemClient.connect(filesystemTransport),
//     memoryClient.connect(memoryTransport),
//     gitClient.connect(gitTransport)
//   ]);
//
//   setupRootsHandler(filesystemClient, { roots });
//   setupRootsHandler(gitClient, { roots });
//
//   await Promise.all([
//     filesystemClient.sendRootsListChanged(),
//     gitClient.sendRootsListChanged()
//   ]);
//
//   const tools = await convertAndMergeMCPTools({
//     filesystemClient,
//     memoryClient,
//     gitClient
//   });
//
//   return { filesystemClient, memoryClient, gitClient, tools };
// };
//
// const convertAndMergeMCPTools = async (clients: Record<string, Client>) => {
//   const RESTRICTED_TOOLS = [
//     'write_file',
//     'edit_file',
//     'create_directory',
//     'move_file'
//   ];
//
//   const tools: Record<string, Tool> = {};
//
//   for (const [k, v] of Object.entries(clients)) {
//     const clientTools = (await v.listTools()).tools;
//
//     for (const mcpTool of clientTools) {
//       tools[mcpTool.name] = tool({
//         description: mcpTool.description ?? undefined,
//         inputSchema: jsonSchema(mcpTool.inputSchema),
//         outputSchema: mcpTool.outputSchema
//           ? jsonSchema(mcpTool.outputSchema)
//           : undefined,
//         execute: async (args) => {
//           if (RESTRICTED_TOOLS.includes(mcpTool.name) || k === 'gitClient')
//             if (
//               !(await requestApproval(
//                 `${mcpTool.name} - ${JSON.stringify(args)}`
//               ))
//             )
//               return ['User did not approved tool execution'];
//
//           const result = await v.callTool({
//             name: mcpTool.name,
//             arguments: args
//           });
//
//           await writeMcpLog(`${k}-${mcpTool.name}`, { result, args });
//
//           return result.content;
//         }
//       });
//     }
//   }
//
//   return tools;
// };
