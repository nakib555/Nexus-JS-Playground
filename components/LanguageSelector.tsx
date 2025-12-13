import React, { useState } from 'react';
import { LANGUAGES } from '../constants';
import { Language, Interpreter } from '../types';
import { FileCode2, Cloud, Monitor, ChevronRight, Terminal, ArrowLeft, PlayCircle, Code } from 'lucide-react';

interface LanguageSelectorProps {
  onSelect: (lang: Language, interpreter: Interpreter) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelect }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedLang, setSelectedLang] = useState<Language | null>(null);

  const handleLangClick = (lang: Language) => {
    setSelectedLang(lang);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedLang(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-[#030712] transition-colors overflow-y-auto">
      <div className="min-h-screen w-full flex flex-col items-center py-12 px-4">
        
        {/* Header Section */}
        <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-2 ring-1 ring-white/20">
              <Terminal className="w-8 h-8 text-white" />
           </div>
           <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight">
             {step === 1 ? 'Select Language' : 'Select Interpreter'}
           </h1>
           <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto text-base">
             {step === 1 
                ? 'Choose from our diverse collection of programming environments.'
                : `Choose the runtime environment for ${selectedLang?.name}.`}
           </p>
        </div>

        {/* Step 1: Language Grid */}
        {step === 1 && (
          <div className="w-full max-w-6xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {LANGUAGES.map((lang, index) => (
                <button
                  key={lang.id}
                  onClick={() => handleLangClick(lang)}
                  className="group relative flex flex-col items-start p-5 rounded-2xl bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/5 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 text-left"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">
                    <ChevronRight className="w-4 h-4" />
                  </div>

                  <div className="p-2.5 rounded-xl mb-4 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 group-hover:text-white group-hover:bg-indigo-500 transition-colors">
                     <Code className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                    {lang.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-auto pt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5">
                      {lang.interpreters.length} Options
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Interpreter List */}
        {step === 2 && selectedLang && (
          <div className="w-full max-w-2xl animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="mb-8 flex items-center justify-start">
                <button 
                  onClick={handleBack}
                  className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors pl-2 pr-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Back to Languages</span>
                </button>
             </div>

             <div className="space-y-4">
               {selectedLang.interpreters.map((interp) => {
                 const isBrowser = interp.type === 'browser';
                 return (
                  <button
                    key={interp.id}
                    onClick={() => onSelect(selectedLang, interp)}
                    className="w-full group flex items-center gap-5 p-5 rounded-2xl bg-white dark:bg-[#09090b] border border-gray-200 dark:border-white/5 hover:border-indigo-500 dark:hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 transition-all text-left shadow-sm hover:shadow-md"
                  >
                    <div className={`shrink-0 p-4 rounded-xl ${isBrowser ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                       {isBrowser ? <Monitor className="w-6 h-6" /> : <Cloud className="w-6 h-6" />}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="text-lg font-bold text-gray-900 dark:text-white">{interp.name}</h3>
                         <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 font-mono">v{interp.version}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                        {interp.description}
                      </p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500 translate-x-2 group-hover:translate-x-0 duration-300">
                      <PlayCircle className="w-6 h-6" />
                    </div>
                  </button>
                 );
               })}
             </div>
          </div>
        )}
        
        <div className="mt-auto pt-12 pb-4 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">
            Nexus Playground v3.1 · Powered by Gemini 2.5 Flash
          </p>
        </div>

      </div>
    </div>
  );
};