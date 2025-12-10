
import React, { useEffect, useState } from 'react';
import { DocumentMetadata, Entity, MedicalEvidence, PolicyReference, TimelineEvent } from '../types';
import { XCircleIcon, DownloadIcon, FileIcon, TimelineIcon, SaveIcon } from './Icons';

interface DocumentReviewModalProps {
  document: DocumentMetadata;
  file?: File;
  onClose: () => void;
  extractedEntities: Entity[];
  extractedMedical: MedicalEvidence[];
  extractedPolicies: PolicyReference[];
  onAddEvent?: (event: TimelineEvent) => void;
}

const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({ 
  document, 
  file, 
  onClose,
  extractedEntities,
  extractedMedical,
  extractedPolicies,
  onAddEvent
}) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  
  // Extraction State
  const [extractText, setExtractText] = useState('');
  const [extractDate, setExtractDate] = useState('');
  const [extractTag, setExtractTag] = useState<'Support' | 'Contradiction' | 'Timeline' | 'Neutral'>('Neutral');
  const [extractCategory, setExtractCategory] = useState('General');

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const docEntities = extractedEntities.filter(e => e.sourceDoc === document.fileName);
  const docMedical = extractedMedical.filter(m => m.sourceDoc === document.fileName);
  const docPolicies = extractedPolicies.filter(p => p.sourceDoc === document.fileName);

  const handleSaveExtract = () => {
      if (!onAddEvent || !extractText || !extractDate) return;
      
      onAddEvent({
          id: Math.random().toString(36).substr(2, 9),
          date: extractDate,
          event: extractText.length > 50 ? extractText.substring(0, 50) + '...' : extractText,
          quote: extractText,
          sourceDoc: document.fileName,
          severity: 'Medium',
          category: extractCategory,
          relevanceTag: extractTag
      });
      
      setExtractText('');
      setExtractDate('');
      // Parent component handles the success toast
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="h-14 bg-slate-900 text-white flex justify-between items-center px-6 flex-shrink-0">
           <div className="flex items-center gap-3">
             <FileIcon />
             <h3 className="font-semibold truncate max-w-xl">{document.fileName}</h3>
             <span className="px-2 py-0.5 rounded bg-slate-700 text-xs text-slate-300 uppercase">{document.fileType}</span>
           </div>
           <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
             <div className="scale-125"><XCircleIcon /></div>
           </button>
        </div>

        {/* Split View */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: File Preview */}
          <div className="flex-1 bg-slate-100 relative border-r border-slate-300 overflow-auto">
            {fileUrl ? (
               document.fileType === 'pdf' ? (
                 <iframe 
                   src={fileUrl} 
                   className="w-full h-full" 
                   title="PDF Preview"
                 />
               ) : document.fileType.startsWith('image') ? (
                 <div className="w-full h-full flex items-center justify-center overflow-auto p-10">
                   <img src={fileUrl} alt="Preview" className="max-w-full max-h-full shadow-lg" />
                 </div>
               ) : document.textContent ? (
                 <div className="w-full h-full p-10 overflow-auto bg-white">
                    <h4 className="text-slate-400 uppercase text-xs font-bold mb-4 sticky top-0 bg-white py-2 border-b">Extracted Text Content</h4>
                    <pre className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed">
                      {document.textContent}
                    </pre>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500 p-10 text-center">
                    <p className="mb-4">Preview not available for this file type in browser.</p>
                 </div>
               )
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                <p>File content unavailable (Session Expired)</p>
              </div>
            )}
          </div>

          {/* RIGHT: AI Extraction Data */}
          <div className="w-[400px] bg-white flex flex-col overflow-hidden flex-shrink-0">
             
             {/* New Manual Extraction Module */}
             <div className="p-4 bg-indigo-50 border-b border-indigo-100">
                 <h4 className="font-bold text-indigo-800 text-sm uppercase tracking-wide flex items-center gap-2 mb-3">
                     <TimelineIcon /> Extract Key Evidence
                 </h4>
                 <div className="space-y-3">
                     <textarea 
                        className="w-full p-2 text-sm border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500"
                        placeholder="Paste meaningful quote here..."
                        value={extractText}
                        onChange={(e) => setExtractText(e.target.value)}
                        rows={3}
                     />
                     <div className="grid grid-cols-2 gap-2">
                         <input 
                            type="date"
                            className="p-2 text-xs border border-indigo-200 rounded"
                            value={extractDate}
                            onChange={(e) => setExtractDate(e.target.value)}
                         />
                         <input 
                            type="text"
                            placeholder="Category (e.g. Email)"
                            className="p-2 text-xs border border-indigo-200 rounded"
                            value={extractCategory}
                            onChange={(e) => setExtractCategory(e.target.value)}
                         />
                     </div>
                     <div className="flex gap-2">
                        <select 
                            className="flex-1 p-2 text-xs border border-indigo-200 rounded"
                            value={extractTag}
                            onChange={(e) => setExtractTag(e.target.value as any)}
                        >
                            <option value="Neutral">Neutral</option>
                            <option value="Support">Support (Yellow)</option>
                            <option value="Contradiction">Contradiction (Pink)</option>
                            <option value="Timeline">Timeline (Blue)</option>
                        </select>
                        <button 
                            onClick={handleSaveExtract}
                            disabled={!extractText || !extractDate}
                            className="px-3 py-2 bg-indigo-600 text-white rounded text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <SaveIcon /> Add
                        </button>
                     </div>
                 </div>
             </div>

             <div className="p-4 border-b border-slate-200 bg-slate-50">
               <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide">AI Findings</h4>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-6">
                
                {/* Entities Section */}
                <div>
                   <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Entities Identified</h5>
                   {docEntities.length === 0 ? <p className="text-sm text-slate-400 italic">None found.</p> : (
                     <div className="space-y-2">
                        {docEntities.map((e, i) => (
                          <div key={i} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded border border-slate-100">
                             <span className="font-medium text-slate-700">{e.name}</span>
                             <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${e.sentiment === 'Hostile' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                               {e.sentiment}
                             </span>
                          </div>
                        ))}
                     </div>
                   )}
                </div>

                {/* Medical Section */}
                <div>
                   <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Medical Facts</h5>
                   {docMedical.length === 0 ? <p className="text-sm text-slate-400 italic">None found.</p> : (
                     <div className="space-y-2">
                        {docMedical.map((m, i) => (
                          <div key={i} className="text-sm p-3 bg-blue-50 rounded border border-blue-100">
                             <div className="flex justify-between mb-1">
                               <span className="text-[10px] font-bold text-blue-500 uppercase">{m.type}</span>
                               <span className="text-[10px] text-blue-400">{m.date}</span>
                             </div>
                             <p className="font-semibold text-slate-800">{m.value}</p>
                             <p className="text-xs text-slate-600 mt-1 italic">"{m.context}"</p>
                          </div>
                        ))}
                     </div>
                   )}
                </div>

                 {/* Policies Section */}
                 <div>
                   <h5 className="text-xs font-bold text-slate-400 uppercase mb-2">Policy Breaches</h5>
                   {docPolicies.length === 0 ? <p className="text-sm text-slate-400 italic">None found.</p> : (
                     <div className="space-y-2">
                        {docPolicies.map((p, i) => (
                          <div key={i} className="text-sm p-3 bg-orange-50 rounded border border-orange-100">
                             <div className="flex justify-between mb-1">
                               <span className="font-medium text-slate-800">{p.policyName}</span>
                               <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${p.complianceStatus === 'Breached' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                                 {p.complianceStatus}
                               </span>
                             </div>
                             <p className="text-xs text-slate-600 mt-1 italic">"{p.quote}"</p>
                          </div>
                        ))}
                     </div>
                   )}
                </div>

             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DocumentReviewModal;
