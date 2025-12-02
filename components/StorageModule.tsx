import React, { useState, useRef } from 'react';
import { StorageFile } from '../types';
import { Cloud, FileText, Image as ImageIcon, Upload, Folder, Trash2, Download, AlertCircle, ArrowUpDown } from 'lucide-react';

interface StorageProps {
    storage: StorageFile[];
    setStorage: React.Dispatch<React.SetStateAction<StorageFile[]>>;
}

export const StorageModule: React.FC<StorageProps> = ({ storage, setStorage }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<'Date' | 'Size'>('Date');

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Limit size to ~5MB
        if (file.size > 5 * 1024 * 1024) {
            setError('FILE SIZE EXCEEDED. MAX LIMIT: 5MB');
            return;
        }

        setError('');
        setUploading(true);
        setProgress(0);

        // Simulate Upload Progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return prev + 10;
            });
        }, 100);

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            
            const newFile: StorageFile = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type.startsWith('image/') ? 'Image' : 'Document',
                date: new Date().toISOString().split('T')[0],
                size: file.size,
                data: base64String
            };

            // Finish up
            clearInterval(interval);
            setProgress(100);
            setTimeout(() => {
                setStorage(prev => [newFile, ...prev]);
                setUploading(false);
                setProgress(0);
            }, 500);
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = (id: string) => {
        if(confirm("PERMANENTLY DELETE FILE FROM VAULT?")) {
            setStorage(prev => prev.filter(f => f.id !== id));
        }
    };

    const handleDownload = (file: StorageFile) => {
        if (!file.data) return;
        const link = document.createElement("a");
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const sortedStorage = [...storage].sort((a, b) => {
        if (sortBy === 'Date') return new Date(b.date).getTime() - new Date(a.date).getTime();
        return b.size - a.size;
    });

    return (
        <div className="p-6 h-full overflow-y-auto pb-20 bg-[#05010a] text-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2 font-mono">
                        <Cloud className="text-orange-500" />
                        SPARKO DATA VAULT
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">Local Secure Browser Storage • Max 5MB/File</p>
                </div>
                <div className="flex gap-2">
                    <button 
                         onClick={() => setSortBy(prev => prev === 'Date' ? 'Size' : 'Date')}
                         className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 px-3 py-2 rounded-sm text-xs flex items-center gap-2"
                    >
                         <ArrowUpDown size={14} /> Sort: {sortBy}
                    </button>
                    
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-purple-900/40 hover:bg-purple-800 border border-purple-600 text-purple-200 px-4 py-2 rounded-sm flex items-center gap-2 text-xs transition uppercase font-mono tracking-wider"
                    >
                        <Upload size={14} className={uploading ? "animate-bounce" : ""} />
                        {uploading ? `${progress}%` : 'UPLOAD'}
                    </button>
                </div>
            </div>

            {uploading && (
                <div className="w-full bg-slate-900 h-2 mb-6 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-purple-500 h-full transition-all duration-300" style={{width: `${progress}%`}}></div>
                </div>
            )}

            {error && (
                <div className="bg-red-900/20 border border-red-800 text-red-400 p-3 mb-4 text-xs font-mono flex items-center gap-2">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 font-mono">
                {['Documents', 'Images', 'Contracts', 'Site Plans'].map(folder => (
                    <div key={folder} className="bg-slate-900 border border-slate-800 p-4 rounded-sm flex items-center gap-3 hover:border-orange-500 cursor-pointer transition group">
                        <Folder className="text-orange-500 group-hover:text-orange-400" size={20} />
                        <span className="text-slate-300 text-xs uppercase tracking-widest">{folder}</span>
                    </div>
                ))}
            </div>

            <h3 className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-widest font-mono">Encrypted Files ({storage.length})</h3>
            
            <div className="bg-slate-900/50 border border-slate-800 rounded-sm overflow-hidden min-h-[300px]">
                {storage.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-600 font-mono">
                        <Cloud size={48} className="mb-4 opacity-20" />
                        <p className="text-xs">VAULT IS EMPTY. INITIALIZE UPLOAD.</p>
                    </div>
                ) : (
                    <table className="w-full text-left font-mono">
                        <thead className="bg-slate-900 text-slate-500 text-[10px] uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Filename</th>
                                <th className="p-4">Date Uploaded</th>
                                <th className="p-4">Size</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs">
                            {sortedStorage.map(file => (
                                <tr key={file.id} className="hover:bg-slate-800/50 transition group">
                                    <td className="p-4 flex items-center gap-3">
                                        {file.type === 'Image' ? <ImageIcon className="text-purple-400" size={16} /> : <FileText className="text-orange-400" size={16} />}
                                        <span className="text-slate-200">{file.name}</span>
                                    </td>
                                    <td className="p-4 text-slate-400">{file.date}</td>
                                    <td className="p-4 text-slate-400">{formatSize(file.size)}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleDownload(file)}
                                            className="text-slate-500 hover:text-orange-400 transition"
                                            title="Download"
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(file.id)}
                                            className="text-slate-500 hover:text-red-400 transition"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};