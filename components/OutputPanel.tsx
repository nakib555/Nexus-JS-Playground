import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, LogType } from '../types';
import { Terminal, Box, AlertCircle, Info, CheckCircle2, AlertTriangle, Trash2, ChevronRight, Braces, List, Layout, Maximize2, Minimize2, Split } from 'lucide-react';

interface OutputPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  // If provided, forces a specific view (used for mobile)
  mobileView?: 'console' | 'preview';
}

// -- Object Inspector Components --
const getType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Element) return 'element'; // Won't happen often across iframe boundary due to serialization
  return typeof value;
};

const InspectorNode: React.FC<{ name?: string, value: any, depth?: number }> = ({ name, value, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (depth > 5) return <span className="text-gray-500 dark:text-gray-600">...</span>;

  // Handle serialized Error objects
  if (typeof value === 'string' && (value.startsWith('Error:') || value.startsWith('ReferenceError:') || value.startsWith('SyntaxError:'))) {
      return <span className="text-red-500 dark:text-red-400 font-medium">{value}</span>;
  }

  if (React.isValidElement(value)) {
    return (
        <div className="inline-flex items-center opacity-80">
          {name && <span className="text-indigo-600 dark:text-indigo-300 mr-2">{name}:</span>}
          <span className="text-teal-600 dark:text-teal-400 font-mono text-[10px] bg-teal-500/10 px-1.5 rounded border border-teal-500/20">
            ReactElement
          </span>
        </div>
    );
  }

  const type = getType(value);

  if (type === 'string') {
    // Check if it looks like HTML/SVG and give a hint
    const isHTML = value.trim().startsWith('<') && value.trim().endsWith('>');
    return (
        <div className="inline-flex items-start break-all">
        {name && <span className="text-indigo-600 dark:text-indigo-300 mr-2">{name}:</span>}
        <span className={`whitespace-pre-wrap ${isHTML ? 'text-blue-600 dark:text-blue-300 font-mono text-[10px]' : 'text-orange-600 dark:text-orange-200/90'}`}>
            {isHTML ? 'Wait, is this HTML? Check visual output.' : `"${value}"`}
            {!isHTML && <span className="text-orange-600 dark:text-orange-200/90"></span>}
        </span>
        {isHTML && (
            <div className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-[10px] font-mono opacity-70">
                {value.substring(0, 100)}{value.length > 100 ? '...' : ''}
            </div>
        )}
        </div>
    );
  }
  if (type === 'number') return (
    <div className="inline-flex">
      {name && <span className="text-indigo-600 dark:text-indigo-300 mr-2">{name}:</span>}
      <span className="text-blue-600 dark:text-blue-400 font-bold">{value}</span>
    </div>
  );
  if (type === 'boolean') return (
    <div className="inline-flex">
      {name && <span className="text-indigo-600 dark:text-indigo-300 mr-2">{name}:</span>}
      <span className="text-purple-600 dark:text-purple-400 font-bold">{String(value)}</span>
    </div>
  );
  if (type === 'null' || type === 'undefined') return (
    <div className="inline-flex">
      {name && <span className="text-indigo-600 dark:text-indigo-300 mr-2">{name}:</span>}
      <span className="text-gray-500 italic">{String(value)}</span>
    </div>
  );
  if (type === 'function') return (
    <div className="inline-flex text-yellow-600 dark:text-yellow-100/80">
      {name && <span className="text-indigo-600 dark:text-indigo-300 mr-2">{name}:</span>}
      <span className="italic opacity-70">ƒ {value.name || 'anonymous'}()</span>
    </div>
  );

  const isArray = type === 'array';
  const keys = value ? Object.keys(value) : [];
  const isEmpty = keys.length === 0;
  
  const toggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
  };

  if (isEmpty) {
    return (
        <div className="inline-flex">
          {name && <span className="text-indigo-600 dark:text-indigo-300 mr-2">{name}:</span>}
          <span className="text-gray-500">{isArray ? '[]' : '{}'}</span>
        </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start align-top">
      <div 
        className="flex items-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 -ml-1 select-none transition-colors" 
        onClick={toggle}
      >
        <span className="mr-1 text-gray-400 dark:text-gray-500 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
           <ChevronRight className="w-3 h-3" />
        </span>
        {name && <span className="text-indigo-600 dark:text-indigo-300 mr-2">{name}:</span>}
        <span className="text-gray-500 dark:text-gray-400 font-medium text-[11px] flex items-center gap-1.5">
            {isArray ? <List className="w-3 h-3 opacity-50"/> : <Braces className="w-3 h-3 opacity-50"/>}
            {isArray ? `Array(${value.length})` : 'Object'}
        </span>
        {!isExpanded && (
            <span className="ml-2 text-gray-400 dark:text-gray-600 text-[10px] truncate max-w-[150px] opacity-50">
                {isArray ? `[...]` : `{...}`}
            </span>
        )}
      </div>
      
      {isExpanded && (
        <div className="pl-3 border-l border-black/10 dark:border-white/10 ml-1.5 mt-1 flex flex-col gap-0.5 animate-fade-in">
          {keys.map((key) => {
             let childValue;
             try { childValue = value[key]; } catch(e) { childValue = "[Restricted]"; }
             return (
                 <InspectorNode key={key} name={key} value={childValue} depth={depth + 1} />
             );
          })}
        </div>
      )}
    </div>
  );
};

export const OutputPanel: React.FC<OutputPanelProps> = ({ 
  logs, 
  onClearLogs,
  mobileView
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  
  // Layout Logic
  const [layoutMode, setLayoutMode] = useState<'auto' | 'split' | 'visual' | 'console'>('auto');
  const [hasVisualContent, setHasVisualContent] = useState(false);
  const [effectiveLayout, setEffectiveLayout] = useState<'split' | 'visual' | 'console'>('visual');

  // Monitor DOM changes in visual root to auto-detect visual output
  useEffect(() => {
    // The Visual Root is where we mount the iframe. 
    // We check if it has an iframe with content.
    const root = document.getElementById('visual-root');
    if (!root) return;

    const checkContent = () => {
      // If there is an iframe, we assume visual content is active or at least initialized
      setHasVisualContent(root.querySelector('iframe') !== null);
    };

    const observer = new MutationObserver(checkContent);
    observer.observe(root, { childList: true, subtree: true });
    checkContent();
    return () => observer.disconnect();
  }, []);

  // Determine Effective Layout based on Mode + Content
  useEffect(() => {
    if (mobileView) {
      setEffectiveLayout(mobileView === 'preview' ? 'visual' : 'console');
      return;
    }

    if (layoutMode !== 'auto') {
      setEffectiveLayout(layoutMode);
      return;
    }

    // Auto Logic
    const hasLogs = logs.length > 0;
    
    // Prioritize Split if both exist
    if (hasVisualContent && hasLogs) {
      setEffectiveLayout('split');
    } else if (hasLogs) {
      setEffectiveLayout('console');
    } else {
      setEffectiveLayout('visual');
    }
  }, [layoutMode, hasVisualContent, logs.length, mobileView]);

  useEffect(() => {
    if (effectiveLayout === 'console' || effectiveLayout === 'split') {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, effectiveLayout]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#030712] relative transition-colors">
      
      {/* Header Controls (Desktop Only) */}
      {!mobileView && (
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-black/20 px-3 h-9 shrink-0 transition-colors z-20">
          <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
            {layoutMode === 'auto' && <span className="flex items-center gap-1 text-indigo-500"><Layout className="w-3 h-3"/> Auto</span>}
            {layoutMode !== 'auto' && <span className="text-gray-400">Manual</span>}
          </div>

          <div className="flex items-center gap-1">
             <button 
              onClick={() => setLayoutMode('auto')}
              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${layoutMode === 'auto' ? 'text-indigo-500' : 'text-gray-400'}`}
              title="Auto Adjust"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-gray-300 dark:bg-white/10 mx-1" />
            <button 
              onClick={() => setLayoutMode('visual')}
              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${layoutMode === 'visual' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
              title="Maximize Visual"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setLayoutMode('split')}
              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${layoutMode === 'split' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
              title="Split View"
            >
              <Split className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setLayoutMode('console')}
              className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${layoutMode === 'console' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}
              title="Maximize Console"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>
             <div className="w-px h-3 bg-gray-300 dark:bg-white/10 mx-1" />
             <button 
              onClick={onClearLogs}
              className="p-1 rounded hover:bg-red-500 hover:text-white text-gray-400 transition-colors"
              title="Clear Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        
        {/* Visual Layer */}
        <div 
           className={`
             relative bg-transparent transition-all duration-300 ease-in-out flex flex-col
             ${effectiveLayout === 'console' ? 'flex-[0] h-0 min-h-0 overflow-hidden opacity-0' : ''}
             ${effectiveLayout === 'split' ? 'flex-[0.6] min-h-[30%]' : ''}
             ${effectiveLayout === 'visual' ? 'flex-1' : ''}
           `}
        >
          <div className="w-full h-full relative">
             <div id="visual-root" className="w-full h-full visual-grid-bg"></div>
             <div className="absolute top-2 right-2 pointer-events-none opacity-50">
               <span className="text-[9px] font-mono text-gray-400 bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 backdrop-blur">Preview</span>
             </div>
          </div>
        </div>

        {/* Divider (Visual only for split view) */}
        {effectiveLayout === 'split' && (
           <div className="h-px bg-gray-200 dark:bg-white/10 w-full shrink-0 shadow-sm z-10"></div>
        )}

        {/* Console Layer */}
        <div 
           className={`
             relative bg-gray-50 dark:bg-[#030712] flex flex-col transition-all duration-300 ease-in-out
             ${effectiveLayout === 'visual' ? 'flex-[0] h-0 min-h-0 overflow-hidden opacity-0' : ''}
             ${effectiveLayout === 'split' ? 'flex-[0.4] min-h-[20%] border-t border-gray-200 dark:border-white/5' : ''}
             ${effectiveLayout === 'console' ? 'flex-1' : ''}
           `}
        >
           <div className="absolute top-2 right-2 pointer-events-none opacity-50 z-10">
               <span className="text-[9px] font-mono text-gray-400 bg-white/50 dark:bg-black/50 px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 backdrop-blur">Console</span>
           </div>

           <div className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs custom-scrollbar">
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-800 space-y-3 opacity-60">
                <Terminal className="w-6 h-6" />
                <p className="text-[10px] font-medium uppercase tracking-widest">No Logs</p>
              </div>
            ) : (
              <div className="flex flex-col min-h-full py-2">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`flex gap-3 px-4 py-1.5 border-l-2 border-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors group items-start
                      ${log.type === LogType.ERROR ? 'border-l-red-500 bg-red-50 dark:bg-red-500/5' : ''}
                      ${log.type === LogType.WARN ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-500/5' : ''}
                      ${log.type === LogType.SUCCESS ? 'border-l-green-500 bg-green-50 dark:bg-green-500/5' : ''}
                    `}
                  >
                    <span className="shrink-0 mt-0.5 opacity-60">
                      {log.type === LogType.ERROR && <AlertCircle className="w-3 h-3 text-red-500 dark:text-red-400" />}
                      {log.type === LogType.WARN && <AlertTriangle className="w-3 h-3 text-yellow-500 dark:text-yellow-400" />}
                      {log.type === LogType.SUCCESS && <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />}
                      {log.type === LogType.INFO && <Info className="w-3 h-3 text-blue-500 dark:text-blue-400" />}
                    </span>
                    
                    <div className="flex-1 min-w-0 font-mono text-[11px] leading-relaxed text-gray-700 dark:text-gray-300 break-words flex flex-col gap-1">
                       {log.messages.map((msg, i) => (
                         <InspectorNode key={i} value={msg} />
                       ))}
                    </div>
                    
                    <span className="text-[9px] text-gray-400 dark:text-gray-700 shrink-0 font-sans select-none opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                    </span>
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