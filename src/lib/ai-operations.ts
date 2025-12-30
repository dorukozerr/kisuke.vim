import { createAnthropic } from '@ai-sdk/anthropic';
import { Anthropic } from '@anthropic-ai/sdk';
import { TextDelta } from '@anthropic-ai/sdk/resources';
import { GoogleGenAI } from '@google/genai';
import { streamText } from 'ai';
import OpenAI from 'openai';

import { stdOutput } from '~/index';
import { Session } from '~/types';
import { getConfig, writeError, writeFile } from '~/utils/file-operations';
import {
  BaseAIInstruction,
  fileContextsProcessingInstructionsForStream,
  sessionHistoryForStream,
  sessionNameGenerationInstructions
} from '~/utils/initials';

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
    const anthropic = createAnthropic({ apiKey: config.apiKeys.anthropic });

    stdOutput({ type: 'response', payload: 'stream_start' });
    const result = streamText({
      model: anthropic('claude-sonnet-4-5'),
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

    return;
    if (config.provider === 'anthropic') {
      const client = new Anthropic({ apiKey: config.apiKeys.anthropic });

      const models = {
        'opus-4-1': 'claude-opus-4-1-20250805',
        'opus-4': 'claude-4-opus-20250514',
        'sonnet-4-5': 'claude-sonnet-4-5-20250929',
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
        ],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }]
      });

      stdOutput({ type: 'response', payload: 'stream_start' });

      let completeResponse = '';
      let modelInfo = '';

      const totalUsage = {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
        server_tool_use: { web_search_requests: 0 }
      };

      try {
        for await (const chunk of stream) {
          if (chunk?.type === 'message_start' && chunk?.message?.model) {
            modelInfo = chunk.message.model;
            if (chunk.message.usage) {
              totalUsage.input_tokens += chunk.message.usage.input_tokens || 0;
              totalUsage.output_tokens +=
                chunk.message.usage.output_tokens || 0;
              totalUsage.cache_creation_input_tokens +=
                chunk.message.usage.cache_creation_input_tokens || 0;
              totalUsage.cache_read_input_tokens +=
                chunk.message.usage.cache_read_input_tokens || 0;
            }
          }

          if (
            chunk?.type === 'content_block_start' &&
            chunk?.content_block?.type === 'server_tool_use' &&
            chunk.content_block.name === 'web_search'
          ) {
            const needsSpacing =
              completeResponse.length > 0 && !completeResponse.endsWith('\n\n');

            let searchMessage;

            if (completeResponse.length === 0) {
              searchMessage = `I need to search for current information on this topic.\n\n[SEARCH] Querying web resources...\n\n`;
            } else {
              searchMessage = `${needsSpacing ? '\n\n' : ''}[SEARCH] Querying web resources...\n\n`;
            }

            completeResponse += searchMessage;

            stdOutput({
              type: 'response',
              payload: searchMessage
            });
          }

          if (
            chunk?.type === 'content_block_start' &&
            chunk?.content_block?.type === 'web_search_tool_result'
          ) {
            const ccbc = chunk.content_block.content;

            if (ccbc && Array.isArray(ccbc) && ccbc[0] && ccbc[0].url) {
              const title = ccbc[0].title || ccbc[0].url;
              const crawlMessage = `[FETCH] ${title}\n\n`;

              completeResponse += crawlMessage;

              stdOutput({
                type: 'response',
                payload: crawlMessage
              });
            }
          }

          if (
            chunk?.type === 'content_block_delta' &&
            chunk?.delta?.type === 'text_delta'
          ) {
            const text = (chunk.delta as TextDelta).text;

            completeResponse += text;

            stdOutput({
              type: 'response',
              payload: text
            });
          }

          if (chunk?.type === 'message_delta' && chunk?.usage) {
            totalUsage.input_tokens += chunk.usage.input_tokens || 0;
            totalUsage.output_tokens += chunk.usage.output_tokens || 0;
            totalUsage.cache_creation_input_tokens +=
              chunk.usage.cache_creation_input_tokens || 0;
            totalUsage.cache_read_input_tokens +=
              chunk.usage.cache_read_input_tokens || 0;
            if (chunk.usage.server_tool_use) {
              totalUsage.server_tool_use.web_search_requests +=
                chunk.usage.server_tool_use.web_search_requests || 0;
            }
          }
        }

        await stream.finalMessage();
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

      if (modelInfo || totalUsage.input_tokens > 0) {
        const statsMessage = `\n\n[INFO]${modelInfo ? ` model=${modelInfo}` : ''}${
          totalUsage.input_tokens > 0
            ? `\n[USAGE] tokens_in=${totalUsage.input_tokens.toLocaleString()} tokens_out=${totalUsage.output_tokens.toLocaleString()}`
            : ''
        }${
          totalUsage.cache_read_input_tokens > 0
            ? ` cache_read=${totalUsage.cache_read_input_tokens.toLocaleString()}`
            : ''
        }${
          totalUsage.server_tool_use.web_search_requests > 0
            ? ` web_queries=${totalUsage.server_tool_use.web_search_requests}`
            : ''
        }\n\n`;

        completeResponse += statsMessage;

        stdOutput({
          type: 'response',
          payload: statsMessage
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
              message: completeResponse
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
        timeout: 720000
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
          payload: chunk?.choices?.[0]?.delta.content ?? ''
        });

        res = res + (chunk?.choices[0]?.delta.content ?? '');
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
        'sonnet-4-5': 'claude-sonnet-4-5-20250929',
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

    if (config.provider === 'grok') {
      const client = new OpenAI({
        apiKey: config.apiKeys.grok,
        baseURL: 'https://api.x.ai/v1'
      });

      const aiResponse = await client.chat.completions.create({
        model: 'grok-4',
        messages: [
          { role: 'system', content: sessionNameGenerationInstructions },
          { role: 'user', content: prompt }
        ]
      });

      const sessionName = aiResponse?.choices?.[0]?.message?.content;
      if (!sessionName) throw new Error('Session name generation error');

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
