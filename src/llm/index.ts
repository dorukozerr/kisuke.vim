import { stepCountIs, streamText } from 'ai';

import { stdOutput } from '~/index';
import { PromptPayload } from '~/types';
import {
  getConfig,
  getSession,
  writeError,
  writeFile
} from '~/utils/file-operations';
import { mcpClient } from '~/llm/mcp/client';
import { KISUKE_SYSTEM_PROMPT } from '~/llm/prompts/system';
import { getAnthropic } from '~/llm/providers';

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

    const tools = await (await mcpClient()).tools();

    stdOutput({ type: 'response', payload: 'stream_start' });

    const result = streamText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      tools,
      stopWhen: stepCountIs(10),
      messages: [
        {
          role: 'system',
          content: KISUKE_SYSTEM_PROMPT
        },
        ...session.messages.map(
          ({ sender, message }) =>
            ({
              role: sender === 'Kisuke' ? 'assistant' : 'user',
              content: message
            }) as const
        ),
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    let res = '';

    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'text-delta':
          res += part.text;
          stdOutput({ type: 'response', payload: part.text });
          break;

        case 'reasoning-delta':
          stdOutput({ type: 'response', payload: `[thinking] ${part.text}` });
          break;

        case 'tool-call':
          stdOutput({
            type: 'response',
            payload: `\n[Tool: ${part.toolName}]\n`
          });
          break;

        case 'tool-result':
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

    await writeFile(
      `${sessionId}.json`,
      JSON.stringify({
        messages: [
          ...session.messages,
          { sender: 'User', message: prompt },
          { sender: 'Kisuke', message: res }
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
