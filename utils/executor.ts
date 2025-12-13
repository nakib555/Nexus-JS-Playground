import { LogType, LogEntry } from '../types';

/**
 * Creates a safe execution environment using an Iframe.
 * This ensures that global variables (like 'let count = 0') do not conflict
 * between runs, as each run happens in a fresh window context.
 */
export const executeUserCode = (
  code: string, 
  rootElement: HTMLElement, 
  onLog: (type: LogType, args: any[]) => void,
  languageId: string = 'javascript'
) => {
  // 1. Clear previous content to destroy the old context
  rootElement.innerHTML = '';
  
  // 2. Create a new Iframe
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.background = 'transparent'; 
  
  // Allow scripts, forms, same-origin (for communication), etc.
  iframe.setAttribute('sandbox', 'allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads');
  
  rootElement.appendChild(iframe);

  // 3. Setup Communication Bridge
  // Generate a unique ID to avoid collisions if multiple iframes somehow existed (rare here)
  const runId = Math.random().toString(36).substring(7);
  const logHandlerName = `__nexus_log_${runId}`;
  
  // Attach the handler to the parent window so the iframe can call it
  (window as any)[logHandlerName] = (type: LogType, args: any[]) => {
    onLog(type, args);
  };

  // 4. Construct the HTML content with Console Interceptor
  const consoleInterceptor = `
    <script>
      (function() {
        // Safe logger that communicates with parent
        const sendLog = (type, args) => {
          try {
             // Clone/Serialize args to avoid Cross-Origin issues or DataCloneErrors
             const processedArgs = args.map(arg => {
                if (arg instanceof Error) return arg.toString();
                if (typeof arg === 'function') return arg.toString();
                if (arg instanceof Element) {
                    return arg.outerHTML.substring(0, 50) + '...';
                }
                // JSON serialization check to ensure it's cloneable
                try {
                  JSON.stringify(arg);
                  return arg;
                } catch (e) {
                  return String(arg);
                }
             });
             
             if (window.parent && window.parent['${logHandlerName}']) {
                window.parent['${logHandlerName}'](type, processedArgs);
             }
          } catch(e) {
             // Fallback if communication fails
             // originalConsole.error(e); 
          }
        };

        const originalConsole = console;
        window.console = {
          ...originalConsole,
          log: (...args) => { originalConsole.log(...args); sendLog('info', args); },
          error: (...args) => { originalConsole.error(...args); sendLog('error', args); },
          warn: (...args) => { originalConsole.warn(...args); sendLog('warn', args); },
          info: (...args) => { originalConsole.info(...args); sendLog('info', args); },
          table: (...args) => { originalConsole.table(...args); sendLog('info', args); },
          clear: () => { /* Prevent clearing parent console */ }
        };

        // Catch global errors
        window.onerror = (message, source, lineno, colno, error) => {
           sendLog('error', [\`\${message} (Line \${lineno})\`]);
           return true; 
        };
        
        // Catch unhandled promise rejections
        window.onunhandledrejection = (event) => {
           sendLog('error', [\`Unhandled Rejection: \${event.reason}\`]);
        };
      })();
    </script>
  `;

  let htmlContent = '';

  if (languageId === 'html') {
    // HTML Mode: Inject interceptor and then the raw user code
    // We add some basic styles to ensure it looks good in the container
    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          ${consoleInterceptor}
          <style>
             body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
             /* Scrollbar styling to match app theme loosely */
             ::-webkit-scrollbar { width: 6px; height: 6px; }
             ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }
          </style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  } else {
    // JavaScript Mode: Create a root div and run script
    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
           ${consoleInterceptor}
           <style>
             body { margin: 0; overflow: auto; background: transparent; color: inherit; font-family: 'Inter', sans-serif; }
           </style>
        </head>
        <body>
          <div id="root"></div>
          <script>
             const root = document.getElementById('root');
             
             // Helper for download (simulated)
             const download = (filename, content, mimeType = 'text/plain') => {
                 const element = document.createElement('a');
                 const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
                 const blob = new Blob([data], { type: mimeType });
                 element.href = URL.createObjectURL(blob);
                 element.download = filename;
                 document.body.appendChild(element);
                 element.click();
                 document.body.removeChild(element);
             };

             try {
                // Wrap in block to allow top-level 'return' if necessary, though 'Function' is usually better for that.
                // However, since we are in a module/script tag, direct execution is fine.
                // We run this inside a try-catch to report immediate errors.
                
                ${code}
                
             } catch(e) {
                console.error(e);
             }
          </script>
        </body>
      </html>
    `;
  }

  // Inject content via srcdoc
  iframe.srcdoc = htmlContent;
};