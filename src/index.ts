import { randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { Anthropic } from '@anthropic-ai/sdk';
import { TextDelta, InputJSONDelta } from '@anthropic-ai/sdk/resources';

import { History, Session, Event, Output } from './types';
import { initialSessionData } from './utils/initials';

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
    JSON.stringify({ sessions: [{ id: sessionId, name: sessionId }] })
  );
  await writeFile(
    join(configDir, `${sessionId}.json`),
    JSON.stringify(initialSessionData)
  );
  await writeFile(join(configDir, 'auth.json'), JSON.stringify({ apiKey: '' }));

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
    return setupKisukeFiles();
  }
};

const getSession = async (sessionId: string) =>
  JSON.parse(
    await readFile(join(configDir, `${sessionId}.json`), 'utf-8')
  ) as Session;

stdin.on('data', async (data: string) => {
  try {
    const history = await getHistory();

    const authFile = JSON.parse(
      await readFile(join(configDir, 'auth.json'), 'utf8')
    );

    if (!authFile.apiKey) {
      throw new Error('Please run :KisukeAuth');
    }

    if (anthropicClient === null) {
      anthropicClient = new Anthropic({
        apiKey: authFile.apiKey
      });
    }

    const event = JSON.parse(data) as Event;

    if (event.type === 'initialize') {
      const latestSessionIndex = history.sessions.length - 1;
      const sessionInfo = history.sessions[latestSessionIndex];
      const session = await getSession(sessionInfo.id);

      currentSessionIndex = latestSessionIndex;

      sendResponse({
        type: 'initialize',
        totalSessions: history.sessions.length,
        currentSession: currentSessionIndex + 1,
        sessionInfo,
        payload: session
      });
    }

    if (event.type === 'prompt') {
      const session = await getSession(event.sessionId);

      //  await writeFile(
      //    join(configDir, `${event.sessionId}.json`),
      //    JSON.stringify({
      //      messages: [
      //        ...session.messages,
      //        { sender: 'User', message: event.payload },
      //        { sender: 'Kisuke', message: `Received: ${event.payload}` }
      //      ]
      //    })
      //  );

      const stream = anthropicClient.messages.stream({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        messages: [
          {
            role: 'assistant',
            content:
              'You are a AI that will help programmers/developers to find and fix bugs, suggest new code blocks, generate solutions and assist them. This will work like normal LLM usage, I will also give you stringifyied version of your session history in this context. Do your best to assist us. And Your output must be in this format => paragraph1 \nparagraph2 \n```language\ncodeblock\n```. paragraph1 and paragraph2 is just a example you can add and remove as much paragraghps or code blocks you need just divide them with line breaks and give code in markdown codeblock format. Your name is Kisuke Urahara, do your best! Process what I wrote and iterate it at least 3 time to do what I want you to do, generate something better than my input and use the generated output. Also put only 1 line break \n between every section I will use that to render your output you will be used as vim plugin so its really important for me to put only one line break. You are doing good at normal text generation but be super strict on code block generation follow the my settings and preferences'
          },
          {
            role: 'assistant',
            content: `stringifyied session history => ${session.messages}`
          },
          { role: 'user', content: event.payload }
        ]
      });

      sendResponse({ type: 'response', payload: 'stream_start' });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta') {
          sendResponse({
            type: 'response',
            payload: (chunk.delta as { text: string }).text
          });
        }
      }

      sendResponse({ type: 'response', payload: 'stream_end' });
    }

    if (event.type === 'newSession') {
      const sessionId = randomBytes(16).toString('hex');

      history.sessions.push({ id: sessionId, name: sessionId });

      await writeFile(join(configDir, 'history.json'), JSON.stringify(history));
      await writeFile(
        join(configDir, `${sessionId}.json`),
        JSON.stringify(initialSessionData)
      );

      currentSessionIndex = history.sessions.length - 1;

      sendResponse({
        type: 'newSession',
        totalSessions: history.sessions.length,
        currentSession: history.sessions.length,
        sessionInfo: { id: sessionId, name: sessionId },
        payload: initialSessionData
      });
    }

    if (event.type === 'nextSession') {
      if (currentSessionIndex === history.sessions.length - 1) {
        currentSessionIndex = 0;

        const sessionInfo = history.sessions[0];
        const session = await getSession(sessionInfo.id);

        sendResponse({
          type: 'switchSession',
          currentSession: currentSessionIndex + 1,
          sessionInfo,
          payload: session
        });
      } else {
        currentSessionIndex++;

        const sessionInfo = history.sessions[currentSessionIndex];
        const session = await getSession(sessionInfo.id);

        sendResponse({
          type: 'switchSession',
          currentSession: currentSessionIndex + 1,
          sessionInfo,
          payload: session
        });
      }
    }

    if (event.type === 'prevSession') {
      if (currentSessionIndex === 0) {
        currentSessionIndex = history.sessions.length - 1;

        const sessionInfo = history.sessions[currentSessionIndex];
        const session = await getSession(sessionInfo.id);

        sendResponse({
          type: 'switchSession',
          currentSession: currentSessionIndex + 1,
          sessionInfo,
          payload: session
        });
      } else {
        currentSessionIndex--;

        const sessionInfo = history.sessions[currentSessionIndex];
        const session = await getSession(sessionInfo.id);

        sendResponse({
          type: 'switchSession',
          currentSession: currentSessionIndex + 1,
          sessionInfo,
          payload: session
        });
      }
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
