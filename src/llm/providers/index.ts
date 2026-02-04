import { AnthropicProviderSettings, createAnthropic } from '@ai-sdk/anthropic';
import { createXai, XaiProviderSettings } from '@ai-sdk/xai';

export const getAnthropic = ({ apiKey }: AnthropicProviderSettings) =>
  createAnthropic({ apiKey });

export const getXAI = (config: XaiProviderSettings) => createXai(config);
