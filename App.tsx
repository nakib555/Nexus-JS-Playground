import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sparkles, Code2, Monitor, Terminal, Settings2, Command, Sun, Moon, ArrowLeft, Square, Menu } from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { OutputPanel } from './components/OutputPanel';
import { AIAssistant } from './components/AIAssistant';
import { LanguageSelector } from './components/LanguageSelector';
import { CommandPalette } from './components/CommandPalette';
import { LANGUAGE_TEMPLATES } from './constants';
import { LogEntry, LogType, Language, Interpreter, Command as CommandType } from './types';
import { executeUserCode } from './utils/executor';
import { executeWithAI } from './utils/aiRunner';

type MobileTab = 'editor' | 'preview' | 'console';
type Theme = 'dark' | 'light';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedInterpreter, setSelectedInterpreter] = useState<Interpreter | null>(null);
  
  const [code, setCode] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    }
    return 'dark';
  });
  
  const [editorWidth, setEditorWidth] = useState(55);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('editor');
  
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

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
    setIsRunning(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const startResize = useCallback(() => setIsDragging(true), []);
  const stopResize = useCallback(() => setIsDragging(false), []);
  
  const resize = useCallback((e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth > 25 && newWidth < 75) setEditorWidth(newWidth);
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
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), type, messages }]);
  }, []);

  const handleClearLogs = useCallback(() => setLogs([]), []);

  const getVisualRoot = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    return document.getElementById(isMobile ? 'visual-root-mobile' : 'visual-root-desktop');
  }, []);

  const handleRun = useCallback(async () => {
    if (!selectedLanguage || !selectedInterpreter) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsRunning(true);
    handleClearLogs();
    await new Promise(r => setTimeout(r, 10));

    if (selectedInterpreter.type === 'browser') {
      setTimeout(() => {
        if (signal.aborted) return setIsRunning(false);
        const rootEl = getVisualRoot();
        if (!rootEl) {
          addLog(LogType.ERROR, ["Visual Root not found."]);
          return setIsRunning(false);
        }
        executeUserCode(code, rootEl, addLog, selectedLanguage.id, selectedInterpreter.id);
        setIsRunning(false);
      }, 50);
    } else {
      const rootEl = getVisualRoot();
      if (rootEl) rootEl.innerHTML = '';
      
      const handleVisualOutput = (htmlContent: string) => {
        if (signal.aborted) return;
        const currentRoot = getVisualRoot();
        if (currentRoot) {
          currentRoot.innerHTML = '';
          const iframe = document.createElement('iframe');
          Object.assign(iframe.style, { width: '100%', height: '100%', border: 'none', background: 'transparent' });
          iframe.setAttribute('sandbox', 'allow-scripts allow-modals allow-same-origin');
          currentRoot.appendChild(iframe);
          iframe.srcdoc = htmlContent;
          if (window.innerWidth < 768 && !isLiveMode) setMobileActiveTab('preview');
        }
      };
      try {
        await executeWithAI(code, selectedLanguage.name, selectedInterpreter, addLog, handleVisualOutput, signal);
      } catch (e) {} finally {
        if (!signal.aborted) setIsRunning(false);
      }
    }
  }, [code, addLog, handleClearLogs, selectedLanguage, selectedInterpreter, isLiveMode, getVisualRoot]);

  const toggleRun = useCallback(() => {
    if (isLiveMode) {
      setIsLiveMode(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsRunning(false);
      if (window.innerWidth < 768) setMobileActiveTab('editor');
    } else {
      if (window.innerWidth < 768) {
        setMobileActiveTab(selectedInterpreter?.type === 'browser' ? 'preview' : 'console');
      }
      setIsLiveMode(true);
      handleRun();
    }
  }, [selectedInterpreter, isLiveMode, handleRun]);

  useEffect(() => {
    if (!isLiveMode || !selectedInterpreter) return;
    const delay = selectedInterpreter.type === 'browser' ? 800 : 2500;
    const timer = setTimeout(() => { if (!isRunningRef.current) handleRun() }, delay);
    return () => clearTimeout(timer);
  }, [code, isLiveMode, selectedInterpreter, handleRun]);

  const handleReset = () => {
    if (selectedLanguage && window.confirm("Reset code to default example?")) {
      setCode(LANGUAGE_TEMPLATES[selectedLanguage.id] || '');
      handleClearLogs();
      const rootEl = getVisualRoot();
      if (rootEl) rootEl.innerHTML = '';
      setMobileActiveTab('editor');
    }
  };

  const handleCodeGenerated = (newCode: string) => {
    setCode(newCode);
    setTimeout(() => {
       if (window.innerWidth < 768) setMobileActiveTab(selectedInterpreter?.type === 'browser' ? 'preview' : 'console');
       if (!isLiveMode) {
           setIsLiveMode(true);
           handleRun();
       }
    }, 100);
  };
  
  // Command Palette integration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
            e.preventDefault();
            setIsCommandPaletteOpen(v => !v);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands: CommandType[] = [
    { id: 'run', name: isLiveMode ? 'Stop Live Mode' : 'Run Code', onSelect: toggleRun, icon: isLiveMode ? <Square size={16}/> : <Play size={16}/>, section: 'Actions', shortcut:['▶'] },
    { id: 'ai', name: 'AI Assistant', onSelect: () => setIsAIModalOpen(true), icon: <Sparkles size={16}/>, section: 'Actions' },
    { id: 'reset', name: 'Reset Code', onSelect: handleReset, icon: <RotateCcw size={16}/>, section: 'Actions' },
    { id: 'clear', name: 'Clear Console', onSelect: handleClearLogs, icon: <Terminal size={16}/>, section: 'Actions' },
    { id: 'lang', name: 'Change Language', onSelect: handleBackToSelection, icon: <Settings2 size={16}/>, section: 'Navigation' },
    { id: 'theme', name: 'Toggle Theme', onSelect: toggleTheme, icon: theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>, section: 'General' },
  ];

  if (!selectedLanguage || !selectedInterpreter) {
    return (
      <>
        <div className="fixed top-4 right-4 z-[110]"><button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white/50 dark:bg-black/50 backdrop-blur rounded-full transition-colors">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button></div>
        <LanguageSelector onSelect={handleLanguageSelect} />
      </>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col text-gray-900 dark:text-white font-sans overflow-hidden bg-white dark:bg-[#0A0A0A] selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-white">
      <AIAssistant isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} onCodeGenerated={handleCodeGenerated} />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={commands} />

      <header className="shrink-0 h-12 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-between px-3 z-50 transition-colors">
        <div className="flex items-center gap-2">
          <button onClick={handleBackToSelection} className="p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors" title="Change Language"><ArrowLeft size={16} /></button>
          <div className="w-px h-5 bg-gray-200 dark:bg-white/10"></div>
          <div className="flex flex-col ml-2">
            <h1 className="text-xs font-bold tracking-tight text-gray-900 dark:text-white/90">{selectedLanguage.name}</h1>
            <span className="text-[10px] text-gray-500 dark:text-white/40 font-mono hidden sm:inline-block">{selectedInterpreter.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsCommandPaletteOpen(true)} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-300 transition-all">
             <Menu size={12} />
             <span className="hidden md:inline">Commands</span>
             <kbd className="hidden md:inline-flex items-center justify-center text-[9px] h-4 min-w-[16px] px-1 rounded bg-white dark:bg-black/50 border border-gray-300 dark:border-white/20">⌘P</kbd>
          </button>
          <button onClick={toggleRun} className={`flex items-center gap-2 px-4 py-1.5 rounded-md font-semibold text-xs transition-all shadow-lg min-w-[90px] justify-center ${isLiveMode ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-indigo-500/20'}`}>
             {isRunning ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/> : (isLiveMode ? <Square size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />)}
             <span>{isLiveMode ? 'Stop' : 'Run'}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative w-full min-h-0 overflow-hidden" ref={containerRef}>
        <div className="md:hidden w-full h-full relative flex flex-col min-h-0">
          <div className={`absolute inset-0 z-10 bg-white dark:bg-black transition-opacity duration-200 flex flex-col ${mobileActiveTab === 'editor' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <CodeEditor code={code} onChange={setCode} language={selectedLanguage} />
          </div>
          <div className={`absolute inset-0 z-10 transition-opacity duration-200 flex flex-col ${mobileActiveTab !== 'editor' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <OutputPanel logs={logs} onClearLogs={handleClearLogs} visualRootId="visual-root-mobile" mobileView={mobileActiveTab === 'console' ? 'console' : 'preview'} />
          </div>
        </div>
        <div className="hidden md:flex w-full h-full">
           <div style={{ width: `${editorWidth}%` }} className="h-full flex flex-col relative group z-10"><CodeEditor code={code} onChange={setCode} language={selectedLanguage} /></div>
           <div className="w-px bg-gray-200 dark:bg-white/10 hover:bg-indigo-500 dark:hover:bg-indigo-500 cursor-col-resize relative z-20 transition-colors group flex flex-col justify-center items-center" onMouseDown={startResize}>
              <div className="absolute inset-y-0 -left-2 -right-2 z-30" />
              <div className="h-8 w-1 bg-gray-300 dark:bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
           </div>
           <div className="flex-1 min-w-0 bg-gray-50 dark:bg-[#030304]"><OutputPanel logs={logs} onClearLogs={handleClearLogs} visualRootId="visual-root-desktop" /></div>
        </div>
      </main>

      <nav className="shrink-0 md:hidden h-16 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 grid grid-cols-4 items-center z-50 pb-[env(safe-area-inset-bottom)]">
         <button onClick={() => setMobileActiveTab('editor')} className={`flex flex-col items-center justify-center gap-1 h-full ${mobileActiveTab === 'editor' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}><Code2 size={20} /><span className="text-[10px] font-medium">Code</span></button>
         <button onClick={() => setMobileActiveTab('preview')} className={`flex flex-col items-center justify-center gap-1 h-full ${mobileActiveTab === 'preview' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}><Monitor size={20} /><span className="text-[10px] font-medium">Preview</span></button>
         <button onClick={() => setMobileActiveTab('console')} className={`relative flex flex-col items-center justify-center gap-1 h-full ${mobileActiveTab === 'console' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}><Terminal size={20} /><span className="text-[10px] font-medium">Console</span>{logs.length > 0 && <span className="absolute top-2 right-4 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>}</button>
         <button onClick={() => setIsAIModalOpen(true)} className="flex flex-col items-center justify-center gap-1 h-full text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"><Sparkles size={20} /><span className="text-[10px] font-medium">AI</span></button>
      </nav>

      <footer className="shrink-0 hidden md:flex h-7 bg-white dark:bg-[#050505] border-t border-gray-200 dark:border-white/10 px-3 items-center justify-between text-[10px] text-gray-500 select-none z-40 transition-colors">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-yellow-500' : (isLiveMode ? 'bg-red-500' : 'bg-emerald-500')} ${isRunning || isLiveMode ? 'animate-pulse' : ''}`}></div><span className="text-gray-500 dark:text-gray-400">{isRunning ? 'Running...' : (isLiveMode ? 'Live Mode' : 'Ready')}</span></div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsCommandPaletteOpen(true)} className="text-gray-400 dark:text-gray-600 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Press <kbd className="inline-flex items-center justify-center text-[9px] h-4 min-w-[16px] px-1 rounded bg-gray-200 dark:bg-black/50 border border-gray-300 dark:border-white/20 mx-0.5">⌘P</kbd> for commands</button>
        </div>
      </footer>
    </div>
  );
};

export default App;
