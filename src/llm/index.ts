import { ModelMessage, stepCountIs, streamText } from 'ai';

import { stdOutput } from '~/index';
import { PromptPayload } from '~/types';
import {
  getConfig,
  getSession,
  writeError,
  writeFile,
  writeTempJson
} from '~/utils/file-operations';
import { mcpClient } from '~/llm/mcp/client';
import { KISUKE_SYSTEM_PROMPT } from '~/llm/prompts/system';
import { getAnthropic } from '~/llm/providers';
import { withApproval } from '~/llm/tool-approval';

const MAX_TOOL_ITERATIONS = 10;

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

    const tools = withApproval(await (await mcpClient()).tools());

    const messages: ModelMessage[] = [
      { role: 'system', content: KISUKE_SYSTEM_PROMPT },
      ...session.messages.map(
        ({ sender, message }) =>
          ({
            role: sender === 'Kisuke' ? 'assistant' : 'user',
            content: message
          }) as const
      ),
      { role: 'user', content: prompt }
    ];

    let fullResponse = '';
    let iteration = 0;

    stdOutput({ type: 'response', payload: 'stream_start' });

    while (iteration < MAX_TOOL_ITERATIONS) {
      const result = streamText({
        model: anthropic('claude-sonnet-4-5-20250929'),
        stopWhen: stepCountIs(5),
        tools,
        messages
      });

      for await (const part of result.fullStream) {
        const timestamp = new Date().toJSON();
        switch (part.type) {
          case 'text-delta':
            fullResponse += part.text;
            stdOutput({ type: 'response', payload: part.text });
            break;

          case 'reasoning-delta':
            stdOutput({ type: 'response', payload: `[thinking] ${part.text}` });
            break;

          case 'tool-call':
            await writeTempJson({ [`tool-call-${timestamp}`]: part });
            stdOutput({
              type: 'response',
              payload: `\n[Tool: ${part.toolName}]\n`
            });
            break;

          case 'tool-result':
            await writeTempJson({ [`tool-result-${timestamp}`]: part });
            stdOutput({
              type: 'response',
              payload: `\n[Result: ${part.toolName}]\n`
            });
            break;

          case 'tool-error':
            stdOutput({
              type: 'response',
              payload: `\n[Error: ${part.toolName}] ${part.error}\n`
            });
            break;

          case 'error':
            stdOutput({ type: 'error', payload: String(part.error) });
            break;

          case 'abort':
            stdOutput({
              type: 'response',
              payload: `\n[Aborted: ${part.reason}]\n`
            });
            break;
        }
      }

      const finishReason = await result.finishReason;

      // Done - no more tool calls needed
      if (finishReason !== 'tool-calls') {
        break;
      }

      // Append only tool-related messages for continuation
      const response = await result.response;
      messages.push(...(response.messages as ModelMessage[]));

      iteration++;
    }

    if (iteration >= MAX_TOOL_ITERATIONS) {
      stdOutput({
        type: 'response',
        payload: '\n\n[Iteration limit reached]'
      });
    }

    await writeFile(
      `${sessionId}.json`,
      JSON.stringify({
        messages: [
          ...session.messages,
          { sender: 'User', message: prompt },
          { sender: 'Kisuke', message: fullResponse }
        ]
      })
    );

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
