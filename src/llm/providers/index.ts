import { AnthropicProviderSettings, createAnthropic } from '@ai-sdk/anthropic';
import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProviderSettings
} from '@ai-sdk/google';
import { createOpenAI, OpenAIProviderSettings } from '@ai-sdk/openai';
import { createXai, XaiProviderSettings } from '@ai-sdk/xai';

export const getAnthropicProdiver = (config: AnthropicProviderSettings) =>
  createAnthropic(config);
export const getGoogleProdiver = (config: GoogleGenerativeAIProviderSettings) =>
  createGoogleGenerativeAI(config);
export const getOpenAIProdiver = (config: OpenAIProviderSettings) =>
  createOpenAI(config);
export const getXAIProdiver = (config: XaiProviderSettings) =>
  createXai(config);
