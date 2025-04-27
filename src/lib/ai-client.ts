import { Anthropic } from '@anthropic-ai/sdk';
import { TextDelta } from '@anthropic-ai/sdk/resources';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

import { Session } from '../types';
import { stdOutput } from '..';
import { getConfig, writeFile, writeError } from '../utils/file-operations';
import {
  BaseAIInstruction,
  sessionHistoryForStream,
  fileContextsProcessingInstructionsForStream,
  sessionNameGenerationInstructions
} from '../utils/initials';

export const getAIClient = async () => {
  const config = await getConfig();

  return config.provider === 'anthropic'
    ? new Anthropic({ apiKey: config.apiKeys.anthropic })
    : config.provider === 'google'
      ? new GoogleGenAI({ apiKey: config.apiKeys.google })
      : config.provider === 'openai'
        ? new OpenAI({ apiKey: config.apiKeys.openai })
        : null;
};

export const sendStreamResponse = async (
  history: string,
  context: {
    fileName: string;
    content: string;
    type: 'all' | 'block';
  }[],
  prompt: string,
  session: Session,
  sessionId: string
) => {
  const config = await getConfig();

  try {
    if (config.provider === 'anthropic') {
      const client = new Anthropic({ apiKey: config.apiKeys.anthropic });

      const models = {
        sonnet: 'claude-3-7-sonnet-latest',
        haiku: 'claude-3-5-haiku-latest',
        opus: 'claude-3-opus-latest'
      };

      const stream = client.messages.stream({
        model: models[config.model],
        max_tokens: 64000,
        messages: [
          { role: 'assistant', content: BaseAIInstruction },
          { role: 'assistant', content: sessionHistoryForStream(history) },
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

      stdOutput({ type: 'response', payload: 'stream_start' });

      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta') {
            stdOutput({
              type: 'response',
              payload: (chunk.delta as TextDelta).text
            });
          }
        }
      } catch (error) {
        await writeError(error, 'streamInner');

        stdOutput({
          type: 'error',
          payload: `Streaming error, ${
            error instanceof Error
              ? {
                  message: error.message,
                  stack: error.stack
                }
              : String(error)
          }`
        });
      }

      stdOutput({ type: 'response', payload: 'stream_end' });

      await writeFile(
        `${sessionId}.json`,
        JSON.stringify({
          messages: [
            ...session.messages,
            {
              sender: 'User',
              message: prompt,
              referenceCount: context.length
            },
            {
              sender: 'Kisuke',
              message: (
                stream?.messages[3].content[0] as unknown as { text: string }
              ).text
            }
          ]
        })
      );

      return true;
    }
  } catch (error) {
    await writeError(error, 'streamOuter');

    stdOutput({
      type: 'error',
      payload: `Streaming error, ${
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack
            }
          : String(error)
      }`
    });
  }
};

export const generateSessionName = async (prompt: string) => {
  const config = await getConfig();

  if (config.provider === 'anthropic') {
    const client = new Anthropic({ apiKey: config.apiKeys.anthropic });

    const models = {
      sonnet: 'claude-3-7-sonnet-latest',
      haiku: 'claude-3-5-haiku-latest',
      opus: 'claude-3-opus-latest'
    };

    const aiResponse = await client.messages.create({
      max_tokens: 1024,
      model: models[config.model],
      messages: [
        { role: 'assistant', content: sessionNameGenerationInstructions },
        { role: 'user', content: prompt }
      ]
    });

    const sessionName = (aiResponse.content[0] as { text: string }).text;

    return sessionName;
  }
};
