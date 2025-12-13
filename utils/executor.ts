import { LogType, LogEntry } from '../types';

/**
 * Creates a safe execution environment.
 * We inject a custom console and the root element.
 */
export const executeUserCode = (
  code: string, 
  rootElement: HTMLElement, 
  onLog: (type: LogType, args: any[]) => void
) => {
  // Clear root first
  if (rootElement) {
    rootElement.innerHTML = '';
    // Reset basic styles to ensure cleanliness
    rootElement.setAttribute('style', '');
  }

  // Create a custom console proxy
  const customConsole = {
    log: (...args: any[]) => onLog(LogType.INFO, args),
    error: (...args: any[]) => onLog(LogType.ERROR, args),
    warn: (...args: any[]) => onLog(LogType.WARN, args),
    info: (...args: any[]) => onLog(LogType.INFO, args),
    table: (...args: any[]) => onLog(LogType.INFO, args),
    clear: () => { /* Handled by UI state */ },
  };

  try {
    // Construct the function.
    // We pass 'console' and 'root' as available arguments to the IIFE.
    // 'window' and 'document' are still accessible, allowing DOM manipulation.
    // We use a function constructor to allow the 'return' statement in user code to work.
    
    // Wrap code to catch syntax errors during compilation
    const run = new Function('console', 'root', `"use strict";\n${code}`);
    
    const result = run(customConsole, rootElement);
    
    // If the code returns a value (not undefined), log it
    if (result !== undefined) {
      onLog(LogType.SUCCESS, ['< Return Value >', result]);
    } else {
      onLog(LogType.SUCCESS, ['Execution finished.']);
    }
  } catch (error: any) {
    onLog(LogType.ERROR, [error.toString()]);
  }
};