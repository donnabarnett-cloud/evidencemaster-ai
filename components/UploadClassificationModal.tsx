
import React, { useState, useEffect } from 'react';
import { XIcon, UserCheckIcon, BriefcaseIcon } from './Icons';

interface UploadClassificationModalProps {
  files: File[];
  onConfirm: (classifications: { [fileName: string]: 'Claimant' | 'Respondent' }) => void;
  onClose: () => void;
}

const UploadClassificationModal: React.FC<UploadClassificationModalProps> = ({ files, onConfirm, onClose }) => {
  const [classifications, setClassifications] = useState<{ [fileName: string]: 'Claimant' | 'Respondent' }>({});

  useEffect(() => {
    // Initialize all files with a default classification of 'Respondent'
    const initialClassifications = files.reduce((acc, file) => {
      acc[file.name] = 'Respondent';
      return acc;
    }, {} as { [fileName: string]: 'Claimant' | 'Respondent' });
    setClassifications(initialClassifications);
  }, [files]);

  const handleClassificationChange = (fileName: string, author: 'Claimant' | 'Respondent') => {
    setClassifications(prev => ({ ...prev, [fileName]: author }));
  };
  
  const handleConfirm = () => {
      onConfirm(classifications);
  };

  if (files.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800">Classify Documents</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200">
            <XIcon />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
            <p className="text-sm text-slate-600 mb-6">
              To build a water-tight case, the AI needs to know which documents are <strong>Your Prep/Notes</strong> (Subjective) and which are <strong>Official Evidence</strong> (Objective).
            </p>
            
            <div className="space-y-4">
                {files.map(file => (
                    <div key={file.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-medium text-sm text-slate-800 truncate pr-4">{file.name}</span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleClassificationChange(file.name, 'Claimant')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                                    classifications[file.name] === 'Claimant' 
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm' 
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                }`}
                                title="Select this if the file contains your personal notes, timeline drafts, or preparation work."
                            >
                                <UserCheckIcon className="w-4 h-4" /> My Notes / Prep
                            </button>
                            <button 
                                onClick={() => handleClassificationChange(file.name, 'Respondent')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                                    classifications[file.name] === 'Respondent' 
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' 
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                                }`}
                                title="Select this for emails, letters, policies, or official records (regardless of who sent them)."
                            >
                                <BriefcaseIcon className="w-4 h-4" /> Official Evidence
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 border-t">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            Start Processing ({files.length} files)
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadClassificationModal;
