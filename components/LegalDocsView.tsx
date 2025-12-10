
import React, { useState } from 'react';
import { generateET1Content, generatePHAgendaContent } from '../services/geminiService';
import { generateMergedBundle } from '../services/pdfService';
import { DocumentMetadata, FileRegistry, TimelineEvent, Issue, BundleFolder } from '../types';
import { FileIcon, LoaderIcon, DownloadIcon, EditIcon, CheckIcon, CalendarIcon, BriefcaseIcon, FolderIcon } from './Icons';

interface LegalDocsViewProps {
  documents: DocumentMetadata[];
  filesRegistry: FileRegistry;
  timeline: TimelineEvent[];
  issues: Issue[];
  contextSummary: string;
  apiKey?: string;
  caseName: string;
  bundleFolders?: BundleFolder[];
}

const LegalDocsView: React.FC<LegalDocsViewProps> = ({ 
  documents, filesRegistry, timeline, issues, contextSummary, apiKey, caseName, bundleFolders 
}) => {
  const [activeTab, setActiveTab] = useState<'et1' | 'agenda' | 'bundle'>('et1');
  const [isLoading, setIsLoading] = useState(false);
  
  // ET1 State
  const [et1Content, setEt1Content] = useState({ grounds: '', remedy: '' });
  
  // Agenda State
  const [agendaContent, setAgendaContent] = useState<any>(null);

  // Bundle State
  const [bundleProgress, setBundleProgress] = useState('');
  const [isBundling, setIsBundling] = useState(false);

  // Generators
  const handleGenerateET1 = async () => {
      setIsLoading(true);
      const res = await generateET1Content(timeline, issues, contextSummary, apiKey);
      setEt1Content(res);
      setIsLoading(false);
  };

  const handleGenerateAgenda = async () => {
      setIsLoading(true);
      const res = await generatePHAgendaContent(contextSummary, issues, apiKey);
      setAgendaContent(res);
      setIsLoading(false);
  };

  const handleCreateBundle = async () => {
      setIsBundling(true);
      setBundleProgress("Starting PDF Engine...");
      
      // Delay slightly to allow UI to update
      setTimeout(async () => {
          const pdfBytes = await generateMergedBundle(
              filesRegistry, 
              documents, 
              caseName, 
              setBundleProgress,
              bundleFolders
          );
          
          if (pdfBytes) {
              const blob = new Blob([pdfBytes], { type: 'application/pdf' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${caseName.replace(/\s+/g, '_')}_Tribunal_Bundle.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setBundleProgress("Done! Download started.");
          } else {
              setBundleProgress("Failed to generate PDF. Check console.");
          }
          setIsBundling(false);
      }, 100);
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
             <div className="bg-slate-900 p-2 rounded-lg text-white"><BriefcaseIcon /></div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Court Documents & Bundle Creator</h2>
                <p className="text-sm text-slate-500">Official Tribunal Documentation Generator</p>
             </div>
          </div>
          
          <div className="flex gap-1 border-b border-slate-200">
             <button onClick={() => setActiveTab('et1')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'et1' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Form ET1 Creator
             </button>
             <button onClick={() => setActiveTab('agenda')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'agenda' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                PH Agenda Creator
             </button>
             <button onClick={() => setActiveTab('bundle')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'bundle' ? 'border-yellow-600 text-yellow-700 bg-yellow-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Master Bundle PDF
             </button>
          </div>
       </div>

       <div className="flex-1 overflow-auto">
          {/* ET1 TAB */}
          {activeTab === 'et1' && (
             <div className="space-y-6">
                {!et1Content.grounds ? (
                   <div className="text-center p-10 bg-slate-50 rounded-xl border border-slate-200">
                      <BriefcaseIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-800">Generate ET1 Particulars</h3>
                      <p className="text-slate-500 mb-6">AI will write Section 8.2 (Details of Claim) and 9.2 (Remedy) based on your timeline.</p>
                      <button onClick={handleGenerateET1} disabled={isLoading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow hover:bg-blue-700 disabled:opacity-50">
                         {isLoading ? <LoaderIcon /> : "Generate Narrative"}
                      </button>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 gap-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800">Section 8.2: Background & Details of Claim</h3>
                            <button onClick={() => copyToClipboard(et1Content.grounds)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><DownloadIcon /> Copy</button>
                         </div>
                         <textarea 
                            className="w-full h-96 p-4 border border-slate-200 rounded font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            value={et1Content.grounds} 
                            onChange={(e) => setEt1Content({...et1Content, grounds: e.target.value})}
                         />
                      </div>
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                         <h3 className="font-bold text-slate-800 mb-4">Section 9.2: Remedy Sought</h3>
                         <textarea 
                            className="w-full h-32 p-4 border border-slate-200 rounded font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500" 
                            value={et1Content.remedy} 
                            onChange={(e) => setEt1Content({...et1Content, remedy: e.target.value})}
                         />
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* AGENDA TAB */}
          {activeTab === 'agenda' && (
             <div className="space-y-6">
                {!agendaContent ? (
                   <div className="text-center p-10 bg-slate-50 rounded-xl border border-slate-200">
                      <CalendarIcon className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-lg font-bold text-slate-800">Generate PH Agenda</h3>
                      <p className="text-slate-500 mb-6">Auto-fill the standard Case Management Agenda for the Preliminary Hearing.</p>
                      <button onClick={handleGenerateAgenda} disabled={isLoading} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold shadow hover:bg-purple-700 disabled:opacity-50">
                         {isLoading ? <LoaderIcon /> : "Populate Agenda"}
                      </button>
                   </div>
                ) : (
                   <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                      <h3 className="text-center font-bold text-xl border-b pb-4">AGENDA FOR CASE MANAGEMENT</h3>
                      
                      {typeof agendaContent === 'object' && Object.entries(agendaContent).map(([key, val], i) => (
                         <div key={i}>
                            <h4 className="font-bold text-slate-700 text-sm uppercase mb-2">{key.replace(/_/g, ' ')}</h4>
                            <textarea 
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={String(val)}
                                readOnly
                            />
                         </div>
                      ))}
                   </div>
                )}
             </div>
          )}

          {/* BUNDLE TAB */}
          {activeTab === 'bundle' && (
             <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
                <div className="bg-yellow-50 p-8 rounded-full mb-6 text-yellow-600 border border-yellow-200 shadow-sm">
                   <FolderIcon className="w-16 h-16" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Official Tribunal Bundle Generator</h2>
                <p className="text-slate-600 mb-8 leading-relaxed">
                   This engine will compile your uploaded documents into a single, court-compliant PDF file.
                   <br/><br/>
                   <strong>Features:</strong>
                   <ul className="text-sm text-left inline-block space-y-2 mt-2 text-slate-500">
                      <li><CheckIcon className="inline text-green-500 mr-2"/> Auto-Generated Cover Page</li>
                      <li><CheckIcon className="inline text-green-500 mr-2"/> Master Index (Table of Contents)</li>
                      <li><CheckIcon className="inline text-green-500 mr-2"/> Structured Sections (based on Bundle Builder)</li>
                      <li><CheckIcon className="inline text-green-500 mr-2"/> Continuous Pagination (Page 1 of X)</li>
                      <li><CheckIcon className="inline text-green-500 mr-2"/> Full Text Wrapping for Witness Statements</li>
                   </ul>
                </p>
                
                {isBundling ? (
                   <div className="w-full bg-slate-100 rounded-lg p-6 border border-slate-200">
                      <LoaderIcon className="mx-auto mb-2 text-blue-600 scale-150" />
                      <p className="font-bold text-slate-700">Generating Bundle...</p>
                      <p className="text-xs text-slate-500 mt-2 font-mono animate-pulse">{bundleProgress}</p>
                   </div>
                ) : (
                   <button onClick={handleCreateBundle} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-xl hover:bg-slate-800 transition-transform hover:scale-105 flex items-center gap-3">
                      <DownloadIcon /> Generate & Download Full Bundle
                   </button>
                )}
                
                <p className="mt-6 text-xs text-slate-400">
                   Note: The PDF structure will match your folder configuration in 'Bundle Builder'.
                </p>
             </div>
          )}
       </div>
    </div>
  );
};

export default LegalDocsView;
