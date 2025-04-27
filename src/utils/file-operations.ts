import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile as fsWriteFile } from 'fs/promises';

import { History, Session } from '../types';

const configDir = join(homedir(), '.config', 'kisuke');

if (!existsSync(configDir)) mkdir(configDir, { recursive: true });

export const writeFile = async (fileName: string, content: string) =>
  await fsWriteFile(join(configDir, fileName), content);

export const writeError = async (error: unknown, operation: string) =>
  await fsWriteFile(
    join(configDir, 'errors.txt'),
    JSON.stringify(
      {
        timestamp: new Date().toLocaleDateString(),
        operation,
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack
              }
            : String(error)
      },
      null,
      2
    ) + '\n',
    { flag: 'a' }
  );

const setupKisuke = async () => {
  await Promise.all([
    writeFile('history.json', JSON.stringify({ sessions: [] })),
    writeFile(
      'config.json',
      JSON.stringify({
        provider: '',
        model: '',
        apiKeys: { anthropic: '', openai: '', google: '' }
      })
    )
  ]);

  return JSON.parse(
    await readFile(join(configDir, 'history.json'), 'utf-8')
  ) as History;
};

export const getConfig = async () => {
  try {
    return JSON.parse(await readFile(join(configDir, 'config.json'), 'utf-8'));
  } catch (error) {
    await writeError(error, 'getConfig');

    await setupKisuke();

    return JSON.parse(await readFile(join(configDir, 'config.json'), 'utf-8'));
  }
};

export const getHistory = async () => {
  try {
    return JSON.parse(
      await readFile(join(configDir, 'history.json'), 'utf-8')
    ) as History;
  } catch (error) {
    await writeError(error, 'getHistory');

    await setupKisuke();

    return JSON.parse(
      await readFile(join(configDir, 'history.json'), 'utf-8')
    ) as History;
  }
};

export const getSession = async (sessionId: string) => {
  try {
    return JSON.parse(
      await readFile(join(configDir, `${sessionId}.json`), 'utf-8')
    ) as Session;
  } catch (error) {
    await writeError(error, `getSession => ${sessionId}`);

    return null;
  }
};
