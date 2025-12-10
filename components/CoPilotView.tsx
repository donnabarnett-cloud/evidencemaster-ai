
import React, { useState } from 'react';
import { generateCaseGraph, performRealityCheck, generateDisabilityAdjustments } from '../services/geminiService';
import { CaseGraphNode, CaseGraphLink, RealityCheckResult, SuggestedAdjustment, TimelineEvent, Issue, MedicalEvidence } from '../types';
import { BrainIcon, GraphIcon, LoaderIcon, LightbulbIcon, AlertIcon, CheckIcon } from './Icons';

interface CoPilotViewProps {
  timeline: TimelineEvent[];
  issues: Issue[];
  contextSummary: string;
  medicalEvidence: MedicalEvidence[];
  apiKey?: string;
}

const CoPilotView: React.FC<CoPilotViewProps> = ({ timeline, issues, contextSummary, medicalEvidence, apiKey }) => {
  const [activeTab, setActiveTab] = useState<'graph' | 'reality' | 'adjustments'>('graph');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Graph
  const [graphData, setGraphData] = useState<{ nodes: CaseGraphNode[], links: CaseGraphLink[] } | null>(null);
  
  // State for Reality Check
  const [actionInput, setActionInput] = useState('');
  const [realityResults, setRealityResults] = useState<RealityCheckResult[]>([]);

  // State for Adjustments
  const [adjustments, setAdjustments] = useState<SuggestedAdjustment[]>([]);

  const handleGenerateGraph = async () => {
    setIsLoading(true);
    const result = await generateCaseGraph(timeline, issues, contextSummary, apiKey);
    setGraphData(result);
    setIsLoading(false);
  };

  const handleRealityCheck = async () => {
    if (!actionInput) return;
    setIsLoading(true);
    const result = await performRealityCheck(actionInput, contextSummary, apiKey);
    setRealityResults(result);
    setIsLoading(false);
  };

  const handleGenerateAdjustments = async () => {
    setIsLoading(true);
    const result = await generateDisabilityAdjustments(contextSummary, medicalEvidence, apiKey);
    setAdjustments(result);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><BrainIcon /></div>
             <div>
               <h2 className="text-xl font-bold text-slate-800">Case Co-Pilot</h2>
               <p className="text-sm text-slate-500">Living Case Graph • Reality Checker • Disability Architect</p>
             </div>
          </div>
        </div>
        
        <div className="flex gap-1 border-b border-slate-200">
          <button onClick={() => setActiveTab('graph')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'graph' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Living Case Map</button>
          <button onClick={() => setActiveTab('reality')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reality' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Reality Check Mode</button>
          <button onClick={() => setActiveTab('adjustments')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'adjustments' ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Adjustments Architect</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isLoading ? (
           <div className="flex flex-col items-center justify-center h-64">
             <div className="scale-150 text-indigo-600 mb-4"><LoaderIcon /></div>
             <p className="text-slate-500 font-medium">Co-Pilot is analyzing...</p>
           </div>
        ) : (
          <>
            {/* GRAPH TAB */}
            {activeTab === 'graph' && (
              <div className="space-y-6">
                {!graphData ? (
                   <div className="text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <GraphIcon />
                      <h3 className="text-lg font-bold text-slate-700 mt-2">Generate Living Case Map</h3>
                      <p className="text-sm text-slate-500 mb-4">Visualize the links between your evidence, issues, and witnesses. Spot gaps instantly.</p>
                      <button onClick={handleGenerateGraph} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Generate Graph</button>
                   </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {graphData.nodes.map((node, i) => (
                       <div key={i} className={`p-4 rounded-xl border shadow-sm ${
                         node.status === 'Missing' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
                       }`}>
                          <div className="flex justify-between mb-2">
                             <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                node.type === 'Issue' ? 'bg-red-100 text-red-700' :
                                node.type === 'Evidence' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-600'
                             }`}>{node.type}</span>
                             <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                node.status === 'Proven' ? 'bg-green-100 text-green-700' :
                                node.status === 'Missing' ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700'
                             }`}>{node.status}</span>
                          </div>
                          <p className="font-medium text-slate-800 text-sm">{node.label}</p>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            )}

            {/* REALITY CHECK TAB */}
            {activeTab === 'reality' && (
              <div className="max-w-3xl mx-auto space-y-6">
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-sm font-bold text-slate-700 mb-2">What action are you planning to take?</label>
                    <textarea 
                      value={actionInput}
                      onChange={(e) => setActionInput(e.target.value)}
                      placeholder="E.g. I am going to refuse to attend the meeting until they apologize..."
                      className="w-full p-3 border border-slate-300 rounded-lg text-sm h-32 mb-4"
                    />
                    <button onClick={handleRealityCheck} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg flex items-center justify-center gap-2">
                       <AlertIcon /> Run Backfire Simulation
                    </button>
                 </div>

                 {realityResults.map((res, i) => (
                   <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center justify-between mb-4">
                         <h3 className="font-bold text-slate-800 text-lg">Simulation Result: {res.action}</h3>
                         <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                            (res.backfireProbability || 0) > 70 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                         }`}>Backfire Risk: {res.backfireProbability}%</div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <span className="text-xs font-bold text-red-700 uppercase block mb-2">Tribunal Perception</span>
                            <p className="text-sm text-slate-700">{res.likelyTribunalReaction}</p>
                         </div>
                         <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <span className="text-xs font-bold text-green-700 uppercase block mb-2">Better Alternative</span>
                            <p className="text-sm text-slate-700">{res.betterAlternative}</p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
            )}

            {/* ADJUSTMENTS TAB */}
            {activeTab === 'adjustments' && (
               <div className="space-y-6">
                  {!adjustments.length ? (
                     <div className="text-center p-10">
                        <LightbulbIcon />
                        <h3 className="text-lg font-bold text-slate-700 mt-2">Disability Adjustments Architect</h3>
                        <p className="text-sm text-slate-500 mb-4">Based on your medical evidence and job role, suggest s20 specific adjustments.</p>
                        <button onClick={handleGenerateAdjustments} className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium">Generate Suggestions</button>
                     </div>
                  ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {adjustments.map((adj, i) => (
                           <div key={i} className="bg-white p-5 rounded-xl border border-teal-100 shadow-sm">
                              <h4 className="font-bold text-teal-800 mb-2">{adj.adjustment}</h4>
                              <p className="text-sm text-slate-600 mb-4">{adj.rationale}</p>
                              {adj.guidanceLink && (
                                 <a href={adj.guidanceLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                    <CheckIcon className="w-3 h-3" /> NGO Guidance
                                 </a>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CoPilotView;