import { createAnthropic } from '@ai-sdk/anthropic';

export const getAnthropic = ({ apiKey }: { apiKey: string }) =>
  createAnthropic({ apiKey });
