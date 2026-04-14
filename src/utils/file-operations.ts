import { existsSync } from 'fs';
import { mkdir, readFile, writeFile as fsWriteFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

import { stdOutput } from '#/index';
import {
  configSchema,
  historySchema,
  mcpClientRootsConfigSchema,
  sessionSchema
} from '#/schemas';
import type { Config, History, MCPClientRootsConfig, Session } from '#/types';
import { formatError } from '#/utils/format-error';
import { requestApproval } from '#/utils/request-approval';

const configDir = join(homedir(), '.config', 'kisuke');

if (!existsSync(configDir)) mkdir(configDir, { recursive: true });

export const writeFile = async (fileName: string, content: string) =>
  await fsWriteFile(join(configDir, fileName), content);

export const writeError = async (error: unknown, operation: string) => {
  const errorFilePath = join(configDir, 'errors.json');

  // eslint-disable-next-line no-useless-assignment
  let currentErrors: object[] = [];

  try {
    const fileContent = await readFile(errorFilePath, 'utf-8');
    const parsedContent = JSON.parse(fileContent);

    if (Array.isArray(parsedContent)) {
      currentErrors = parsedContent;
    } else {
      await writeFile('errors.json', JSON.stringify([parsedContent], null, 2));

      currentErrors = [parsedContent];
    }
  } catch (error) {
    currentErrors = error instanceof Error ? [error] : [];
  }

  const errorEntry = { timestamp: new Date().toISOString(), operation, error };

  currentErrors.push({ timestamp: new Date().toISOString(), operation, error });

  try {
    await writeFile('errors.json', JSON.stringify(currentErrors, null, 2));
  } catch (error) {
    await writeFile(
      `errors-${new Date().toISOString()}.json`,
      JSON.stringify([errorEntry, error], null, 2)
    );
  }
};

export const getConfig = async (): Promise<Config | null> => {
  try {
    return configSchema.parse(
      JSON.parse(await readFile(join(configDir, 'config.json'), 'utf-8'))
    );
  } catch (e) {
    if (
      await requestApproval(
        'Config file parsing failed, reset to initial state?'
      )
    ) {
      await writeFile(
        'config.json',
        JSON.stringify({
          provider: '',
          model: '',
          apiKeys: { anthropic: '', openai: '', google: '', xai: '' }
        })
      );

      return await getConfig();
    } else {
      stdOutput({ type: 'error', payload: 'Config file parsing failed' });

      const error = formatError(e);
      await writeError(error, 'get_config');

      return null;
    }
  }
};

export const getMCPClientRootsConfig =
  async (): Promise<MCPClientRootsConfig | null> => {
    try {
      return mcpClientRootsConfigSchema.parse(
        JSON.parse(
          await readFile(
            join(configDir, 'mcp-client-roots-config.json'),
            'utf-8'
          )
        )
      );
    } catch (e) {
      const error = formatError(e);
      await writeError(error, 'getMCPClientRootsConfig');

      if (
        await requestApproval(
          'MCP client roots config file parsing failed, reset to initial state?'
        )
      ) {
        await writeFile(
          'mcp-client-roots-config.json',
          JSON.stringify({
            cwd: { dir: null, accessGranted: false },
            roots: []
          })
        );

        return await getMCPClientRootsConfig();
      } else {
        stdOutput({
          type: 'error',
          payload: 'MCP client roots config file parsing failed'
        });

        return null;
      }
    }
  };

export const getHistory = async (): Promise<History | null> => {
  try {
    return historySchema.parse(
      JSON.parse(await readFile(join(configDir, 'history.json'), 'utf-8'))
    );
  } catch (e) {
    const error = formatError(e);
    await writeError(error, 'getHistory');

    if (
      await requestApproval(
        'History config file parsing failed, reset to initial state?'
      )
    ) {
      await writeFile('history.json', JSON.stringify({ sessions: [] }));

      return await getHistory();
    } else {
      stdOutput({
        type: 'error',
        payload: 'History config file parsing failed'
      });

      return null;
    }
  }
};

export const getSession = async (
  sessionId: string
): Promise<Session | null> => {
  try {
    return sessionSchema.parse(
      JSON.parse(await readFile(join(configDir, `${sessionId}.json`), 'utf-8'))
    );
  } catch (e) {
    const error = formatError(e);

    await writeError(error, `getSesssion => ${sessionId}`);

    stdOutput({ type: 'error', payload: 'Session file parsing failed' });

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
    await writeFile('temp.json', JSON.stringify(currentArray, null, 2));
  } catch (error) {
    await writeError(error, 'writeTempJson - Write Appended Data');
  }
};

export const writeMcpLog = async (operation: string, data: unknown) => {
  const mcpLogPath = join(configDir, 'mcp-logs.json');
  // eslint-disable-next-line no-useless-assignment
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
