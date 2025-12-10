
import React, { useState } from 'react';
import { generateDraftDocument, checkDraftFairness, generateLegalParagraph } from '../services/geminiService';
import { TimelineEvent, Issue, FairnessCheckResult } from '../types';
import { EditIcon, LoaderIcon, DownloadIcon, SaveIcon, AlertIcon, CheckIcon, TimelineIcon, MagicWandIcon } from './Icons';

interface DraftingStudioProps {
  contextSummary: string;
  issues: Issue[];
  timeline: TimelineEvent[];
  apiKey?: string;
}

const DraftingStudio: React.FC<DraftingStudioProps> = ({ contextSummary, issues, timeline, apiKey }) => {
  const [activeMode, setActiveMode] = useState<'editor' | 'wizard'>('wizard');
  
  // Editor State
  const [docType, setDocType] = useState<'Grievance' | 'Appeal' | 'ET1' | 'Witness Statement'>('Grievance');
  const [userInstructions, setUserInstructions] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [fairnessResults, setFairnessResults] = useState<FairnessCheckResult[]>([]);
  const [showEvidence, setShowEvidence] = useState(true);
  const [evidenceFilter, setEvidenceFilter] = useState<'All' | 'Support' | 'Contradiction'>('All');

  // Wizard State
  const [wizardClaimType, setWizardClaimType] = useState<'s15' | 's20' | 's27'>('s15');
  const [wizardInputs, setWizardInputs] = useState<any>({});
  const [isGeneratingWizard, setIsGeneratingWizard] = useState(false);

  const handleDraft = async () => {
    setIsDrafting(true);
    setFairnessResults([]);
    const result = await generateDraftDocument(docType, contextSummary, issues, timeline, userInstructions, apiKey);
    setDraftContent(result);
    setIsDrafting(false);
  };

  const handleWizardGenerate = async () => {
      setIsGeneratingWizard(true);
      const result = await generateLegalParagraph(wizardClaimType, wizardInputs, contextSummary, apiKey);
      setDraftContent(prev => prev + (prev ? '\n\n' : '') + result);
      setActiveMode('editor');
      setIsGeneratingWizard(false);
  };

  const handleFairnessCheck = async () => {
    if (!draftContent) return;
    setIsChecking(true);
    const results = await checkDraftFairness(draftContent, apiKey);
    setFairnessResults(results);
    setIsChecking(false);
  };

  const insertEvidence = (event: TimelineEvent) => {
      const citation = `On ${event.date}, ${event.event} [Ref: ${event.sourceDoc}]`;
      setDraftContent(prev => prev + (prev.length > 0 ? '\n\n' : '') + citation);
  };

  const downloadDraft = () => {
    const blob = new Blob([draftContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Draft_${docType}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTimeline = timeline.filter(e => {
      if (evidenceFilter === 'All') return true;
      return e.relevanceTag === evidenceFilter;
  });

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
             <div className="bg-purple-100 p-2 rounded text-purple-600"><EditIcon /></div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">Drafting & Statement Builder</h2>
               <p className="text-sm text-slate-500">Generate formal legal documents, build specific claim paragraphs, and check for bias.</p>
             </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-slate-200 mb-4">
            <button 
                onClick={() => setActiveMode('wizard')}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeMode === 'wizard' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
                <MagicWandIcon className="inline w-4 h-4 mr-1"/> Claim Builder Wizard
            </button>
            <button 
                onClick={() => setActiveMode('editor')}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeMode === 'editor' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
                <EditIcon className="inline w-4 h-4 mr-1"/> Editor Mode
            </button>
        </div>

        {activeMode === 'editor' && (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Document Type</label>
                    <select 
                    value={docType} 
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded text-sm bg-slate-50"
                    >
                    <option value="Grievance">Formal Grievance Letter</option>
                    <option value="Appeal">Grievance Appeal Letter</option>
                    <option value="ET1">ET1 Paper of Particulars (Grounds of Claim)</option>
                    <option value="Witness Statement">Witness Statement</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Specific Instructions</label>
                    <input 
                    value={userInstructions}
                    onChange={(e) => setUserInstructions(e.target.value)}
                    placeholder="E.g., Focus on the meeting of 12th July..."
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    />
                </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                <button 
                    onClick={() => setShowEvidence(!showEvidence)}
                    className={`px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-colors ${showEvidence ? 'bg-slate-200 text-slate-700' : 'bg-white border text-slate-500'}`}
                >
                    <TimelineIcon /> {showEvidence ? 'Hide Evidence Sidebar' : 'Show Evidence Sidebar'}
                </button>
                <button 
                    onClick={handleDraft}
                    disabled={isDrafting}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    {isDrafting ? <LoaderIcon /> : <EditIcon />}
                    {isDrafting ? 'Drafting...' : 'Generate Full Draft'}
                </button>
                </div>
            </>
        )}

        {activeMode === 'wizard' && (
            <div className="animate-in fade-in">
                <p className="text-sm text-slate-600 mb-4">
                    Use this wizard to build legally precise paragraphs for your specific claims. The AI will weave your facts into the statutory tests.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Claim Type</label>
                        <select 
                            value={wizardClaimType} 
                            onChange={(e) => { setWizardClaimType(e.target.value as any); setWizardInputs({}); }}
                            className="w-full p-2 border border-purple-300 rounded text-sm bg-purple-50 focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="s15">s15 Discrimination Arising from Disability</option>
                            <option value="s20">s20 Failure to Make Adjustments</option>
                            <option value="s27">s27 Victimisation</option>
                        </select>
                    </div>
                    
                    {/* Dynamic Inputs based on Type */}
                    <div className="col-span-3 grid grid-cols-2 gap-4">
                        {wizardClaimType === 's15' && (
                            <>
                                <input className="p-2 border rounded text-sm" placeholder="The 'Something' (e.g. Sickness Absence)" onChange={e => setWizardInputs({...wizardInputs, something: e.target.value})} />
                                <input className="p-2 border rounded text-sm" placeholder="Unfavourable Treatment (e.g. Warning)" onChange={e => setWizardInputs({...wizardInputs, treatment: e.target.value})} />
                                <input className="p-2 border rounded text-sm col-span-2" placeholder="Link to Disability (e.g. Absence was caused by pain)" onChange={e => setWizardInputs({...wizardInputs, link: e.target.value})} />
                            </>
                        )}
                        {wizardClaimType === 's20' && (
                            <>
                                <input className="p-2 border rounded text-sm" placeholder="The PCP (Rule/Policy)" onChange={e => setWizardInputs({...wizardInputs, pcp: e.target.value})} />
                                <input className="p-2 border rounded text-sm" placeholder="Substantial Disadvantage" onChange={e => setWizardInputs({...wizardInputs, disadvantage: e.target.value})} />
                                <input className="p-2 border rounded text-sm col-span-2" placeholder="The Reasonable Adjustment Required" onChange={e => setWizardInputs({...wizardInputs, adjustment: e.target.value})} />
                            </>
                        )}
                        {wizardClaimType === 's27' && (
                            <>
                                <input className="p-2 border rounded text-sm" placeholder="Protected Act (e.g. Grievance date)" onChange={e => setWizardInputs({...wizardInputs, protectedAct: e.target.value})} />
                                <input className="p-2 border rounded text-sm" placeholder="Detriment (What happened after?)" onChange={e => setWizardInputs({...wizardInputs, detriment: e.target.value})} />
                                <input className="p-2 border rounded text-sm col-span-2" placeholder="Causal Link (Why do you think they are linked?)" onChange={e => setWizardInputs({...wizardInputs, causation: e.target.value})} />
                            </>
                        )}
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button 
                        onClick={handleWizardGenerate}
                        disabled={isGeneratingWizard}
                        className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {isGeneratingWizard ? <LoaderIcon /> : <MagicWandIcon />}
                        Generate Legal Argument & Add to Editor
                    </button>
                </div>
            </div>
        )}
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        
        {/* LEFT: Evidence Sidebar */}
        {showEvidence && (
            <div className="w-80 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm uppercase">Evidence Picker</h3>
                    <select 
                        className="text-xs border rounded p-1"
                        value={evidenceFilter}
                        onChange={(e) => setEvidenceFilter(e.target.value as any)}
                    >
                        <option value="All">All Events</option>
                        <option value="Support">Support (Yellow)</option>
                        <option value="Contradiction">Contradiction (Pink)</option>
                    </select>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {filteredTimeline.map((e, i) => (
                        <div 
                            key={i} 
                            onClick={() => insertEvidence(e)}
                            className="p-3 border border-slate-100 rounded hover:bg-slate-50 cursor-pointer group transition-all"
                        >
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-bold text-slate-500">{e.date}</span>
                                {e.relevanceTag && (
                                    <span className={`w-2 h-2 rounded-full ${
                                        e.relevanceTag === 'Support' ? 'bg-yellow-400' : 
                                        e.relevanceTag === 'Contradiction' ? 'bg-pink-500' : 'bg-blue-400'
                                    }`}></span>
                                )}
                            </div>
                            <p className="text-xs text-slate-800 line-clamp-3 mb-1 group-hover:text-blue-600">
                                {e.event}
                            </p>
                            <div className="text-[10px] text-slate-400 truncate">{e.sourceDoc}</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* CENTER: Editor */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
           <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase">Draft Editor</span>
              <div className="flex gap-2">
                 <button 
                   onClick={handleFairnessCheck}
                   disabled={!draftContent || isChecking}
                   className="text-slate-600 hover:text-blue-600 bg-white border hover:bg-slate-50 px-3 py-1 rounded text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                 >
                   {isChecking ? <LoaderIcon /> : <CheckIcon className="text-green-500" />}
                   Check Fairness & Bias
                 </button>
                 {draftContent && (
                   <button onClick={downloadDraft} className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1">
                     <DownloadIcon /> Download .txt
                   </button>
                 )}
              </div>
           </div>
           {isDrafting ? (
             <div className="flex-1 flex items-center justify-center text-purple-500">
                <div className="scale-150"><LoaderIcon /></div>
             </div>
           ) : (
             <textarea 
               className="flex-1 p-6 font-mono text-sm text-slate-800 focus:outline-none resize-none leading-relaxed"
               value={draftContent}
               onChange={(e) => setDraftContent(e.target.value)}
               placeholder="Generated text will appear here... Click events on the left to insert citations."
             />
           )}
        </div>

        {/* RIGHT: Fairness Check */}
        {(fairnessResults.length > 0 || isChecking) && (
           <div className="w-72 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
             <div className="p-4 bg-slate-50 border-b border-slate-200">
               <h3 className="font-bold text-slate-700 text-sm uppercase">Fairness Audit</h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isChecking && <div className="text-center p-4"><LoaderIcon className="text-blue-500 mx-auto" /></div>}
                
                {!isChecking && fairnessResults.length === 0 && (
                   <div className="text-center text-green-600 p-4">
                     <CheckIcon className="w-8 h-8 mx-auto mb-2" />
                     <p className="text-sm font-medium">No obvious bias detected.</p>
                   </div>
                )}

                {fairnessResults.map((res, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm text-sm">
                     <div className="flex items-center gap-2 mb-2">
                        <AlertIcon className="text-orange-500 w-4 h-4" />
                        <span className="font-bold text-slate-700 text-xs uppercase">{res.issueType}</span>
                     </div>
                     <div className="bg-red-50 text-red-800 p-2 rounded mb-2 italic border-l-2 border-red-300">
                       "{res.flaggedSegment}"
                     </div>
                     <p className="text-slate-600 mb-2">{res.reasoning}</p>
                     <div className="bg-green-50 text-green-800 p-2 rounded border border-green-100">
                        <span className="block text-[10px] font-bold text-green-600 uppercase mb-1">Suggestion</span>
                        {res.suggestion}
                     </div>
                  </div>
                ))}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default DraftingStudio;
