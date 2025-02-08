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
  context?: {
    file_path: string;
    scope: 'all' | 'block';
    highlighted_code?: string;
  }[];
}

interface NewSessionEvent {
  type: 'newSession';
}

interface SwitchSessionEvent {
  type: 'nextSession' | 'prevSession';
  paylod: string;
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
  sessions: History['sessions'];
  payload: 'configurationNeeded' | 'readyToUse';
}

interface PromptOutput {
  type: 'response';
  payload: string;
}

interface NewSessionOutput {
  type: 'newSession';
  totalSessions: number;
  currentSession: number;
  sessionInfo: { id: string; name: string };
  payload: Session;
}

interface SwitchSessionOuput {
  type: 'switchSession';
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
