import { readFile } from 'fs/promises';

import { processPrompt } from '#/llm';
import type { PromptPayload } from '#/types';

export const promptHandler = async (payload: PromptPayload) => {
  const context: {
    fileName: string;
    content: string;
    type: 'all' | 'block';
  }[] = [];

  if (payload.context) {
    await Promise.all(
      payload.context.map(async (entry) => {
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

  processPrompt({ ...payload, ...(payload.context ? context : {}) });
};
