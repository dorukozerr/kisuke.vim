interface BaseConfig {
  apiKeys: {
    anthropic: string;
    google: string;
    openai: string;
  };
}

interface AnthropicConfig extends BaseConfig {
  provider: 'anthropic';
  model: 'sonnet-4' | 'opus-4' | 'sonnet-3.7' | 'haiku-3.7' | 'opus-3.7';
}

interface GoogleConfig extends BaseConfig {
  provider: 'google';
  model:
    | 'pro-2.5-exp'
    | 'pro-2.5-prev'
    | 'flash-2.0-exp'
    | 'flash-1.5'
    | 'flash-1.5-8b'
    | 'pro-1.5';
}

interface OpenAIConfig extends BaseConfig {
  provider: 'openai';
  model:
    | 'gpt-4.1'
    | 'gpt-4.1-mini'
    | 'gpt-4o'
    | 'gpt-4o-mini'
    | 'gpt-4-turbo'
    | 'gpt-4'
    | 'gpt-3.5-turbo';
}

export type Config = AnthropicConfig | GoogleConfig | OpenAIConfig;

export interface History {
  sessions: { id: string; name: string }[];
}

export interface Session {
  messages: { sender: string; message: string }[];
}

interface InitializeEvent {
  type: 'initialize';
}

interface NewSessionEvent {
  type: 'new_session';
}

export interface PromptEvent {
  type: 'prompt';
  payload: string;
  sessionId: string;
  context?: {
    file_path: string;
    scope: 'all' | 'block';
    highlighted_code?: string;
  }[];
}

interface ResumeLastSessionEvent {
  type: 'resume_last_session';
}

interface LoadSessionsEvent {
  type: 'load_sessions';
}

export interface RestoreSessionEvent {
  type: 'restore_session';
  payload: string;
}

export interface DeleteSessionEvent {
  type: 'delete_session';
  payload: string;
}

export type Event =
  | InitializeEvent
  | NewSessionEvent
  | PromptEvent
  | ResumeLastSessionEvent
  | LoadSessionsEvent
  | RestoreSessionEvent
  | DeleteSessionEvent;

interface InitializeOutput {
  type: 'initialize';
  payload: 'not_configured' | 'missing_api_key' | 'eligible';
  provider?: string;
  model?: string;
  session_count?: number;
}

interface NewSessionOutput {
  type: 'new_session';
  totalSessions: number;
  current_session: number;
  session_info: {
    id: string;
    name: string;
    total_count: number;
    current_index: number;
  };
  payload: Session;
}

interface PromptOutput {
  type: 'response';
  payload: string;
}

interface ResumeLastSessionOutput {
  type: 'resume_last_session';
  session_info: {
    id: string;
    name: string;
    total_count: number;
    current_index: number;
  };
  payload: Session;
}

interface LoadSessionsOutput {
  type: 'load_sessions';
  payload: { id: string; name: string }[];
}

interface RestoreSessionOutput {
  type: 'restore_session';
  session_info: {
    id: string;
    name: string;
    total_count: number;
    current_index: number;
  };
  payload: Session;
}

interface ErrorOutput {
  type: 'error';
  payload: string;
}

export type Output =
  | InitializeOutput
  | NewSessionOutput
  | PromptOutput
  | ResumeLastSessionOutput
  | LoadSessionsOutput
  | RestoreSessionOutput
  | ErrorOutput;
