import { AnthropicProviderSettings, createAnthropic } from '@ai-sdk/anthropic';

export const getAnthropic = ({ apiKey }: AnthropicProviderSettings) =>
  createAnthropic({ apiKey });
