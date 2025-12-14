import React, { useState } from 'react';
import { LANGUAGES } from '../constants';
import { Language, Interpreter } from '../types';
import { 
  FileCode2, Cloud, Monitor, ChevronRight, Terminal, ArrowLeft, 
  PlayCircle, Code2, Cpu, Globe, Database, Hash, 
  Braces, Coffee, FileJson, Layers, Command, Zap, Boxes, Sparkles
} from 'lucide-react';

interface LanguageSelectorProps {
  onSelect: (lang: Language, interpreter: Interpreter) => void;
}

const LANGUAGE_CONFIG: Record<string, { icon: React.ElementType, color: string, gradient: string, description: string }> = {
  javascript: { 
    icon: Braces, 
    color: 'text-yellow-400', 
    gradient: 'from-yellow-400/20 to-orange-500/20',
    description: 'The language of the web. V8 & Node.js environments.' 
  },
  typescript: { 
    icon: FileCode2, 
    color: 'text-blue-500', 
    gradient: 'from-blue-500/20 to-cyan-500/20',
    description: 'Typed JavaScript for scalable application development.' 
  },
  html: { 
    icon: Globe, 
    color: 'text-orange-500', 
    gradient: 'from-orange-500/20 to-red-500/20',
    description: 'Web markup and styling with real-time rendering.' 
  },
  python: { 
    icon: Hash, 
    color: 'text-emerald-500', 
    gradient: 'from-emerald-500/20 to-green-600/20',
    description: 'Powerful standard for Data Science and AI.' 
  },
  java: { 
    icon: Coffee, 
    color: 'text-red-500', 
    gradient: 'from-red-500/20 to-orange-600/20',
    description: 'Robust, object-oriented enterprise development.' 
  },
  csharp: { 
    icon: Boxes, 
    color: 'text-violet-500', 
    gradient: 'from-violet-500/20 to-purple-600/20',
    description: 'Modern, multi-paradigm coding on .NET.' 
  },
  cpp: { 
    icon: Cpu, 
    color: 'text-blue-600', 
    gradient: 'from-blue-600/20 to-indigo-700/20',
    description: 'High-performance system programming.' 
  },
  go: { 
    icon: Zap, 
    color: 'text-cyan-500', 
    gradient: 'from-cyan-500/20 to-blue-500/20',
    description: 'Simple, reliable, and efficient concurrency.' 
  },
  rust: { 
    icon: Layers, 
    color: 'text-orange-600', 
    gradient: 'from-orange-600/20 to-red-600/20',
    description: 'Memory-safe systems programming without garbage collection.' 
  },
  ruby: { 
    icon: Command, 
    color: 'text-rose-500', 
    gradient: 'from-rose-500/20 to-red-600/20',
    description: 'Focused on simplicity and productivity.' 
  },
  php: { 
    icon: FileJson, 
    color: 'text-indigo-400', 
    gradient: 'from-indigo-400/20 to-violet-500/20',
    description: 'Server-side scripting for web development.' 
  },
  swift: { 
    icon: Command, 
    color: 'text-orange-400', 
    gradient: 'from-orange-400/20 to-yellow-500/20',
    description: 'Intuitive programming for Apple platforms.' 
  },
  bash: { 
    icon: Terminal, 
    color: 'text-gray-400', 
    gradient: 'from-gray-400/20 to-gray-600/20',
    description: 'Command line interface scripting.' 
  },
  sql: { 
    icon: Database, 
    color: 'text-blue-400', 
    gradient: 'from-blue-400/20 to-cyan-500/20',
    description: 'Relational database management.' 
  },
};

