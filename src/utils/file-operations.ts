import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile as fsWriteFile } from 'fs/promises';

import { Config, History, Session } from '../types';

const configDir = join(homedir(), '.config', 'kisuke');

if (!existsSync(configDir)) mkdir(configDir, { recursive: true });

export const writeFile = async (fileName: string, content: string) =>
  await fsWriteFile(join(configDir, fileName), content);

export const writeError = async (error: unknown, operation: string) =>
  await fsWriteFile(
    join(configDir, 'errors.json'),
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
    return JSON.parse(
      await readFile(join(configDir, 'config.json'), 'utf-8')
    ) as Config;
  } catch (error) {
    await writeError(error, 'getConfig');

    await setupKisuke();

    return JSON.parse(
      await readFile(join(configDir, 'config.json'), 'utf-8')
    ) as Config;
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

export const writeTempJson = async (data: object) => {
  const tempFilePath = join(configDir, 'temp.json');
  let currentArray: object[] = [];

  try {
    const fileContent = await readFile(tempFilePath, 'utf-8');
    const parsedContent = JSON.parse(fileContent);

    if (Array.isArray(parsedContent)) {
      currentArray = parsedContent;
    } else {
      // If file exists but is not a valid JSON array, treat it as empty.
      // This ensures subsequent writes start a new, valid array.
      // Log an error to indicate an issue with the existing file structure.
      await writeError(
        `Existing temp.json is not a valid JSON array. Content: ${fileContent.substring(0, 100)}...`,
        'writeTempJson - Invalid JSON Structure'
      );
    }
  } catch (error) {
    // If readFile fails (e.g., file not found - ENOENT) or JSON.parse fails (SyntaxError),
    // we proceed with an empty array. This handles both missing files and corrupted/invalid JSON.
    await writeError(error, 'writeTempJson - Read/Parse Failure');
  }

  currentArray.push(data);

  try {
    const contentToWrite = JSON.stringify(currentArray, null, 2);
    // Use the existing writeFile utility to write the updated array
    await writeFile('temp.json', contentToWrite);
  } catch (error) {
    await writeError(error, 'writeTempJson - Write Appended Data');
  }
};
