
import React, { useRef } from 'react';
import { File as FileIcon, Upload, Trash2, FolderOpen, Image as ImageIcon, FileCode, FileText, Plus, X, Download } from 'lucide-react';
import { VirtualFile } from '../types';

interface FileExplorerProps {
  files: VirtualFile[];
  onUpload: (files: FileList) => void;
  onDelete: (fileId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onUpload, 
  onDelete,
  isOpen,
  onToggle,
  isMobile = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: VirtualFile) => {
    if (file.type.startsWith('image/')) return <ImageIcon size={14} className="text-purple-400" />;
    if (file.name.endsWith('.js') || file.name.endsWith('.ts')) return <FileCode size={14} className="text-yellow-400" />;
    if (file.name.endsWith('.py')) return <FileCode size={14} className="text-blue-400" />;
    if (file.name.endsWith('.json')) return <FileText size={14} className="text-green-400" />;
    return <FileIcon size={14} className="text-slate-400" />;
  };

  const handleDownload = (file: VirtualFile) => {
    const byteCharacters = atob(file.content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: file.type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full bg-[#0c0c0e] text-slate-300 w-full`}>
      {/* Header */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-white/5 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Explorer</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
          >
            <Plus size={16} />
          </button>
          {isMobile && (
             <button onClick={onToggle} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white ml-2">
                <X size={16} />
             </button>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) onUpload(e.target.files);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600 text-center px-4">
             <FolderOpen size={32} className="mb-3 opacity-20" />
             <p className="text-xs font-medium">No files yet</p>
             <p className="text-[10px] mt-1 opacity-60">Upload assets to use in your code</p>
          </div>
        ) : (
          files.map((file) => (
            <div 
              key={file.id} 
              className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-white/5 cursor-pointer text-xs transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                {getFileIcon(file)}
                <span className="truncate font-medium text-slate-300 group-hover:text-white transition-colors">{file.name}</span>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleDownload(file)} className="p-1 hover:text-indigo-400 rounded">
                  <Download size={13} />
                </button>
                <button onClick={() => onDelete(file.id)} className="p-1 hover:text-red-400 rounded">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Footer */}
      <div className="p-4 border-t border-white/5 text-[10px] text-slate-500 font-mono bg-[#09090b]">
        <div className="flex justify-between mb-2">
           <span>Total Files:</span>
           <span className="text-slate-300">{files.length}</span>
        </div>
        <p className="opacity-50">Files available in /workspace</p>
      </div>
    </div>
  );
};
