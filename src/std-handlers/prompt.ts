import { readFile } from 'fs/promises';
import { TextDelta } from '@anthropic-ai/sdk/resources';

import { PromptEvent } from '../types';
import { BaseAIInstruction } from '../utils/initials';
import { getAIClient } from '../lib/ai-client';
import { stdOutput } from '..';
import {
  getSession,
  writeFile,
  writeError,
  getHistory
} from '../utils/file-operations';

export const promptHandler = async (event: PromptEvent) => {
  const [aiClient, session] = await Promise.all([
    getAIClient(),
    getSession(event.sessionId)
  ]);

  const context: {
    fileName: string;
    content: string;
    type: 'all' | 'block';
  }[] = [];

  if (!session) {
    stdOutput({ type: 'error', payload: 'Session not found.' });

    return;
  }

  if (event.context) {
    await Promise.all(
      event.context.map(async (entry) => {
        if (entry.scope === 'all') {
          const fileContent = await readFile(entry.file_path, 'utf-8');

          context.push({
            fileName: entry.file_path,
            content: fileContent,
            type: 'all'
          });
        } else if (entry.scope === 'block') {
          context.push({
            fileName: entry.file_path,
            content: entry.highlighted_code ?? '',
            type: 'block'
          });
        }
      })
    );
  }

  const stream = aiClient.messages.stream({
    model: 'claude-3-7-sonnet-latest',
    max_tokens: 64000,
    messages: [
      { role: 'assistant', content: BaseAIInstruction },
      {
        role: 'assistant',
        content: `stringified session history, please parse it accordingly before using it => ${JSON.stringify(session.messages)}`
      },
      {
        role: 'user',
        content: event.context
          ? `Here is the context of this prompt, there can be full files or code blocks in context, their type tell you about this info. If its all then its full file, if its block its a code block as you can assume. Digest this stringified context data and use it generating your next response. Stringified Context => ${JSON.stringify(context)}

Prompt is => ${event.payload}`
          : event.payload
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
    await writeError(error, 'stream');

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

  if (session.messages.length === 1) {
    const generatedSessionName = await aiClient.messages.create({
      max_tokens: 1024,
      model: 'claude-3-7-sonnet-latest',
      messages: [
        {
          role: 'assistant',
          content:
            'This is the beginning of AI chat session. I will provide you the first message of user. I want you to create me a session name based on the user message. Dont generate anything except session name I want just pure session name nothing else in generated message. By the way you had opening and closing tags in one of your responses I want only raw session name text ideally around 40-60 chars nothing else. Nothing in the beginning nothing in the end just session name nothing else, dont generate nonsense.'
        },
        { role: 'user', content: event.payload }
      ]
    });

    const history = await getHistory();

    history.sessions = history.sessions.map((session) =>
      session.id === event.sessionId
        ? {
            ...session,
            name: `${new Date().toLocaleDateString()} - ${(generatedSessionName.content[0] as { text: string }).text}`
          }
        : session
    );

    await writeFile('history.json', JSON.stringify(history));
  }

  await writeFile(
    `${event.sessionId}.json`,
    JSON.stringify({
      messages: [
        ...session.messages,
        {
          sender: 'User',
          message: event.payload,
          referenceCount: context.length
        },
        {
          sender: 'Kisuke',
          message: (
            stream.messages[3].content[0] as unknown as { text: string }
          ).text
        }
      ]
    })
  );
};
