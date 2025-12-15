import React, { useRef } from 'react';
import { File as FileIcon, Upload, Download, Trash2, FolderOpen, Image as ImageIcon, FileCode, FileText, Plus } from 'lucide-react';
import { VirtualFile } from '../types';

interface FileExplorerProps {
  files: VirtualFile[];
  onUpload: (files: FileList) => void;
  onDelete: (fileId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onUpload, 
  onDelete,
  isOpen,
  onToggle
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: VirtualFile) => {
    if (file.type.startsWith('image/')) return <ImageIcon size={14} className="text-purple-400" />;
    if (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py')) return <FileCode size={14} className="text-blue-400" />;
    if (file.name.endsWith('.json') || file.name.endsWith('.csv')) return <FileText size={14} className="text-green-400" />;
    return <FileIcon size={14} className="text-gray-400" />;
  };

  const handleDownload = (file: VirtualFile) => {
    // Convert base64 back to blob for download
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
    <div className={`flex flex-col border-r border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#050505] transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'}`}>
      <div className="h-10 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/5 shrink-0 bg-gray-100/50 dark:bg-white/5">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
          <FolderOpen size={14} />
          <span className="truncate">Project Root</span>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors text-gray-500 dark:text-gray-400 hover:text-indigo-500"
          title="Upload Files"
        >
          <Plus size={16} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files) onUpload(e.target.files);
            // Reset value so same file can be uploaded again if deleted
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-gray-600 text-center px-4 mt-8">
            <Upload size={24} className="mb-2 opacity-50" />
            <p className="text-xs font-medium">No files</p>
            <p className="text-[10px] opacity-70 mt-1">Upload files to access them in your code.</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            >
              Upload Assets
            </button>
          </div>
        ) : (
          files.map((file) => (
            <div 
              key={file.id} 
              className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getFileIcon(file)}
                <span className="truncate font-mono">{file.name}</span>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleDownload(file)}
                  className="p-1 hover:text-indigo-500 transition-colors"
                  title="Download"
                >
                  <Download size={12} />
                </button>
                <button 
                  onClick={() => onDelete(file.id)}
                  className="p-1 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-white/5 text-[9px] text-gray-400 dark:text-gray-600 font-mono">
        <p className="mb-1 font-bold">Quick Access:</p>
        <div className="space-y-1 opacity-80">
            <div className="flex gap-1">
                <span className="text-yellow-500">JS:</span>
                <code>fs.readFileSync('{files[0]?.name || 'file.txt'}')</code>
            </div>
            <div className="flex gap-1">
                <span className="text-blue-500">Py:</span>
                <code>open('{files[0]?.name || 'file.txt'}').read()</code>
            </div>
        </div>
      </div>
    </div>
  );
};