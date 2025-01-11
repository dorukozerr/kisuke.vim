export interface History {
  sessions: { id: string; name: string }[];
}

export interface Session {
  messages: { sender: string; message: string }[];
}

interface InitializeEvent {
  type: 'initialize';
}

interface PromptEvent {
  type: 'prompt';
  payload: string;
  sessionId: string;
}

interface NewSessionEvent {
  type: 'newSession';
}

interface SwitchSessionEvent {
  type: 'switchSession';
  payload: string;
}

interface RenameSessionEvent {
  type: 'renameSession';
  payload: string;
  sessionId: string;
}

interface DeleteSessionEvent {
  type: 'deleteSession';
  payload: string;
}

export type Event =
  | InitializeEvent
  | PromptEvent
  | NewSessionEvent
  | SwitchSessionEvent
  | RenameSessionEvent
  | DeleteSessionEvent;

interface InitializeOutput {
  type: 'initialize';
  totalSessions: number;
  sessionInfo: { id: string; name: string };
  payload: Session;
}

interface PromptOutput {
  type: 'response';
  payload: string;
}

interface NewSessionOutput {
  type: 'newSession';
  totalSessions: number;
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
  | ErrorOutput;
