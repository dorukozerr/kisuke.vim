import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ElicitRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { writeMcpLog } from '~/utils/file-operations';

export const stdioMcpClient = async () => {
  const client = new Client(
    {
      name: 'kisuke-mcp-client',
      version: '0.0.1',
      description: 'Initial MCP client implementation attemt for kisuke'
    },
    { capabilities: { elicitation: { form: {} } } }
  );

  client.setRequestHandler(ElicitRequestSchema, async ({ method, params }) => {
    if (params.mode !== 'form')
      throw new Error('how come this ended up working?');

    writeMcpLog('stdio_mcp_client_log', { method, params });

    return {
      action: 'accept',
      content:
        params.message === 'Elicitation Form - Step 1'
          ? { step1Field: 's1v3' }
          : { step2Field: 's2v2' }
    };
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./dist/llm/mcp/server/elicitation-example.js']
  });

  await client.connect(transport);

  return client;
};
