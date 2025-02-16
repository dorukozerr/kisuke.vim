export interface ConfigFile {
  provider: 'anthropic' | '';
  model: 'sonnet' | '';
  apiKeys: { anthropicApiKey: string; openAiApiKey: string };
}

export interface History {
  sessions: { id: string; name: string }[];
}

export interface Session {
  messages: { sender: string; message: string }[];
}

interface InitializeEvent {
  type: 'initialize';
}

interface CreateNewSessionEvent {
  type: 'createNewSession';
}

interface LoadLastSessionEvent {
  type: 'loadLastSession';
}

interface ListAllSessionsEvent {
  type: 'listAllSessions';
}

interface LoadSessionEvent {
  type: 'LoadSessionEvent';
  sessionId: string;
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
  | CreateNewSessionEvent
  | LoadLastSessionEvent
  | ListAllSessionsEvent
  | LoadSessionEvent
  | PromptEvent
  | NewSessionEvent
  | SwitchSessionEvent
  | RenameSessionEvent
  | DeleteSessionEvent;

interface InitializeOutput {
  type: 'initialize';
  payload: 'configurationNeeded' | 'readyToUse';
  totalSessions?: number;
}

interface CreateNewSessionOutput {
  type: 'createNewSession';
  payload: Session;
  sessionId: string;
}

interface LoadLastSessionOutput {
  type: 'loadLastSession';
  payload: Session;
  sessionId: string;
}

interface ListAllSessionsOutput {
  type: 'createNewSession';
  payload: History;
}

interface LoadSessionOutput {
  type: 'loadSession';
  payload: Session;
  sessionId: string;
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
  | CreateNewSessionOutput
  | LoadLastSessionOutput
  | ListAllSessionsOutput
  | LoadSessionOutput
  | LoadSessionOutput
  | PromptOutput
  | NewSessionOutput
  | SwitchSessionOuput
  | ErrorOutput;
