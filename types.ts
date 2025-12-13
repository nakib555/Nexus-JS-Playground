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