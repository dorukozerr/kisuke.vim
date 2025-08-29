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

export const sendStreamResponse = async (
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
        'opus-4-1': 'claude-opus-4-1-20250805',
        'opus-4': 'claude-4-opus-20250514',
        'sonnet-4': 'claude-sonnet-4-20250514',
        'sonnet-3.7': 'claude-3-7-sonnet-latest',
        'haiku-3.7': 'claude-3-5-haiku-latest',
        'opus-3.7': 'claude-3-opus-latest'
      };

      const stream = client.messages.stream({
        model: models[config.model],
        max_tokens:
          config.model === 'opus-3.7'
            ? 4096
            : config.model === 'haiku-3.7'
              ? 8192
              : config.model === 'opus-4' || config.model === 'opus-4-1'
                ? 32000
                : 64000,
        system:
          BaseAIInstruction + sessionHistoryForStream(JSON.stringify(session)),
        messages: [
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
                stream?.messages[1].content[0] as unknown as { text: string }
              ).text
            }
          ]
        })
      );

      return true;
    }

    if (config.provider === 'google') {
      const client = new GoogleGenAI({ apiKey: config.apiKeys.google });

      const contents = [
        {
          role: 'model',
          text:
            BaseAIInstruction + sessionHistoryForStream(JSON.stringify(session))
        },
        {
          role: 'user',
          text: context
            ? fileContextsProcessingInstructionsForStream(
                JSON.stringify(context),
                prompt
              )
            : prompt
        }
      ];

      const stream = await client.models.generateContentStream({
        model: config.model,
        contents
      });

      stdOutput({ type: 'response', payload: 'stream_start' });

      try {
        let completeResponse = '';

        for await (const chunk of stream) {
          if (chunk.text) {
            stdOutput({
              type: 'response',
              payload: chunk.text
            });
            completeResponse += chunk.text;
          }
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
                message: completeResponse
              }
            ]
          })
        );

        return true;
      } catch (error) {
        await writeError(error, 'googleStreamInner');

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
    }

    if (config.provider === 'openai') {
      const client = new OpenAI({ apiKey: config.apiKeys.openai });

      const stream = await client.responses.create({
        model: config.model,
        instructions:
          BaseAIInstruction + sessionHistoryForStream(JSON.stringify(session)),
        input: [
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
        stream: true
      });

      let res = '';

      stdOutput({ type: 'response', payload: 'stream_start' });

      for await (const event of stream) {
        if (event.type === 'response.output_text.delta') {
          stdOutput({
            type: 'response',
            payload: (event as { delta: string }).delta
          });
        }

        if (event.type === 'response.content_part.done') {
          res = (event.part as { text: string }).text;
        }
      }

      stdOutput({ type: 'response', payload: 'stream_end' });

      await writeError(stream, 'openai_stream');

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
              message: res
            }
          ]
        })
      );

      return true;
    }

    if (config.provider === 'grok') {
      const client = new OpenAI({
        apiKey: config.apiKeys.grok,
        baseURL: 'https://api.x.ai/v1',
        timeout: 60 * 5
      });

      const stream = await client.chat.completions.create({
        model: 'grok-4',
        messages: [
          {
            role: 'system',
            content:
              BaseAIInstruction +
              sessionHistoryForStream(JSON.stringify(session))
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
        stream: true
      });

      let res = '';

      stdOutput({ type: 'response', payload: 'stream_start' });

      for await (const chunk of stream) {
        stdOutput({
          type: 'response',
          payload: chunk.choices[0].delta.content ?? ''
        });

        res = res + (chunk.choices[0].delta.content ?? '');
      }

      stdOutput({ type: 'response', payload: 'stream_end' });

      await writeError(stream, 'openai_stream');

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
              message: res
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
  try {
    const config = await getConfig();

    if (config.provider === 'anthropic') {
      const client = new Anthropic({ apiKey: config.apiKeys.anthropic });

      const models = {
        'opus-4-1': 'claude-opus-4-1-20250805',
        'opus-4': 'claude-4-opus-20250514',
        'sonnet-4': 'claude-sonnet-4-20250514',
        'sonnet-3.7': 'claude-3-7-sonnet-latest',
        'haiku-3.7': 'claude-3-5-haiku-latest',
        'opus-3.7': 'claude-3-opus-latest'
      };

      const aiResponse = await client.messages.create({
        model: models[config.model],
        max_tokens: 30,
        temperature: 0.3,
        system: sessionNameGenerationInstructions,
        messages: [{ role: 'user', content: prompt }]
      });

      const sessionName = (aiResponse.content[0] as { text: string }).text;

      return sessionName;
    }

    if (config.provider === 'google') {
      const client = new GoogleGenAI({ apiKey: config.apiKeys.google });

      const contents = [
        { role: 'model', text: sessionNameGenerationInstructions },
        { role: 'user', text: prompt }
      ];

      const aiResponse = await client.models.generateContent({
        model: config.model,
        contents,
        config: { maxOutputTokens: 30, temperature: 0.3 }
      });

      const sessionName = aiResponse.text;

      return sessionName;
    }

    if (config.provider === 'openai') {
      const client = new OpenAI({ apiKey: config.apiKeys.openai });

      const aiResponse = await client.responses.create({
        model: config.model,
        max_output_tokens: 30,
        temperature: 0.3,
        input: [
          { role: 'system', content: sessionNameGenerationInstructions },
          { role: 'user', content: prompt }
        ]
      });

      const sessionName = aiResponse.output_text;

      return sessionName;
    }
  } catch (error) {
    await writeError(error, 'generateSessionName');

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
