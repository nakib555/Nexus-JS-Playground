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
  languageId: string = 'javascript',
  interpreterId?: string
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
  const runId = Math.random().toString(36).substring(7);
  const logHandlerName = `__nexus_log_${runId}`;
  
  (window as any)[logHandlerName] = (type: LogType, args: any[]) => {
    onLog(type, args);
  };

  // 4. Construct the HTML content with Console Interceptor
  const consoleInterceptor = `
    <script>
      (function() {
        const sendLog = (type, args) => {
          try {
             const processedArgs = args.map(arg => {
                if (arg instanceof Error) return arg.toString();
                if (typeof arg === 'function') return arg.toString();
                if (arg instanceof Promise) return '[object Promise]';
                if (arg instanceof Date) return arg.toISOString();
                
                if (arg instanceof Element) {
                    return arg.outerHTML.substring(0, 150) + (arg.outerHTML.length > 150 ? '...' : '');
                }
                
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
          } catch(e) { }
        };

        const originalConsole = console;
        window.console = {
          ...originalConsole,
          log: (...args) => { originalConsole.log(...args); sendLog('info', args); },
          error: (...args) => { originalConsole.error(...args); sendLog('error', args); },
          warn: (...args) => { originalConsole.warn(...args); sendLog('warn', args); },
          info: (...args) => { originalConsole.info(...args); sendLog('info', args); },
          table: (...args) => { originalConsole.table(...args); sendLog('info', args); },
          clear: () => { }
        };

        window.onerror = (message, source, lineno, colno, error) => {
           sendLog('error', [\`\${message} (Line \${lineno})\`]);
           return true; 
        };
        
        window.onunhandledrejection = (event) => {
           sendLog('error', [\`Unhandled Rejection: \${event.reason}\`]);
        };
      })();
    </script>
    <style>
      @media (prefers-color-scheme: dark) { body { color: #e2e8f0; } }
      @media (prefers-color-scheme: light) { body { color: #1f2937; } }
    </style>
  `;

  const cspMeta = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; font-src data: https:; style-src 'self' 'unsafe-inline' https:;">
  `;

  let htmlContent = '';

  // Smart wrapping: Check if user provided a full HTML document
  const trimmedCode = code.trim().toLowerCase();
  const isFullPage = trimmedCode.startsWith('<!doctype html>') || trimmedCode.startsWith('<html');

  if (isFullPage) {
    // If full page, inject interceptor into head
    if (code.includes('<head>')) {
        htmlContent = code.replace('<head>', `<head>${cspMeta}${consoleInterceptor}`);
    } else {
        htmlContent = code.replace('<html>', `<html><head>${cspMeta}${consoleInterceptor}</head>`);
    }
  } else {
    // Partial content (e.g. just an SVG, or just JS)
    
    if (languageId === 'html' || trimmedCode.startsWith('<svg') || trimmedCode.startsWith('<div')) {
        // Wrap partial visual content in a centering container for better presentation
        htmlContent = `
        <!DOCTYPE html>
        <html>
            <head>
                ${cspMeta}
                ${consoleInterceptor}
                <style>
                    body { 
                        margin: 0; 
                        height: 100vh; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        justify-content: center; 
                        background: transparent;
                        font-family: 'Inter', system-ui, sans-serif;
                    }
                    /* Ensure SVGs scale nicely */
                    svg { max-width: 90vw; max-height: 90vh; }
                </style>
            </head>
            <body>${code}</body>
        </html>`;
    } else {
        // Pure JavaScript Mode
        const isLibraryMode = interpreterId === 'js-libs';
        let importMapScript = '';
        let scriptTagOpen = '<script>';

        if (isLibraryMode) {
            // ... (import logic kept for legacy browser runs) ...
            scriptTagOpen = '<script type="module">';
        }

        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
               ${cspMeta}
               ${consoleInterceptor}
               ${importMapScript}
               <style>
                 body { margin: 0; overflow: auto; background: transparent; color: inherit; font-family: 'Inter', sans-serif; }
               </style>
            </head>
            <body>
              <div id="root"></div>
              ${scriptTagOpen}
                 const root = document.getElementById('root');
                 try {
                    ${code}
                 } catch(e) {
                    console.error(e);
                 }
              </script>
            </body>
          </html>
        `;
    }
  }

  // Inject content via srcdoc
  iframe.srcdoc = htmlContent;
};