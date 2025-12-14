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
                if (arg instanceof Promise) return '[object Promise]';
                if (arg instanceof Date) return arg.toISOString();
                if (arg instanceof RegExp) return arg.toString();
                if (arg instanceof Set) return Array.from(arg);
                if (arg instanceof Map) return Object.fromEntries(arg);
                
                if (arg instanceof Element) {
                    // Serialize simplified element structure
                    return arg.outerHTML.substring(0, 150) + (arg.outerHTML.length > 150 ? '...' : '');
                }
                
                // JSON serialization check to ensure it's cloneable
                try {
                  JSON.stringify(arg);
                  return arg;
                } catch (e) {
                  return String(arg); // Fallback for circular references or other non-serializables
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
    <style>
      @media (prefers-color-scheme: dark) { body { color: #e2e8f0; } }
      @media (prefers-color-scheme: light) { body { color: #1f2937; } }
    </style>
  `;

  // Default Head content with CSP
  const headContent = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; font-src data: https:; style-src 'self' 'unsafe-inline' https:;">
    ${consoleInterceptor}
  `;

  let htmlContent = '';

  if (languageId === 'html') {
    // HTML Mode: Inject interceptor and then the raw user code
    // We try to inject the interceptor in the head if possible, otherwise prepend
    if (code.includes('<head>')) {
        htmlContent = code.replace('<head>', `<head>${headContent}`);
    } else if (code.includes('<html>')) {
        htmlContent = code.replace('<html>', `<html><head>${headContent}</head>`);
    } else {
        htmlContent = `
        <!DOCTYPE html>
        <html>
            <head>${headContent}</head>
            <body>${code}</body>
        </html>`;
    }
  } else {
    // JavaScript Mode
    
    // Check if Library Runtime is active
    const isLibraryMode = interpreterId === 'js-libs';
    let importMapScript = '';
    let scriptTagOpen = '<script>';

    if (isLibraryMode) {
      // 1. Scan for imports
      const importRegex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
      const imports = [];
      let match;
      // Copy code to avoid state issues with regex
      const codeToScan = code;
      while ((match = importRegex.exec(codeToScan)) !== null) {
        imports.push(match[1]);
      }
      
      // Filter out relative/absolute paths, keep bare modules (e.g. 'react', 'canvas-confetti')
      const bareModules = [...new Set(imports)].filter(i => !i.startsWith('.') && !i.startsWith('/') && !i.startsWith('http'));
      
      if (bareModules.length > 0) {
        const importMap = {
          imports: bareModules.reduce((acc: any, lib: string) => ({
            ...acc,
            [lib]: `https://esm.sh/${lib}`
          }), {})
        };
        importMapScript = `<script type="importmap">${JSON.stringify(importMap)}</script>`;
        
        // Notify user in console about installed libs
        onLog(LogType.INFO, [`Installing temporary libraries: ${bareModules.join(', ')}...`]);
      }

      // Switch to module execution
      scriptTagOpen = '<script type="module">';
    }

    htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
           ${headContent}
           ${importMapScript}
           <style>
             body { margin: 0; overflow: auto; background: transparent; color: inherit; font-family: 'Inter', sans-serif; }
           </style>
        </head>
        <body>
          <div id="root"></div>
          ${scriptTagOpen}
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