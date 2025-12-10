
import React, { useState, useRef } from 'react';
import { generateAppealPack, extractDocumentContent } from '../services/geminiService';
import { AppealPack, TimelineEvent, DocumentMetadata } from '../types';
import { GavelIcon, LoaderIcon, AlertIcon, CheckIcon, FileIcon, ClipboardIcon, UploadIcon, MicIcon, DownloadIcon } from './Icons';
import { generateAppealPackTXT, downloadTXT } from '../utils/exportUtils';
import mammoth from 'mammoth';

interface GrievanceAppealViewProps {
  timeline: TimelineEvent[];
  contextSummary: string;
  apiKey?: string;
  pack: AppealPack | null;
  setPack: (pack: AppealPack | null) => void;
  documents: DocumentMetadata[]; 
}

const GrievanceAppealView: React.FC<GrievanceAppealViewProps> = ({ timeline, contextSummary, apiKey, pack, setPack, documents }) => {
  const [outcomeText, setOutcomeText] = useState('');
  const [myAppealText, setMyAppealText] = useState('');
  const [respondentInviteText, setRespondentInviteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'flaws' | 'risks' | 'matrix'>('summary');
  
  const outcomeRef = useRef<HTMLInputElement>(null);
  const appealRef = useRef<HTMLInputElement>(null);
  const inviteRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!outcomeText && !myAppealText) {
        alert("Please upload at least your Appeal Letter or the Outcome Letter.");
        return;
    }
    
    const fullEvidenceCorpus = documents.map(d => 
        `--- DOCUMENT: ${d.fileName} (TYPE: ${d.author === 'Claimant' ? 'PREP/NOTES' : 'OFFICIAL EVIDENCE'}) ---\n${d.textContent || '(No extracted text)'}`
    ).join('\n\n');

    setIsLoading(true);
    const result = await generateAppealPack(
        outcomeText, 
        timeline, 
        contextSummary, 
        fullEvidenceCorpus,
        apiKey,
        myAppealText,
        respondentInviteText
    );
    setPack(result);
    setIsLoading(false);
  };

  const handleExportPack = () => {
    if (pack) {
      const content = generateAppealPackTXT(pack);
      downloadTXT(content, 'Grievance_Appeal_Pack_Submission');
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File, setText: (t: string) => void) => {
    if (!file || !apiKey) return;
    try {
        let text = '';
        if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
             const base64 = await readFileAsBase64(file);
             text = await extractDocumentContent({ mimeType: file.type, data: base64 }, apiKey);
        } else {
            text = await file.text();
        }
        setText(text);
    } catch (e) {
        console.error("Upload failed", e);
        alert(`Failed to read ${file.name}`);
    }
  };

  if (!pack && !isLoading) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
            <div className="bg-slate-100 p-6 rounded-full mb-6 text-indigo-600"><GavelIcon /></div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Grievance Appeal Pack Generator</h2>
            <p className="text-slate-500 mb-8 text-center max-w-xl">
              Upload your documents below. The AI will act as a King's Counsel (KC) to produce a complete, multi-part legal submission designed to win your appeal.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
                {/* 1. Outcome Letter */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase">1. Grievance Outcome</h3>
                    <p className="text-xs text-slate-500 mb-4 h-8">The original decision.</p>
                    <textarea 
                        className="w-full h-32 p-3 border rounded text-xs mb-3 resize-none"
                        placeholder="Paste text..."
                        value={outcomeText}
                        onChange={e => setOutcomeText(e.target.value)}
                    />
                    <div className="mt-auto">
                        <input type="file" ref={outcomeRef} className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0], setOutcomeText)} />
                        <button onClick={() => outcomeRef.current?.click()} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center justify-center gap-2">
                            <UploadIcon /> Upload File
                        </button>
                    </div>
                </div>

                {/* 2. My Appeal */}
                <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-sm flex flex-col ring-1 ring-indigo-100">
                    <h3 className="font-bold text-indigo-800 mb-2 text-sm uppercase">2. My Appeal Letter</h3>
                    <p className="text-xs text-slate-500 mb-4 h-8">Your draft arguments.</p>
                    <textarea 
                        className="w-full h-32 p-3 border rounded text-xs mb-3 resize-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Paste text..."
                        value={myAppealText}
                        onChange={e => setMyAppealText(e.target.value)}
                    />
                    <div className="mt-auto">
                        <input type="file" ref={appealRef} className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0], setMyAppealText)} />
                        <button onClick={() => appealRef.current?.click()} className="w-full py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-bold rounded flex items-center justify-center gap-2">
                            <UploadIcon /> Upload File
                        </button>
                    </div>
                </div>

                {/* 3. Respondent Invite */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase">3. Respondent Invite</h3>
                    <p className="text-xs text-slate-500 mb-4 h-8">The "Grounds" they accepted.</p>
                    <textarea 
                        className="w-full h-32 p-3 border rounded text-xs mb-3 resize-none"
                        placeholder="Paste text..."
                        value={respondentInviteText}
                        onChange={e => setRespondentInviteText(e.target.value)}
                    />
                    <div className="mt-auto">
                        <input type="file" ref={inviteRef} className="hidden" onChange={e => e.target.files?.[0] && processFile(e.target.files[0], setRespondentInviteText)} />
                        <button onClick={() => inviteRef.current?.click()} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center justify-center gap-2">
                            <UploadIcon /> Upload File
                        </button>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={handleGenerate} 
                disabled={(!outcomeText && !myAppealText)}
                className="px-10 py-4 bg-indigo-600 text-white rounded-xl shadow-lg font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
                <GavelIcon /> Generate KC-Level Appeal Pack
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
         <div className="flex justify-between items-start mb-4">
            <div>
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><GavelIcon /> KC-Grade Appeal Dossier</h2>
               <p className="text-sm text-slate-500">A comprehensive legal submission ready for the Appeal Manager.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportPack} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm">
                  <DownloadIcon/> Download Full Appeal Pack
              </button>
              <button onClick={() => setPack(null)} className="text-sm text-slate-500 hover:text-slate-800 underline">Start Over</button>
            </div>
         </div>

         <div className="flex gap-1 border-b border-slate-200">
            <button onClick={() => setActiveTab('summary')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'summary' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Summary & Remedy
            </button>
            <button onClick={() => setActiveTab('flaws')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'flaws' ? 'border-orange-600 text-orange-700 bg-orange-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Procedural Flaws (ACAS)
            </button>
            <button onClick={() => setActiveTab('risks')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'risks' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Legal Risks for Employer
            </button>
            <button onClick={() => setActiveTab('matrix')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'matrix' ? 'border-blue-600 text-blue-700 bg-blue-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                Forensic Evidence Matrix
            </button>
         </div>
      </div>

      {isLoading ? (
         <div className="flex-1 flex items-center justify-center flex-col">
             <div className="scale-150 text-indigo-600 mb-4"><LoaderIcon /></div>
             <p className="text-slate-500">Generating comprehensive legal submission...</p>
         </div>
      ) : (
         <div className="flex-1 overflow-auto p-1">
            {activeTab === 'summary' && pack && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border">
                        <h3 className="font-bold text-slate-500 text-xs uppercase mb-2">Cover Letter</h3>
                        <pre className="text-sm font-serif whitespace-pre-wrap text-slate-800 bg-slate-50 p-4 rounded-md border">{pack.coverLetter}</pre>
                    </div>
                    <div className="bg-white p-6 rounded-lg border">
                        <h3 className="font-bold text-slate-500 text-xs uppercase mb-2">Executive Summary</h3>
                        <p className="text-base text-slate-800 italic bg-slate-50 p-4 rounded-md border">"{pack.executiveSummary}"</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg border">
                        <h3 className="font-bold text-slate-500 text-xs uppercase mb-2">Requested Remedy</h3>
                        <p className="text-base font-bold text-green-700 bg-green-50 p-4 rounded-md border border-green-200">{pack.requestedRemedy}</p>
                    </div>
                </div>
            )}
             {activeTab === 'flaws' && pack && (
                <div className="space-y-4">
                    {(pack.proceduralFlaws || []).map((flaw, i) => (
                        <div key={i} className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-orange-800">Area: {flaw.area}</span>
                                <span className="text-xs font-mono bg-orange-100 text-orange-700 px-2 py-1 rounded">{flaw.acasCodeReference}</span>
                            </div>
                            <p className="text-sm text-slate-700 mb-2">{flaw.breachDescription}</p>
                            <div className="bg-slate-50 p-2 rounded border text-xs text-slate-600"><strong>Significance:</strong> {flaw.legalSignificance}</div>
                        </div>
                    ))}
                </div>
            )}
            {activeTab === 'risks' && pack && (
                <div className="space-y-4">
                    {(pack.legalRisksForEmployer || []).map((risk, i) => (
                        <div key={i} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                             <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-red-800">{risk.claim}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded text-white ${risk.riskLevel === 'High' ? 'bg-red-600' : 'bg-orange-500'}`}>{risk.riskLevel} RISK</span>
                            </div>
                            <p className="text-sm text-slate-700">{risk.rationale}</p>
                        </div>
                    ))}
                </div>
            )}
            {activeTab === 'matrix' && (
                <div className="overflow-x-auto bg-white rounded-lg border">
                    <table className="w-full text-sm text-left border-collapse min-w-[1200px]">
                        <thead className="bg-slate-50 text-slate-500 border-b-2 border-slate-200">
                            <tr>
                                <th className="p-3 w-12 text-center">#</th>
                                <th className="p-3 w-1/5">Employer's Finding</th>
                                <th className="p-3 w-1/6">Claimant's Argument</th>
                                <th className="p-3 w-1/4">"Smoking Gun" Evidence</th>
                                <th className="p-3 w-1/6">Impact & Question</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(pack?.forensicAppealPoints || []).map((point) => (
                                <tr key={point.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 align-top">
                                    <td className="p-4 text-center font-bold text-slate-400">{point.findingNumber}</td>
                                    <td className="p-4"><p className="text-slate-700 italic">"{point.employerFinding}"</p></td>
                                    <td className="p-4">
                                        <span className="font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-md inline-block mb-2 text-xs">{point.rebuttalCategory}</span>
                                        <p className="text-slate-800 font-medium">{point.claimantArgument}</p>
                                    </td>
                                    <td className="p-4">
                                        <ul className="space-y-2">
                                            {(point.smokingGunEvidence || []).map((ev, k) => (
                                                <li key={k} className="text-xs text-blue-900 bg-blue-50 p-2 rounded border border-blue-100 font-mono">
                                                    <p className="italic">"{ev.quote}"</p>
                                                    <p className="text-right text-[10px] text-slate-500 mt-1">Ref: {ev.documentRef} {ev.pageNumber ? `(p. ${ev.pageNumber})` : ''}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="p-4 space-y-3">
                                        <div className="bg-purple-50 p-2 rounded border border-purple-100">
                                            <span className="text-[10px] font-bold text-purple-700 uppercase">Impact on Case</span>
                                            <p className="text-xs text-purple-900">{point.impactOnCase}</p>
                                        </div>
                                         <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                            <span className="text-[10px] font-bold text-orange-700 uppercase">Question to Ask</span>
                                            <p className="text-xs text-orange-900 italic">"{point.questionForDecisionMaker}"</p>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {(pack?.forensicAppealPoints || []).length === 0 && (
                        <div className="p-10 text-center text-slate-400">No appeal points generated. The analysis may have been interrupted or no clear contradictions were found.</div>
                     )}
                </div>
            )}
         </div>
      )}
    </div>
  );
};

export default GrievanceAppealView;
