import { streamText } from 'ai';

import { stdOutput } from '~/index';
import { PromptPayload } from '~/types';
import {
  getConfig,
  getSession,
  writeError,
  writeFile
  // writeTempJson
} from '~/utils/file-operations';
import { KISUKE_V030_SYSTEM_PROMPT } from '~/llm/prompts/system';
import { getAnthropic } from '~/llm/providers';

export const promptHandler = async ({
  sessionId,
  prompt,
  context: _
}: PromptPayload) => {
  try {
    const config = await getConfig();
    const session = await getSession(sessionId);
    const anthropic = getAnthropic({ apiKey: config.apiKeys.anthropic });

    if (!session) throw new Error('Invalid session');

    stdOutput({ type: 'response', payload: 'stream_start' });

    const result = streamText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      messages: [
        {
          role: 'system',
          content: KISUKE_V030_SYSTEM_PROMPT
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

    for await (const textPart of result.textStream) {
      res += textPart;
      stdOutput({ type: 'response', payload: textPart });
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
