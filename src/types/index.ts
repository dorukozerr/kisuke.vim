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
