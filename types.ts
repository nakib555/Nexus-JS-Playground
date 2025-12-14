import React from 'react';

export enum LogType {
  INFO = 'info',
  ERROR = 'error',
  WARN = 'warn',
  SUCCESS = 'success',
  SYSTEM = 'system',
  TABLE = 'table'
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

export type ExecutionMode = 'browser' | 'docker' | 'ai';

export interface Interpreter {
  id: string;
  name: string;
  type: ExecutionMode;
  version: string;
  description: string;
  // New fields for Docker backend
  dockerImage?: string;
  extension?: string;
  entryCommand?: string;
}

export interface Language {
  id: string;
  name: string;
  prismId: string;
  interpreters: Interpreter[];
}

export interface Command {
  id: string;
  name: string;
  subtitle?: string;
  icon: React.ReactElement;
  onSelect: () => void;
  shortcut?: string[];
  section: 'Actions' | 'Navigation' | 'General';
}