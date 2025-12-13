import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, RotateCcw, Code2, Zap, Sparkles, PanelLeftClose, PanelLeft, GripVertical } from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { OutputPanel } from './components/OutputPanel';
import { AIAssistant } from './components/AIAssistant';
import { INITIAL_CODE } from './constants';
import { LogEntry, LogType } from './types';
import { executeUserCode } from './utils/executor';

const App: React.FC = () => {
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeOutputTab, setActiveOutputTab] = useState<'console' | 'visual'>('visual');
  const [isRunning, setIsRunning] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  // Resizable Logic
  const [editorWidth, setEditorWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResize = useCallback(() => setIsDragging(true), []);
  const stopResize = useCallback(() => setIsDragging(false), []);
  
  const resize = useCallback((e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setEditorWidth(newWidth);
      }
    }
  }, [isDragging]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [resize, stopResize]);

  const addLog = useCallback((type: LogType, messages: any[]) => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        type,
        messages,
      },
    ]);
  }, []);

  const handleClearLogs = useCallback(() => setLogs([]), []);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    handleClearLogs();
    
    // Defer execution slightly to ensure UI updates state
    setTimeout(() => {
      const rootEl = document.getElementById('visual-root');
      if (!rootEl) {
          setIsRunning(false);
          return;
      }
      
      executeUserCode(code, rootEl, addLog);
      setIsRunning(false);
      setActiveOutputTab('visual');
    }, 150);
  }, [code, addLog, handleClearLogs]);

  // Initial Run
  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        handleRun();
      }, 500);
    }
  }, [hasMounted, handleRun]);

  const handleReset = () => {
    if (window.confirm("Reset code to default example?")) {
      setCode(INITIAL_CODE);
      handleClearLogs();
      const rootEl = document.getElementById('visual-root');
      if (rootEl) rootEl.innerHTML = '';
      setActiveOutputTab('visual');
    }
  };

  const handleCodeGenerated = (newCode: string) => {
    setCode(newCode);
    setTimeout(() => {
      const rootEl = document.getElementById('visual-root');
      if (rootEl) {
         handleClearLogs();
         executeUserCode(newCode, rootEl, addLog);
         setActiveOutputTab('visual');
      }
    }, 100);
  };

  return (
    <div className="flex flex-col h-screen bg-[#030712] text-white font-sans overflow-hidden">
      <AIAssistant 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onCodeGenerated={handleCodeGenerated} 
      />

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f] bg-[#030712]/80 backdrop-blur-md shrink-0 z-40 relative">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-[#0a0a0a] p-2 rounded-lg ring-1 ring-white/10">
              <Zap className="w-5 h-5 text-indigo-400" fill="currentColor" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-100 font-mono">
              Nexus<span className="text-indigo-500">_</span>Playground
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-md transition-all group"
          >
            <Sparkles className="w-3.5 h-3.5 group-hover:text-indigo-200 transition-colors" />
            <span className="group-hover:text-indigo-200">AI Assistant</span>
          </button>

          <div className="h-5 w-px bg-[#1f1f1f] mx-2"></div>

          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-white transition-colors hover:bg-white/5 rounded-md"
            title="Reset Code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleRun}
            disabled={isRunning}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-xs tracking-wide uppercase transition-all transform active:scale-95 border
              ${isRunning 
                ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-black border-white hover:bg-gray-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
              }`}
          >
            {isRunning ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            {isRunning ? 'Running' : 'Run'}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden relative flex" ref={containerRef}>
        
        {/* Editor Pane */}
        <div style={{ width: `${editorWidth}%` }} className="h-full flex flex-col min-w-[200px] relative z-10">
           <div className="bg-[#0a0a0a] px-4 py-2 border-b border-[#1f1f1f] flex justify-between items-center shrink-0">
             <span className="flex items-center gap-2 text-[11px] font-mono text-gray-400 uppercase tracking-wider">
               <Code2 className="w-3.5 h-3.5" /> script.js
             </span>
             <span className="text-[10px] text-gray-600">JavaScript (ESNext)</span>
           </div>
           <div className="flex-1 relative overflow-hidden bg-[#050505]">
             <CodeEditor code={code} onChange={setCode} />
           </div>
        </div>

        {/* Resizer Handle */}
        <div 
          className="w-1 bg-[#1f1f1f] hover:bg-indigo-500 cursor-col-resize flex items-center justify-center transition-colors z-30 group relative"
          onMouseDown={startResize}
        >
          <div className="absolute inset-y-0 -left-2 -right-2 z-30"></div> {/* Hit area */}
          <GripVertical className="w-3 h-3 text-gray-600 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100" />
        </div>

        {/* Output Pane */}
        <div className="flex-1 h-full min-w-[200px] bg-[#030712] relative z-10 flex flex-col">
          <OutputPanel 
            logs={logs} 
            activeTab={activeOutputTab} 
            onClearLogs={handleClearLogs}
            onTabChange={setActiveOutputTab}
          />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-[#1f1f1f] px-4 py-1.5 flex items-center justify-between text-[10px] text-gray-500 select-none shrink-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'}`}></div>
             <span className="font-medium text-gray-400">{isRunning ? 'Compiling...' : 'System Ready'}</span>
          </div>
          <span>|</span>
          <span>Ln {code.split('\n').length}, Col 1</span>
        </div>
        <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
           <span>Gemini 2.5 Active</span>
        </div>
      </footer>
    </div>
  );
};

export default App;