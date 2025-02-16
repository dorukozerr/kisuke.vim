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
  type: 'loadSession';
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
  | SwitchSessionEvent
  | RenameSessionEvent
  | DeleteSessionEvent;

interface InitializeOutput {
  type: 'initialize';
  payload: 'invalidConfig' | 'readyToUse';
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
  sessionIndex: number;
}

interface ListAllSessionsOutput {
  type: 'listAllSessions';
  payload: History;
}

interface LoadSessionOutput {
  type: 'loadSession';
  payload: Session;
  sessionId: string;
  sessionIndex: number;
}

interface PromptOutput {
  type: 'response';
  payload: string;
}

interface SwitchSessionOuput {
  type: 'switchSession';
  sessionIndex: number;
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
  | SwitchSessionOuput
  | ErrorOutput;
