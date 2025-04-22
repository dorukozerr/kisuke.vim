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

interface PromptEvent {
  type: 'prompt';
  payload: string;
  sessionId: string;
  context?: {
    file_path: string;
    scope: 'all' | 'block';
    highlighted_code?: string;
  }[];
}

interface SwitchSessionEvent {
  type: 'next_session' | 'prev_session';
  paylod: string;
}

interface DeleteSessionEvent {
  type: 'delete_session';
  payload: string;
}

export type Event =
  | InitializeEvent
  | PromptEvent
  | NewSessionEvent
  | SwitchSessionEvent
  | DeleteSessionEvent;

interface InitializeOutput {
  type: 'initialize';
  payload: 'not_configured' | 'missing_api_key' | 'eligible';
  provider?: string;
  model?: string;
  session_count?: number;
}

interface PromptOutput {
  type: 'response';
  payload: string;
}

interface NewSessionOutput {
  type: 'new_session';
  totalSessions: number;
  currentSession: number;
  sessionInfo: { id: string; name: string };
  payload: Session;
}

interface SwitchSessionOuput {
  type: 'switch_session';
  currentSession: number;
  sessionInfo: { id: string; name: string };
  payload: Session;
}

interface ErrorOutput {
  type: 'error';
  payload: string;
}

export type Output =
  | InitializeOutput
  | PromptOutput
  | NewSessionOutput
  | SwitchSessionOuput
  | ErrorOutput;
