export enum LogType {
  INFO = 'info',
  ERROR = 'error',
  WARN = 'warn',
  SUCCESS = 'success'
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  messages: any[];
}

export type TabOption = 'editor' | 'console' | 'visual';

export interface ExecutionContext {
  console: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    clear: () => void;
  };
  root: HTMLElement | null;
}

export type ExecutionMode = 'browser' | 'cloud';

export interface Interpreter {
  id: string;
  name: string;
  type: ExecutionMode;
  version: string;
  description: string;
}

export interface Language {
  id: string;
  name: string;
  prismId: string;
  interpreters: Interpreter[];
}