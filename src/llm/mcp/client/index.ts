import { createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';

export const mcpClient = async () => {
  const transport = new Experimental_StdioMCPTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '~/.sandbox/temp/']
  });

  const stdioClient = await createMCPClient({
    name: 'Kisuke MCP Client',
    version: '0.0.1-development',
    transport
  });

  return stdioClient;
};
