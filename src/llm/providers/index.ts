import { AnthropicProviderSettings, createAnthropic } from '@ai-sdk/anthropic';
import { createXai, XaiProviderSettings } from '@ai-sdk/xai';

export const getAnthropic = (config: AnthropicProviderSettings) =>
  createAnthropic(config);
export const getXAI = (config: XaiProviderSettings) => createXai(config);
