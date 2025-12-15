
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LogEntry, LogType } from '../types';
import { Terminal, AlertCircle, Info, CheckCircle2, AlertTriangle, Trash2, ChevronRight, Braces, List, Layout, Maximize2, FunctionSquare, Table, Cpu, Globe } from 'lucide-react';

interface OutputPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  visualRootId?: string;
  hasVisualContentOverride?: boolean;
}

// ... Inspector Helper Functions (re-using largely same logic but updated styles) ...
const getType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Element) return 'element';
  const type = typeof value;
  if (type === 'string' && value.startsWith('Error:')) return 'error';
  return type;
};

const InspectorNode: React.FC<{ name?: string, value: any, depth?: number }> = ({ name, value, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 1);
  const type = getType(value);

  if (depth > 8) return <span className="text-slate-600">...</span>;

  const renderValue = () => {
    switch (type) {
      case 'string':
        // Handling Logic for Images/JSON inside strings...
        if (value.startsWith('data:image/') || value.startsWith('blob:') || (value.startsWith('http') && (value.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i)))) {
            return <img src={value} alt="Output" className="max-w-[200px] max-h-[150px] rounded-md border border-white/10 my-1 bg-black/20" />;
        }
        if ((value.startsWith('{') || value.startsWith('[')) && value.length < 5000) {
            try {
                const parsed = JSON.parse(value);
                if (typeof parsed === 'object') return <InspectorNode value={parsed} depth={depth} />;
            } catch(e) {}
        }
        return <span className="text-orange-300 break-all whitespace-pre-wrap">{`"${value}"`}</span>;
      case 'number': return <span className="text-cyan-300 font-bold">{value}</span>;
      case 'boolean': return <span className="text-purple-400 font-bold">{String(value)}</span>;
      case 'null': return <span className="text-slate-500 italic">null</span>;
      case 'undefined': return <span className="text-slate-500 italic">undefined</span>;
      case 'error': return <span className="text-red-400 font-medium">{value}</span>;
      case 'object':
      case 'array':
        const keys = Object.keys(value);
        if (keys.length === 0) return <span className="text-slate-500">{type === 'array' ? '[]' : '{}'}</span>;
        return (
          <div className="inline-block align-top w-full">
            <div
              className="flex items-center cursor-pointer hover:bg-white/5 rounded px-1 -ml-1 select-none transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            >
              <ChevronRight className={`w-3 h-3 mr-1 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
              <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1.5">
                {type === 'array' ? `Array(${keys.length})` : 'Object'}
              </span>
            </div>
            {isExpanded && (
              <div className="pl-4 border-l border-white/5 ml-1.5 mt-1 flex flex-col gap-0.5 w-full">
                {keys.map(key => <InspectorNode key={key} name={key} value={value[key]} depth={depth + 1} />)}
              </div>
            )}
          </div>
        );
      default: return <span className="text-slate-400">{String(value)}</span>;
    }
  };

  return (
    <div className="flex items-start">
      {name && <span className="text-indigo-300 mr-2 shrink-0">{name}:</span>}
      <div className="min-w-0 w-full">{renderValue()}</div>
    </div>
  );
};

export const OutputPanel: React.FC<OutputPanelProps> = ({
  logs,
  onClearLogs,
  visualRootId = 'visual-root',
  hasVisualContentOverride
}) => {
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'console' | 'visual'>('console');
  
  // Auto-switch tabs if visual content appears
  useEffect(() => {
    if (hasVisualContentOverride) setActiveTab('visual');
  }, [hasVisualContentOverride]);

  // Auto-scroll logic
  useEffect(() => {
    if (activeTab === 'console' && scrollViewportRef.current) {
        scrollViewportRef.current.scrollTo({ top: scrollViewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs, activeTab]);

  return (
    <div className="flex flex-col h-full w-full bg-[#121214]">
      {/* Panel Header */}
      <div className="h-10 shrink-0 border-b border-white/5 flex items-center justify-between px-3 bg-[#121214]">
        <div className="flex items-center gap-1">
           <button 
             onClick={() => setActiveTab('console')}
             className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-2 ${activeTab === 'console' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <Terminal size={12} />
             <span>Console</span>
             {logs.length > 0 && <span className="bg-white/10 px-1.5 rounded-full text-[9px]">{logs.length}</span>}
           </button>
           <button 
             onClick={() => setActiveTab('visual')}
             className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors flex items-center gap-2 ${activeTab === 'visual' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <Globe size={12} />
             <span>Visual</span>
             {hasVisualContentOverride && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
           </button>
        </div>
        
        <div className="flex items-center gap-2">
           <button onClick={onClearLogs} className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-white/5 transition-colors" title="Clear">
              <Trash2 size={14} />
           </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        
        {/* Visual Tab */}
        <div className={`absolute inset-0 bg-white/5 ${activeTab === 'visual' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}>
           <div id={visualRootId} className="w-full h-full"></div>
           {!hasVisualContentOverride && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-xs">
                 <span>No visual output generated</span>
              </div>
           )}
        </div>

        {/* Console Tab */}
        <div 
           ref={scrollViewportRef}
           className={`absolute inset-0 overflow-auto custom-scrollbar p-3 space-y-2 font-mono text-xs ${activeTab === 'console' ? 'z-10' : 'z-0 opacity-0 pointer-events-none'}`}
        >
            {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-700">
                    <Terminal size={24} className="mb-2 opacity-50" />
                    <p>Console Empty</p>
                </div>
            ) : (
                logs.map(log => (
                    <div key={log.id} className={`flex gap-3 p-2 rounded border-l-2 ${
                        log.type === LogType.ERROR ? 'border-red-500 bg-red-500/5' : 
                        log.type === LogType.WARN ? 'border-yellow-500 bg-yellow-500/5' : 
                        log.type === LogType.SYSTEM ? 'border-fuchsia-500 bg-fuchsia-500/5' :
                        'border-slate-600 hover:bg-white/5'
                    }`}>
                        <span className="shrink-0 mt-0.5 opacity-70">
                            {log.type === LogType.ERROR && <AlertCircle size={12} className="text-red-500" />}
                            {log.type === LogType.WARN && <AlertTriangle size={12} className="text-yellow-500" />}
                            {log.type === LogType.INFO && <Info size={12} className="text-blue-500" />}
                            {log.type === LogType.SYSTEM && <Cpu size={12} className="text-fuchsia-500" />}
                            {log.type === LogType.SUCCESS && <CheckCircle2 size={12} className="text-emerald-500" />}
                        </span>
                        <div className="flex-1 overflow-x-auto">
                            {log.messages.map((msg, i) => <InspectorNode key={i} value={msg} />)}
                        </div>
                        <span className="text-[10px] text-slate-600 shrink-0">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}</span>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};
