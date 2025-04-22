import { randomBytes } from 'crypto';
import { mkdir, readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { Anthropic } from '@anthropic-ai/sdk';
import { TextDelta } from '@anthropic-ai/sdk/resources';

import { History, Session, Event, Output } from './types';
import { initialSessionData, BaseAIInstruction } from './utils/initials';

const stdin = process.stdin;
const stdout = process.stdout;

stdin.resume();
stdin.setEncoding('utf-8');

const configDir = join(homedir(), '.config', 'kisuke');

if (!existsSync(configDir)) mkdir(configDir, { recursive: true });

let anthropicClient: Anthropic | null = null;
let currentSessionIndex: number = 0;

const setupKisukeFiles = async () => {
  const sessionId = randomBytes(16).toString('hex');

  await writeFile(
    join(configDir, 'history.json'),
    JSON.stringify({ sessions: [] })
  );
  await writeFile(
    join(configDir, `${sessionId}.json`),
    JSON.stringify(initialSessionData)
  );
  await writeFile(
    join(configDir, 'config.json'),
    JSON.stringify({
      provider: '',
      model: '',
      apiKeys: { anthropicApiKey: '' }
    })
  );

  return JSON.parse(
    await readFile(join(configDir, 'history.json'), 'utf-8')
  ) as History;
};

const getHistory = async () => {
  try {
    return JSON.parse(
      await readFile(join(configDir, 'history.json'), 'utf-8')
    ) as History;
  } catch {
    await setupKisukeFiles();

    return JSON.parse(
      await readFile(join(configDir, 'history.json'), 'utf-8')
    ) as History;
  }
};

const getSession = async (sessionId: string) =>
  JSON.parse(
    await readFile(join(configDir, `${sessionId}.json`), 'utf-8')
  ) as Session;

stdin.on('data', async (data: string) => {
  try {
    const history = await getHistory();

    const configFile = JSON.parse(
      await readFile(join(configDir, 'config.json'), 'utf8')
    );

    if (anthropicClient === null) {
      anthropicClient = new Anthropic({
        apiKey: configFile.apiKey
      });
    }

    const event = JSON.parse(data) as Event;

    if (event.type === 'initialize') {
      //  const latestSessionIndex = history.sessions.length - 1;
      //  const sessionInfo = history.sessions[latestSessionIndex];
      //  const session = await getSession(sessionInfo.id);

      //  currentSessionIndex = latestSessionIndex;

      // sendResponse({
      //   type: 'initialize',
      //   totalSessions: history.sessions.length,
      //   currentSession: currentSessionIndex + 1,
      //   sessionInfo,
      //   payload: session
      // });

      if (!configFile.provider || !configFile.model) {
        sendResponse({
          type: 'initialize',
          payload: 'not_configured'
        });
      } else if (
        configFile.provider === 'anthropic' &&
        !configFile.apiKeys.anthropicApiKey
      ) {
        sendResponse({
          type: 'initialize',
          payload: 'missing_api_key',
          provider: configFile.provider,
          model: configFile.model
        });
      } else {
        sendResponse({
          type: 'initialize',
          payload: 'eligible',
          provider: configFile.provider,
          model: configFile.model
        });
      }
    }

    if (event.type === 'prompt') {
      const session = await getSession(event.sessionId);
      const context: {
        fileName: string;
        content: string;
        type: 'all' | 'block';
      }[] = [];

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

      const stream = anthropicClient.messages.stream({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 4096,
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

My prompt is => ${event.payload}`
              : event.payload
          }
        ]
      });

      sendResponse({ type: 'response', payload: 'stream_start' });

      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta') {
            sendResponse({
              type: 'response',
              payload: (chunk.delta as TextDelta).text
            });
          }
        }
      } catch (streamError) {
        sendResponse({
          type: 'error',
          payload: `Stream error: ${streamError}`
        });
      } finally {
        sendResponse({ type: 'response', payload: 'stream_end' });
      }

      await writeFile(
        join(configDir, `${event.sessionId}.json`),
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
    }

    if (event.type === 'new_session') {
      const sessionId = randomBytes(16).toString('hex');

      history.sessions.push({ id: sessionId, name: sessionId });

      await writeFile(join(configDir, 'history.json'), JSON.stringify(history));
      await writeFile(
        join(configDir, `${sessionId}.json`),
        JSON.stringify(initialSessionData)
      );

      currentSessionIndex = history.sessions.length - 1;

      sendResponse({
        type: 'new_session',
        totalSessions: history.sessions.length,
        currentSession: history.sessions.length,
        sessionInfo: { id: sessionId, name: sessionId },
        payload: initialSessionData
      });
    }

    if (event.type === 'next_session') {
      if (currentSessionIndex === history.sessions.length - 1) {
        currentSessionIndex = 0;

        const sessionInfo = history.sessions[0];
        const session = await getSession(sessionInfo.id);

        sendResponse({
          type: 'switch_session',
          currentSession: currentSessionIndex + 1,
          sessionInfo,
          payload: session
        });
      } else {
        currentSessionIndex++;

        const sessionInfo = history.sessions[currentSessionIndex];
        const session = await getSession(sessionInfo.id);

        sendResponse({
          type: 'switch_session',
          currentSession: currentSessionIndex + 1,
          sessionInfo,
          payload: session
        });
      }
    }

    if (event.type === 'prev_session') {
      if (currentSessionIndex === 0) {
        currentSessionIndex = history.sessions.length - 1;

        const sessionInfo = history.sessions[currentSessionIndex];
        const session = await getSession(sessionInfo.id);

        sendResponse({
          type: 'switch_session',
          currentSession: currentSessionIndex + 1,
          sessionInfo,
          payload: session
        });
      } else {
        currentSessionIndex--;

        const sessionInfo = history.sessions[currentSessionIndex];
        const session = await getSession(sessionInfo.id);

        sendResponse({
          type: 'switch_session',
          currentSession: currentSessionIndex + 1,
          sessionInfo,
          payload: session
        });
      }
    }

    if (event.type === 'delete_session') {
      history.sessions = history.sessions.filter(
        (session) => session.id !== event.payload
      );

      await unlink(join(configDir, `${event.payload}.json`));

      if (history.sessions.length === 0) {
        const sessionId = randomBytes(16).toString('hex');

        history.sessions = [{ id: sessionId, name: sessionId }];

        await writeFile(
          join(configDir, 'history.json'),
          JSON.stringify({ sessions: [{ id: sessionId, name: sessionId }] })
        );
        await writeFile(
          join(configDir, `${sessionId}.json`),
          JSON.stringify(initialSessionData)
        );
      } else {
        await writeFile(
          join(configDir, 'history.json'),
          JSON.stringify(history)
        );
      }

      // const latestSessionIndex = history.sessions.length - 1;
      // const sessionInfo = history.sessions[latestSessionIndex];
      // const session = await getSession(sessionInfo.id);

      // currentSessionIndex = latestSessionIndex;

      // sendResponse({
      //   type: 'initialize',
      //   totalSessions: history.sessions.length,
      //   currentSession: currentSessionIndex + 1,
      //   sessionInfo,
      //   payload: session
      // });
    }
  } catch (error) {
    sendResponse({
      type: 'error',
      payload: `Unknown server error, ${(error as { message?: string })?.message}`
    });
  }
});

const sendResponse = (reply: Output) => {
  stdout.write(JSON.stringify(reply) + '\n');
};
