import { randomBytes } from 'crypto';
import { mkdir, readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';
import { Anthropic } from '@anthropic-ai/sdk';
import { TextDelta } from '@anthropic-ai/sdk/resources';

import { History, Session, Event, Output } from '../types';
import { getConfig } from '../utils/file-operations';
import { initialSessionData, BaseAIInstruction } from '../utils/initials';

export let aiClient: Anthropic | null;

export const updateAIClient = async () => {
  const configFile = await getConfig();

  aiClient = new Anthropic({ apiKey: configFile.apiKeys.anthropic });
};
