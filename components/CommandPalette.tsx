import React, { useState, useEffect, useRef } from 'react';
import { Command } from '../types';
import { Search, CornerDownLeft, ArrowUp, ArrowDown, X } from 'lucide-react';

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
  const listRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(cmd =>
    cmd.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedIndex(0);
      // Slight delay to ensure render before focus
      const timer = setTimeout(() => inputRef.current?.focus(), 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => {
            const next = prev + 1;
            return next >= filteredCommands.length ? 0 : next;
          });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => {
            const next = prev - 1;
            return next < 0 ? filteredCommands.length - 1 : next;
          });
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].onSelect();
            onClose();
          }
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timer);
      };
    }
  }, [isOpen, filteredCommands, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group commands by section
  const commandsBySection = filteredCommands.reduce((acc, cmd) => {
    const section = cmd.section || 'General';
    if (!acc[section]) acc[section] = [];
    acc[section].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const renderList = () => {
    if (filteredCommands.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600">
           <Search className="w-10 h-10 mb-4 opacity-20" />
           <p className="text-sm font-medium">No commands found</p>
           <p className="text-xs opacity-60 mt-1">Try searching for something else</p>
        </div>
      );
    }

    // Define standard order
    const sectionOrder = ['Actions', 'Navigation', 'General']; 
    const sections = Object.keys(commandsBySection).sort((a, b) => {
        const ia = sectionOrder.indexOf(a);
        const ib = sectionOrder.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    return (
      <div className="py-2 pb-4">
        {sections.map((section) => {
           const sectionCmds = commandsBySection[section];
           if (!sectionCmds || sectionCmds.length === 0) return null;
           
           return (
             <div key={section} className="mb-1">
               <div className="px-4 py-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest sticky top-0 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-sm z-10 border-b border-transparent">
                 {section}
               </div>
               <div className="px-2 space-y-0.5 mt-1">
                 {sectionCmds.map((cmd) => {
                   const index = filteredCommands.indexOf(cmd);
                   const isSelected = selectedIndex === index;
                   
                   return (
                     <div
                       key={cmd.id}
                       data-index={index}
                       onClick={() => { cmd.onSelect(); onClose(); }}
                       onMouseMove={() => setSelectedIndex(index)}
                       className={`
                         relative flex items-center justify-between px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group
                         ${isSelected 
                            ? 'bg-indigo-600 shadow-lg shadow-indigo-500/25 scale-[1.005] z-10' 
                            : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                         }
                       `}
                     >
                        <div className="flex items-center gap-3.5 relative z-10">
                           <div className={`
                             flex items-center justify-center w-9 h-9 rounded-lg transition-colors
                             ${isSelected 
                               ? 'bg-white/20 text-white shadow-inner' 
                               : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-white/20 shadow-sm'
                             }
                           `}>
                              {React.cloneElement(cmd.icon as React.ReactElement<any>, { size: 18 })}
                           </div>
                           <div className="flex flex-col gap-0.5">
                              <span className={`text-sm font-semibold tracking-tight ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-200'}`}>
                                {cmd.name}
                              </span>
                              {cmd.subtitle && (
                                <span className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-gray-400'}`}>
                                  {cmd.subtitle}
                                </span>
                              )}
                           </div>
                        </div>

                        {cmd.shortcut && (
                          <div className="flex items-center gap-1.5 opacity-100">
                             {cmd.shortcut.map((key, idx) => (
                               <kbd 
                                 key={idx}
                                 className={`
                                   hidden sm:inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-[10px] font-mono font-medium rounded-md
                                   ${isSelected 
                                     ? 'bg-indigo-500 text-indigo-100 border border-indigo-400 shadow-none' 
                                     : 'bg-gray-50 dark:bg-[#27272a] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 shadow-[0_2px_0_0_rgba(0,0,0,0.05)] dark:shadow-[0_2px_0_0_rgba(0,0,0,0.5)]'
                                   }
                                 `}
                               >
                                 {key}
                               </kbd>
                             ))}
                          </div>
                        )}
                     </div>
                   );
                 })}
               </div>
             </div>
           );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center pt-4 sm:pt-[12vh] px-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Modal */}
      <div 
        ref={paletteRef}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-2xl rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-2xl shadow-black/50 flex flex-col overflow-hidden relative animate-in slide-in-from-top-4 zoom-in-95 duration-200"
      >
        {/* Search Header */}
        <div className="relative border-b border-gray-200/50 dark:border-white/5 p-4 flex items-center gap-3 bg-white/50 dark:bg-white/[0.02]">
           <Search className="w-5 h-5 text-gray-400 shrink-0" />
           <input
             ref={inputRef}
             type="text"
             value={searchTerm}
             onChange={e => { setSearchTerm(e.target.value); setSelectedIndex(0); }}
             className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none h-10"
             placeholder="What would you like to do?"
             autoComplete="off"
           />
           <button 
             onClick={onClose}
             className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors border border-gray-200 dark:border-white/5"
           >
             <span className="text-[9px]">ESC</span>
           </button>
        </div>

        {/* Command List */}
        <div 
          ref={listRef}
          className="max-h-[50vh] sm:max-h-[55vh] overflow-y-auto custom-scrollbar bg-gray-50/30 dark:bg-black/20"
        >
          {renderList()}
        </div>

        {/* Footer */}
        {filteredCommands.length > 0 && (
          <div className="hidden sm:flex px-4 py-3 bg-white/80 dark:bg-[#18181b]/80 border-t border-gray-200/50 dark:border-white/5 items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 select-none backdrop-blur-sm">
             <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                   <div className="flex gap-0.5">
                     <ArrowUp size={12} className="p-0.5 bg-gray-200 dark:bg-white/10 rounded border border-gray-300 dark:border-white/5"/>
                     <ArrowDown size={12} className="p-0.5 bg-gray-200 dark:bg-white/10 rounded border border-gray-300 dark:border-white/5"/>
                   </div>
                   <span className="font-medium">Navigate</span>
                </span>
                <span className="flex items-center gap-1.5">
                   <CornerDownLeft size={12} className="p-0.5 bg-gray-200 dark:bg-white/10 rounded border border-gray-300 dark:border-white/5 w-4 h-4"/>
                   <span className="font-medium">Select</span>
                </span>
             </div>
             <div className="flex items-center gap-1.5 opacity-50">
                <span className="font-semibold tracking-wider">NEXUS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};