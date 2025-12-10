
import React, { useState } from 'react';
import { generateLegalGuide } from '../services/geminiService';
import { LegalGuide } from '../types';
import { GraduationCapIcon, LoaderIcon, BookIcon, SearchIcon } from './Icons';

interface LegalLibraryViewProps {
  contextSummary: string;
  apiKey?: string;
  guides: LegalGuide[];
  setGuides: (guides: LegalGuide[]) => void;
}

const LegalLibraryView: React.FC<LegalLibraryViewProps> = ({ contextSummary, apiKey, guides, setGuides }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    const result = await generateLegalGuide(contextSummary, apiKey);
    setGuides(result);
    setIsLoading(false);
  };

  if (guides.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-indigo-600">
          <GraduationCapIcon />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Legal Research Library</h2>
        <p className="text-slate-500 mb-6">
          Understand the exact claims you are bringing (s15, s20, s27) and build your "Continuing Act" argument.
          <br/><br/>
          EvidenceMaster will analyze your case facts and generate custom study guides explaining how the law applies <strong>specifically to you</strong>.
        </p>
        <button onClick={handleGenerate} className="px-8 py-3 bg-indigo-600 text-white rounded-xl shadow-lg font-bold">Generate My Study Guides</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><GraduationCapIcon /> Legal Library & Research</h2>
            <p className="text-sm text-slate-500">Discrimination Definitions • Burden of Proof • Case Specific Examples</p>
         </div>
         <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
            {isLoading ? <LoaderIcon /> : <SearchIcon />} Refresh Guides
         </button>
      </div>

      {isLoading ? (
         <div className="flex-1 flex items-center justify-center"><LoaderIcon className="scale-150 text-indigo-600"/></div>
      ) : (
         <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {guides.map((guide, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                 <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
                    <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg"><BookIcon /></div>
                    <h3 className="font-bold text-lg text-slate-800">{guide.topic}</h3>
                 </div>
                 
                 <div className="space-y-4 flex-1">
                    <div>
                       <span className="text-xs font-bold text-slate-400 uppercase">Definition</span>
                       <p className="text-sm text-slate-700 mt-1">{guide.definition}</p>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded border border-blue-100">
                       <span className="text-xs font-bold text-blue-700 uppercase block mb-1">Your Burden of Proof</span>
                       <p className="text-sm text-blue-900">{guide.burdenOfProof}</p>
                    </div>

                    <div>
                       <span className="text-xs font-bold text-slate-400 uppercase">Examples from YOUR Case</span>
                       <ul className="mt-2 space-y-2">
                          {(guide.caseExamples || []).map((ex, idx) => (
                             <li key={idx} className="flex gap-2 text-sm text-slate-700">
                                <span className="text-green-500 font-bold">✓</span> {ex}
                             </li>
                          ))}
                       </ul>
                    </div>

                    <div className="bg-orange-50 p-3 rounded border border-orange-100 mt-auto">
                       <span className="text-xs font-bold text-orange-700 uppercase block mb-1">Potential Respondent Defence</span>
                       <p className="text-sm text-orange-900 italic">"{guide.respondentDefence}"</p>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default LegalLibraryView;
