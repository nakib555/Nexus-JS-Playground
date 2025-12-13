import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Sparkles, X, Send, Loader2, Bot } from 'lucide-react';

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
      // Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const systemInstruction = `You are an elite Creative JavaScript Developer.
Your goal is to write robust, self-contained, high-performance JavaScript code.

Constraints & Environment:
1. You have access to a global HTML element variable named 'root'. Attach visual elements to 'root'.
2. You have access to a powerful 'console' object. You can log complex Objects, Arrays, and DOM Elements, and they will be interactively inspected by the user.
3. Do NOT use 'import' or 'require'. Use purely vanilla JS APIs.
4. If creating animations, use requestAnimationFrame.
5. The output must be ONLY valid JavaScript code. Do not wrap in markdown code blocks.
6. Reset 'root.innerHTML = ""' at the start of your code.
7. You can use modern ES6+ syntax.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate code for: "${prompt}"`,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      let generatedCode = response.text || '';
      
      // Clean up potential markdown formatting if the model disobeys
      generatedCode = generatedCode
        .replace(/^```javascript/, '')
        .replace(/^```js/, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();
      
      onCodeGenerated(generatedCode);
      onClose();
      setPrompt('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate code. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">AI Architect</h2>
              <p className="text-xs text-gray-400">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe what you want to build (e.g., 'A particle system', 'Recursive object demo', or 'Fetch JSON from API')..."
              className="w-full h-32 bg-gray-950 border border-gray-800 rounded-lg p-4 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none placeholder:text-gray-600 font-mono"
              disabled={loading}
            />
            <div className="absolute bottom-3 right-3 text-[10px] text-gray-600 bg-gray-900/80 px-2 py-1 rounded border border-gray-800">
              Shift + Enter for new line
            </div>
          </div>

          {error && (
            <div className="bg-red-950/20 border border-red-900/30 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
              <Bot className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-950 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all
              ${loading || !prompt.trim()
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
              }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 fill-current" />
                Generate Code
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}