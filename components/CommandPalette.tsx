import React, { useState, useEffect, useRef } from 'react';
import { Command } from '../types';
import { Search, CornerDownLeft } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const paletteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].onSelect();
            onClose();
          }
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, filteredCommands.length]);

  useEffect(() => {
    const selectedElement = paletteRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const renderSection = (sectionName: Command['section']) => {
    const sectionCommands = filteredCommands.filter(cmd => cmd.section === sectionName);
    if (sectionCommands.length === 0) return null;

    return (
      <div key={sectionName}>
        <h3 className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{sectionName}</h3>
        {sectionCommands.map(cmd => {
          const index = filteredCommands.indexOf(cmd);
          return (
            <div
              key={cmd.id}
              data-index={index}
              onClick={() => {
                cmd.onSelect();
                onClose();
              }}
              className={`flex items-center justify-between px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
                selectedIndex === index
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={selectedIndex === index ? 'text-white' : 'text-gray-400'}>{cmd.icon}</span>
                <span className="font-medium">{cmd.name}</span>
              </div>
              {cmd.shortcut && (
                <div className="flex items-center gap-1">
                  {cmd.shortcut.map(key => (
                    <kbd key={key} className={`text-xs font-sans px-1.5 py-0.5 rounded border ${selectedIndex === index ? 'bg-white/20 border-white/30' : 'bg-gray-100 dark:bg-white/10 border-gray-200 dark:border-white/20'}`}>{key}</kbd>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm pt-[15vh] sm:p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div
        ref={paletteRef}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-[#111113] rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col relative animate-in slide-in-from-top-10 sm:zoom-in-95 duration-300 overflow-hidden"
      >
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-white/5">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="w-full bg-transparent text-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none"
          />
        </div>

        <div className="max-h-[40vh] overflow-y-auto custom-scrollbar py-2">
            {filteredCommands.length > 0 ? (
              <>
                {renderSection('Actions')}
                {renderSection('Navigation')}
                {renderSection('General')}
              </>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    <p className="font-medium">No results found</p>
                    <p className="text-sm mt-1">Try a different search term.</p>
                </div>
            )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20 text-xs text-gray-400 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <span>↑↓ to navigate</span>
                <span className="flex items-center gap-1"><CornerDownLeft size={12}/> to select</span>
            </div>
            <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
