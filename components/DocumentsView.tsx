




import React, { useRef, useState } from 'react';
import { DocumentMetadata, DocStatus, TimelineEvent } from '../types';
import { UploadIcon, FileIcon, LoaderIcon, CheckIcon, AlertIcon, TrashIcon, EyeIcon, MicIcon, DownloadIcon, BookIcon } from './Icons';
import { downloadCSV } from '../utils/exportUtils';

interface DocumentsViewProps {
  documents: DocumentMetadata[];
  onUpload: (files: File[]) => void;
  onDelete: (id: string) => void;
  onReview: (id: string) => void;
  onAddEvent?: (event: TimelineEvent) => void;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ documents, onUpload, onDelete, onReview, onAddEvent }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(Array.from(e.target.files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleDownloadTranscript = (doc: DocumentMetadata) => {
    if (doc.textContent) {
      const blob = new Blob([doc.textContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${doc.fileName}_transcript.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const statusColor = (status: DocStatus) => {
    switch (status) {
      case DocStatus.READY: return 'text-green-600 bg-green-50 border-green-200';
      case DocStatus.PROCESSING: return 'text-blue-600 bg-blue-50 border-blue-200';
      case DocStatus.ERROR: return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const statusIcon = (status: DocStatus) => {
    switch (status) {
      case DocStatus.READY: return <CheckIcon />;
      case DocStatus.PROCESSING: return <LoaderIcon />;
      case DocStatus.ERROR: return <AlertIcon />;
      default: return <div className="w-5 h-5" />;
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.match(/\.(mp3|wav|m4a|mp4|mpeg)$/i)) {
      return <MicIcon />;
    }
    return <FileIcon />;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div 
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer group ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg' 
            : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple
          accept=".pdf,.txt,.docx,image/*,audio/*"
          onChange={handleFileChange}
        />
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform ${
          isDragging ? 'bg-blue-200 scale-110' : 'bg-blue-100 group-hover:scale-110'
        }`}>
          <div className={isDragging ? 'text-blue-700' : 'text-blue-600'}>
            <UploadIcon />
          </div>
        </div>
        <h3 className="text-lg font-medium text-slate-900">Upload Evidence</h3>
        <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
          Drag and drop multiple <strong>PDF, Word, Text, Image or Audio</strong> files here.
        </p>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800">Case Files ({documents.length})</h3>
          <span className="text-xs text-slate-500 uppercase font-medium tracking-wider">Storage: Persistent (IndexedDB)</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {documents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 italic">No documents uploaded yet.</div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${doc.fileName.match(/\.(mp3|wav|m4a)$/i) ? 'bg-indigo-100 text-indigo-500' : 'bg-slate-100 text-slate-500'}`}>
                            {getFileIcon(doc.fileName)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-slate-900">{doc.fileName}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    doc.author === 'Claimant'
                                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                                        : 'bg-red-100 text-red-700 border-red-200'
                                }`}>
                                    {doc.author === 'Claimant' ? 'Me' : 'Employer'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                            <p className="text-xs text-slate-500 flex gap-1">
                                <span>{doc.size}</span>
                                <span>•</span>
                                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            </p>
                            {doc.status === DocStatus.READY && doc.extractionStats && (
                                <div className="flex gap-2">
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-medium">
                                    {doc.extractionStats.eventCount} Events
                                </span>
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-medium">
                                    {doc.extractionStats.issueCount} Issues
                                </span>
                                </div>
                            )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 ${statusColor(doc.status)}`}>
                            {statusIcon(doc.status)}
                            <span className="uppercase">{doc.status}</span>
                        </div>
                        
                        {doc.status === DocStatus.READY && (
                            <>
                            {(doc.fileName.match(/\.(mp3|wav|m4a|mp4|mpeg)$/i) || doc.textContent) && (
                                <button
                                onClick={() => handleDownloadTranscript(doc)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors group-hover:opacity-100"
                                title="Download Transcript"
                                >
                                <DownloadIcon />
                                </button>
                            )}
                            <button 
                                onClick={() => onReview(doc.id)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group-hover:opacity-100"
                                title="Review Document & Verify Evidence"
                            >
                                <EyeIcon />
                            </button>
                            </>
                        )}

                        <button 
                            onClick={(e) => {
                            e.stopPropagation();
                            onDelete(doc.id); // Trigger Modal in Parent
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete Document & Findings"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                </div>
                
                {/* AI Summary Section */}
                {doc.summary && doc.summary.length > 0 && (
                    <div className="ml-14 mt-2 bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-slate-600 animate-in fade-in">
                        <span className="font-bold text-blue-700 uppercase block mb-1">AI Content Summary</span>
                        <ul className="space-y-1 list-disc list-inside">
                            {doc.summary.map((point, i) => (
                                <li key={i}>{point}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Chapter Extraction (New Feature) */}
                {doc.chapters && doc.chapters.length > 0 && (
                    <div className="ml-14 mt-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100 text-xs text-slate-600 animate-in fade-in">
                        <span className="font-bold text-indigo-700 uppercase block mb-2 flex items-center gap-2">
                            <BookIcon className="w-3 h-3"/> Chapters / Sections
                        </span>
                        <div className="space-y-2">
                            {doc.chapters.map((chap, i) => (
                                <div key={i} className="bg-white p-2 rounded border border-indigo-100">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-slate-800">{chap.title}</span>
                                        {chap.pageEstimate && <span className="text-[10px] text-slate-400">~Page {chap.pageEstimate}</span>}
                                    </div>
                                    <p className="text-slate-500 mt-1">{chap.summary}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsView;