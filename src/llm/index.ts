import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

import { stdOutput } from '~/index';
import { Session } from '~/types';
import { getConfig, writeError, writeFile } from '~/utils/file-operations';
import {
  BaseAIInstruction,
  fileContextsProcessingInstructionsForStream,
  sessionHistoryForStream
} from '~/utils/initials';

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
    const anthropic = createAnthropic({ apiKey: config.apiKeys.anthropic });

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
      ]
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
  }
};
