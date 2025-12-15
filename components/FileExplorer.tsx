import React, { useRef } from 'react';
import { File as FileIcon, Upload, Download, Trash2, FolderOpen, Image as ImageIcon, FileCode, FileText, Plus } from 'lucide-react';
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
    if (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py')) return <FileCode size={14} className="text-blue-400" />;
    if (file.name.endsWith('.json') || file.name.endsWith('.csv')) return <FileText size={14} className="text-green-400" />;
    return <FileIcon size={14} className="text-gray-400" />;
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
    <div 
      className={`
        flex flex-col border-r border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#050505] transition-all duration-300 ease-in-out
        ${isMobile ? 'w-full h-full' : (isOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden')}
      `}
    >
      <div className="h-10 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/5 shrink-0 bg-gray-100/50 dark:bg-white/5">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
          <FolderOpen size={14} />
          <span className="truncate">Files</span>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors text-gray-500 dark:text-gray-400 hover:text-indigo-500"
            title="Upload Files"
          >
            <Plus size={16} />
          </button>
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

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 dark:text-gray-600 text-center px-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
               <Upload size={20} className="opacity-50" />
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">No files uploaded</p>
            <p className="text-[10px] opacity-70 mt-1 max-w-[150px] leading-tight">Upload assets to use them in your code.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors border border-indigo-200 dark:border-indigo-500/20"
            >
              Browse Files
            </button>
          </div>
        ) : (
          files.map((file) => (
            <div 
              key={file.id} 
              className="group flex items-center justify-between px-2.5 py-2 rounded-lg hover:bg-white dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors text-xs border border-transparent hover:border-gray-200 dark:hover:border-white/5"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {getFileIcon(file)}
                <span className="truncate font-mono">{file.name}</span>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDownload(file)}
                  className="p-1 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 rounded transition-colors"
                  title="Download"
                >
                  <Download size={13} />
                </button>
                <button 
                  onClick={() => onDelete(file.id)}
                  className="p-1 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-white/5 text-[9px] text-gray-400 dark:text-gray-600 font-mono bg-gray-100/30 dark:bg-white/[0.02]">
        <p className="mb-2 font-bold text-[10px] uppercase tracking-wider opacity-70">Access Examples</p>
        <div className="space-y-1.5 opacity-90">
            <div className="flex gap-2 items-center bg-white dark:bg-black/20 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                <span className="text-yellow-600 dark:text-yellow-500 font-bold">JS</span>
                <code className="text-gray-600 dark:text-gray-400">fs.readFileSync('name')</code>
            </div>
            <div className="flex gap-2 items-center bg-white dark:bg-black/20 px-2 py-1 rounded border border-gray-200 dark:border-white/5">
                <span className="text-blue-600 dark:text-blue-500 font-bold">Py</span>
                <code className="text-gray-600 dark:text-gray-400">open('name').read()</code>
            </div>
        </div>
      </div>
    </div>
  );
};