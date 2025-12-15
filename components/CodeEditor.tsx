import React, { useRef, useState, useEffect, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Language } from '../types';

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: Language;
  onFocus?: () => void;
  onBlur?: () => void;
}

declare global {
  interface Window {
    Prism: any;
  }
}

const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  code, 
  onChange, 
  language,
  onFocus,
  onBlur
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);
  const [error, setError] = useState<{ line: number; message: string } | null>(null);

  useEffect(() => {
    setLineCount(code.split('\n').length);
    
    // Only perform basic syntax checking for JavaScript
    if (language.id === 'javascript') {
      const timer = setTimeout(() => {
        try {
          // A simple check using new Function is cheap and effective for syntax errors.
          new Function(code);
          setError(null);
        } catch (err: any) {
          let line = 0;
          const stack = err.stack || '';
          const match = stack.match(/<anonymous>:(\d+):(\d+)/) || stack.match(/@<anonymous>:(\d+):(\d+)/);
          if (match) line = parseInt(match[1], 10);
          setError({
            line: line > 0 ? line : 0,
            message: err.message
          });
        }
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setError(null);
    }
  }, [code, language.id]);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
      preRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
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

  const highlightedCode = useMemo(() => {
    if (typeof window !== 'undefined' && 
        window.Prism && 
        window.Prism.languages[language.prismId]) {
      return window.Prism.highlight(code, window.Prism.languages[language.prismId], language.prismId);
    }
    return escapeHtml(code);
  }, [code, language.prismId]);

  return (
    <div className="relative w-full h-full bg-white dark:bg-[#0C0C0C] font-mono text-[13px] group flex flex-col overflow-hidden transition-colors">
      
      <div className="relative flex-1 flex min-h-0">
        {/* Gutter */}
        <div 
          ref={gutterRef}
          className="w-10 bg-gray-50 dark:bg-[#070707] border-r border-gray-200 dark:border-white/5 text-gray-400 dark:text-gray-700 select-none flex flex-col items-end py-4 shrink-0 z-20 overflow-hidden transition-colors"
        >
           <div className="w-full text-right pr-2">
            {Array.from({ length: Math.max(lineCount, 50) }).map((_, i) => {
              const lineNum = i + 1;
              const isError = error?.line === lineNum;
              return (
                <div 
                  key={i} 
                  className={`h-6 leading-6 text-[10px] transition-colors ${isError ? 'text-red-500 font-bold' : ''}`}
                >
                  {lineNum}
                </div>
              );
            })}
          </div>
        </div>

        {/* Code Area */}
        <div className="relative flex-1 min-w-0 h-full text-gray-900 dark:text-gray-100">
          {/* Syntax Highlight Layer */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 p-4 font-mono text-[13px] leading-6 whitespace-pre pointer-events-none z-0 overflow-hidden"
            style={{ fontFamily: '"JetBrains Mono", monospace', tabSize: 2 }}
          >
             <code dangerouslySetInnerHTML={{ __html: highlightedCode + '<br/>' }} className="block min-w-full min-h-full" />
             
             {/* Error Line Highlight - Inside pre to scroll with content */}
             {error && error.line > 0 && (
                <div 
                  className="absolute left-0 right-0 bg-red-500/5 border-y border-red-500/10 pointer--events-none"
                  style={{ 
                    top: `${16 + (error.line - 1) * 24}px`, 
                    height: '24px' 
                  }}
                />
             )}
          </pre>

          {/* Input Layer */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-indigo-600 dark:caret-indigo-400 outline-none resize-none font-mono text-[13px] leading-6 whitespace-pre z-10 selection:bg-indigo-200 dark:selection:bg-indigo-500/20 overflow-auto overscroll-none touch-auto"
            style={{ fontFamily: '"JetBrains Mono", monospace', tabSize: 2, backgroundColor: 'transparent' }}
          />
        </div>
      </div>

      {/* Syntax Error Toast */}
      {error && (
        <div className="absolute bottom-4 right-6 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-red-500/30 text-red-600 dark:text-red-200 pl-3 pr-4 py-2 rounded-lg shadow-2xl flex items-center gap-3">
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