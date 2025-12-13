import React, { useEffect, useRef, useState } from 'react';
import { LogEntry, LogType } from '../types';
import { Terminal, Monitor, AlertCircle, Info, CheckCircle2, AlertTriangle, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

interface OutputPanelProps {
  logs: LogEntry[];
  activeTab: 'console' | 'visual';
  onClearLogs: () => void;
  onTabChange: (tab: 'console' | 'visual') => void;
}

// -- Object Inspector Components --

const getType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Element) return 'element';
  return typeof value;
};

const InspectorNode: React.FC<{ name?: string, value: any, depth?: number }> = ({ name, value, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const type = getType(value);

  if (depth > 10) return <span className="text-gray-600">...</span>;

  // Primitives
  if (type === 'string') return (
    <div className="inline-flex items-start">
      {name && <span className="text-purple-300 mr-1">{name}:</span>}
      <span className="text-orange-300 whitespace-pre-wrap">"{value}"</span>
    </div>
  );
  if (type === 'number') return (
    <div className="inline-flex">
      {name && <span className="text-purple-300 mr-1">{name}:</span>}
      <span className="text-blue-400">{value}</span>
    </div>
  );
  if (type === 'boolean') return (
    <div className="inline-flex">
      {name && <span className="text-purple-300 mr-1">{name}:</span>}
      <span className="text-indigo-400">{String(value)}</span>
    </div>
  );
  if (type === 'null' || type === 'undefined') return (
    <div className="inline-flex">
      {name && <span className="text-purple-300 mr-1">{name}:</span>}
      <span className="text-gray-500">{String(value)}</span>
    </div>
  );
  if (type === 'function') return (
    <div className="inline-flex">
      {name && <span className="text-purple-300 mr-1">{name}:</span>}
      <span className="text-yellow-300 italic">f {value.name || '()'}</span>
    </div>
  );
  if (type === 'element') {
      const tagName = value.tagName.toLowerCase();
      const id = value.id ? `#${value.id}` : '';
      const className = value.className ? `.${value.className.split(' ').join('.')}` : '';
      return (
        <div className="inline-flex text-gray-400 hover:text-gray-200 transition-colors">
            {name && <span className="text-purple-300 mr-1">{name}:</span>}
            <span>&lt;{tagName}<span className="text-yellow-600">{id}</span><span className="text-blue-500">{className}</span>&gt;</span>
        </div>
      )
  }

  // Complex Types (Arrays/Objects)
  const isArray = type === 'array';
  const keys = Object.keys(value);
  const isEmpty = keys.length === 0;
  
  const toggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
  };

  if (isEmpty) {
    return (
        <div className="inline-flex">
          {name && <span className="text-purple-300 mr-1">{name}:</span>}
          <span className="text-gray-400">{isArray ? '[]' : '{}'}</span>
        </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-start align-top">
      <div 
        className="flex items-center cursor-pointer hover:bg-white/5 rounded px-0.5 -ml-0.5 select-none" 
        onClick={toggle}
      >
        <span className="mr-1 text-gray-500">
           {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
        {name && <span className="text-purple-300 mr-1">{name}:</span>}
        <span className="text-gray-400 font-medium">
            {isArray ? `Array(${value.length})` : 'Object'}
        </span>
        {!isExpanded && (
            <span className="ml-2 text-gray-600 text-[10px] truncate max-w-[200px]">
                {isArray ? `[ ... ]` : `{ ... }`}
            </span>
        )}
      </div>
      
      {isExpanded && (
        <div className="pl-4 border-l border-gray-800 ml-1 mt-0.5 flex flex-col gap-0.5">
          {keys.map((key) => {
             // Handle getters that might throw error on access
             let childValue;
             try { childValue = value[key]; } catch(e) { childValue = <span className="text-red-900 bg-red-900/20 px-1 rounded">Error</span>; }
             return (
                 <InspectorNode 
                    key={key} 
                    name={key} 
                    value={childValue} 
                    depth={depth + 1} 
                 />
             );
          })}
        </div>
      )}
    </div>
  );
};

// -- Main Output Panel --

export const OutputPanel: React.FC<OutputPanelProps> = ({ 
  logs, 
  activeTab, 
  onClearLogs,
  onTabChange
}) => {
  const endRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<'all' | LogType>('all');

  useEffect(() => {
    if (activeTab === 'console') {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  const filteredLogs = logs.filter(log => filter === 'all' || log.type === filter);

  return (
    <div className="flex flex-col h-full bg-[#030712] relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur px-3 h-10 shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => onTabChange('visual')}
            className={`relative px-3 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-2 ${
              activeTab === 'visual' 
                ? 'text-white bg-[#1f1f1f] shadow-sm' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#151515]'
            }`}
          >
            <Monitor className="w-3 h-3" />
            Visual
            {activeTab === 'visual' && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-indigo-500"></div>}
          </button>
          <button
            onClick={() => onTabChange('console')}
            className={`relative px-3 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-2 ${
              activeTab === 'console' 
                ? 'text-white bg-[#1f1f1f] shadow-sm' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#151515]'
            }`}
          >
            <Terminal className="w-3 h-3" />
            Console
            {logs.length > 0 && (
              <span className="bg-gray-700 text-gray-300 px-1 rounded-full text-[9px] min-w-[14px] text-center">
                {logs.length}
              </span>
            )}
            {activeTab === 'console' && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-indigo-500"></div>}
          </button>
        </div>

        {activeTab === 'console' && (
          <div className="flex items-center gap-2">
            <button 
              onClick={onClearLogs}
              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
              title="Clear Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        
        {/* Visual Tab */}
        <div 
          className={`absolute inset-0 z-10 transition-opacity duration-300 ${activeTab === 'visual' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="w-full h-full relative">
            <div id="visual-root" className="w-full h-full text-white"></div>
            
            {activeTab === 'visual' && (
               <div className="absolute top-4 right-4 pointer-events-none opacity-20 hover:opacity-100 transition-opacity">
                 <span className="text-[10px] font-mono text-white bg-black/50 px-2 py-1 rounded">#visual-root</span>
               </div>
            )}
          </div>
        </div>

        {/* Console Tab */}
        <div 
          className={`absolute inset-0 z-20 overflow-y-auto bg-[#030712] font-mono text-xs ${activeTab === 'console' ? 'visible' : 'invisible'}`}
        >
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-700 space-y-3">
              <div className="p-3 bg-gray-900/50 rounded-xl border border-gray-800">
                <Terminal className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">Console is empty</p>
            </div>
          ) : (
            <div className="flex flex-col min-h-full py-2">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className={`flex gap-3 px-4 py-1.5 border-b border-transparent hover:bg-white/5 transition-colors group items-start
                    ${log.type === LogType.ERROR ? 'bg-red-500/5 border-red-500/10' : ''}
                    ${log.type === LogType.WARN ? 'bg-yellow-500/5 border-yellow-500/10' : ''}
                    ${log.type === LogType.SUCCESS ? 'bg-green-500/5 border-green-500/10' : ''}
                  `}
                >
                  <span className="shrink-0 mt-0.5 opacity-80 pt-0.5">
                    {log.type === LogType.ERROR && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                    {log.type === LogType.WARN && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />}
                    {log.type === LogType.SUCCESS && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                    {log.type === LogType.INFO && <Info className="w-3.5 h-3.5 text-blue-400" />}
                  </span>
                  
                  <div className="flex-1 min-w-0 font-mono text-[11px] leading-5 text-gray-300 break-words flex flex-wrap gap-2 items-center">
                     {log.messages.map((msg, i) => (
                       <InspectorNode key={i} value={msg} />
                     ))}
                  </div>
                  
                  <span className="text-[10px] text-gray-700 shrink-0 font-sans select-none opacity-0 group-hover:opacity-100 transition-opacity pt-0.5">
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
  );
};