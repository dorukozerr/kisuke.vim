import { PromptPayload } from '~/types';
import { processPrompt } from '~/llm';

export const promptHandler = async (payload: PromptPayload) =>
  processPrompt(payload);
