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
    description: 'Universal JS Runtime. Supports ESNext & Node libs.' 
  },
  typescript: { 
    icon: FileCode2, 
    color: 'text-blue-500', 
    gradient: 'from-blue-500/20 to-cyan-500/20',
    description: 'Typed JavaScript. Full type-checking support.' 
  },
  html: { 
    icon: Globe, 
    color: 'text-orange-500', 
    gradient: 'from-orange-500/20 to-red-500/20',
    description: 'Web markup renderer with Tailwind CSS built-in.' 
  },
  python: { 
    icon: Hash, 
    color: 'text-emerald-500', 
    gradient: 'from-emerald-500/20 to-green-600/20',
    description: 'Data Science ready. Auto-installs NumPy, Pandas, etc.' 
  },
  java: { 
    icon: Coffee, 
    color: 'text-red-500', 
    gradient: 'from-red-500/20 to-orange-600/20',
    description: 'Enterprise Java 21 environment.' 
  },
  csharp: { 
    icon: Boxes, 
    color: 'text-violet-500', 
    gradient: 'from-violet-500/20 to-purple-600/20',
    description: 'Modern .NET execution environment.' 
  },
  cpp: { 
    icon: Cpu, 
    color: 'text-blue-600', 
    gradient: 'from-blue-600/20 to-indigo-700/20',
    description: 'C++20 GCC Runtime environment.' 
  },
  go: { 
    icon: Zap, 
    color: 'text-cyan-500', 
    gradient: 'from-cyan-500/20 to-blue-500/20',
    description: 'Go runtime with Go Modules support.' 
  },
  rust: { 
    icon: Layers, 
    color: 'text-orange-600', 
    gradient: 'from-orange-600/20 to-red-600/20',
    description: 'Memory-safe runtime with Cargo simulation.' 
  },
  ruby: { 
    icon: Command, 
    color: 'text-rose-500', 
    gradient: 'from-rose-500/20 to-red-600/20',
    description: 'Ruby 3.2 runtime with Gems support.' 
  },
  php: { 
    icon: FileJson, 
    color: 'text-indigo-400', 
    gradient: 'from-indigo-400/20 to-violet-500/20',
    description: 'PHP 8.2 CLI execution environment.' 
  },
  swift: { 
    icon: Command, 
    color: 'text-orange-400', 
    gradient: 'from-orange-400/20 to-yellow-500/20',
    description: 'Swift runtime for Apple platforms.' 
  },
  bash: { 
    icon: Terminal, 
    color: 'text-gray-400', 
    gradient: 'from-gray-400/20 to-gray-600/20',
    description: 'Bash Shell environment.' 
  },
  sql: { 
    icon: Database, 
    color: 'text-blue-400', 
    gradient: 'from-blue-400/20 to-cyan-500/20',
    description: 'SQL Database playground.' 
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
  const [hoveredLang, setHoveredLang] = useState<string | null>(null);

  const handleLangClick = (lang: Language) => {
    // Automatically select the first (and only) interpreter
    const interpreter = lang.interpreters[0];
    onSelect(lang, interpreter);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-[#030712] transition-colors overflow-y-auto selection:bg-indigo-500/30">
      <div className="min-h-screen w-full flex flex-col items-center py-8 px-4 md:py-16 md:px-6">
        
        {/* Header Section */}
        <div className="text-center mb-10 md:mb-16 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
           <div className="relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-[#1e1e2e] to-[#0f0f16] shadow-2xl shadow-black/50 mb-2 md:mb-4 ring-1 ring-white/10 group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Terminal className="w-8 h-8 md:w-10 md:h-10 text-white relative z-10" />
           </div>
           <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tighter">
             Choose Runtime
           </h1>
           <p className="text-gray-500 dark:text-gray-400 max-w-sm md:max-w-lg mx-auto text-base md:text-lg font-medium leading-relaxed">
             Select a language to initialize the smart runtime environment.
             <br className="hidden sm:block"/>
             <span className="text-sm opacity-75">Auto-installs libraries on code execution.</span>
           </p>
        </div>

        {/* Language Grid */}
        <div className="w-full max-w-7xl animate-in fade-in slide-in-from-bottom-12 duration-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
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
                  className="group relative flex flex-col items-start h-full p-5 md:p-6 rounded-3xl bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/5 hover:border-transparent dark:hover:border-transparent transition-all duration-300 text-left overflow-hidden shadow-sm hover:shadow-xl dark:shadow-none"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Hover Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  
                  {/* Active Border Gradient (simulated with shadow/inset) */}
                  <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-black/5 dark:ring-white/5 group-hover:ring-2 group-hover:ring-inset group-hover:ring-indigo-500/20 transition-all duration-300" />

                  <div className="relative z-10 w-full flex flex-col h-full">
                    <div className="flex items-start justify-between w-full mb-3 md:mb-4">
                      <div className={`p-3 md:p-3.5 rounded-2xl ${isHovered ? 'bg-white/90 dark:bg-black/40 shadow-sm' : 'bg-gray-50 dark:bg-white/5'} transition-all duration-300`}>
                          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${config.color}`} />
                      </div>
                      <div className={`opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 ${config.color}`}>
                          <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1.5 md:mb-2 tracking-tight">
                      {lang.name}
                    </h3>
                    
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4 md:mb-6 flex-1">
                      {config.description}
                    </p>

                    {/* Capabilities Badges */}
                    <div className="flex flex-wrap gap-2 mt-auto">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/5 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Smart Runtime</span>
                        </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="mt-auto pt-10 md:pt-20 pb-6 text-center opacity-60 hover:opacity-100 transition-opacity">
          <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-600 font-mono tracking-widest uppercase">
            Nexus Playground // Smart Runtime Environment
          </p>
        </div>

      </div>
    </div>
  );
};