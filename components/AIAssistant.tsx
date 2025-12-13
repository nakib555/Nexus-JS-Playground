import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, X, Loader2, Bot, ArrowRight } from 'lucide-react';

interface AIAssistantProps {
  onCodeGenerated: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onCodeGenerated, isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are an elite Creative JavaScript Developer.
Your goal is to write robust, self-contained, high-performance JavaScript code.

Constraints & Environment:
1. You have access to a global HTML element variable named 'root'. Attach visual elements to 'root'.
2. You have access to a powerful 'console' object.
3. Do NOT use 'import' or 'require'. Use purely vanilla JS APIs.
4. If creating animations, use requestAnimationFrame.
5. The output must be ONLY valid JavaScript code. Do not wrap in markdown code blocks.
6. Reset 'root.innerHTML = ""' at the start of your code.
7. You can use modern ES6+ syntax.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate code for: "${prompt}"`,
        config: { systemInstruction },
      });

      let generatedCode = response.text || '';
      generatedCode = generatedCode.replace(/^```javascript/, '').replace(/^```js/, '').replace(/^```/, '').replace(/```$/, '').trim();
      
      onCodeGenerated(generatedCode);
      onClose();
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate code.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#09090b] sm:rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-2 rounded-lg border border-indigo-100 dark:border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">AI Architect</h2>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Gemini 2.5 Flash</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="relative group">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build (e.g., 'A particle system with gravity', 'Interactive data visualization')..."
              className="w-full h-40 bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none placeholder:text-gray-400 dark:placeholder:text-gray-700 font-mono transition-all"
              disabled={loading}
            />
            <div className="absolute bottom-4 right-4 text-[10px] text-gray-400 dark:text-gray-600 bg-white dark:bg-black px-2 py-1 rounded border border-gray-200 dark:border-white/5 hidden sm:block pointer-events-none">
              Shift + Enter for new line
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-300 text-xs p-3 rounded-lg flex items-center gap-2">
              <Bot className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3 bg-gray-50/[0.5] dark:bg-white/[0.02]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg
              ${loading || !prompt.trim()
                ? 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Designing...</span>
              </>
            ) : (
              <>
                <span>Generate Code</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}