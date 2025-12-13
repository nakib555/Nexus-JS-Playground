import React, { useRef, useState, useEffect, useMemo } from 'react';
import { AlertCircle, Check } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
}

// Simple Tokenizer for JavaScript/TypeScript
const tokenize = (code: string): string => {
  // We will build a safer, simple lexer that returns HTML strings
  let html = '';
  let i = 0;
  
  const keywords = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 
    'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 
    'throw', 'new', 'this', 'class', 'extends', 'super', 'import', 'export', 
    'default', 'await', 'async', 'void', 'typeof', 'instanceof', 'in', 'of', 'from'
  ]);

  const builtins = new Set(['console', 'document', 'window', 'Math', 'JSON', 'Promise', 'setTimeout', 'setInterval', 'requestAnimationFrame']);

  while (i < code.length) {
    const char = code[i];

    // Comments
    if (char === '/' && code[i + 1] === '/') {
      let value = '//';
      i += 2;
      while (i < code.length && code[i] !== '\n') {
        value += code[i];
        i++;
      }
      html += `<span class="token-comment">${escapeHtml(value)}</span>`;
      continue;
    }
    if (char === '/' && code[i + 1] === '*') {
      let value = '/*';
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) {
        value += code[i];
        i++;
      }
      if (i < code.length) {
        value += '*/';
        i += 2;
      }
      html += `<span class="token-comment">${escapeHtml(value)}</span>`;
      continue;
    }

    // Strings
    if (char === '"' || char === "'" || char === '`') {
      const quote = char;
      let value = quote;
      i++;
      while (i < code.length) {
        if (code[i] === '\\') {
          value += code[i] + (code[i+1] || '');
          i += 2;
          continue;
        }
        if (code[i] === quote) {
          value += quote;
          i++;
          break;
        }
        value += code[i];
        i++;
      }
      html += `<span class="token-string">${escapeHtml(value)}</span>`;
      continue;
    }

    // Numbers
    if (/\d/.test(char)) {
      let value = '';
      while (i < code.length && /[\d.]/.test(code[i])) {
        value += code[i];
        i++;
      }
      html += `<span class="token-number">${value}</span>`;
      continue;
    }

    // Identifiers (Keywords, Functions, Builtins, Variables)
    if (/[a-zA-Z_$]/.test(char)) {
      let value = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) {
        value += code[i];
        i++;
      }
      
      // Lookahead for function call
      let isFunction = false;
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      if (code[j] === '(') isFunction = true;

      if (keywords.has(value)) {
        html += `<span class="token-keyword">${value}</span>`;
      } else if (builtins.has(value)) {
        html += `<span class="token-builtin">${value}</span>`;
      } else if (isFunction) {
        html += `<span class="token-function">${value}</span>`;
      } else {
        html += value; // plain text
      }
      continue;
    }

    // Punctuation / Operators
    if (/[{}()[\].,;:]/.test(char)) {
      html += `<span class="token-punctuation">${char}</span>`;
      i++;
      continue;
    }
    
    // Default: text, whitespace, operators
    html += escapeHtml(char);
    i++;
  }

  return html;
};

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const [error, setError] = useState<{ line: number; message: string } | null>(null);

  useEffect(() => {
    setLineCount(code.split('\n').length);
    
    // Syntax check
    const timer = setTimeout(() => {
      try {
        new Function(code);
        setError(null);
      } catch (err: any) {
        let line = 0;
        const stack = err.stack || '';
        const chromeMatch = stack.match(/<anonymous>:(\d+):(\d+)/);
        const firefoxMatch = stack.match(/@<anonymous>:(\d+):(\d+)/);
        if (chromeMatch) line = parseInt(chromeMatch[1], 10);
        else if (firefoxMatch) line = parseInt(firefoxMatch[1], 10);
        
        setError({
          line: line > 0 ? line : 0,
          message: err.message
        });
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [code]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const highlightedCode = useMemo(() => tokenize(code), [code]);

  return (
    <div className="relative w-full h-full bg-[#050505] font-mono text-[13px] group flex flex-col overflow-hidden">
      
      {/* Editor Container */}
      <div className="relative flex-1 flex min-h-0">
        
        {/* Gutter */}
        <div className="w-12 bg-[#0a0a0a] border-r border-[#1f1f1f] text-gray-600 select-none flex flex-col items-end py-4 shrink-0 z-20 overflow-hidden">
           {/* We use a separate div translated by scrollTop to sync with textarea */}
           <div 
             className="w-full text-right pr-3"
             style={{ 
               transform: `translateY(-${textareaRef.current?.scrollTop || 0}px)`,
               transition: 'transform 0s' // Instant sync
             }}
           >
            {Array.from({ length: Math.max(lineCount, 50) }).map((_, i) => {
              const lineNum = i + 1;
              const isError = error?.line === lineNum;
              return (
                <div 
                  key={i} 
                  className={`h-6 leading-6 transition-colors ${isError ? 'text-red-400 font-bold' : ''}`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Area */}
        <div className="relative flex-1 min-w-0 h-full">
          
          {/* Syntax Highlight Layer */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 p-4 font-mono text-[13px] leading-6 whitespace-pre pointer-events-none z-0 overflow-hidden text-transparent"
            style={{ 
                fontFamily: '"JetBrains Mono", monospace',
                tabSize: 2 
            }}
          >
             <code 
                dangerouslySetInnerHTML={{ __html: highlightedCode + '<br/>' }} 
                className="block min-w-full min-h-full"
             />
          </pre>

          {/* Input Layer */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-white outline-none resize-none font-mono text-[13px] leading-6 whitespace-pre z-10 selection:bg-indigo-500/30"
            style={{ 
                fontFamily: '"JetBrains Mono", monospace',
                tabSize: 2 
            }}
          />

          {/* Error Line Highlight */}
          {error && error.line > 0 && (
            <div 
              className="absolute left-0 right-0 bg-red-500/10 border-y border-red-500/20 pointer-events-none z-0"
              style={{ 
                top: `${16 + (error.line - 1) * 24 - (textareaRef.current?.scrollTop || 0)}px`, 
                height: '24px' 
              }}
            />
          )}

        </div>
      </div>

      {/* Status Bar / Error Toast */}
      {error && (
        <div className="absolute bottom-4 right-6 z-50 animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-gray-900 border border-red-900/50 text-red-200 pl-3 pr-4 py-2 rounded-lg shadow-2xl flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Syntax Error · Line {error.line}</span>
                <span className="text-xs opacity-90">{error.message}</span>
            </div>
            </div>
        </div>
      )}
    </div>
  );
};
