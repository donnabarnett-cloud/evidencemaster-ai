
import React, { useState, useRef } from 'react';
import { UserNote } from '../types';
import { ClipboardIcon, TrashIcon, SaveIcon, UploadIcon, LoaderIcon } from './Icons';
import mammoth from 'mammoth';
import { extractDocumentContent } from '../services/geminiService';

interface UserNotesViewProps {
  notes: UserNote[];
  onAddNote: (note: UserNote) => void;
  onDeleteNote: (id: string) => void;
  apiKey?: string; // New Prop for AI extraction
}

const UserNotesView: React.FC<UserNotesViewProps> = ({ notes, onAddNote, onDeleteNote, apiKey }) => {
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<UserNote['category']>('Observation');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');

  const handleAdd = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    
    const note: UserNote = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      title: newTitle,
      content: newContent,
      category: newCategory
    };
    
    onAddNote(note);
    setNewTitle('');
    setNewContent('');
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    if (!apiKey) {
      alert("Please configure your API Key in the main dashboard to use AI extraction features.");
      return;
    }

    setIsProcessing(true);
    let successCount = 0;

    for (const file of files) {
      setProcessStatus(`Processing ${file.name}...`);
      try {
        let text = '';
        const arrayBuffer = await file.arrayBuffer();

        if (file.name.endsWith('.docx')) {
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf') || file.type.startsWith('image/')) {
          // Use Gemini for PDFs and Images (OCR & Extraction)
          const base64 = await readFileAsBase64(file);
          text = await extractDocumentContent({ mimeType: file.type, data: base64 }, apiKey);
        } else {
          // Fallback for text files
          text = await file.text();
        }

        if (text && text.trim()) {
          // If multiple files, save immediately. If single file, populate inputs for editing.
          if (files.length > 1) {
             const note: UserNote = {
                id: Date.now().toString() + Math.random().toString().slice(2,5),
                date: new Date().toISOString().split('T')[0],
                title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
                content: `--- Imported from ${file.name} ---\n\n${text}`,
                category: 'Context'
             };
             onAddNote(note);
             successCount++;
          } else {
             setNewTitle(file.name.replace(/\.[^/.]+$/, ""));
             setNewContent(`--- Imported from ${file.name} ---\n\n${text}`);
             setNewCategory('Context');
          }
        }
      } catch (error) {
        console.error(`Failed to read ${file.name}`, error);
      }
    }

    setIsProcessing(false);
    setProcessStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    if (files.length > 1 && successCount > 0) {
       // Batch completed
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <ClipboardIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">My Case Notes & Observations</h2>
              <p className="text-sm text-slate-500">
                Add context, off-record observations, or upload your strategy notes (.docx, .pdf, .txt).
                <br/>The AI uses this to <strong>steer the strategy</strong> towards your narrative.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
              disabled={isProcessing}
            >
              <UploadIcon /> {isProcessing ? 'Importing...' : 'Bulk Import Notes'}
            </button>
            <span className="text-[10px] text-slate-400">Supported: PDF, DOCX, TXT, IMG</span>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple // Enable multiple files
              accept=".docx,.txt,.pdf,application/pdf,image/*,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {isProcessing && (
           <div className="mb-4 p-2 bg-blue-50 text-blue-700 text-xs rounded flex items-center gap-2 animate-pulse">
             <LoaderIcon /> {processStatus}
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input 
            className="col-span-1 md:col-span-3 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            placeholder="Note Title (e.g., 'Timeline Corrections' or 'Witness Credibility')"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <select 
            className="border border-slate-300 rounded-lg p-3 text-sm bg-white"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as any)}
          >
            <option value="Observation">Observation</option>
            <option value="Rebuttal">Rebuttal</option>
            <option value="Context">Context</option>
            <option value="Question">Question</option>
          </select>
        </div>
        <textarea 
          className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none h-48 mb-4 font-mono leading-relaxed"
          placeholder="Type your notes here or import documents..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <div className="flex justify-end">
          <button 
            onClick={handleAdd}
            disabled={!newTitle || !newContent}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <SaveIcon /> Add Note to Case Context
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-10">
        {notes.length === 0 ? (
          <div className="text-center py-10 text-slate-400 italic">
            No notes added yet. Import a document or type your observations above.
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wide ${
                    note.category === 'Observation' ? 'bg-blue-100 text-blue-700' :
                    note.category === 'Rebuttal' ? 'bg-red-100 text-red-700' :
                    note.category === 'Context' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {note.category}
                  </span>
                  <span className="text-xs text-slate-400">{note.date}</span>
                </div>
                <button onClick={() => onDeleteNote(note.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TrashIcon />
                </button>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{note.title}</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserNotesView;
