import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sparkles, Code2, Monitor, Terminal, GripVertical, Settings2, Command, Sun, Moon, ArrowLeft, Square } from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { OutputPanel } from './components/OutputPanel';
import { AIAssistant } from './components/AIAssistant';
import { LanguageSelector } from './components/LanguageSelector';
import { LANGUAGE_TEMPLATES } from './constants';
import { LogEntry, LogType, Language, Interpreter } from './types';
import { executeUserCode } from './utils/executor';
import { executeWithAI } from './utils/aiRunner';

type MobileTab = 'editor' | 'preview' | 'console';
type Theme = 'dark' | 'light';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedInterpreter, setSelectedInterpreter] = useState<Interpreter | null>(null);
  
  const [code, setCode] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  // Theme State with Persistence
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    }
    return 'dark';
  });
  
  // Desktop Layout State
  const [editorWidth, setEditorWidth] = useState(55); // percentage
  
  // Mobile State
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('editor');
  
  const [isRunning, setIsRunning] = useState(false);
  // Ref to track running state inside timers without triggering re-renders/effect loops
  const isRunningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync ref
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Handle Language Selection (Now includes Interpreter)
  const handleLanguageSelect = (lang: Language, interpreter: Interpreter) => {
    setSelectedLanguage(lang);
    setSelectedInterpreter(interpreter);
    setCode(LANGUAGE_TEMPLATES[lang.id] || '// Start coding...');
    setLogs([]);
    setIsLiveMode(false);
  };

  const handleBackToSelection = () => {
    setSelectedLanguage(null);
    setSelectedInterpreter(null);
    setLogs([]);
    setMobileActiveTab('editor');
    setIsLiveMode(false);
    setIsRunning(false); // Explicitly stop running state
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  // Resize Logic (Desktop Only)
  const startResize = useCallback(() => setIsDragging(true), []);
  const stopResize = useCallback(() => setIsDragging(false), []);
  
  const resize = useCallback((e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newWidth > 25 && newWidth < 75) {
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

  // Logging
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

  // Execution Logic
  const handleRun = useCallback(async () => {
    if (!selectedLanguage || !selectedInterpreter) return;

    // Cancel any previous run
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsRunning(true);
    handleClearLogs();

    // Small delay to ensure UI updates before heavy work
    await new Promise(r => setTimeout(r, 10));

    if (selectedInterpreter.type === 'browser') {
      // Browser Execution
      setTimeout(() => {
        if (signal.aborted) {
            setIsRunning(false);
            return;
        }
        const rootEl = document.getElementById('visual-root');
        if (!rootEl) {
            setIsRunning(false);
            return;
        }
        executeUserCode(code, rootEl, addLog, selectedLanguage.id);
        setIsRunning(false);
      }, 50); 
    } else {
      // Cloud/AI Execution
      
      // Clear previous visual output (if any)
      const rootEl = document.getElementById('visual-root');
      if (rootEl) rootEl.innerHTML = '';

      const handleVisualOutput = (htmlContent: string) => {
          if (signal.aborted) return;

          if (rootEl) {
              const iframe = document.createElement('iframe');
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.border = 'none';
              iframe.style.background = 'transparent'; 
              iframe.setAttribute('sandbox', 'allow-scripts allow-modals allow-same-origin');
              
              rootEl.appendChild(iframe);
              iframe.srcdoc = htmlContent;

              // If mobile, switch to preview tab automatically only if explicit run
              if (window.innerWidth < 768 && !isLiveMode) {
                  setMobileActiveTab('preview');
              }
          }
      };

      try {
         await executeWithAI(code, selectedLanguage.name, addLog, handleVisualOutput, signal);
      } catch (e) {
         // Ignore abort errors
      } finally {
         if (!signal.aborted) setIsRunning(false);
      }
    }

  }, [code, addLog, handleClearLogs, selectedLanguage, selectedInterpreter, isLiveMode]);

  const toggleRun = useCallback(() => {
    if (isLiveMode) {
        // STOP LIVE MODE
        setIsLiveMode(false);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsRunning(false);
        
        // Switch back to editor when stopping
        if (window.innerWidth < 768) {
          setMobileActiveTab('editor');
        }
    } else {
        // START LIVE MODE
        // Switch Tabs on Mobile to appropriate view
        if (window.innerWidth < 768) {
            if (selectedInterpreter?.type === 'browser') {
               setMobileActiveTab('preview');
            } else {
               setMobileActiveTab('console');
            }
        }

        setIsLiveMode(true);
        handleRun();
    }
  }, [selectedInterpreter, isLiveMode, handleRun]);

  // Live Mode Debounce Effect
  useEffect(() => {
    if (!isLiveMode || !selectedInterpreter) return;

    // Browser is fast, Cloud/AI needs longer debounce to avoid rate limits
    const delay = selectedInterpreter.type === 'browser' ? 800 : 2500;

    const timer = setTimeout(() => {
      // Don't trigger if already running (avoids stacking)
      if (!isRunningRef.current) {
        handleRun();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [code, isLiveMode, selectedInterpreter, handleRun]);

  const handleReset = () => {
    if (selectedLanguage && window.confirm("Reset code to default example?")) {
      setCode(LANGUAGE_TEMPLATES[selectedLanguage.id] || '');
      handleClearLogs();
      const rootEl = document.getElementById('visual-root');
      if (rootEl) rootEl.innerHTML = '';
      setMobileActiveTab('editor');
    }
  };

  const handleCodeGenerated = (newCode: string) => {
    setCode(newCode);
    setTimeout(() => {
       if (window.innerWidth < 768) {
           if (selectedInterpreter?.type === 'browser') setMobileActiveTab('preview');
           else setMobileActiveTab('console');
       }
       if (!isLiveMode) {
           setIsLiveMode(true);
           handleRun();
       }
    }, 100);
  };

  if (!selectedLanguage || !selectedInterpreter) {
    return (
      <>
        <div className="fixed top-4 right-4 z-[110]">
           <button 
             onClick={toggleTheme}
             className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white/50 dark:bg-black/50 backdrop-blur rounded-full transition-colors"
           >
             {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
           </button>
        </div>
        <LanguageSelector onSelect={handleLanguageSelect} />
      </>
    );
  }

  return (
    <div className="flex flex-col w-full h-full text-gray-900 dark:text-white font-sans overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-white bg-white dark:bg-black">
      <AIAssistant 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        onCodeGenerated={handleCodeGenerated} 
      />

      {/* --- Header --- */}
      <header className="h-14 border-b border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/50 backdrop-blur-xl shrink-0 flex items-center justify-between px-4 z-50 transition-colors">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBackToSelection}
            className="p-1.5 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Change Language"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <Command className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white/90">Nexus Playground</h1>
            <span className="text-[10px] text-gray-500 dark:text-white/40 font-mono hidden sm:inline-block">
              {selectedLanguage.name} · {selectedInterpreter.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={toggleTheme}
             className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors mr-1"
             title="Toggle Theme"
           >
             {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
           </button>

           <div className="hidden md:flex items-center gap-2 mr-2">
              <button onClick={() => setIsAIModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-white/5 hover:bg-indigo-100 dark:hover:bg-white/10 border border-indigo-200 dark:border-white/5 text-xs font-medium text-indigo-600 dark:text-indigo-300 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Assist</span>
              </button>
              <button onClick={handleReset} className="p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
           </div>

           <button
             onClick={toggleRun}
             className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold text-xs transition-all shadow-lg min-w-[100px] justify-center
               ${isLiveMode 
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-indigo-500/20'
               }`}
           >
             {isRunning ? (
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/>
             ) : (
                isLiveMode ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />
             )}
             
             <span className="hidden sm:inline">
                {isLiveMode ? 'Stop Live' : 'Run'}
             </span>
             <span className="sm:hidden">
                {isLiveMode ? 'Stop' : 'Run'}
             </span>
           </button>
        </div>
      </header>

      {/* --- Main Workspace --- */}
      <main className="flex-1 relative flex overflow-hidden" ref={containerRef}>
        
        {/* Mobile View Manager - Persistent DOM using visibility toggling to prevent iframe loss */}
        <div className="md:hidden w-full h-full relative flex flex-col min-h-0">
          <div 
             className={`absolute inset-0 z-10 bg-white dark:bg-black transition-opacity duration-200 flex flex-col ${
               mobileActiveTab === 'editor' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
             }`}
          >
             <CodeEditor 
                code={code} 
                onChange={setCode} 
                language={selectedLanguage}
                onRun={toggleRun}
                onAI={() => setIsAIModalOpen(true)}
                onChangeSettings={handleBackToSelection}
             />
          </div>
          
          <div 
             className={`absolute inset-0 z-10 transition-opacity duration-200 flex flex-col ${
               mobileActiveTab !== 'editor' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
             }`}
          >
             <OutputPanel 
               logs={logs} 
               onClearLogs={handleClearLogs}
               // If in editor, keep the previous output state (or default to preview) rather than unmounting
               mobileView={mobileActiveTab === 'console' ? 'console' : 'preview'}
             />
          </div>
        </div>

        {/* Desktop Split View */}
        <div className="hidden md:flex w-full h-full">
           <div style={{ width: `${editorWidth}%` }} className="h-full flex flex-col relative group z-10">
              <CodeEditor 
                code={code} 
                onChange={setCode} 
                language={selectedLanguage}
                onRun={toggleRun}
                onAI={() => setIsAIModalOpen(true)}
                onChangeSettings={handleBackToSelection}
              />
           </div>

           <div 
             className="w-px bg-gray-200 dark:bg-white/10 hover:bg-indigo-500 dark:hover:bg-indigo-500 cursor-col-resize relative z-20 transition-colors group flex flex-col justify-center items-center"
             onMouseDown={startResize}
           >
              <div className="absolute inset-y-0 -left-2 -right-2 z-30" />
              <div className="h-8 w-1 bg-gray-300 dark:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
           </div>

           <div className="flex-1 min-w-0 bg-gray-50 dark:bg-[#030304]">
              <OutputPanel 
                logs={logs} 
                onClearLogs={handleClearLogs}
              />
           </div>
        </div>
      </main>

      {/* --- Mobile Bottom Navigation --- */}
      <nav className="md:hidden h-16 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 grid grid-cols-4 items-center shrink-0 pb-safe z-50">
         <button 
           onClick={() => setMobileActiveTab('editor')}
           className={`flex flex-col items-center justify-center gap-1 h-full ${mobileActiveTab === 'editor' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
         >
           <Code2 className="w-5 h-5" />
           <span className="text-[10px] font-medium">Code</span>
         </button>
         
         <button 
           onClick={() => setMobileActiveTab('preview')}
           className={`flex flex-col items-center justify-center gap-1 h-full ${mobileActiveTab === 'preview' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
         >
           <Monitor className="w-5 h-5" />
           <span className="text-[10px] font-medium">Preview</span>
         </button>

         <button 
           onClick={() => setMobileActiveTab('console')}
           className={`relative flex flex-col items-center justify-center gap-1 h-full ${mobileActiveTab === 'console' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}
         >
           <Terminal className="w-5 h-5" />
           <span className="text-[10px] font-medium">Console</span>
           {logs.length > 0 && (
             <span className="absolute top-2 right-4 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
           )}
         </button>

         <button 
            onClick={() => setIsAIModalOpen(true)}
            className="flex flex-col items-center justify-center gap-1 h-full text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
         >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">AI</span>
         </button>
      </nav>

      {/* --- Desktop Status Bar --- */}
      <footer className="hidden md:flex h-7 bg-white dark:bg-[#050505] border-t border-gray-200 dark:border-white/10 px-3 items-center justify-between text-[10px] text-gray-500 select-none shrink-0 z-40 transition-colors">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-yellow-500 animate-pulse' : (isLiveMode ? 'bg-red-500 animate-pulse' : 'bg-emerald-500')}`}></div>
              <span className="text-gray-500 dark:text-gray-400">{isRunning ? 'Running...' : (isLiveMode ? 'Live Mode Active' : 'Ready')}</span>
           </div>
           <div className="w-px h-3 bg-gray-300 dark:bg-white/10"></div>
           <span>{selectedLanguage.name} · {selectedInterpreter.name}</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="flex items-center gap-1 text-gray-400 dark:text-gray-600">
             <Settings2 className="w-3 h-3" />
             <span>{selectedInterpreter.type === 'browser' ? 'Local Runtime' : 'Cloud Simulation'}</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default App;