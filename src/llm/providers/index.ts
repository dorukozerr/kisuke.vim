import {
  type AnthropicProviderSettings,
  createAnthropic
} from '@ai-sdk/anthropic';
import {
  createGoogleGenerativeAI,
  type GoogleGenerativeAIProviderSettings
} from '@ai-sdk/google';
import { createOpenAI, type OpenAIProviderSettings } from '@ai-sdk/openai';
import { createXai, type XaiProviderSettings } from '@ai-sdk/xai';

export const getAnthropicProdiver = (config: AnthropicProviderSettings) =>
  createAnthropic(config);
export const getGoogleProdiver = (config: GoogleGenerativeAIProviderSettings) =>
  createGoogleGenerativeAI(config);
export const getOpenAIProdiver = (config: OpenAIProviderSettings) =>
  createOpenAI(config);
export const getXAIProdiver = (config: XaiProviderSettings) =>
  createXai(config);
