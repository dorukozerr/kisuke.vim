// import { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { stepCountIs, streamText } from 'ai';
import { ollama } from 'ai-sdk-ollama';

import { stdOutput } from '~/index';
import { PromptPayload } from '~/types';
import {
  // getConfig,
  getSession,
  writeError,
  writeFile
  // writeTempJson
} from '~/utils/file-operations';
import { mcpClients } from '~/llm/mcp/client';
import { KISUKE_SYSTEM_PROMPT } from '~/llm/prompts/system';
// import { getAnthropic } from '~/llm/providers';

export const processPrompt = async ({
  sessionId,
  prompt,
  context: _
}: PromptPayload) => {
  try {
    // const config = await getConfig();
    const session = await getSession(sessionId);
    // const anthropic = getAnthropic({ apiKey: config.apiKeys.anthropic });

    if (!session) throw new Error('Invalid session');

    const { tools } = await mcpClients();

    const result = streamText({
      // model: anthropic('claude-3-7-sonnet-latest'),
      model: ollama('qwen2.5:latest', {
        options: {
          seed: 123,
          num_gpu: 999,
          num_ctx: 8192,
          num_thread: 8,
          temperature: 0.5,
          repeat_penalty: 1.1,
          top_p: 0.9,
          min_p: 0.1,
          top_k: 40
        }
      }),
      stopWhen: stepCountIs(10),
      tools,
      messages: [
        { role: 'system', content: KISUKE_SYSTEM_PROMPT },
        ...session.messages.map(
          ({ sender, message }) =>
            ({
              role: sender === 'Kisuke' ? 'assistant' : 'user',
              content: message
            }) as const
        ),
        { role: 'user', content: prompt }
      ]
    });

    let res = '';
    let lastBlockType: 'reasoning' | 'text' | 'tool' | null = null;
    let currentToolInput = '';
    let consecutiveToolCount = 0;

    const output = (chunk: string) => {
      res += chunk;
      stdOutput({ type: 'response', payload: chunk });
    };

    stdOutput({ type: 'response', payload: 'stream_start' });

    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'reasoning-start':
          if (lastBlockType !== null) output('\n');
          lastBlockType = 'reasoning';
          output('Thinking: ');
          break;

        case 'reasoning-delta':
          output(part.text);
          break;

        case 'reasoning-end':
          output('\n');
          break;

        case 'text-start':
          if (lastBlockType !== null && lastBlockType !== 'text') output('\n');
          lastBlockType = 'text';
          break;

        case 'text-delta':
          output(part.text);
          break;

        case 'text-end':
          output('\n');
          break;

        case 'tool-approval-request':
          output(`⏳ Awaiting approval: ${part.toolCall.toolName}\n`);
          break;

        case 'tool-input-start':
          if (lastBlockType !== 'tool') {
            if (lastBlockType !== null) output('\n');
            consecutiveToolCount = 0;
          } else if (consecutiveToolCount > 0) output('\n');
          lastBlockType = 'tool';
          currentToolInput = '';
          break;

        case 'tool-input-delta':
          currentToolInput += part.delta;
          break;

        case 'tool-input-end':
          break;

        case 'tool-call':
          output(`=> ${part.toolName}(${currentToolInput})\n`);
          currentToolInput = '';
          consecutiveToolCount++;
          break;

        case 'tool-result':
          break;

        case 'tool-error':
          output(
            `✗ ${part.toolName}: ${
              part.error instanceof Error
                ? part.error.message
                : JSON.stringify(part.error)
            }\n`
          );
          break;

        case 'error':
          output(
            `Error: ${
              part.error instanceof Error
                ? `${part.error.name}: ${part.error.message}`
                : JSON.stringify(part.error)
            }\n`
          );
          await writeError(part.error, 'llm_stream_text');
          break;

        case 'abort':
          output(`\nAborted: ${part.reason}\n`);
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
