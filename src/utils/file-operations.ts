import { existsSync } from 'fs';
import { mkdir, readFile, writeFile as fsWriteFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

import { z, ZodError } from 'zod';

import { Config } from '~/types';
import {
  configSchema,
  historySchema,
  mcpClientRootsConfigSchema,
  sessionSchema
} from '~/schemas';
import { requestApproval } from '~/utils/request-approval';

const configDir = join(homedir(), '.config', 'kisuke');

if (!existsSync(configDir)) mkdir(configDir, { recursive: true });

export const writeFile = async (fileName: string, content: string) =>
  await fsWriteFile(join(configDir, fileName), content);

// FIXME: wtf is this function
export const writeError = async (error: unknown, operation: string) => {
  const errorFilePath = join(configDir, 'errors.json');

  let currentErrors: object[] = [];

  try {
    const fileContent = await readFile(errorFilePath, 'utf-8');
    const parsedContent = JSON.parse(fileContent);

    if (Array.isArray(parsedContent)) {
      currentErrors = parsedContent;
    } else {
      await fsWriteFile(
        errorFilePath,
        JSON.stringify([parsedContent], null, 2)
      );

      currentErrors = [parsedContent];
    }
  } catch (error) {
    currentErrors = error instanceof Error ? [error] : [];
  }

  const errorEntry = { timestamp: new Date().toISOString(), operation, error };

  currentErrors.push(errorEntry);

  try {
    await fsWriteFile(errorFilePath, JSON.stringify(currentErrors, null, 2));
  } catch (error) {
    await fsWriteFile(
      join(configDir, `errors-${new Date().toISOString()}.json`),
      JSON.stringify([errorEntry, error], null, 2)
    );
  }
};

const setupKisuke = async () => {
  await Promise.all([
    writeFile('history.json', JSON.stringify({ sessions: [] })),
    writeFile(
      'config.json',
      JSON.stringify({
        provider: '',
        model: '',
        apiKeys: { anthropic: '', openai: '', google: '', xai: '' }
      })
    ),
    writeFile(
      'mcp-client-roots-config.json',
      JSON.stringify({ cwd: { dir: null, accessGranted: false }, roots: [] })
    )
  ]);

  const fileContent = await readFile(join(configDir, 'history.json'), 'utf-8');
  return historySchema.parse(JSON.parse(fileContent));
};

export const getConfig = async (): Promise<Config | { error: string }> => {
  try {
    return configSchema.parse(
      JSON.parse(await readFile(join(configDir, 'config.json'), 'utf-8'))
    );
  } catch (error) {
    await writeError(
      error instanceof ZodError
        ? z.treeifyError(error)
        : error instanceof Error
          ? `${error.name} - ${error.message}`
          : error,
      'get_config'
    );

    if (
      await requestApproval('Config file malformed, reset to initial state?')
    ) {
      await setupKisuke();

      return await getConfig();
    } else return { error: 'Config file malformed' };
  }
};

export const getMCPClientRootsConfig = async () => {
  try {
    return mcpClientRootsConfigSchema.parse(
      JSON.parse(
        await readFile(join(configDir, 'mcp-client-roots-config.json'), 'utf-8')
      )
    );
  } catch (error) {
    await writeError(
      error instanceof ZodError
        ? z.treeifyError(error)
        : error instanceof Error
          ? `${error.name} - ${error.message}`
          : error,
      'get_mcp_client_roots_config'
    );

    return { error: 'MCP client roots config file malformed' };
  }
};

export const getHistory = async () => {
  try {
    return historySchema.parse(
      JSON.parse(await readFile(join(configDir, 'history.json'), 'utf-8'))
    );
  } catch (error) {
    await writeError(
      error instanceof ZodError
        ? z.treeifyError(error)
        : error instanceof Error
          ? `${error.name} - ${error.message}`
          : error,
      'getHistory'
    );

    return { error: 'History file malformed' };
  }
};

export const getSession = async (sessionId: string) => {
  try {
    const fileContent = await readFile(
      join(configDir, `${sessionId}.json`),
      'utf-8'
    );
    return sessionSchema.parse(JSON.parse(fileContent));
  } catch (error) {
    await writeError(
      error instanceof ZodError
        ? z.treeifyError(error)
        : error instanceof Error
          ? `${error.name} - ${error.message}`
          : error,
      `getSession => ${sessionId}`
    );
    return { error: 'Session file malformed' };
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
      await writeError(
        `Existing temp.json is not a valid JSON array. Content: ${fileContent.substring(0, 100)}...`,
        'writeTempJson - Invalid JSON Structure'
      );
    }
  } catch (error) {
    await writeError(error, 'writeTempJson - Read/Parse Failure');
  }
  currentArray.push(data);
  try {
    const contentToWrite = JSON.stringify(currentArray, null, 2);
    await writeFile('temp.json', contentToWrite);
  } catch (error) {
    await writeError(error, 'writeTempJson - Write Appended Data');
  }
};

export const writeMcpLog = async (operation: string, data: unknown) => {
  const mcpLogPath = join(configDir, 'mcp-logs.json');
  let currentLogs: object[] = [];

  try {
    const fileContent = await readFile(mcpLogPath, 'utf-8');
    const parsedContent = JSON.parse(fileContent);

    if (Array.isArray(parsedContent)) {
      currentLogs = parsedContent;
    } else {
      await fsWriteFile(mcpLogPath, JSON.stringify([parsedContent], null, 2));
      currentLogs = [parsedContent];
    }
  } catch {
    currentLogs = [];
  }

  const logEntry = { timestamp: new Date().toISOString(), operation, data };
  currentLogs.push(logEntry);

  try {
    await fsWriteFile(mcpLogPath, JSON.stringify(currentLogs, null, 2));
  } catch (error) {
    await writeError(error, 'writeMcpLog');
  }
};
