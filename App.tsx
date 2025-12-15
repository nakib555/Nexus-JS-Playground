import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Play, RotateCcw, Sparkles, Code2, Monitor, Terminal, Settings2, Command, Sun, Moon, ArrowLeft, Square, Menu, Container, Server, Cpu, Wifi, Zap, Radio, FolderOpen } from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { OutputPanel } from './components/OutputPanel';
import { AIAssistant } from './components/AIAssistant';
import { LanguageSelector } from './components/LanguageSelector';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { FileExplorer } from './components/FileExplorer';
import { LANGUAGE_TEMPLATES } from './constants';
import { LogEntry, LogType, Language, Interpreter, Command as CommandType, VirtualFile } from './types';
import { executeUserCode } from './utils/executor';
import { dockerClient } from './utils/dockerClient';
import { detectLibraries } from './utils/codeAnalysis';
import { executeWithAI } from './utils/aiRunner';

type MobileTab = 'editor' | 'preview' | 'console';
type Theme = 'dark' | 'light';

const App: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedInterpreter, setSelectedInterpreter] = useState<Interpreter | null>(null);
  
  const [code, setCode] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [files, setFiles] = useState<VirtualFile[]>([]);
  
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    }
    return 'dark';
  });
  
  const [editorWidth, setEditorWidth] = useState(55);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileTab>('editor');
  
  const [isRunning, setIsRunning] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hasVisualContent, setHasVisualContent] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const executorCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const addLog = useCallback((type: LogType, messages: any[]) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), type, messages }]);
  }, []);

  const handleLanguageSelect = (lang: Language, interpreter: Interpreter) => {
    setSelectedLanguage(lang);
    setSelectedInterpreter(interpreter);
    setCode(LANGUAGE_TEMPLATES[lang.id] || '// Start coding...');
    setLogs([]);
    setHasVisualContent(false);
    setIsLiveMode(false);
    setFiles([]); // Clear files on language switch

    if (interpreter.type === 'docker' && interpreter.dockerImage) {
        setConnectionStatus('Connecting...');
        dockerClient.connect(
            lang.id,
            interpreter.dockerImage,
            addLog,
            (status) => setConnectionStatus(status)
        );
    }
  };

  const handleBackToSelection = () => {
    if (selectedInterpreter?.type === 'docker') {
        dockerClient.disconnect();
    }
    if (executorCleanupRef.current) {
        executorCleanupRef.current();
        executorCleanupRef.current = null;
    }
    
    setSelectedLanguage(null);
    setSelectedInterpreter(null);
    setLogs([]);
    setFiles([]);
    setMobileActiveTab('editor');
    setIsRunning(false);
    setHasVisualContent(false);
    setIsLiveMode(false);
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
      if (newWidth > 20 && newWidth < 80) setEditorWidth(newWidth);
    }
  }, [isDragging]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
      if (executorCleanupRef.current) {
          executorCleanupRef.current();
      }
    };
  }, [resize, stopResize]);

  const handleClearLogs = useCallback(() => setLogs([]), []);

  const getVisualRoot = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    return document.getElementById(isMobile ? 'visual-root-mobile' : 'visual-root-desktop');
  }, []);

  const handleRun = useCallback(async (isAutoRun = false) => {
    if (!selectedLanguage || !selectedInterpreter) return;

    if (window.innerWidth < 768 && !isAutoRun) {
       setMobileActiveTab('console');
    }

    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    if (executorCleanupRef.current) {
        executorCleanupRef.current();
        executorCleanupRef.current = null;
    }

    setIsRunning(true);
    handleClearLogs();
    setHasVisualContent(false);

    // Browser Execution (HTML/JS)
    if (selectedInterpreter.type === 'browser') {
        const rootEl = getVisualRoot();
        if (rootEl) {
            setHasVisualContent(true);
            if (window.innerWidth < 768 && !isAutoRun) setMobileActiveTab('preview');
            // Execute and store the cleanup function
            // Pass files to browser executor
            executorCleanupRef.current = executeUserCode(code, rootEl, addLog, 'html', undefined, (hasContent) => {
                setHasVisualContent(hasContent);
                if (hasContent && window.innerWidth < 768 && (!isAutoRun || mobileActiveTab === 'preview')) {
                    setMobileActiveTab('preview');
                }
            }, files);
        }
        setIsRunning(false);
        return;
    }

    // Docker Execution (with AI Fallback)
    if (selectedInterpreter.type === 'docker') {
        const isBackendConnected = connectionStatus.includes('Ready');

        if (isBackendConnected) {
            const libs = detectLibraries(code, selectedLanguage.id);
            let finalCode = code;
            let command = selectedInterpreter.entryCommand || '';

            if (selectedInterpreter.setupCode) {
                finalCode = selectedInterpreter.setupCode + '\n' + code;
            }

            if (libs.length > 0 && selectedInterpreter.installCommand) {
                if (!isAutoRun) addLog(LogType.SYSTEM, [`[System] Detected libraries: ${libs.join(', ')}`]);
                
                let installCmd = selectedInterpreter.installCommand;
                if (installCmd.includes('{libs}')) {
                    installCmd = installCmd.replace('{libs}', libs.join(' '));
                } else {
                    installCmd = `${installCmd} ${libs.join(' ')}`;
                }
                
                command = `${installCmd} && ${command}`;
            }

            // Pass files to docker client
            dockerClient.runCode(finalCode, selectedInterpreter.extension || 'txt', command, files);
            setTimeout(() => setIsRunning(false), 1000);
        } else {
            // AI Runtime Fallback
            if (!isAutoRun) addLog(LogType.SYSTEM, [`[Nexus] Backend unavailable. Switching to AI Runtime (Simulation)...`]);
            
            try {
                await executeWithAI(
                    code,
                    selectedLanguage.name,
                    selectedInterpreter,
                    addLog,
                    (htmlContent) => {
                        setHasVisualContent(true);
                        if (window.innerWidth < 768 && !isAutoRun) setMobileActiveTab('preview');
                        const rootEl = getVisualRoot();
                        if (rootEl) {
                             const cleanup = executeUserCode(htmlContent, rootEl, addLog, 'html', undefined, undefined, files);
                             executorCleanupRef.current = cleanup;
                        }
                    },
                    abortControllerRef.current?.signal
                );
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    addLog(LogType.ERROR, [`Execution Error: ${error.message}`]);
                }
            } finally {
                setIsRunning(false);
            }
        }
    }

  }, [code, addLog, handleClearLogs, selectedLanguage, selectedInterpreter, getVisualRoot, connectionStatus, mobileActiveTab, files]);

  // Live Run Effect
  useEffect(() => {
    if (!isLiveMode) return;
    const debounceMs = selectedInterpreter?.type === 'browser' ? 800 : 2500;
    const timer = setTimeout(() => {
        if (code.trim()) {
            handleRun(true);
        }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [code, isLiveMode, handleRun, selectedInterpreter]);

  const handleReset = () => {
    if (selectedLanguage && window.confirm("Reset code to default example?")) {
      setCode(LANGUAGE_TEMPLATES[selectedLanguage.id] || '');
      handleClearLogs();
      const rootEl = getVisualRoot();
      if (rootEl) rootEl.innerHTML = '';
      setHasVisualContent(false);
      setMobileActiveTab('editor');
    }
  };

  const handleCodeGenerated = (newCode: string) => {
    setCode(newCode);
    setTimeout(() => {
       if (window.innerWidth < 768) setMobileActiveTab('editor');
    }, 100);
  };
  
  const handleFileUpload = useCallback(async (fileList: FileList) => {
    const newFiles: VirtualFile[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        try {
            const buffer = await file.arrayBuffer();
            const binary = new Uint8Array(buffer);
            let binaryString = '';
            for (let j = 0; j < binary.byteLength; j++) {
                binaryString += String.fromCharCode(binary[j]);
            }
            const base64 = btoa(binaryString);
            
            newFiles.push({
                id: Math.random().toString(36).substr(2, 9),
                name: file.name,
                content: base64,
                size: file.size,
                type: file.type || 'application/octet-stream',
                lastModified: file.lastModified
            });
        } catch (e) {
            console.error("Upload failed", e);
            addLog(LogType.ERROR, [`Failed to upload ${file.name}`]);
        }
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    addLog(LogType.SYSTEM, [`Uploaded ${newFiles.length} file(s).`]);
  }, [addLog]);

  const handleFileDelete = useCallback((id: string) => {
     setFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
            e.preventDefault();
            setIsCommandPaletteOpen(v => !v);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
             e.preventDefault();
             handleRun();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
             e.preventDefault();
             setIsFileExplorerOpen(v => !v);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  const commands: CommandType[] = [
    { id: 'run', name: 'Run Code', onSelect: () => handleRun(), icon: <Play size={16}/>, section: 'Actions', shortcut:['⌘', 'Enter'] },
    { id: 'live', name: 'Toggle Live Mode', onSelect: () => setIsLiveMode(v => !v), icon: <Zap size={16}/>, section: 'Actions' },
    { id: 'ai', name: 'AI Architect', onSelect: () => setIsAIModalOpen(true), icon: <Sparkles size={16}/>, section: 'Actions' },
    { id: 'files', name: 'Toggle Files', onSelect: () => setIsFileExplorerOpen(v => !v), icon: <FolderOpen size={16}/>, section: 'Navigation', shortcut:['⌘', 'B'] },
    { id: 'reset', name: 'Reset Code', onSelect: handleReset, icon: <RotateCcw size={16}/>, section: 'Actions' },
    { id: 'clear', name: 'Clear Console', onSelect: handleClearLogs, icon: <Terminal size={16}/>, section: 'Actions' },
    { id: 'settings', name: 'Connection Settings', onSelect: () => setIsSettingsOpen(true), icon: <Settings2 size={16}/>, section: 'General' },
    { id: 'lang', name: 'Change Language', onSelect: handleBackToSelection, icon: <ArrowLeft size={16}/>, section: 'Navigation' },
    { id: 'theme', name: 'Toggle Theme', onSelect: toggleTheme, icon: theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>, section: 'General' },
  ];

  if (!selectedLanguage || !selectedInterpreter) {
    return (
      <>
        <div className="fixed top-4 right-4 z-[110] flex gap-2">
            <button onClick={toggleTheme} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white/50 dark:bg-black/50 backdrop-blur rounded-full transition-colors">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-white/50 dark:bg-black/50 backdrop-blur rounded-full transition-colors"><Settings2 size={20} /></button>
        </div>
        <LanguageSelector onSelect={handleLanguageSelect} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col text-gray-900 dark:text-white font-sans overflow-hidden bg-white dark:bg-[#0A0A0A] selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-white">
      <AIAssistant isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} onCodeGenerated={handleCodeGenerated} />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={commands} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <header className="shrink-0 h-14 md:h-12 border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl flex items-center justify-between px-3 sm:px-4 z-50 transition-colors">
        <div className="flex items-center gap-2">
          <button onClick={handleBackToSelection} className="p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors" title="Change Language"><ArrowLeft size={18} /></button>
          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1"></div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white/90 leading-tight">{selectedLanguage.name}</h1>
            <span className="text-[10px] text-gray-500 dark:text-white/40 font-mono hidden sm:inline-block leading-tight">{selectedInterpreter.name}</span>
          </div>
        </div>

         <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
             selectedInterpreter.type === 'docker' 
                ? (connectionStatus.includes('Ready') 
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' 
                    : 'bg-purple-50 dark:bg-purple-500/10 border-purple-100 dark:border-purple-500/20') 
                : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20'
         }`}>
            {selectedInterpreter.type === 'docker' 
                ? (connectionStatus.includes('Ready') ? <Container size={12} className="text-emerald-500" /> : <Sparkles size={12} className="text-purple-500" />) 
                : <Monitor size={12} className="text-indigo-500" />
            }
            <span className={`text-[10px] font-mono ${
                selectedInterpreter.type === 'docker' 
                    ? (connectionStatus.includes('Ready') ? connectionStatus : 'AI Runtime') 
                    : 'text-indigo-700 dark:text-indigo-300'
            }`}>
               {selectedInterpreter.type === 'docker' 
                   ? (connectionStatus.includes('Ready') ? connectionStatus : 'AI Runtime') 
                   : 'Browser Runtime'}
            </span>
         </div>

        <div className="flex items-center gap-2">
          <button 
             onClick={() => setIsLiveMode(!isLiveMode)}
             className={`flex items-center gap-1.5 px-3 py-1.5 md:py-1 rounded-md text-xs font-medium transition-all border ${
                 isLiveMode 
                     ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30' 
                     : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
             }`}
             title="Toggle Live Execution"
          >
             {isLiveMode ? <Radio size={14} className="animate-pulse" /> : <Zap size={14} />}
             <span className="hidden md:inline">{isLiveMode ? 'Live' : 'Live'}</span>
          </button>

          <button onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)} className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md border text-xs font-medium transition-all ${isFileExplorerOpen ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}>
             <FolderOpen size={14} />
             <span className="hidden lg:inline">Files</span>
          </button>

          <button onClick={() => setIsCommandPaletteOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 md:py-1 rounded-md bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-300 transition-all">
             <Menu size={16} className="md:w-3 md:h-3" />
             <span className="hidden md:inline">Commands</span>
             <kbd className="hidden md:inline-flex items-center justify-center text-[9px] h-4 min-w-[16px] px-1 rounded bg-white dark:bg-black/50 border border-gray-300 dark:border-white/20">⌘P</kbd>
          </button>
          
          <button onClick={() => handleRun()} disabled={isRunning} className={`flex items-center gap-2 px-4 py-2 md:py-1.5 rounded-md font-semibold text-xs transition-all shadow-lg min-w-[80px] sm:min-w-[90px] justify-center ${isRunning ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 shadow-indigo-500/20'}`}>
             {isRunning ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"/> : <Play size={14} fill="currentColor" className="md:w-3 md:h-3" />}
             <span>Run</span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative w-full min-h-0 overflow-hidden" ref={containerRef}>
        <div className="md:hidden w-full h-full relative flex flex-col min-h-0">
          <div className={`absolute inset-0 z-10 bg-white dark:bg-black transition-opacity duration-200 flex flex-col ${mobileActiveTab === 'editor' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <CodeEditor code={code} onChange={setCode} language={selectedLanguage} />
          </div>
          <div className={`absolute inset-0 z-10 transition-opacity duration-200 flex flex-col ${mobileActiveTab !== 'editor' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             <OutputPanel logs={logs} onClearLogs={handleClearLogs} visualRootId="visual-root-mobile" mobileView={mobileActiveTab === 'console' ? 'console' : 'preview'} hasVisualContentOverride={hasVisualContent} />
          </div>
        </div>
        <div className="hidden md:flex w-full h-full">
           <FileExplorer 
              files={files} 
              onUpload={handleFileUpload} 
              onDelete={handleFileDelete}
              isOpen={isFileExplorerOpen}
              onToggle={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
           />
           
           <div style={{ width: `${editorWidth}%` }} className="h-full flex flex-col relative group z-10 border-l border-gray-200 dark:border-white/5">
                <CodeEditor code={code} onChange={setCode} language={selectedLanguage} />
                {isLiveMode && (
                    <div className="absolute top-2 right-4 pointer-events-none z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Live</span>
                    </div>
                )}
           </div>
           
           <div 
             className="w-1 bg-gray-100 dark:bg-black border-l border-r border-gray-200 dark:border-white/5 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 cursor-col-resize relative z-20 transition-colors group flex flex-col justify-center items-center" 
             onMouseDown={startResize}
           >
              <div className="absolute inset-y-0 -left-2 -right-2 z-30" />
              <div className="h-8 w-1 bg-gray-300 dark:bg-white/20 rounded-full group-hover:bg-indigo-500 dark:group-hover:bg-indigo-400 transition-colors" />
           </div>

           <div className="flex-1 min-w-0 bg-gray-50 dark:bg-[#030304]"><OutputPanel logs={logs} onClearLogs={handleClearLogs} visualRootId="visual-root-desktop" hasVisualContentOverride={hasVisualContent} /></div>
        </div>
      </main>

      <nav className="shrink-0 md:hidden h-[60px] bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 grid grid-cols-4 items-center z-50 pb-[env(safe-area-inset-bottom)] px-2 gap-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none">
         <button onClick={() => setMobileActiveTab('editor')} className={`flex flex-col items-center justify-center gap-1 h-full rounded-lg transition-colors active:scale-95 duration-150 ${mobileActiveTab === 'editor' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            <Code2 size={20} className="stroke-[1.5]" />
            <span className="text-[10px] font-medium">Code</span>
         </button>
         <button onClick={() => setMobileActiveTab('preview')} className={`flex flex-col items-center justify-center gap-1 h-full rounded-lg transition-colors active:scale-95 duration-150 ${mobileActiveTab === 'preview' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            <Monitor size={20} className="stroke-[1.5]" />
            <span className="text-[10px] font-medium">Preview</span>
         </button>
         <button onClick={() => setMobileActiveTab('console')} className={`relative flex flex-col items-center justify-center gap-1 h-full rounded-lg transition-colors active:scale-95 duration-150 ${mobileActiveTab === 'console' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            <Terminal size={20} className="stroke-[1.5]" />
            <span className="text-[10px] font-medium">Console</span>
            {logs.length > 0 && <span className="absolute top-2 right-6 md:right-4 w-2 h-2 bg-indigo-500 rounded-full animate-pulse border border-white dark:border-black"></span>}
         </button>
         <button onClick={() => setIsAIModalOpen(true)} className="flex flex-col items-center justify-center gap-1 h-full rounded-lg text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors active:scale-95 duration-150">
            <Sparkles size={20} className="stroke-[1.5]" />
            <span className="text-[10px] font-medium">AI</span>
         </button>
      </nav>

      <footer className="shrink-0 hidden md:flex h-7 bg-white dark:bg-[#050505] border-t border-gray-200 dark:border-white/10 px-3 items-center justify-between text-[10px] text-gray-500 select-none z-40 transition-colors">
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'}`}></div><span className="text-gray-500 dark:text-gray-400">{isRunning ? 'Executing...' : 'Ready'}</span></div>
           {isLiveMode && <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div><span className="text-red-500 font-medium">Live Mode Active</span></div>}
           <div className="h-3 w-px bg-gray-200 dark:bg-white/10"></div>
           <div className="flex items-center gap-1">
             <span className="text-gray-400">Files:</span>
             <span className="font-mono text-gray-600 dark:text-gray-300">{files.length}</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsCommandPaletteOpen(true)} className="text-gray-400 dark:text-gray-600 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">Press <kbd className="inline-flex items-center justify-center text-[9px] h-4 min-w-[16px] px-1 rounded bg-gray-200 dark:bg-black/50 border border-gray-300 dark:border-white/20 mx-0.5">⌘P</kbd> for commands</button>
        </div>
      </footer>
    </div>
  );
};

export default App;