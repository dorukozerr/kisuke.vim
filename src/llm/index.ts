import { streamText } from 'ai';

import { stdOutput } from '~/index';
import { Session } from '~/types';
import {
  getConfig,
  writeError,
  writeFile,
  writeMcpLog
} from '~/utils/file-operations';
import {
  BaseAIInstruction,
  fileContextsProcessingInstructionsForStream,
  sessionHistoryForStream
} from '~/utils/initials';

import {
  closeMcpClient,
  getMcpTools,
  initializeMcpClient
} from './mcp/client.js';
import { getEnabledMcpServers } from './mcp/config.js';
import { getAnthropic } from './providers/index.js';

export const streamHandler = async (
  context: {
    fileName: string;
    content: string;
    type: 'all' | 'block';
  }[],
  prompt: string,
  session: Session,
  sessionId: string
) => {
  try {
    const config = await getConfig();
    const anthropic = getAnthropic({ apiKey: config.apiKeys.anthropic });

    // Initialize MCP client and fetch tools
    const mcpServers = await getEnabledMcpServers();
    let tools = {};

    if (mcpServers.length > 0) {
      // Connect to first enabled MCP server
      const server = mcpServers[0];
      if (server) {
        try {
          await initializeMcpClient(server);
          tools = await getMcpTools();
          await writeMcpLog('mcp_tools_loaded', {
            count: Object.keys(tools).length
          });
        } catch (error) {
          await writeMcpLog('mcp_init_error', { error });
        }
      }
    }

    stdOutput({ type: 'response', payload: 'stream_start' });

    const result = streamText({
      model: anthropic('claude-opus-4-5'),
      messages: [
        {
          role: 'system',
          content:
            BaseAIInstruction + sessionHistoryForStream(JSON.stringify(session))
        },
        {
          role: 'user',
          content: context
            ? fileContextsProcessingInstructionsForStream(
                JSON.stringify(context),
                prompt
              )
            : prompt
        }
      ],
      ...(Object.keys(tools).length > 0 && {
        tools,
        maxSteps: 5
      })
    });

    let res = '';

    for await (const textPart of result.textStream) {
      res += textPart;

      stdOutput({
        type: 'response',
        payload: textPart
      });
    }

    await writeFile(
      `${sessionId}.json`,
      JSON.stringify({
        messages: [
          ...session.messages,
          {
            sender: 'User',
            message: prompt,
            ...(context.length ? { referenceCount: context.length } : {})
          },
          {
            sender: 'Kisuke',
            message: res
          }
        ]
      })
    );

    stdOutput({ type: 'response', payload: 'stream_end' });

    // Clean up MCP client
    await closeMcpClient();
  } catch (error) {
    const e =
      error instanceof Error
        ? `${error.name} - ${error.message}`
        : JSON.stringify(error);

    await writeError(e, 'stream_error');

    stdOutput({
      type: 'error',
      payload: e
    });

    // Ensure MCP client is closed on error
    await closeMcpClient();
  }
};
