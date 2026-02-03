import {
  ListToolsRequestSchema,
  ListToolsResultSchema
} from '@modelcontextprotocol/sdk/types.js';
import {
  jsonSchema,
  ModelMessage,
  stepCountIs,
  streamText,
  Tool,
  tool
} from 'ai';

import { stdOutput } from '~/index';
import { PromptPayload } from '~/types';
import {
  getConfig,
  getSession,
  writeError,
  writeFile,
  writeTempJson
} from '~/utils/file-operations';
import { mcpClient as MCP_CLIENT } from '~/llm/mcp/client';
import { KISUKE_SYSTEM_PROMPT } from '~/llm/prompts/system';
import { getAnthropic } from '~/llm/providers';
// import { withApproval } from '~/llm/tool-approval';

export const processPrompt = async ({
  sessionId,
  prompt,
  context: _
}: PromptPayload) => {
  try {
    const config = await getConfig();
    const session = await getSession(sessionId);
    const anthropic = getAnthropic({ apiKey: config.apiKeys.anthropic });

    if (!session) throw new Error('Invalid session');

    // const tools = withApproval(await (await mcpClient()).tools());
    const mcpClient = await MCP_CLIENT();
    const toolsResult = await mcpClient.listTools();

    const tools: Record<string, Tool> = {};

    for (const mcpTool of toolsResult.tools) {
      tools[mcpTool.name] = tool({
        description: mcpTool.description ?? '',
        inputSchema: jsonSchema(mcpTool.inputSchema),
        outputSchema: mcpTool.outputSchema
          ? jsonSchema(mcpTool.outputSchema)
          : undefined,
        execute: async (params: Record<string, unknown> | undefined) => {
          try {
            const result = await mcpClient.callTool({
              name: mcpTool.name,
              arguments: params
            });

            return result as Record<string, unknown>;
          } catch (err) {
            return { success: false, err };
          }
        }
      });
    }

    // const res = '';

    stdOutput({ type: 'response', payload: 'stream_start' });

    if (prompt === 'list') {
      const res = await mcpClient.callTool({
        name: 'list_allowed_directories',
        arguments: {}
      });

      stdOutput({ type: 'response', payload: JSON.stringify(res) });
    }

    if (prompt === 'ls') {
      const res = await mcpClient.callTool({
        name: 'list_directory',
        arguments: { path: '/home/softboi/.sandbox/temp/' }
      });

      stdOutput({ type: 'response', payload: JSON.stringify(res) });
    }

    // await writeTempJson({ tools });

    //     const result = streamText({
    //       model: anthropic('claude-sonnet-4-5-20250929'),
    //       stopWhen: stepCountIs(10),
    //       tools,
    //       messages: [
    //         { role: 'system', content: KISUKE_SYSTEM_PROMPT },
    //         ...session.messages.map(
    //           ({ sender, message }) =>
    //             ({
    //               role: sender === 'Kisuke' ? 'assistant' : 'user',
    //               content: message
    //             }) as const
    //         ),
    //         { role: 'user', content: prompt }
    //       ]
    //     });
    //
    //     for await (const part of result.fullStream) {
    //       const timestamp = new Date().toJSON();
    //       switch (part.type) {
    //         case 'text-delta':
    //           res += part.text;
    //           stdOutput({ type: 'response', payload: part.text });
    //           break;
    //
    //         case 'text-end':
    //           stdOutput({ type: 'response', payload: '\n\n' });
    //           break;
    //
    //         case 'reasoning-delta':
    //           stdOutput({ type: 'response', payload: `[thinking] ${part.text}` });
    //           break;
    //
    //         case 'tool-call':
    //           await writeTempJson({ [`tool-call-${timestamp}`]: part });
    //           stdOutput({
    //             type: 'response',
    //             payload: `[Tool: ${part.toolName}]\n`
    //           });
    //           break;
    //
    //         case 'start':
    //           await writeTempJson({ [`start-${timestamp}`]: part });
    //           break;
    //
    //         case 'finish':
    //           await writeTempJson({ [`finish-${timestamp}`]: part });
    //           break;
    //
    //         case 'start-step':
    //           await writeTempJson({ [`start-step-${timestamp}`]: part });
    //           break;
    //
    //         case 'finish-step':
    //           await writeTempJson({ [`finish-step-${timestamp}`]: part });
    //           break;
    //
    //         case 'tool-result':
    //           await writeTempJson({ [`tool-result-${timestamp}`]: part });
    //           stdOutput({
    //             type: 'response',
    //             payload: `[Result: ${part.toolName}]\n\n`
    //           });
    //           break;
    //
    //         case 'tool-error':
    //           stdOutput({
    //             type: 'response',
    //             payload: `\n[Error: ${part.toolName}] ${part.error}\n`
    //           });
    //           break;
    //
    //         case 'error':
    //           stdOutput({ type: 'error', payload: String(part.error) });
    //           break;
    //
    //         case 'abort':
    //           stdOutput({
    //             type: 'response',
    //             payload: `\n[Aborted: ${part.reason}]\n`
    //           });
    //           break;
    //       }
    //     }
    //
    //     await writeFile(
    //       `${sessionId}.json`,
    //       JSON.stringify({
    //         messages: [
    //           ...session.messages,
    //           { sender: 'User', message: prompt },
    //           { sender: 'Kisuke', message: res }
    //         ]
    //       })
    //     );

    stdOutput({ type: 'response', payload: 'stream_end' });
  } catch (error) {
    const e =
      error instanceof Error
        ? `${error.name} - ${error.message}`
        : JSON.stringify(error);

    await writeError(e, 'stream_error');

    stdOutput({ type: 'error', payload: e });
  }
};
