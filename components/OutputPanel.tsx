import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LogEntry, LogType } from '../types';
import { Terminal, Box, AlertCircle, Info, CheckCircle2, AlertTriangle, Trash2, ChevronRight, Braces, List, Layout, Maximize2, Minimize2, Split, GripVertical, FunctionSquare } from 'lucide-react';

interface OutputPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  // If provided, forces a specific view (used for mobile)
  mobileView?: 'console' | 'preview';
  visualRootId?: string;
}

// -- Object Inspector Components --
const getType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Element) return 'element';
  const type = typeof value;
  if (type === 'string' && value.startsWith('Error:')) return 'error';
  return type;
};

// Simple Markdown Renderer for Logs
const MarkdownText: React.FC<{ text: string }> = ({ text }) => {
  // Split by bold (**text**)
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  
  return (
    <span className="break-all whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="bg-black/5 dark:bg-white/10 px-1 rounded text-[10px] font-mono text-indigo-600 dark:text-indigo-400">{part.slice(1, -1)}</code>;
        }
        return part;
      })}
    </span>
  );
};

const InspectorNode: React.FC<{ name?: string, value: any, depth?: number }> = ({ name, value, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const type = getType(value);

  if (depth > 8) return <span className="text-gray-500 dark:text-gray-600">...</span>;

  const renderValue = () => {
    switch (type) {
      case 'string':
        // Detect Images (Base64 or URL)
        if (value.startsWith('data:image/') || (value.startsWith('http') && (value.match(/\.(jpeg|jpg|gif|png|webp)$/) || value.includes('placeholder')))) {
            return (
                <div className="mt-1 mb-2 inline-block group relative">
                    <img src={value} alt="Console Output" className="max-w-[300px] max-h-[200px] h-auto rounded-lg border border-gray-200 dark:border-white/10 shadow-sm bg-gray-50 dark:bg-black/50" />
                </div>
            );
        }
        // Detect HTML-like strings
        if ((value.startsWith('<') && value.endsWith('>')) || value.trim().startsWith('<!DOCTYPE') || value.trim().startsWith('<svg')) {
             return (
                 <div className="mt-2 mb-2 p-2 bg-white dark:bg-black/20 rounded border border-gray-200 dark:border-white/10 overflow-auto max-w-full">
                     <div dangerouslySetInnerHTML={{ __html: value }} />
                 </div>
             );
        }
        return <span className="text-orange-600 dark:text-orange-300"><MarkdownText text={value} /></span>;
      case 'number':
        return <span className="text-blue-600 dark:text-cyan-300 font-bold">{value}</span>;
      case 'boolean':
        return <span className="text-purple-600 dark:text-purple-400 font-bold">{String(value)}</span>;
      case 'null':
      case 'undefined':
        return <span className="text-gray-500 italic">{String(value)}</span>;
      case 'error':
        return <span className="text-red-500 dark:text-red-400 font-medium">{value}</span>;
      case 'function':
        return (
          <div className="inline-flex items-center text-yellow-600 dark:text-yellow-200/80">
            <FunctionSquare className="w-3 h-3 mr-1.5 opacity-60" />
            <span className="italic">{value.name || 'anonymous'}()</span>
          </div>
        );
      case 'object':
      case 'array':
        const keys = Object.keys(value);
        if (keys.length === 0) {
          return <span className="text-gray-500">{type === 'array' ? '[]' : '{}'}</span>;
        }
        return (
          <div className="flex flex-col items-start align-top w-full">
            <div
              className="flex items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -ml-1 select-none transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              <ChevronRight className={`w-3 h-3 mr-1 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
              <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px] flex items-center gap-1.5">
                {type === 'array' ? <List className="w-3 h-3 opacity-50" /> : <Braces className="w-3 h-3 opacity-50" />}
                {type === 'array' ? `Array(${keys.length})` : 'Object'}
              </span>
            </div>
            {isExpanded && (
              <div className="pl-4 border-l border-black/10 dark:border-white/10 ml-1.5 mt-1 flex flex-col gap-0.5 w-full">
                {keys.map(key => (
                  <InspectorNode key={key} name={key} value={value[key]} depth={depth + 1} />
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <span className="text-gray-500">{String(value)}</span>;
    }
  };

  return (
    <div className="flex items-start">
      {name && <span className="text-indigo-600 dark:text-indigo-300 mr-2 shrink-0">{name}:</span>}
      <div className="min-w-0 w-full">{renderValue()}</div>
    </div>
  );
};

export const OutputPanel: React.FC<OutputPanelProps> = ({
  logs,
  onClearLogs,
  mobileView,
  visualRootId = 'visual-root'
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [layoutMode, setLayoutMode] = useState<'auto' | 'split' | 'visual' | 'console'>('auto');
  const [hasVisualContent, setHasVisualContent] = useState(false);
  const [effectiveLayout, setEffectiveLayout] = useState<'split' | 'visual' | 'console'>('visual');
  
  const [visualHeight, setVisualHeight] = useState(60); // percentage
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);

  useEffect(() => {
    const root = document.getElementById(visualRootId);
    if (!root) return;
    const checkContent = () => {
        const iframe = root.querySelector('iframe');
        // Simple heuristic: if iframe exists, we have visual content.
        setHasVisualContent(!!iframe);
    };
    const observer = new MutationObserver(checkContent);
    observer.observe(root, { childList: true, subtree: true });
    checkContent();
    return () => observer.disconnect();
  }, [visualRootId]);

  useEffect(() => {
    if (mobileView) {
      setEffectiveLayout(mobileView === 'preview' ? 'visual' : 'console');
      return;
    }
    if (layoutMode !== 'auto') {
      setEffectiveLayout(layoutMode);
      return;
    }
    // Auto Mode Logic:
    // If logs exist and visual exists -> Split
    // If logs exist and NO visual -> Console
    // If NO logs and visual exists -> Visual
    // Default -> Console
    if (hasVisualContent && logs.length > 0) {
        setEffectiveLayout('split');
    } else if (hasVisualContent) {
        setEffectiveLayout('visual');
    } else {
        setEffectiveLayout('console');
    }
  }, [layoutMode, hasVisualContent, logs.length, mobileView]);

  useEffect(() => {
    if (['console', 'split'].includes(effectiveLayout)) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, effectiveLayout]);

  const startResizeVertical = useCallback(() => setIsDraggingVertical(true), []);
  const stopResizeVertical = useCallback(() => setIsDraggingVertical(false), []);
  
  const resizeVertical = useCallback((e: MouseEvent) => {
    if (isDraggingVertical && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
      if (newHeight > 15 && newHeight < 85) {
        setVisualHeight(newHeight);
      }
    }
  }, [isDraggingVertical]);

  useEffect(() => {
    window.addEventListener('mousemove', resizeVertical);
    window.addEventListener('mouseup', stopResizeVertical);
    return () => {
      window.removeEventListener('mousemove', resizeVertical);
      window.removeEventListener('mouseup', stopResizeVertical);
    };
  }, [resizeVertical, stopResizeVertical]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#030304] relative transition-colors overflow-hidden">
      {!mobileView && (
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-black/20 px-3 h-9 shrink-0 transition-colors z-30 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            {layoutMode === 'auto' ? <span className="flex items-center gap-1 text-indigo-500"><Layout className="w-3 h-3"/> Auto</span> : <span className="text-gray-400">Manual</span>}
          </div>
          <div className="flex items-center gap-1">
             <button onClick={() => setLayoutMode('auto')} className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${layoutMode === 'auto' ? 'text-indigo-500' : 'text-gray-400'}`} title="Auto Adjust"><Layout className="w-3.5 h-3.5" /></button>
            <div className="w-px h-3 bg-gray-300 dark:bg-white/10 mx-1" />
            <button onClick={() => setLayoutMode('visual')} className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${layoutMode === 'visual' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} title="Maximize Visual"><Maximize2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => setLayoutMode('split')} className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${layoutMode === 'split' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} title="Split View"><Split className="w-3.5 h-3.5" /></button>
            <button onClick={() => setLayoutMode('console')} className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${layoutMode === 'console' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} title="Maximize Console"><Terminal className="w-3.5 h-3.5" /></button>
             <div className="w-px h-3 bg-gray-300 dark:bg-white/10 mx-1" />
             <button onClick={onClearLogs} className="p-1 rounded hover:bg-red-500 hover:text-white text-gray-400 transition-colors" title="Clear Console"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        <div style={{ flexBasis: effectiveLayout === 'split' ? `${visualHeight}%` : 'auto' }} className={`relative bg-transparent transition-all duration-300 ease-in-out flex flex-col origin-top ${effectiveLayout === 'console' ? 'flex-[0] h-0 min-h-0 overflow-hidden opacity-0' : ''} ${effectiveLayout === 'split' ? '' : ''} ${effectiveLayout === 'visual' ? 'flex-1' : ''}`}>
          <div className="w-full h-full relative">
             <div id={visualRootId} className="w-full h-full visual-grid-bg"></div>
             <div className="absolute top-2 right-2 pointer-events-none opacity-50 z-10"><span className="text-[9px] font-mono text-gray-400 bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 backdrop-blur">Preview</span></div>
          </div>
        </div>

        <div onMouseDown={startResizeVertical} className={`h-px bg-gray-200 dark:bg-white/10 w-full shrink-0 shadow-sm z-20 transition-all duration-300 group flex items-center justify-center relative ${effectiveLayout === 'split' ? 'opacity-100 cursor-row-resize' : 'opacity-0 h-0 border-none'}`}>
          <div className="absolute inset-y-[-4px] w-full z-30"/>
          <div className="h-1.5 w-8 bg-gray-300 dark:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div style={{ flexBasis: effectiveLayout === 'split' ? `${100 - visualHeight}%` : 'auto' }} className={`relative bg-gray-50 dark:bg-gray-950 flex flex-col transition-all duration-300 ease-in-out origin-bottom ${effectiveLayout === 'visual' ? 'flex-[0] h-0 min-h-0 overflow-hidden opacity-0' : ''} ${effectiveLayout === 'console' ? 'flex-1' : ''}`}>
           <div className="absolute top-2 right-2 pointer-events-none opacity-50 z-10"><span className="text-[9px] font-mono text-gray-400 bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 backdrop-blur">Console</span></div>
           <div className="flex-1 overflow-y-auto overflow-x-auto font-mono text-xs custom-scrollbar">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-800 space-y-3 opacity-60"><Terminal className="w-6 h-6" /><p className="text-[10px] font-medium uppercase tracking-widest">No Logs</p></div>
            ) : (
              <div className="flex flex-col min-h-full py-2">
                {logs.map((log) => (
                  <div key={log.id} className={`flex gap-3 px-4 py-1.5 border-l-2 border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group items-start ${log.type === LogType.ERROR ? 'border-l-red-500 bg-red-50 dark:bg-red-500/5' : ''} ${log.type === LogType.WARN ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-500/5' : ''} ${log.type === LogType.SUCCESS ? 'border-l-green-500 bg-green-50 dark:bg-green-500/5' : ''} ${log.type === LogType.INFO ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-500/5' : ''}`}>
                    <span className="shrink-0 mt-0.5 opacity-60">
                      {log.type === LogType.ERROR && <AlertCircle className="w-3 h-3 text-red-500 dark:text-red-400" />}
                      {log.type === LogType.WARN && <AlertTriangle className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />}
                      {log.type === LogType.SUCCESS && <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />}
                      {log.type === LogType.INFO && <Info className="w-3 h-3 text-blue-500 dark:text-blue-400" />}
                    </span>
                    <div className="flex-1 min-w-0 font-mono text-[11px] leading-relaxed text-gray-700 dark:text-gray-300 break-words flex flex-col gap-1.5">
                       {log.messages.map((msg, i) => <InspectorNode key={i} value={msg} />)}
                    </div>
                    <span className="text-[9px] text-gray-400 dark:text-gray-700 shrink-0 font-sans select-none opacity-0 group-hover:opacity-100 transition-opacity pt-1">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</span>
                  </div>
                ))}
                <div ref={endRef} className="h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};