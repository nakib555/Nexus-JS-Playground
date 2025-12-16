
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Play, RotateCcw, Sparkles, Settings2, Sun, Moon, ArrowLeft, 
  Menu, Container, Server, Zap, Radio, FolderOpen, PanelBottom,
  PanelRight, PanelLeft, X, Command, MoreHorizontal, Maximize2, Minimize2
} from 'lucide-react';

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

// Theme Type
type Theme = 'dark' | 'light';

const App: React.FC = () => {
  // --- Core State ---
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [selectedInterpreter, setSelectedInterpreter] = useState<Interpreter | null>(null);
  const [code, setCode] = useState<string>('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [files, setFiles] = useState<VirtualFile[]>([]);
  
  // --- Layout State ---
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isOutputOpen, setIsOutputOpen] = useState(true);
  const [outputSize, setOutputSize] = useState(40); // Percentage: Height on Mobile, Width on Desktop
  const [sidebarWidth, setSidebarWidth] = useState(240); // Pixel width for sidebar
  
  // --- UI State ---
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'dark'; // Default to dark
    }
    return 'dark';
  });
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [hasVisualContent, setHasVisualContent] = useState(false);

  // --- Modals ---
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Refs ---
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const executorCleanupRef = useRef<(() => void) | null>(null);
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResizingRef = useRef(false);

  // --- Initialization & Effects ---
  useEffect(() => {
    // Initial responsive setup
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsFileExplorerOpen(false); // Closed by default on mobile
        setOutputSize(40); // 40% height on mobile
      } else {
        setIsFileExplorerOpen(true);
        setOutputSize(40); // 40% width on desktop
      }
    };
    
    handleResize(); // Run once
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('nexus-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // --- Resize Logic ---
  const startResize = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = window.innerWidth < 768 ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
    
    const onMove = (mv: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;
      
      const clientX = 'touches' in mv ? mv.touches[0].clientX : (mv as MouseEvent).clientX;
      const clientY = 'touches' in mv ? mv.touches[0].clientY : (mv as MouseEvent).clientY;
      const rect = containerRef.current.getBoundingClientRect();
      const isMobile = window.innerWidth < 768;

      let newSize;
      if (isMobile) {
        // Vertical Resize (Bottom Panel Height)
        const height = rect.height;
        const relativeY = clientY - rect.top;
        newSize = ((height - relativeY) / height) * 100;
      } else {
        // Horizontal Resize (Right Panel Width)
        const width = rect.width;
        const relativeX = clientX - rect.left;
        newSize = ((width - relativeX) / width) * 100;
      }

      // Clamping
      if (newSize < 10) newSize = 10;
      if (newSize > 85) newSize = 85;
      
      setOutputSize(newSize);
    };

    const onUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }, []);

  // --- Logs & Execution ---
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
    setFiles([]);
    // Auto-open output on mobile/desktop reset
    setIsOutputOpen(true);
  };

  const establishConnection = useCallback((lang: Language, interpreter: Interpreter) => {
    if (interpreter.type === 'docker' && interpreter.dockerImage) {
        setConnectionStatus('Connecting...');
        dockerClient.connect(
            lang.id,
            interpreter.dockerImage,
            addLog,
            (status) => setConnectionStatus(status),
            () => setIsRunning(false)
        );
    }
  }, [addLog]);

  const handleRun = useCallback(async (isAutoRun = false) => {
    if (!selectedLanguage || !selectedInterpreter) return;
    
    // Ensure output is open to see results
    if (!isOutputOpen) setIsOutputOpen(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    
    if (executorCleanupRef.current) {
        executorCleanupRef.current();
        executorCleanupRef.current = null;
    }

    // Don't clear logs on auto-run (live mode) to preserve context
    if (!isAutoRun) handleClearLogs();
    
    // Browser Mode
    if (selectedInterpreter.type === 'browser') {
        setIsRunning(true);
        setHasVisualContent(true);
        const rootEl = document.getElementById('visual-root');
        if (rootEl) {
            executorCleanupRef.current = executeUserCode(code, rootEl, addLog, 'html', undefined, (hasContent) => {
                setHasVisualContent(hasContent);
            }, files);
        }
        setIsRunning(false);
        return;
    }

    // Docker/Server Mode
    if (selectedInterpreter.type === 'docker') {
        if (connectionStatus === 'Disconnected' || connectionStatus === 'Connection Failed') {
             addLog(LogType.SYSTEM, ['[System] Connecting to runtime environment...']);
             setIsRunning(true); // Show loading state
             establishConnection(selectedLanguage, selectedInterpreter);
             // Stop execution here until connected
             return;
        }

        if (connectionStatus === 'Connecting...') {
             addLog(LogType.WARN, ['[System] Still connecting to runtime... Please wait.']);
             return;
        }

        setIsRunning(true);
        setHasVisualContent(false);

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

        dockerClient.runCode(finalCode, selectedInterpreter.extension || 'txt', command, files);
    }
  }, [code, addLog, selectedLanguage, selectedInterpreter, connectionStatus, files, isOutputOpen, establishConnection]);

  // Live Mode Effect
  useEffect(() => {
    if (!isLiveMode) return;
    const debounceMs = selectedInterpreter?.type === 'browser' ? 800 : 2500;
    const timer = setTimeout(() => {
        if (code.trim()) handleRun(true);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [code, isLiveMode, handleRun, selectedInterpreter]);

  const handleClearLogs = () => setLogs([]);
  
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
        } catch (e) { console.error("Upload failed", e); }
    }
    setFiles(prev => [...prev, ...newFiles]);
    addLog(LogType.SYSTEM, [`Uploaded ${newFiles.length} file(s).`]);
  }, [addLog]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
            e.preventDefault(); setIsCommandPaletteOpen(v => !v);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
             e.preventDefault(); handleRun();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
             e.preventDefault(); setIsFileExplorerOpen(v => !v);
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
             e.preventDefault(); setIsOutputOpen(v => !v);
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
    { id: 'output', name: 'Toggle Output', onSelect: () => setIsOutputOpen(v => !v), icon: <PanelBottom size={16}/>, section: 'Navigation', shortcut:['⌘', 'J'] },
    { id: 'reset', name: 'Reset Code', onSelect: () => { if(confirm('Reset?')) setCode(LANGUAGE_TEMPLATES[selectedLanguage!.id] || ''); }, icon: <RotateCcw size={16}/>, section: 'Actions' },
    { id: 'clear', name: 'Clear Console', onSelect: handleClearLogs, icon: <Command size={16}/>, section: 'Actions' },
    { id: 'settings', name: 'Settings', onSelect: () => setIsSettingsOpen(true), icon: <Settings2 size={16}/>, section: 'General' },
    { id: 'lang', name: 'Switch Language', onSelect: () => { setSelectedLanguage(null); setIsRunning(false); }, icon: <ArrowLeft size={16}/>, section: 'Navigation' },
    { id: 'theme', name: 'Toggle Theme', onSelect: toggleTheme, icon: theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>, section: 'General' },
  ];

  // --- No Language Selected View ---
  if (!selectedLanguage || !selectedInterpreter) {
    return (
      <>
        <LanguageSelector onSelect={handleLanguageSelect} />
        <div className="fixed top-4 right-4 z-[110] flex gap-2">
            <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-white bg-black/50 backdrop-blur rounded-full transition-colors">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white bg-black/50 backdrop-blur rounded-full transition-colors"><Settings2 size={20} /></button>
        </div>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </>
    );
  }

  // --- Main App Render ---
  return (
    <div className="h-full w-full flex flex-col bg-[#09090b] text-slate-300 font-sans overflow-hidden relative">
      <AIAssistant isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} onCodeGenerated={setCode} />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} commands={commands} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* --- Header --- */}
      <header className="h-14 shrink-0 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedLanguage(null); setIsRunning(false); }} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 transition-colors">
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight">{selectedLanguage.name}</span>
              <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400 border border-white/5">{selectedInterpreter.version}</span>
            </div>
            <span className={`text-[10px] flex items-center gap-1.5 ${connectionStatus.includes('Ready') ? 'text-emerald-400' : 'text-slate-500'}`}>
               <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus.includes('Ready') ? 'bg-emerald-500' : 'bg-slate-600'}`} />
               {selectedInterpreter.type === 'browser' ? 'Browser Runtime' : connectionStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Desktop Controls */}
           <div className="hidden md:flex items-center bg-white/5 rounded-lg p-0.5 border border-white/5 mr-2">
              <button onClick={() => setIsLiveMode(!isLiveMode)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isLiveMode ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:text-white'}`}>
                  {isLiveMode ? <Radio size={14} className="animate-pulse"/> : <Zap size={14}/>}
                  <span>Live</span>
              </button>
           </div>

           <button onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)} className={`p-2 rounded-lg transition-colors ${isFileExplorerOpen ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'}`}>
              <FolderOpen size={18} />
           </button>

           <button onClick={() => setIsCommandPaletteOpen(true)} className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-400 border border-white/5 transition-colors">
              <Command size={14} />
              <span>Cmd+P</span>
           </button>

           <button onClick={() => setIsAIModalOpen(true)} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
              <Sparkles size={18} />
           </button>

           <div className="h-6 w-px bg-white/10 mx-1"></div>

           <button 
             onClick={() => handleRun()} 
             disabled={isRunning}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all ${isRunning ? 'bg-indigo-500/50 cursor-not-allowed text-white/50' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
           >
             {isRunning ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Play size={14} fill="currentColor" />}
             <span className="hidden sm:inline">Run</span>
           </button>

           <button onClick={() => setIsSettingsOpen(true)} className="md:hidden p-2 text-slate-400">
             <MoreHorizontal size={20} />
           </button>
        </div>
      </header>

      {/* --- Unified Workspace --- */}
      <div className="flex-1 flex min-h-0 relative" ref={containerRef}>
        
        {/* Sidebar (Drawer on Mobile) */}
        <div className={`
           absolute md:static inset-y-0 left-0 z-30 bg-[#09090b] md:bg-transparent border-r border-white/5 transition-all duration-300 ease-in-out
           ${isFileExplorerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden'}
           ${isFileExplorerOpen ? 'md:w-64' : ''}
        `}>
           <FileExplorer 
              files={files} 
              onUpload={handleFileUpload} 
              onDelete={id => setFiles(prev => prev.filter(f => f.id !== id))}
              isOpen={isFileExplorerOpen}
              onToggle={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
              isMobile={window.innerWidth < 768}
           />
        </div>
        
        {/* Backdrop for Mobile Sidebar */}
        {isFileExplorerOpen && (
           <div className="md:hidden absolute inset-0 bg-black/50 backdrop-blur-sm z-20" onClick={() => setIsFileExplorerOpen(false)} />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row min-w-0 relative">
           
           {/* Editor Area */}
           <div className="flex-1 relative flex flex-col min-h-0 min-w-0 bg-[#0c0c0e]">
              <CodeEditor 
                 code={code} 
                 onChange={setCode} 
                 language={selectedLanguage} 
              />
              {/* Mobile "Open Output" Hint if collapsed */}
              {!isOutputOpen && (
                <button 
                  onClick={() => setIsOutputOpen(true)}
                  className="md:hidden absolute bottom-4 right-4 z-10 bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-500/30 animate-in zoom-in"
                >
                  <PanelBottom size={20} />
                </button>
              )}
           </div>

           {/* Resize Handle (Responsive) */}
           {isOutputOpen && (
             <div 
               className={`
                 z-20 flex items-center justify-center hover:bg-indigo-500 transition-colors group
                 ${window.innerWidth < 768 
                    ? 'h-1.5 w-full cursor-row-resize bg-[#121214] border-t border-b border-white/5' 
                    : 'w-1.5 h-full cursor-col-resize bg-[#09090b] border-l border-r border-white/5'
                 }
               `}
               onMouseDown={startResize}
               onTouchStart={startResize}
             >
                <div className={`rounded-full bg-slate-600 group-hover:bg-white ${window.innerWidth < 768 ? 'w-8 h-1' : 'w-1 h-8'}`} />
             </div>
           )}

           {/* Output Panel Area */}
           {isOutputOpen && (
             <div 
               className="bg-[#121214] flex flex-col relative z-10 shadow-2xl md:shadow-none"
               style={{ 
                 [window.innerWidth < 768 ? 'height' : 'width']: `${outputSize}%`
               }}
             >
                <div className="absolute top-0 right-0 p-2 z-20 flex gap-2">
                   <button onClick={() => setOutputSize(window.innerWidth < 768 ? 80 : 60)} className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10" title="Expand">
                      <Maximize2 size={14} />
                   </button>
                   <button onClick={() => setIsOutputOpen(false)} className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-white/10" title="Close">
                      <X size={14} />
                   </button>
                </div>
                <OutputPanel 
                   logs={logs} 
                   onClearLogs={handleClearLogs} 
                   visualRootId="visual-root"
                   hasVisualContentOverride={hasVisualContent} 
                />
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default App;
