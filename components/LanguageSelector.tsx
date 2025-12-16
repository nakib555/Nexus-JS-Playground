
import React, { useState } from 'react';
import { LANGUAGES } from '../constants';
import { Language, Interpreter } from '../types';
import { 
  FileCode2, Globe, Hash, Coffee, Boxes, Cpu, Zap, Layers, Command, 
  FileJson, Terminal, Database, Sparkles, ChevronRight, Code2, Braces,
  Container, ArrowRight, Check
} from 'lucide-react';

interface LanguageSelectorProps {
  onSelect: (lang: Language, interpreter: Interpreter) => void;
}

const LANGUAGE_CONFIG: Record<string, { icon: React.ElementType, color: string, bg: string, description: string }> = {
  javascript: { icon: Braces, color: 'text-yellow-400', bg: 'bg-yellow-500/10', description: 'Universal JS Runtime' },
  typescript: { icon: FileCode2, color: 'text-blue-400', bg: 'bg-blue-500/10', description: 'Typed JavaScript' },
  html: { icon: Globe, color: 'text-orange-500', bg: 'bg-orange-500/10', description: 'Web Markup' },
  python: { icon: Hash, color: 'text-emerald-400', bg: 'bg-emerald-500/10', description: 'Data Science Ready' },
  java: { icon: Coffee, color: 'text-red-400', bg: 'bg-red-500/10', description: 'JVM Environment' },
  csharp: { icon: Boxes, color: 'text-purple-400', bg: 'bg-purple-500/10', description: '.NET Core' },
  cpp: { icon: Cpu, color: 'text-blue-500', bg: 'bg-blue-600/10', description: 'GCC C++20' },
  go: { icon: Zap, color: 'text-cyan-400', bg: 'bg-cyan-500/10', description: 'Golang Runtime' },
  rust: { icon: Layers, color: 'text-orange-600', bg: 'bg-orange-600/10', description: 'Cargo & Rustc' },
  ruby: { icon: Command, color: 'text-rose-500', bg: 'bg-rose-500/10', description: 'Ruby 3.2' },
  php: { icon: FileJson, color: 'text-indigo-400', bg: 'bg-indigo-500/10', description: 'PHP CLI' },
  sql: { icon: Database, color: 'text-sky-400', bg: 'bg-sky-500/10', description: 'SQL Playground' },
  bash: { icon: Terminal, color: 'text-slate-400', bg: 'bg-slate-500/10', description: 'Shell Script' },
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleCardClick = (lang: Language) => {
    // If multiple interpreters, toggle expand. Else select immediately.
    if (lang.interpreters.length > 1) {
      setExpandedId(expandedId === lang.id ? null : lang.id);
    } else {
      onSelect(lang, lang.interpreters[0]);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-white overflow-y-auto custom-scrollbar p-6 md:p-12 flex flex-col items-center">
      
      {/* Header */}
      <div className="text-center max-w-2xl mb-12 animate-slide-up">
        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-[#121214] border border-white/5 mb-6 shadow-2xl shadow-indigo-500/10">
           <Terminal className="w-10 h-10 text-indigo-500" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          Nexus Playground
        </h1>
        <p className="text-slate-400 text-lg">
          Select a runtime environment to begin. 
          <span className="block mt-1 text-sm text-slate-500">Powered by Docker containers & Smart AI assistance.</span>
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full max-w-7xl animate-in fade-in duration-700">
        {LANGUAGES.map((lang, idx) => {
          const config = LANGUAGE_CONFIG[lang.id] || { icon: Code2, color: 'text-slate-400', bg: 'bg-slate-500/10', description: 'Standard Runtime' };
          const Icon = config.icon;
          const isExpanded = expandedId === lang.id;
          const hasMultiple = lang.interpreters.length > 1;
          
          return (
            <div
              key={lang.id}
              className={`
                group relative flex flex-col rounded-2xl bg-[#121214] border transition-all duration-300 overflow-hidden
                ${isExpanded ? 'border-indigo-500/50 ring-1 ring-indigo-500/20 z-10 row-span-2' : 'border-white/5 hover:border-white/10 hover:bg-[#18181b]'}
              `}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Main Card Content */}
              <div 
                className="p-5 flex flex-col h-full cursor-pointer"
                onClick={() => handleCardClick(lang)}
              >
                {/* Top Row */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${config.bg} border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  
                  {hasMultiple ? (
                     <div className={`p-1.5 rounded-full bg-white/5 transition-transform duration-300 ${isExpanded ? 'rotate-90 bg-indigo-500/20 text-indigo-400' : 'text-slate-500'}`}>
                        <ChevronRight size={14} />
                     </div>
                  ) : (
                     <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-slate-500">
                        <ArrowRight size={16} />
                     </div>
                  )}
                </div>

                {/* Text */}
                <h3 className="text-lg font-bold text-slate-200 mb-1 group-hover:text-white transition-colors">{lang.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{config.description}</p>

                {/* Default Tag / Footer */}
                {!isExpanded && (
                  <div className="mt-auto flex gap-2">
                    <span className="text-[10px] font-medium px-2 py-1 rounded bg-black/40 text-slate-400 border border-white/5 flex items-center gap-1.5">
                      {hasMultiple ? <Container size={10} /> : null}
                      {lang.interpreters[0].version}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <Sparkles size={8} /> Smart
                    </span>
                  </div>
                )}
              </div>

              {/* Expanded Selection Area */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-0 space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="h-px bg-white/5 w-full mb-3" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Select Image Version</p>
                  
                  {lang.interpreters.map((interpreter) => (
                    <button
                      key={interpreter.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(lang, interpreter);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg bg-black/20 hover:bg-white/5 border border-white/5 hover:border-white/10 transition-all group/item text-left"
                    >
                      <div className="flex flex-col">
                         <span className="text-xs font-semibold text-slate-300 group-hover/item:text-white flex items-center gap-2">
                            {interpreter.name}
                            {interpreter.id === lang.interpreters[0].id && (
                                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">Default</span>
                            )}
                         </span>
                         <span className="text-[10px] text-slate-500 group-hover/item:text-slate-400">{interpreter.description}</span>
                      </div>
                      <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                         <ArrowRight size={14} className="text-slate-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
