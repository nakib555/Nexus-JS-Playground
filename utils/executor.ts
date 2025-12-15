import { LogType, LogEntry, VirtualFile } from '../types';

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
  interpreterId?: string,
  onVisualChange?: (hasContent: boolean) => void,
  files: VirtualFile[] = []
): (() => void) => {
  // 1. Clear previous content to destroy the old context
  rootElement.innerHTML = '';
  
  // 2. Create a new Iframe
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.background = 'transparent'; 
  
  // Remove 'allow-same-origin' to create an opaque origin.
  iframe.setAttribute('sandbox', 'allow-scripts allow-modals allow-forms allow-popups allow-downloads allow-pointer-lock');
  
  rootElement.appendChild(iframe);

  // 3. Setup Communication Bridge using postMessage
  const messageHandler = (event: MessageEvent) => {
    // Only accept messages from this specific iframe
    if (event.source !== iframe.contentWindow) return;

    const data = event.data;
    if (data && data.type === 'nexus-log') {
        onLog(data.logType, data.args);
    } else if (data && data.type === 'nexus-visual') {
        if (onVisualChange) onVisualChange(data.hasContent);
    }
  };

  window.addEventListener('message', messageHandler);

  // Prepare File System Shim
  const filesMap = files.reduce((acc, f) => ({...acc, [f.name]: f.content}), {});
  const filesJson = JSON.stringify(filesMap);

  const fsShim = `
    <script>
       window.__NEXUS_FILES__ = ${filesJson};
       
       // Simple Virtual File System shim for Browser Runtime
       window.fs = {
         readFile: (path, encoding, cb) => {
            if (typeof encoding === 'function') { cb = encoding; encoding = 'utf8'; }
            try {
               const content = window.fs.readFileSync(path, encoding);
               cb(null, content);
            } catch(e) { cb(e); }
         },
         readFileSync: (path, encoding) => {
            const fileContent = window.__NEXUS_FILES__[path];
            if (fileContent === undefined) {
                throw new Error("ENOENT: no such file or directory, open '" + path + "'");
            }
            const binary = atob(fileContent);
            if (!encoding || encoding === 'utf8' || encoding === 'utf-8') return binary;
            return binary; 
         },
         writeFileSync: (path, content) => {
            console.log('[System] Wrote to virtual file: ' + path);
            // In a real implementation, we could postMessage this back to the main app to update the file list
         },
         exists: (path, cb) => {
            cb(!!window.__NEXUS_FILES__[path]);
         },
         existsSync: (path) => {
            return !!window.__NEXUS_FILES__[path];
         }
       };
    </script>
  `;

  // 4. Construct the HTML content with Console Interceptor & Visual Detector
  const consoleInterceptor = `
    <script>
      (function() {
        const serialize = (obj, seen = new WeakSet()) => {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Error) return obj.toString();
            if (obj instanceof RegExp) return obj.toString();
            if (obj instanceof Date) return obj.toISOString();
            
            // Support for Set and Map in output
            if (obj instanceof Set) return Array.from(obj).map(v => serialize(v, seen));
            if (obj instanceof Map) return Array.from(obj.entries()).map(([k, v]) => [serialize(k, seen), serialize(v, seen)]);

            if (obj instanceof Element) {
                if (obj.outerHTML.length < 200) return obj.outerHTML;
                return '[HTMLElement: ' + obj.tagName + ']';
            }
            
            if (seen.has(obj)) return '[Circular]';
            seen.add(obj);
            
            if (Array.isArray(obj)) {
                return obj.map(v => serialize(v, seen));
            }
            
            const copy = {};
            for (const key in obj) {
                try {
                    copy[key] = serialize(obj[key], seen);
                } catch (e) {
                    copy[key] = '[Access Error]';
                }
            }
            return copy;
        };

        const sendLog = (type, args) => {
          try {
             const processedArgs = args.map(arg => {
                try {
                    return serialize(arg);
                } catch(e) {
                    return String(arg);
                }
             });
             
             window.parent.postMessage({
                 type: 'nexus-log',
                 logType: type,
                 args: processedArgs
             }, '*');
          } catch(e) { 
             console.error("Logger Error:", e);
          }
        };

        // --- Visual Change Detector ---
        let hasReportedVisual = false;
        const reportVisual = () => {
            window.parent.postMessage({
                type: 'nexus-visual',
                hasContent: true
            }, '*');
        };

        const checkVisualContent = () => {
            const body = document.body;
            if (!body) return;
            
            let hasContent = false;
            const visibleTags = ['CANVAS', 'SVG', 'IMG', 'VIDEO', 'IFRAME', 'BUTTON', 'INPUT', 'TABLE'];
            if (body.querySelector(visibleTags.join(','))) {
                hasContent = true;
            } else {
                 const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, {
                    acceptNode: function(node) {
                        if (node.parentNode.nodeName === 'SCRIPT' || node.parentNode.nodeName === 'STYLE') return NodeFilter.FILTER_REJECT;
                        if (node.textContent.trim().length > 0) return NodeFilter.FILTER_ACCEPT;
                        return NodeFilter.FILTER_SKIP;
                    }
                 });
                 if (walker.nextNode()) hasContent = true;
            }

            if (hasContent && !hasReportedVisual) {
                hasReportedVisual = true;
                reportVisual();
            }
        };
        
        const observer = new MutationObserver((mutations) => {
             checkVisualContent();
        });
        
        window.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true, attributes: true });
            checkVisualContent(); 
        });

        // --- Overrides ---
        const originalConsole = console;
        const timers = new Map();

        window.console = {
          ...originalConsole,
          log: (...args) => { originalConsole.log(...args); sendLog('info', args); },
          error: (...args) => { originalConsole.error(...args); sendLog('error', args); },
          warn: (...args) => { originalConsole.warn(...args); sendLog('warn', args); },
          info: (...args) => { originalConsole.info(...args); sendLog('info', args); },
          debug: (...args) => { originalConsole.debug(...args); sendLog('info', args); },
          table: (...args) => { originalConsole.table(...args); sendLog('table', args); },
          dir: (...args) => { originalConsole.dir(...args); sendLog('info', args); },
          clear: () => { },
          assert: (condition, ...args) => { 
              originalConsole.assert(condition, ...args); 
              if (!condition) sendLog('error', ['Assertion failed:', ...args]); 
          },
          count: (label = 'default') => { 
             originalConsole.count(label); 
             sendLog('info', [\`Count: \${label}\`]); 
          },
          time: (label = 'default') => {
            originalConsole.time(label);
            timers.set(label, performance.now());
          },
          timeEnd: (label = 'default') => {
            originalConsole.timeEnd(label);
            if (timers.has(label)) {
                const duration = performance.now() - timers.get(label);
                sendLog('info', [\`\${label}: \${duration.toFixed(3)}ms\`]);
                timers.delete(label);
            } else {
                sendLog('warn', [\`Timer '\${label}' does not exist\`]);
            }
          }
        };

        window.alert = (msg) => { sendLog('warn', ['[Alert]', msg]); };
        window.confirm = (msg) => { sendLog('warn', ['[Confirm]', msg]); return true; };
        window.prompt = (msg) => { sendLog('warn', ['[Prompt]', msg]); return null; };
        window.onerror = (message, source, lineno, colno, error) => { sendLog('error', [\`\${message} (Line \${lineno})\`]); return true; };
        window.onunhandledrejection = (event) => { sendLog('error', [\`Unhandled Rejection: \${event.reason}\`]); };
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
    <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' blob:; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:;">
  `;

  let htmlContent = '';
  const trimmedCode = code.trim();
  const lowerCode = trimmedCode.toLowerCase();
  const isFullPage = lowerCode.startsWith('<!doctype html>') || lowerCode.startsWith('<html');

  if (isFullPage) {
    if (code.includes('<head>')) {
        htmlContent = code.replace('<head>', `<head>${cspMeta}${fsShim}${consoleInterceptor}`);
    } else {
        htmlContent = code.replace('<html>', `<html><head>${cspMeta}${fsShim}${consoleInterceptor}</head>`);
    }
  } else {
    const isHtmlLike = languageId === 'html' || lowerCode.startsWith('<svg') || lowerCode.startsWith('<div') || lowerCode.startsWith('<style');
    
    if (isHtmlLike) {
        htmlContent = `
        <!DOCTYPE html>
        <html>
            <head>
                ${cspMeta}
                ${fsShim}
                ${consoleInterceptor}
                <style>
                    body { 
                        margin: 0; 
                        min-height: 100vh; 
                        display: flex; 
                        flex-direction: column; 
                        align-items: center; 
                        justify-content: center; 
                        background: transparent;
                        font-family: 'Inter', system-ui, sans-serif;
                    }
                    svg { max-width: 90vw; max-height: 90vh; }
                </style>
            </head>
            <body>${code}</body>
        </html>`;
    } else {
        const isLibraryMode = interpreterId === 'js-libs';
        let importMapScript = '';
        let scriptTagOpen = '<script>';

        if (isLibraryMode) {
            scriptTagOpen = '<script type="module">';
        }

        htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
               ${cspMeta}
               ${fsShim}
               ${consoleInterceptor}
               ${importMapScript}
               <style>
                 body { 
                   margin: 0; 
                   padding: 20px;
                   overflow: auto; 
                   background: transparent; 
                   color: inherit; 
                   font-family: 'Inter', sans-serif; 
                   width: 100vw;
                   height: 100vh;
                   box-sizing: border-box;
                 }
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

  iframe.srcdoc = htmlContent;

  return () => {
      window.removeEventListener('message', messageHandler);
  };
};