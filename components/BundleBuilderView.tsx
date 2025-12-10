
import React, { useState } from 'react';
import { organizeEvidenceBundle } from '../services/geminiService';
import { BundleFolder, DocumentMetadata } from '../types';
import { FolderIcon, LoaderIcon, FileIcon, DownloadIcon, RefreshIcon, EditIcon, SaveIcon, XIcon, CheckIcon, AlertIcon } from './Icons';
import { downloadCSV } from '../utils/exportUtils';

interface BundleBuilderViewProps {
  documents: DocumentMetadata[];
  apiKey?: string;
  folders: BundleFolder[];
  setFolders: (folders: BundleFolder[]) => void;
  onUpdateDocument?: (id: string, updates: Partial<DocumentMetadata>) => void;
}

const BundleBuilderView: React.FC<BundleBuilderViewProps> = ({ documents, apiKey, folders, setFolders, onUpdateDocument }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingFolderIndex, setEditingFolderIndex] = useState<number | null>(null);
  const [editSummary, setEditSummary] = useState('');
  
  // Doc Page Edit State
  const [editingPageDocId, setEditingPageDocId] = useState<string | null>(null);
  const [tempPageCount, setTempPageCount] = useState<number>(1);

  const handleOrganize = async () => {
    setIsLoading(true);
    const result = await organizeEvidenceBundle(documents, apiKey);
    setFolders(result);
    setIsLoading(false);
  };

  // Helper to get page count (default to 1 if missing)
  const getPageCount = (doc: DocumentMetadata) => doc.pageCount || 1;

  const handleDownloadMasterIndex = () => {
     const headers = ['Page Number', 'Document Description', 'Date', 'Original File'];
     const rows: string[][] = [];
     
     let currentPage = 1;

     // Flatten folders to get order
     folders.forEach(folder => {
        // Add Section Header Row
        rows.push([``, `--- SECTION: ${folder.name.toUpperCase()} ---`, ``, ``]);
        
        folder.docIds.forEach(docId => {
           const doc = documents.find(d => d.id === docId);
           if (doc) {
              const count = getPageCount(doc);
              const endPage = currentPage + count - 1;
              const range = count === 1 ? `${currentPage}` : `${currentPage}-${endPage}`;
              
              rows.push([
                 `"${range}"`,
                 `"${doc.fileName}"`,
                 `"${new Date(doc.uploadedAt).toLocaleDateString()}"`,
                 `"${doc.fileName}"`
              ]);
              
              currentPage = endPage + 1;
           }
        });
     });
     
     const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.href = url;
     link.download = `Paginated_Bundle_Index.csv`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handleDownloadSummaries = () => {
      let content = "CASE BUNDLE SUMMARIES\n=====================\n\n";
      folders.forEach(folder => {
          content += `FOLDER: ${folder.name.toUpperCase()}\n`;
          content += `--------------------------------\n`;
          content += `${folder.summary}\n\n`;
          content += `Documents: ${folder.docIds.length}\n\n`;
      });

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bundle_Folder_Summaries.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const startEdit = (index: number, summary: string) => {
      setEditingFolderIndex(index);
      setEditSummary(summary);
  };

  const saveEdit = (index: number) => {
      const newFolders = [...folders];
      newFolders[index].summary = editSummary;
      setFolders(newFolders);
      setEditingFolderIndex(null);
  };

  const moveDocument = (docId: string, sourceFolderIndex: number, targetFolderIndex: number) => {
      const newFolders = [...folders];
      // Remove from source
      newFolders[sourceFolderIndex].docIds = newFolders[sourceFolderIndex].docIds.filter(id => id !== docId);
      // Add to target
      if (!newFolders[targetFolderIndex].docIds.includes(docId)) {
          newFolders[targetFolderIndex].docIds.push(docId);
      }
      setFolders(newFolders);
  };

  const savePageCount = (docId: string) => {
      if (onUpdateDocument && editingPageDocId) {
          onUpdateDocument(docId, { pageCount: tempPageCount });
      }
      setEditingPageDocId(null);
  };

  // Render logic to calculate pagination on the fly for display
  let runningPageCount = 1;

  if (folders.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-yellow-600">
          <FolderIcon />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Evidence Bundle Builder</h2>
        <p className="text-slate-500 mb-6">
          Organize your chaotic documents into professional folders (Medical, CSP, IPI, Grievance).
          <br/>Generate a paginated index for the Tribunal.
        </p>
        <button onClick={handleOrganize} className="px-8 py-3 bg-yellow-600 text-white rounded-xl shadow-lg font-bold">Organize My Evidence</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FolderIcon /> Evidence Bundle Builder</h2>
            <p className="text-sm text-slate-500">Auto-Sorted Folders • Pagination Engine • Folder Summaries</p>
         </div>
         <div className="flex gap-2">
            <button onClick={handleOrganize} disabled={isLoading} className="px-4 py-2 bg-slate-100 hover:bg-yellow-50 text-slate-600 hover:text-yellow-600 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
               {isLoading ? <LoaderIcon /> : <RefreshIcon />} Re-Organize
            </button>
            <button onClick={handleDownloadSummaries} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
               <FileIcon /> Download Summaries
            </button>
            <button onClick={handleDownloadMasterIndex} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
               <DownloadIcon /> Download Paginated Index
            </button>
         </div>
      </div>

      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm text-yellow-800 flex items-center gap-2">
         <AlertIcon className="w-4 h-4" />
         <strong>Pro Tip:</strong> Click the "p.X" next to a document to edit its page count for accurate indexing. Default is 1 page.
      </div>

      {isLoading ? (
         <div className="flex-1 flex items-center justify-center"><LoaderIcon className="scale-150 text-yellow-600"/></div>
      ) : (
         <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {folders.map((folder, folderIndex) => (
              <div key={folderIndex} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                       <FolderIcon className="text-yellow-500" /> {folder.name}
                    </h3>
                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded font-bold">{folder.docIds.length} Docs</span>
                 </div>
                 
                 <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-4 group relative">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-yellow-700 uppercase">One-Page Summary</span>
                        {editingFolderIndex !== folderIndex && (
                            <button onClick={() => startEdit(folderIndex, folder.summary)} className="text-yellow-600 hover:text-yellow-800 opacity-0 group-hover:opacity-100 transition-opacity">
                                <EditIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    
                    {editingFolderIndex === folderIndex ? (
                        <div className="flex flex-col gap-2">
                            <textarea 
                                value={editSummary}
                                onChange={(e) => setEditSummary(e.target.value)}
                                className="w-full h-32 p-2 text-sm border border-yellow-300 rounded focus:ring-2 focus:ring-yellow-500"
                            />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingFolderIndex(null)} className="text-xs text-slate-500">Cancel</button>
                                <button onClick={() => saveEdit(folderIndex)} className="bg-yellow-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1">
                                    <SaveIcon className="w-3 h-3"/> Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-yellow-900 leading-relaxed italic whitespace-pre-wrap">"{folder.summary}"</p>
                    )}
                 </div>

                 <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px]">
                    {folder.docIds.map(docId => {
                       const doc = documents.find(d => d.id === docId);
                       if (!doc) return null;

                       const count = getPageCount(doc);
                       const startPage = runningPageCount;
                       const endPage = runningPageCount + count - 1;
                       runningPageCount = endPage + 1;

                       return (
                          <div key={docId} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded border border-transparent hover:border-slate-100 group">
                             <div className="flex items-center gap-2 overflow-hidden flex-1">
                                {editingPageDocId === docId ? (
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            value={tempPageCount} 
                                            onChange={(e) => setTempPageCount(Number(e.target.value))}
                                            className="w-12 text-xs border rounded p-1"
                                            autoFocus
                                            onKeyDown={(e) => e.key === 'Enter' && savePageCount(docId)}
                                        />
                                        <button onClick={() => savePageCount(docId)} className="text-green-600 text-xs">OK</button>
                                    </div>
                                ) : (
                                    <span 
                                        className="text-xs font-mono font-bold text-slate-400 w-16 flex-shrink-0 cursor-pointer hover:text-blue-600 hover:underline"
                                        onClick={() => {
                                            setEditingPageDocId(docId);
                                            setTempPageCount(doc.pageCount || 1);
                                        }}
                                        title="Click to edit page count"
                                    >
                                        p.{startPage === endPage ? startPage : `${startPage}-${endPage}`}
                                    </span>
                                )}
                                
                                <FileIcon className="text-slate-400 w-4 h-4 flex-shrink-0" />
                                <span className="text-sm text-slate-700 truncate">{doc.fileName}</span>
                             </div>
                             
                             {/* Move Dropdown */}
                             <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                                 <select 
                                    className="text-[10px] border border-slate-300 rounded bg-white p-1 w-20 cursor-pointer"
                                    onChange={(e) => {
                                        moveDocument(docId, folderIndex, parseInt(e.target.value));
                                        e.target.value = ""; // Reset value for next selection
                                    }}
                                    value=""
                                 >
                                     <option value="" disabled>Move to...</option>
                                     {folders.map((target, idx) => (
                                         idx !== folderIndex ? <option key={idx} value={idx}>{target.name}</option> : null
                                     ))}
                                 </select>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default BundleBuilderView;