// Default fallback
const DEFAULT_CONFIG = { 
  icon: Code2, 
  color: 'text-gray-500', 
  gradient: 'from-gray-500/20 to-gray-700/20',
  description: 'Standard programming environment.'
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  const handleLangClick = (lang: Language) => {
    setSelectedLang(lang);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedLang(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-[#030712] transition-colors overflow-y-auto selection:bg-indigo-500/30">
      <div className="min-h-screen w-full flex flex-col items-center py-16 px-6">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1e1e2e] to-[#0f0f16] shadow-2xl shadow-black/50 mb-4 ring-1 ring-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Terminal className="w-10 h-10 text-white relative z-10" />
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter">
             {step === 1 ? 'Choose Runtime' : 'Select Environment'}
           </h1>
           <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-lg font-medium leading-relaxed">
             {step === 1 
                ? 'Select a programming language to initialize your workspace.'
                : `Configure the execution environment for ${selectedLang?.name}.`}
           </p>
        </div>

        {/* Step 1: Language Grid */}
        {step === 1 && (
          <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-12 duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {LANGUAGES.map((lang, index) => {
                const config = LANGUAGE_CONFIG[lang.id] || DEFAULT_CONFIG;
                const Icon = config.icon;
                const isHovered = hoveredLang === lang.id;
                
                return (
                  <button
                    key={lang.id}
                    onClick={() => handleLangClick(lang)}
                    onMouseEnter={() => setHoveredLang(lang.id)}
                    onMouseLeave={() => setHoveredLang(null)}
                    className="group relative flex flex-col items-start h-full p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/5 hover:border-transparent dark:hover:border-transparent transition-all duration-300 text-left overflow-hidden"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Hover Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    {/* Active Border Gradient (simulated with shadow/inset) */}
                    <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/5 dark:ring-white/5 group-hover:ring-2 group-hover:ring-inset group-hover:ring-indigo-500/20 transition-all duration-300" />

                    <div className="relative z-10 w-full flex flex-col h-full">
                      <div className="flex items-start justify-between w-full mb-4">
                        <div className={`p-3.5 rounded-2xl ${isHovered ? 'bg-white/90 dark:bg-black/40 shadow-sm' : 'bg-gray-50 dark:bg-white/5'} transition-all duration-300`}>
                           <Icon className={`w-6 h-6 ${config.color}`} />
                        </div>
                        <div className={`opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 ${config.color}`}>
                           <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                        {lang.name}
                      </h3>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 flex-1">
                        {config.description}
                      </p>

                      {/* Capabilities Badges */}
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {lang.interpreters.some(i => i.type === 'browser') && (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                             <Monitor className="w-3 h-3 text-emerald-500" />
                             <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Browser</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Interpreter List (Enhanced) */}
        {step === 2 && selectedLang && (
          <div className="w-full max-w-3xl animate-in fade-in slide-in-from-right-12 duration-500">
             <div className="mb-8 flex items-center justify-start">
                <button 
                  onClick={handleBack}
                  className="group flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors pl-2 pr-5 py-2.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Select different language</span>
                </button>
             </div>

             <div className="space-y-4">
               {selectedLang.interpreters.map((interp, idx) => {
                 const isBrowser = interp.type === 'browser';
                 return (
                  <button
                    key={interp.id}
                    onClick={() => onSelect(selectedLang, interp)}
                    className="w-full group relative flex items-center gap-6 p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/5 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 text-left overflow-hidden"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                     {/* Selection Highlight */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />

                    <div className={`shrink-0 p-5 rounded-2xl ${isBrowser ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-blue-50 dark:bg-blue-500/10'} transition-transform group-hover:scale-110 duration-300`}>
                       {isBrowser 
                          ? <Monitor className={`w-8 h-8 ${isBrowser ? 'text-emerald-500' : 'text-blue-500'}`} /> 
                          : <Cloud className={`w-8 h-8 ${isBrowser ? 'text-emerald-500' : 'text-blue-500'}`} />
                       }
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white">{interp.name}</h3>
                         <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${isBrowser ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'}`}>
                           v{interp.version}
                         </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {interp.description}
                      </p>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-indigo-500 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <PlayCircle className="w-6 h-6 fill-current" />
                    </div>
                  </button>
                 );
               })}
             </div>
          </div>
        )}
        
        <div className="mt-auto pt-20 pb-6 text-center opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-mono tracking-widest uppercase">
            Nexus Playground // High-Performance Runtime
          </p>
        </div>

      </div>
    </div>
  );
};