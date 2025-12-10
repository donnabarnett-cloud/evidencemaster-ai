
import React, { useState } from 'react';
import { Issue, ConsolidatedIssue, EthicsRadar, LegalResearchNote, PCP, ProtectedAct } from '../types';
import { DownloadIcon, GavelIcon, AlertIcon, CheckIcon, LoaderIcon, BrainIcon, SearchIcon, VerifiedIcon, FileIcon, BookIcon } from './Icons';
import { generateScottScheduleCSV, downloadCSV } from '../utils/exportUtils';
import { consolidateAndAnalyzeIssues, searchPrecedents, extractLegalFramework } from '../services/geminiService';

interface IssuesViewProps {
  issues: Issue[];
  consolidatedIssues?: ConsolidatedIssue[]; 
  ethicsRadar?: EthicsRadar[]; 
  onUpdate: (index: number, issue: Issue) => void;
  apiKey?: string;
  contextSummary?: string;
}

const IssuesView: React.FC<IssuesViewProps> = ({ issues, consolidatedIssues: initialConsolidated, ethicsRadar: initialRadar, onUpdate, apiKey, contextSummary }) => {
  const [viewMode, setViewMode] = useState<'raw' | 'consolidated' | 'elements'>('consolidated');
  const [isLoading, setIsLoading] = useState(false);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedIssue[]>(initialConsolidated || []);
  const [radarData, setRadarData] = useState<EthicsRadar[]>(initialRadar || []);
  const [selectedIssue, setSelectedIssue] = useState<ConsolidatedIssue | null>(null);
  
  // Legal Framework State
  const [pcps, setPcps] = useState<PCP[]>([]);
  const [protectedActs, setProtectedActs] = useState<ProtectedAct[]>([]);
  
  // State for inline research results
  const [researchResults, setResearchResults] = useState<{ [key: number]: LegalResearchNote[] }>({});
  const [researchingIds, setResearchingIds] = useState<Set<number>>(new Set());

  const handleConsolidate = async () => {
    if (!apiKey || !contextSummary) return;
    setIsLoading(true);
    const result = await consolidateAndAnalyzeIssues(issues, contextSummary, apiKey);
    if (result) {
      setConsolidatedData(result.consolidatedIssues || []);
      setRadarData(result.ethicsRadar || []);
      setViewMode('consolidated');
    }
    setIsLoading(false);
  };
  
  const handleExtractElements = async () => {
      if (!apiKey || !contextSummary) return;
      setIsLoading(true);
      const result = await extractLegalFramework(contextSummary, apiKey);
      if (result) {
          setPcps(result.pcps || []);
          setProtectedActs(result.protectedActs || []);
          setViewMode('elements');
      }
      setIsLoading(false);
  };

  const handleExportScottSchedule = () => {
    const csv = generateScottScheduleCSV(issues);
    downloadCSV(csv, 'Scott_Schedule_Draft');
  };

  const handleResearchIssue = async (index: number, issue: Issue) => {
    if (!apiKey) return;
    
    setResearchingIds(prev => new Set(prev).add(index));
    
    // Construct a specific search query
    const query = `UK Employment Law case precedents for: ${issue.category} - ${issue.description}`;
    const results = await searchPrecedents(query, apiKey);
    
    setResearchResults(prev => ({ ...prev, [index]: results }));
    setResearchingIds(prev => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  if (!issues || issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <p>No issues detected yet. Upload documents to begin analysis.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
         <div className="flex justify-between items-start mb-4">
            <div>
               <h2 className="text-xl font-bold text-slate-800">Legal Findings & Risk Engine</h2>
               <p className="text-sm text-slate-500">Transform scattered risks into definitive legal claims.</p>
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={handleConsolidate}
                 disabled={isLoading}
                 className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition-colors disabled:opacity-50"
               >
                 {isLoading ? <LoaderIcon /> : <BrainIcon />}
                 {consolidatedData.length > 0 ? "Re-Analyze & Group" : "Group into Master Claims"}
               </button>
               <button 
                 onClick={handleExtractElements}
                 disabled={isLoading}
                 className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 rounded-lg font-medium transition-colors disabled:opacity-50"
               >
                 <BookIcon /> Extract PCPs & Protected Acts
               </button>
               <button 
                 onClick={handleExportScottSchedule}
                 className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
               >
                 <DownloadIcon /> Export Scott Schedule
               </button>
            </div>
         </div>

         <div className="flex gap-1 border-b border-slate-200">
            <button 
              onClick={() => setViewMode('consolidated')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${viewMode === 'consolidated' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Master Claims (Consolidated)
            </button>
            <button 
              onClick={() => setViewMode('elements')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${viewMode === 'elements' ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Legal Framework (PCPs)
            </button>
            <button 
              onClick={() => setViewMode('raw')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${viewMode === 'raw' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              Raw Findings ({issues.length})
            </button>
         </div>
      </div>

      {viewMode === 'elements' && (
          <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {pcps.length === 0 && protectedActs.length === 0 && (
                  <div className="col-span-2 text-center py-10 text-slate-400">
                      {isLoading ? (
                          <div className="flex flex-col items-center"><LoaderIcon className="mb-2 scale-150 text-teal-500"/> Extracting legal elements...</div>
                      ) : (
                          "Click 'Extract PCPs & Protected Acts' to identify specific legal elements."
                      )}
                  </div>
              )}
              
              {/* PCP Section */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="bg-teal-100 text-teal-600 p-1 rounded"><GavelIcon /></div>
                      Provisions, Criterions & Practices (PCPs)
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Essential for Section 20 Reasonable Adjustments claims. You must identify what specific "rule" disadvantaged you.</p>
                  
                  <div className="space-y-4">
                      {(pcps || []).map((pcp, i) => (
                          <div key={i} className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                              <h4 className="font-bold text-teal-800 text-sm mb-1">"{pcp.description}"</h4>
                              <div className="text-xs text-slate-600 mb-2">Applied to: <span className="font-medium">{pcp.appliedTo}</span></div>
                              <div className="bg-white p-2 rounded border border-teal-100 text-xs italic text-slate-600">
                                  <strong>Disadvantage:</strong> {pcp.disadvantage}
                              </div>
                              <div className="mt-2 text-[10px] text-slate-400 text-right">Ref: {pcp.sourceDoc}</div>
                          </div>
                      ))}
                  </div>
              </div>
              
              {/* Protected Acts Section */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <div className="bg-purple-100 text-purple-600 p-1 rounded"><VerifiedIcon /></div>
                      Protected Acts
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Essential for Section 27 Victimisation claims. You must prove you did one of these before the bad treatment started.</p>
                  
                  <div className="space-y-4">
                      {(protectedActs || []).map((act, i) => (
                          <div key={i} className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                              <div className="flex justify-between items-start mb-1">
                                  <span className="text-xs font-bold text-purple-600 uppercase">{act.date}</span>
                                  <span className="text-[10px] bg-white border border-purple-100 px-2 rounded-full text-purple-800">{act.type}</span>
                              </div>
                              <h4 className="font-medium text-slate-800 text-sm mb-1">{act.description}</h4>
                              <div className="mt-2 text-[10px] text-slate-400 text-right">Ref: {act.sourceDoc}</div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {viewMode === 'consolidated' && (
        <div className="flex-1 overflow-hidden flex gap-6">
           {consolidatedData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-10 text-center">
                 <BrainIcon />
                 <h3 className="text-lg font-bold text-slate-700 mt-4">Chaos to Clarity</h3>
                 <p className="text-slate-500 max-w-md mt-2">
                   You have {issues.length} raw issues identified. The AI can group them into "Master Claims" (e.g. s15 Discrimination), assess the strength of each, and write your Victim Impact Statement.
                 </p>
                 <button onClick={handleConsolidate} className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-lg hover:bg-indigo-700">
                    {isLoading ? "Analyzing..." : "Run Deep Consolidation"}
                 </button>
              </div>
           ) : (
             <>
               <div className="w-1/3 overflow-y-auto space-y-3 pr-2">
                  {radarData.length > 0 && (
                    <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg mb-4 border border-slate-700">
                       <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3 flex items-center gap-2">
                         <AlertIcon /> Ethics & Credibility Radar
                       </h3>
                       <div className="space-y-3">
                         {(radarData || []).map((item, i) => (
                           <div key={i} className="bg-slate-800 p-3 rounded border border-slate-700">
                              <div className="flex justify-between items-center mb-1">
                                 <span className="font-bold text-sm">{item.tactic}</span>
                                 <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{item.evidenceCount} instances</span>
                              </div>
                              <p className="text-xs text-slate-400">{item.description}</p>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}

                  {(consolidatedData || []).map((issue, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedIssue(issue)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedIssue?.id === issue.id 
                          ? 'bg-indigo-50 border-indigo-500 shadow-md ring-1 ring-indigo-200' 
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{issue.statute}</span>
                             <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase w-fit ${
                                issue.temporalStatus === 'Active/Ongoing' ? 'bg-red-100 text-red-700' :
                                issue.temporalStatus === 'Resolved (Factually)' ? 'bg-green-100 text-green-700' : 
                                'bg-orange-100 text-orange-700'
                             }`}>{issue.temporalStatus || 'Ongoing'}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                             issue.primaFacieStrength === 'Strong' ? 'bg-green-100 text-green-700' :
                             issue.primaFacieStrength === 'Moderate' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>{issue.primaFacieStrength} Case</span>
                       </div>
                       <h3 className="font-bold text-slate-800 mb-1 leading-tight">{issue.legalHead}</h3>
                       <p className="text-xs text-slate-500 line-clamp-2">{issue.summaryOfBreach}</p>
                       <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                          <VerifiedIcon className="w-3 h-3 text-blue-500" />
                          {(issue.combinedEvidence || []).length} Evidence Points
                       </div>
                    </div>
                  ))}
               </div>

               <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                  {selectedIssue ? (
                    <div className="flex-1 overflow-y-auto p-8">
                       <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg"><GavelIcon /></div>
                          <div>
                             <h2 className="text-2xl font-bold text-slate-900">{selectedIssue.legalHead}</h2>
                             <p className="text-slate-500 font-medium">{selectedIssue.statute}</p>
                          </div>
                       </div>

                       {selectedIssue.evolution && (
                         <div className="bg-slate-50 border-l-4 border-slate-400 p-4 mb-6 rounded-r-lg">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Timeline Evolution</h4>
                            <p className="text-sm text-slate-800 italic leading-relaxed">"{selectedIssue.evolution}"</p>
                            {selectedIssue.temporalStatus === 'Resolved (Factually)' && (
                               <p className="text-xs text-green-600 mt-2 font-bold flex items-center gap-1">
                                  <CheckIcon className="w-3 h-3"/> Issue resolved on {selectedIssue.resolutionDate || 'record'}, but historic claim remains valid.
                                </p>
                            )}
                         </div>
                       )}

                       <div className="grid grid-cols-2 gap-6 mb-8">
                          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Tribunal Perspective</h4>
                             <p className="text-sm text-slate-700 font-medium italic leading-relaxed">"{selectedIssue.tribunalPerspective}"</p>
                          </div>
                          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                             <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Missing Proof</h4>
                             <p className="text-sm text-red-600 font-medium leading-relaxed">{selectedIssue.missingProof}</p>
                          </div>
                       </div>

                       <div className="mb-8">
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4 border-b pb-2">Evidence Dossier</h4>
                          <div className="space-y-3">
                             {(selectedIssue.combinedEvidence || []).map((ev, i) => (
                               <div key={i} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                                  <p className="text-sm text-slate-700 italic mb-2">"{ev.quote}"</p>
                                  <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                                     <span>{ev.doc}</span>
                                     <span>{ev.date}</span>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mb-8">
                          <h4 className="text-sm font-bold text-purple-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                            <BrainIcon /> Victim Impact Statement (Draft)
                          </h4>
                          <p className="text-sm text-purple-900 leading-relaxed whitespace-pre-wrap font-serif">
                            {selectedIssue.victimImpact}
                          </p>
                       </div>

                       <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                          <span className="text-xs font-bold text-blue-600 uppercase">Estimated Remedy Impact</span>
                          <p className="text-lg font-bold text-blue-900">{selectedIssue.remedyAssessment}</p>
                       </div>

                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 italic">
                       Select a Master Claim to view the deep legal analysis.
                    </div>
                  )}
               </div>
             </>
           )}
        </div>
      )}

      {viewMode === 'raw' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
            {issues.map((issue, index) => (
               <div key={index} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col h-full">
                  <div className="flex justify-between mb-2">
                     <span className="text-xs font-bold uppercase bg-slate-100 px-2 py-1 rounded text-slate-600">{issue.category}</span>
                     <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                        issue.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                     }`}>{issue.severity}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 mb-2">{issue.description}</p>
                  
                  {/* Legal Rationale & Statutes */}
                  {issue.legalRationale && (
                    <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 mt-2 mb-2 border-l-2 border-indigo-200">
                       <span className="block font-bold text-indigo-800 mb-1">Legal Rationale:</span>
                       {issue.legalRationale}
                    </div>
                  )}
                  
                  {/* Detailed Legal Elements Table */}
                  {issue.legalElements && (issue.legalElements || []).length > 0 && (
                     <div className="mt-3 mb-3 border rounded overflow-hidden">
                        <table className="w-full text-[10px]">
                           <thead className="bg-slate-50 text-slate-500">
                              <tr>
                                 <th className="p-1 text-left">Element</th>
                                 <th className="p-1 text-center">Status</th>
                              </tr>
                           </thead>
                           <tbody>
                              {(issue.legalElements || []).map((el, i) => (
                                 <tr key={i} className="border-t border-slate-100">
                                    <td className="p-1 font-medium text-slate-700">{el.element}</td>
                                    <td className="p-1 text-center">
                                       <span className={`px-1 rounded ${
                                          el.status === 'Met' ? 'bg-green-100 text-green-700' :
                                          el.status === 'Missing' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                       }`}>{el.status}</span>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  )}

                  <div className="mt-auto space-y-2">
                     {(issue.relevantStatutes || []).length > 0 && (
                        <div className="flex flex-wrap gap-1">
                           {(issue.relevantStatutes || []).map((s, i) => (
                              <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">{s}</span>
                           ))}
                        </div>
                     )}
                     
                     {/* Research Button */}
                     <button 
                        onClick={() => handleResearchIssue(index, issue)}
                        disabled={researchingIds.has(index)}
                        className="w-full mt-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                     >
                        {researchingIds.has(index) ? <LoaderIcon /> : <SearchIcon className="w-3 h-3" />}
                        {researchingIds.has(index) ? 'Searching...' : 'Find Case Law Precedents'}
                     </button>

                     {/* Inline Research Results */}
                     {(researchResults[index] || []).length > 0 && (
                        <div className="mt-2 bg-blue-50 border border-blue-100 rounded p-2 animate-in fade-in">
                           <span className="text-[10px] font-bold text-blue-800 uppercase block mb-1">Found Precedents</span>
                           <ul className="space-y-1">
                              {(researchResults[index] || []).slice(0, 2).map((res, r) => (
                                 <li key={r} className="text-[10px] text-slate-700 leading-tight">
                                    <span className="font-bold">{res.relevantPrecedent}:</span> {res.summaryOfLaw.substring(0, 60)}...
                                 </li>
                              ))}
                           </ul>
                        </div>
                     )}

                     {(issue.precedentCases || []).length > 0 && (
                        <div className="text-[10px] text-slate-500 bg-slate-50 p-1.5 rounded flex items-start gap-1">
                           <GavelIcon />
                           <div>
                              <span className="font-bold">Precedents: </span>
                              {(issue.precedentCases || []).join(", ")}
                           </div>
                        </div>
                     )}

                     <p className="text-xs text-slate-500 italic border-t pt-2 mt-2">"{issue.sourceQuote}"</p>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default IssuesView;
