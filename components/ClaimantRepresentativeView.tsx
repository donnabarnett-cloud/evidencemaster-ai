
import React, { useState } from 'react';
import { generateClaimantActionPlan, generateJustificationRebuttal } from '../services/geminiService';
import { ClaimantActionPlan, TimelineEvent, Issue } from '../types';
import { LoaderIcon, BriefcaseIcon, SearchIcon, CheckIcon, AlertIcon, RefreshIcon, InfoIcon, BrainIcon, TargetIcon, GavelIcon } from './Icons';

interface ClaimantRepresentativeViewProps {
  timeline: TimelineEvent[];
  issues: Issue[];
  contextSummary: string;
  apiKey?: string;
  actionPlan: ClaimantActionPlan | null;
  setActionPlan: (plan: ClaimantActionPlan | null) => void;
}

const ClaimantRepresentativeView: React.FC<ClaimantRepresentativeViewProps> = ({ timeline, issues, contextSummary, apiKey, actionPlan, setActionPlan }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'justification' | 'attacks' | 'defense' | 'script' | 'cross-exam'>('summary');

  // Justification State
  const [treatment, setTreatment] = useState('');
  const [employerAim, setEmployerAim] = useState('');
  const [rebuttalPlan, setRebuttalPlan] = useState('');
  const [isRebutting, setIsRebutting] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    const result = await generateClaimantActionPlan(timeline, issues, contextSummary, apiKey);
    if (result) {
      setActionPlan(result);
    } else {
      setError("Failed to generate action plan. The AI analysis was interrupted or timed out. Please try again with fewer documents or check your connection.");
    }
    setIsLoading(false);
  };

  const handleJustificationRebuttal = async () => {
      if (!treatment || !employerAim) return;
      setIsRebutting(true);
      const result = await generateJustificationRebuttal(treatment, employerAim, apiKey);
      setRebuttalPlan(result);
      setIsRebutting(false);
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center max-w-lg mx-auto">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-blue-500">
          <BriefcaseIcon />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Claimant's War Room</h3>
        <p className="text-slate-500 mb-6">
          Awaiting evidence. Upload documents to enable the AI to build your advocacy strategy.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-blue-600 mb-4 scale-150">
          <LoaderIcon />
        </div>
        <h3 className="text-lg font-medium text-slate-700">Building Your Defense Strategy...</h3>
        <p className="text-slate-500 mt-2 max-w-md text-center">
          Analyzing Respondent weaknesses, drafting cross-examination questions, and writing your opening statement.
        </p>
      </div>
    );
  }

  if (!actionPlan) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="max-w-2xl bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-center mb-6 text-blue-600">
             <BriefcaseIcon />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Litigant in Person: Advocacy Engine</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            EvidenceMaster will now switch to <strong>Advocacy Mode</strong>. 
            It will aggressively analyze the evidence to:
            <ul className="text-sm mt-4 space-y-2 text-slate-500 text-left pl-20">
              <li className="flex items-center gap-2"><span className="text-red-500 font-bold">⚔️</span> Dismantle the Respondent's defence.</li>
              <li className="flex items-center gap-2"><span className="text-blue-500 font-bold">🛡️</span> Identify your own weak points to defend.</li>
              <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">🎤</span> Write your Opening & Closing statements.</li>
              <li className="flex items-center gap-2"><span className="text-orange-500 font-bold">🎯</span> Create a "Killer Question" list for cross-examination.</li>
            </ul>
          </p>
          
          <button 
            onClick={handleGenerate}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-3 mx-auto"
          >
            Generate Advocacy Plan
          </button>
          {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 h-full flex flex-col">
       {/* Dashboard Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Advocacy & Representation Plan</h2>
            <p className="text-sm text-slate-500 mt-1">Strategic roadmap for the Self-Represented Litigant.</p>
          </div>
          <button 
              onClick={handleGenerate} 
              className="px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
              title="Re-run Analysis with latest evidence"
            >
              <RefreshIcon /> Refresh Strategy
            </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'summary', label: 'Claim Summary (The Pitch)' },
            { id: 'justification', label: 'Destroying "Justification" (s15)' },
            { id: 'attacks', label: 'Attack Plan (Respondent Weaknesses)' },
            { id: 'defense', label: "Defense Shield (Your Weaknesses)" },
            { id: 'cross-exam', label: 'Cross-Examination' },
            { id: 'script', label: 'Hearing Script' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto">

        {/* TAB: SUMMARY */}
        {activeTab === 'summary' && (
           <div className="space-y-6">
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                  <h3 className="text-indigo-800 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                     <BrainIcon /> Your Elevator Pitch (Judge Q1)
                  </h3>
                  <p className="text-sm text-indigo-700 mb-4">
                     The Judge will ask: <em>"What is your claim about?"</em> You must answer confidently in 2-3 sentences. Do not ramble.
                  </p>
                  
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-200">
                     <p className="text-lg font-medium text-slate-800 leading-relaxed font-serif">
                        "{actionPlan.claimSummary || 'No summary generated yet.'}"
                     </p>
                  </div>
              </div>
           </div>
        )}

        {/* TAB: JUSTIFICATION DESTROYER (NEW) */}
        {activeTab === 'justification' && (
            <div className="space-y-6">
                <div className="bg-slate-900 p-6 rounded-xl text-white border border-slate-700">
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><TargetIcon className="text-red-500" /> The "Justification" Destroyer (s15)</h3>
                    <p className="text-slate-300 text-sm mb-6 max-w-2xl">
                        For s15 Discrimination, the Employer will admit the bad treatment but claim it was a "Proportionate means of achieving a Legitimate Aim".
                        Use this tool to prove it wasn't.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Unfavourable Treatment</label>
                            <input 
                                className="w-full p-3 bg-slate-800 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                placeholder="e.g. Dismissed for sickness absence"
                                value={treatment}
                                onChange={(e) => setTreatment(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Employer's "Aim" / Excuse</label>
                            <input 
                                className="w-full p-3 bg-slate-800 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                                placeholder="e.g. Ensuring consistent attendance"
                                value={employerAim}
                                onChange={(e) => setEmployerAim(e.target.value)}
                            />
                        </div>
                    </div>
                    <button 
                        onClick={handleJustificationRebuttal}
                        disabled={isRebutting || !treatment || !employerAim}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 rounded font-bold transition-colors flex justify-center items-center gap-2"
                    >
                        {isRebutting ? <LoaderIcon /> : <GavelIcon />} Generate Cross-Examination Attack
                    </button>
                </div>

                {rebuttalPlan && (
                    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4">
                        <h4 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Strategic Rebuttal Plan</h4>
                        <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {rebuttalPlan}
                        </div>
                    </div>
                )}
            </div>
        )}
        
        {/* TAB: ATTACKS */}
        {activeTab === 'attacks' && (
          <div className="bg-red-50 p-6 rounded-xl border border-red-100">
            <h3 className="text-red-800 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-xl">⚔️</span> Destructive Arguments
            </h3>
            <p className="text-sm text-red-700 mb-6">Use these points to dismantle the credibility of the Respondent's witnesses and documentation.</p>
            {(actionPlan.respondentDestruction || []).length > 0 ? (
              <ul className="space-y-4">
                {(actionPlan.respondentDestruction || []).map((point, i) => (
                  <li key={i} className="bg-white p-4 rounded-lg shadow-sm border border-red-100 text-slate-800 font-medium flex gap-3">
                    <span className="text-red-500 font-bold">{i+1}.</span>
                    <div>
                      <p>{point}</p>
                      <div className="mt-2 text-xs bg-red-50 text-red-600 p-2 rounded flex items-center gap-1">
                        <InfoIcon className="w-3 h-3"/> <strong>Legal Context:</strong> This attacks their credibility under cross-examination.
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-slate-500 italic">No specific weaknesses identified.</p>}
          </div>
        )}

        {/* TAB: DEFENSE */}
        {activeTab === 'defense' && (
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-blue-800 font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-xl">🛡️</span> Defensive Shield
            </h3>
            <p className="text-sm text-blue-700 mb-6">Prepare answers for these likely attacks on your own credibility or procedural failures.</p>
            {(actionPlan.claimantShield || []).length > 0 ? (
              <ul className="space-y-4">
                {(actionPlan.claimantShield || []).map((point, i) => (
                  <li key={i} className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 text-slate-800 font-medium flex gap-3">
                    <span className="text-blue-500 font-bold">{i+1}.</span>
                    {point}
                  </li>
                ))}
              </ul>
            ) : <p className="text-slate-500 italic">No major vulnerabilities flagged.</p>}
          </div>
        )}

        {/* TAB: CROSS-EXAMINATION */}
        {activeTab === 'cross-exam' && (
          <div className="space-y-6">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-800">
                <strong>Strategy:</strong> Ask these questions to force witnesses into a trap. Do not ask a question unless you know the answer or can impeach them with the document listed.
              </p>
            </div>
            {(actionPlan.crossExaminationStrategy || []).length > 0 ? (
              (actionPlan.crossExaminationStrategy || []).map((q, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Target: {q.targetWitness}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono">Ref: {q.supportingDoc}</span>
                  </div>
                  <div className="p-5">
                    <h4 className="text-lg font-bold text-slate-800 mb-3">"{q.question}"</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-sm text-slate-600">
                        <span className="font-bold text-blue-600 block text-xs uppercase mb-1">Purpose</span>
                        {q.purpose}
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-bold text-red-600 block text-xs uppercase mb-1">The Trap</span>
                        {q.trap}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : <p className="text-slate-400 italic">No cross-examination questions generated.</p>}
          </div>
        )}

        {/* TAB: SCRIPT */}
        {activeTab === 'script' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-slate-900 font-bold text-xl mb-4 border-b pb-2">Opening Statement</h3>
              <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
                {actionPlan.openingStatement || "No opening statement generated. Ensure sufficient evidence is uploaded."}
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-slate-900 font-bold text-xl mb-4 border-b pb-2">Skeleton Argument Structure</h3>
              <div className="space-y-4">
                {(actionPlan.skeletonArgument || []).length > 0 ? (
                  (actionPlan.skeletonArgument || []).map((arg, i) => (
                    <div key={i} className="pl-4 border-l-4 border-slate-200 hover:border-blue-500 transition-colors">
                      <h4 className="font-bold text-lg text-slate-800">{arg.headline}</h4>
                      <p className="text-sm text-slate-500 mb-2 font-mono">{arg.legalBasis}</p>
                      <p className="text-slate-700 mb-2">{arg.keyEvidence}</p>
                      <p className="text-sm text-slate-500 italic">Rebuttal: {arg.rebuttal}</p>
                    </div>
                  ))
                ) : <p className="text-slate-500 italic">No skeleton argument structure generated.</p>}
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-slate-900 font-bold text-xl mb-4 border-b pb-2">Closing Submissions</h3>
              <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap font-serif leading-relaxed">
                {actionPlan.closingStatement || "No closing statement generated."}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ClaimantRepresentativeView;
