import { randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

import { History, Session, Event, Output } from './types';

const stdin = process.stdin;
const stdout = process.stdout;

stdin.resume();
stdin.setEncoding('utf-8');

const configDir = join(homedir(), '.config', 'kisuke');

if (!existsSync(configDir)) mkdir(configDir, { recursive: true });

const getHistory = async () => {
  try {
    return JSON.parse(
      await readFile(join(configDir, 'history.json'), 'utf-8')
    ) as History;
  } catch {
    const sessionId = randomBytes(16).toString('hex');
    await writeFile(
      join(configDir, 'history.json'),
      JSON.stringify({ sessions: [{ id: sessionId, name: sessionId }] })
    );
    await writeFile(
      join(configDir, `${sessionId}.json`),
      JSON.stringify({
        messages: [
          {
            sender: 'Kisuke',
            message: 'Welcome to Urahara candy shop, how can I help you today?'
          }
        ]
      })
    );
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
    const event = JSON.parse(data) as Event;

    if (event.type === 'initialize') {
      const history = await getHistory();
      const sessionId = history.sessions[history.sessions.length - 1].id;
      const session = await getSession(sessionId);

      sendResponse({
        type: 'initialize',
        sessionId,
        totalSessions: history.sessions.length,
        payload: session
      });
    }

    if (event.type === 'prompt') {
      sendResponse({
        type: 'response',
        payload: `Received: ${event.payload}`
      });
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
