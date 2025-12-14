import React, { useState, useEffect } from 'react';
import { X, Server, Save, RotateCcw } from 'lucide-react';
import { dockerClient } from '../utils/dockerClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [backendUrl, setBackendUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBackendUrl(dockerClient.getBackendUrl());
      setIsSaved(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    dockerClient.setBackendUrl(backendUrl);
    setIsSaved(true);
    setTimeout(() => {
        setIsSaved(false);
        onClose();
    }, 500);
  };

  const handleReset = () => {
    setBackendUrl('http://localhost:3001');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#111113] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-500" />
            Connection Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Execution Backend URL
            </label>
            <div className="relative group">
                <input 
                    type="text" 
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    placeholder="https://nexus-backend.onrender.com"
                    className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
            </div>
            <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
              This URL connects the frontend to the code execution engine. 
              If hosting separately (e.g., Cloudflare + Render), ensure this points to your active backend service.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] flex justify-between items-center">
          <button 
             onClick={handleReset}
             className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 flex items-center gap-1.5"
             title="Reset to localhost"
          >
             <RotateCcw className="w-3.5 h-3.5" />
             Reset
          </button>
          
          <div className="flex gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition-all ${isSaved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                {isSaved ? 'Saved!' : 'Save Connection'}
                {!isSaved && <Save className="w-4 h-4" />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};