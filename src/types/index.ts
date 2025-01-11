export interface History {
  sessions: { id: string; name: string }[];
}

export interface Session {
  sessionName: string;
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
  sessionId: string;
  totalSessions: number;
  payload: Session;
}

interface PromptOutput {
  type: 'response';
  payload: string;
}

interface ErrorOutput {
  type: 'error';
  payload: string;
}

export type Output = InitializeOutput | PromptOutput | ErrorOutput;
