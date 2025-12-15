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
  interpreterId?: string,
  onVisualChange?: (hasContent: boolean) => void
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
  iframe.setAttribute('sandbox', 'allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads allow-pointer-lock');
  
  rootElement.appendChild(iframe);

  // 3. Setup Communication Bridge
  const runId = Math.random().toString(36).substring(7);
  const logHandlerName = `__nexus_log_${runId}`;
  const visualHandlerName = `__nexus_visual_${runId}`;
  
  (window as any)[logHandlerName] = (type: LogType, args: any[]) => {
    onLog(type, args);
  };

  (window as any)[visualHandlerName] = (hasContent: boolean) => {
    if (onVisualChange) onVisualChange(hasContent);
  };

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
                // For elements, give a nice representation or just outerHTML if small
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
             // We use a custom serializer to handle circular references and DOM nodes
             // before sending to the parent. This ensures "any output" is viewable.
             const processedArgs = args.map(arg => {
                try {
                    return serialize(arg);
                } catch(e) {
                    return String(arg);
                }
             });
             
             if (window.parent && window.parent['${logHandlerName}']) {
                window.parent['${logHandlerName}'](type, processedArgs);
             }
          } catch(e) { 
             console.error("Logger Error:", e);
          }
        };

        // --- Visual Change Detector ---
        let hasReportedVisual = false;
        const reportVisual = () => {
            if (window.parent && window.parent['${visualHandlerName}']) {
                window.parent['${visualHandlerName}'](true);
            }
        };

        const checkVisualContent = () => {
            // Check body children excluding scripts and this logic
            const body = document.body;
            if (!body) return;
            
            // Heuristic: If body text is not empty, or if there are elements like Canvas, SVG, Img, Divs with size
            let hasContent = false;
            
            // Check for specific visible elements
            const visibleTags = ['CANVAS', 'SVG', 'IMG', 'VIDEO', 'IFRAME', 'BUTTON', 'INPUT', 'TABLE'];
            if (body.querySelector(visibleTags.join(','))) {
                hasContent = true;
            } else {
                 // Check deep text content, excluding scripts
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
        
        // Use MutationObserver to detect DOM changes
        const observer = new MutationObserver((mutations) => {
             checkVisualContent();
        });
        
        window.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true, attributes: true });
            checkVisualContent(); // Check initial
        });

        // --- Overrides ---

        const originalConsole = console;
        
        // Timer storage for console.time/timeEnd polyfill
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

  // Extremely permissive CSP for playground usage
  const cspMeta = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' blob:; style-src * 'unsafe-inline'; img-src * data: blob:; font-src * data:;">
  `;

  let htmlContent = '';

  // Smart wrapping: Check if user provided a full HTML document
  const trimmedCode = code.trim();
  const lowerCode = trimmedCode.toLowerCase();
  const isFullPage = lowerCode.startsWith('<!doctype html>') || lowerCode.startsWith('<html');

  if (isFullPage) {
    // If full page, inject interceptor into head
    if (code.includes('<head>')) {
        htmlContent = code.replace('<head>', `<head>${cspMeta}${consoleInterceptor}`);
    } else {
        htmlContent = code.replace('<html>', `<html><head>${cspMeta}${consoleInterceptor}</head>`);
    }
  } else {
    // Partial content (e.g. just an SVG, or just JS)
    
    // Check if it looks like HTML or plain JS
    const isHtmlLike = languageId === 'html' || lowerCode.startsWith('<svg') || lowerCode.startsWith('<div') || lowerCode.startsWith('<style');
    
    if (isHtmlLike) {
        // Wrap partial visual content
        htmlContent = `
        <!DOCTYPE html>
        <html>
            <head>
                ${cspMeta}
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
        // Pure JavaScript Mode
        // We create a container structure so the user can easily attach things to document.body
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

  // Inject content via srcdoc
  iframe.srcdoc = htmlContent;
};