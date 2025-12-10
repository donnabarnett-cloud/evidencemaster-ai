
import React, { useState } from 'react';
import { performDeepCrossAnalysis } from '../services/geminiService';
import { TribunalStrategy, TimelineEvent, Issue, MedicalEvidence, UserNote } from '../types';
import { LoaderIcon, GavelIcon, AlertIcon, CheckIcon, SearchIcon, FileIcon, ChartIcon } from './Icons';
import PrecedentFinder from './PrecedentFinder'; 

interface TribunalPrepViewProps {
  timeline: TimelineEvent[];
  issues: Issue[];
  strategy: TribunalStrategy | null;
  setStrategy: (strategy: TribunalStrategy | null) => void;
  apiKey?: string;
  contextSummary: string;
  medicalEvidence: MedicalEvidence[];
  userNotes?: UserNote[]; 
}

const TribunalPrepView: React.FC<TribunalPrepViewProps> = ({ timeline, issues, strategy, setStrategy, apiKey, contextSummary, medicalEvidence, userNotes }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'strategy' | 'facts' | 'respondent' | 'outcomes' | 'stresstest' | 'judge' | 'claims' | 'witness' | 'medical' | 'adjustments' | 'research' | 'procedure' | 'cross-exam'>('strategy');
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    const result = await performDeepCrossAnalysis(timeline, issues, contextSummary, medicalEvidence, userNotes || [], apiKey);
    if (result) {
      setStrategy(result);
    } else {
      setError("Analysis failed or timed out. Try reducing document complexity or try again.");
    }
    setIsLoading(false);
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestion(expandedQuestion === id ? null : id);
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center max-w-lg mx-auto">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-blue-500">
          <GavelIcon />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Awaiting Evidence</h3>
        <p className="text-slate-500 mb-6">
          Please upload documents and allow the system to extract the timeline before running the Solicitor Analysis.
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
        <h3 className="text-lg font-medium text-slate-700">Running Deep Legal Analysis...</h3>
        <p className="text-slate-500 mt-2 max-w-md text-center">
          Conducting Google Search for Precedents, Running Monte Carlo Simulations, Stress-Testing Arguments, and Predicting Judicial Outcome.
        </p>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="max-w-2xl bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-center mb-6 text-blue-600">
             <GavelIcon />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Solicitor-Grade Case Review</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            EvidenceMaster will now perform a <strong>Deep Cross-Analysis</strong> of your entire bundle.
            <br/><br/>
            Capabilities:
            <ul className="text-sm mt-2 space-y-1 text-slate-500 text-left pl-20">
              <li>• <strong>Precedent Research:</strong> Finds UK Case Law relevant to your facts.</li>
              <li>• <strong>Strategic Outcome Modelling:</strong> Simulates settlement vs. win scenarios.</li>
              <li>• <strong>Argument Stress-Test:</strong> Tests case fragility against hostile judges.</li>
              <li>• <strong>Judge Prediction:</strong> Probability of Win/Loss & Reasoning.</li>
              <li>• <strong>Compensation:</strong> Vento Band & Award Estimation.</li>
            </ul>
          </p>
          
          <button 
            onClick={handleGenerate}
            className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-3 mx-auto"
          >
            Run Full Case Analysis
          </button>
          {error && <p className="text-red-500 mt-4 text-sm font-medium border border-red-200 bg-red-50 p-3 rounded">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 h-full flex flex-col">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Case Strategy Dashboard</h2>
            <p className="text-sm text-slate-500 italic mt-1">"{strategy.caseTheory || 'No case theory generated'}"</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Outcome Prediction</div>
              <div className={`text-2xl font-bold ${
                strategy.judgePrediction?.likelyOutcome?.includes('Claimant') ? 'text-green-600' : 
                strategy.judgePrediction?.likelyOutcome?.includes('Respondent') ? 'text-red-600' : 'text-orange-500'
              }`}>
                {strategy.judgePrediction?.probabilityScore || 0}% {strategy.judgePrediction?.likelyOutcome?.split(' ')[0] || 'Unknown'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Credibility</div>
              <div className={`text-2xl font-bold ${strategy.credibilityScore > 70 ? 'text-green-600' : strategy.credibilityScore > 40 ? 'text-orange-500' : 'text-red-600'}`}>
                {strategy.credibilityScore || 0}/100
              </div>
            </div>
            <button 
              onClick={handleGenerate} 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Re-run Analysis"
            >
              <div className="w-5 h-5"><SearchIcon /></div>
            </button>
          </div>
        </div>
        
        <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
          {[
            { id: 'strategy', label: 'Case Merits' },
            { id: 'facts', label: 'Findings of Fact' }, // NEW
            { id: 'respondent', label: 'The Respondent' }, 
            { id: 'outcomes', label: 'Future Scenarios' },
            { id: 'stresstest', label: 'Stress Test' },
            { id: 'judge', label: "Judge's Chambers" },
            { id: 'claims', label: "Claims Simulator" },
            { id: 'witness', label: 'Witness Analysis' },
            { id: 'research', label: 'Case Law' },
            { id: 'medical', label: 'Medical' },
            { id: 'adjustments', label: 'Adjustments' },
            { id: 'procedure', label: 'Procedure' },
            { id: 'cross-exam', label: 'Hearing' },
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
        
        {activeTab === 'strategy' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm">
              <h3 className="text-green-700 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                <CheckIcon /> Case Strengths
              </h3>
              <ul className="space-y-3">
                {(strategy.strengths || []).map((point, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-green-500">•</span> {point}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl border border-red-100 shadow-sm">
              <h3 className="text-red-600 font-bold uppercase text-xs tracking-wider mb-4 flex items-center gap-2">
                <AlertIcon /> Critical Weaknesses & Rebuttals
              </h3>
              {(strategy.weaknessAnalysis || []).length > 0 ? (
                 <div className="space-y-4">
                    {(strategy.weaknessAnalysis || []).map((w, i) => (
                       <div key={i} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                             <span className="text-sm font-medium text-slate-800">{w.weakness}</span>
                             <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                w.impact === 'High' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                             }`}>{w.impact} Impact</span>
                          </div>
                          <div className="bg-blue-50 p-2 rounded text-xs text-blue-800 mt-2">
                             <strong>Fix:</strong> {w.rebuttalStrategy}
                          </div>
                       </div>
                    ))}
                 </div>
              ) : (
                 <ul className="space-y-3">
                   {(strategy.weaknesses || []).map((point, i) => (
                     <li key={i} className="text-sm text-slate-700 flex gap-2">
                       <span className="text-red-500">•</span> {point}
                     </li>
                   ))}
                 </ul>
              )}
            </div>
            
             <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 md:col-span-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-xs text-purple-700 font-bold uppercase mb-1">Injury to Feelings (Vento Band Estimate)</span>
                      <p className="text-2xl font-extrabold text-purple-900">{strategy.ventoBandAssessment?.band || 'N/A'} Band</p>
                      <p className="text-lg font-bold text-purple-800">{strategy.ventoBandAssessment?.estimate || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                       <span className="block text-xs text-purple-700 font-bold uppercase mb-1">Total Est. Compensation</span>
                       <p className="text-2xl font-extrabold text-purple-900">{strategy.compensationEstimate || 'N/A'}</p>
                    </div>
                  </div>
                  <p className="text-sm text-purple-700 italic mt-4 bg-white/50 p-3 rounded">{strategy.ventoBandAssessment?.rationale || 'No rationale provided.'}</p>
             </div>
          </div>
        )}

        {/* NEW TAB: FINDINGS OF FACT */}
        {activeTab === 'facts' && (
           <div className="space-y-6">
             <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
               <p className="text-sm text-indigo-800 font-medium">
                 <strong>Findings of Fact:</strong> These are points the Tribunal is likely to accept as established fact based on the documentary evidence.
               </p>
             </div>
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 text-slate-500">
                      <tr>
                         <th className="p-4 font-medium">Fact</th>
                         <th className="p-4 font-medium">Status</th>
                         <th className="p-4 font-medium">Evidence Source</th>
                         <th className="p-4 font-medium">Relevance</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {(strategy.findingsOfFact || []).map((f, i) => (
                         <tr key={i} className="hover:bg-slate-50">
                            <td className="p-4 text-slate-800 font-medium">{f.fact}</td>
                            <td className="p-4">
                               <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                  f.status === 'Agreed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                               }`}>{f.status}</span>
                            </td>
                            <td className="p-4 text-slate-500 font-mono text-xs">{f.source}</td>
                            <td className="p-4 text-slate-600 italic">{f.relevance}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {(strategy.findingsOfFact || []).length === 0 && <div className="p-8 text-center text-slate-400">No facts extracted.</div>}
             </div>
           </div>
        )}

        {activeTab === 'respondent' && (
           <div className="space-y-6">
             {strategy.respondentPsychology && (
               <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 text-white shadow-lg">
                 <h3 className="text-slate-300 font-bold uppercase text-xs tracking-wider mb-4">Respondent Psychology Profile</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div>
                     <span className="text-xs text-slate-500 uppercase font-bold">Archetype</span>
                     <p className="text-xl font-bold text-white">{strategy.respondentPsychology.profile || 'Unknown'}</p>
                   </div>
                   <div>
                     <span className="text-xs text-slate-500 uppercase font-bold">Settlement Propensity</span>
                     <p className={`text-xl font-bold ${
                       strategy.respondentPsychology.settlementPropensity === 'High' ? 'text-green-400' : 'text-red-400'
                     }`}>{strategy.respondentPsychology.settlementPropensity || 'Unknown'}</p>
                   </div>
                   <div>
                     <span className="text-xs text-slate-500 uppercase font-bold">Likely Next Move</span>
                     <p className="text-sm text-white">{strategy.respondentPsychology.likelyNextMove || 'Unknown'}</p>
                   </div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-slate-700">
                    <span className="text-xs text-slate-500 uppercase font-bold">Pressure Points</span>
                    <ul className="mt-2 space-y-1">
                      {(strategy.respondentPsychology.pressurePoints || []).map((pp, i) => (
                        <li key={i} className="text-sm text-slate-300 flex gap-2">
                           <span className="text-red-500">⚠</span> {pp}
                        </li>
                      ))}
                    </ul>
                 </div>
               </div>
             )}

             <div className="space-y-4">
                <h3 className="font-bold text-slate-800 text-lg">Likely Respondent Legal Arguments</h3>
                {(strategy.respondentArguments || []).length === 0 ? (
                   <div className="p-4 bg-slate-50 text-slate-500 italic rounded">No specific legal arguments predicted yet.</div>
                ) : (
                   (strategy.respondentArguments || []).map((arg, i) => (
                     <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                           <h4 className="font-bold text-slate-800 text-lg">"{arg.argument}"</h4>
                           <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase text-white ${
                              arg.likelihood === 'High' ? 'bg-red-500' : 'bg-orange-400'
                           }`}>{arg.likelihood} Probability</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-red-50 p-3 rounded border border-red-100">
                              <span className="text-xs font-bold text-red-700 uppercase block mb-1">Their Weakness</span>
                              <p className="text-sm text-red-900">{arg.weakness}</p>
                           </div>
                           <div className="bg-blue-50 p-3 rounded border border-blue-100">
                              <span className="text-xs font-bold text-blue-700 uppercase block mb-1">Your Counter-Argument</span>
                              <p className="text-sm text-blue-900">{arg.counterArgument}</p>
                           </div>
                        </div>
                     </div>
                   ))
                )}
             </div>
           </div>
        )}

        {activeTab === 'outcomes' && (
           <div className="space-y-6">
             <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <p className="text-sm text-emerald-800 font-medium">
                  <strong>Strategic Outcome Modeller:</strong> Instead of a single prediction, we simulate three possible futures based on historical discrimination case data patterns. This helps you weigh settlement vs. risk.
                </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {(strategy.outcomeScenarios || []).map((scenario, i) => (
                 <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 text-center">
                       <h4 className="font-bold text-slate-800">{scenario.name}</h4>
                       <div className="text-xs text-slate-500 font-mono mt-1">{scenario.probability}% Probability</div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                       <div className="text-center mb-6">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Value</span>
                         <div className="text-2xl font-extrabold text-slate-800 mt-1">{scenario.financialRange}</div>
                       </div>
                       <p className="text-sm text-slate-600 mb-4 flex-1 italic">"{scenario.description}"</p>
                       <div className="bg-blue-50 p-3 rounded border border-blue-100 text-xs text-blue-800">
                          <strong>Advice:</strong> {scenario.strategicAdvice}
                       </div>
                    </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {activeTab === 'stresstest' && (
           <div className="space-y-6">
             <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <p className="text-sm text-orange-800 font-medium">
                  <strong>Argument Stress-Test:</strong> We simulated your case against 3 judicial archetypes (Strict, Empathetic, Forensic) to identify fragile arguments.
                </p>
             </div>

             <div className="space-y-4">
                {(strategy.stressTestResults || []).map((result, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                     <div className="flex items-center">
                        <div className={`w-2 h-full min-h-[100px] ${
                           result.fragilityScore > 70 ? 'bg-red-500' : result.fragilityScore > 40 ? 'bg-orange-500' : 'bg-green-500'
                        }`}></div>
                        <div className="p-5 flex-1">
                           <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-slate-800 text-lg">"{result.argument}"</h4>
                              <div className="text-right">
                                 <div className="text-xs text-slate-400 uppercase font-bold">Fragility Score</div>
                                 <div className={`text-xl font-bold ${
                                     result.fragilityScore > 70 ? 'text-red-600' : 'text-orange-500'
                                 }`}>{result.fragilityScore}/100</div>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                              <div>
                                 <span className="text-xs font-bold text-red-600 uppercase mb-1 block">Breaking Point</span>
                                 <p className="text-sm text-slate-700">{result.breakingPoint}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                                 <span className="text-xs font-bold text-slate-500 uppercase mb-1 block flex gap-1 items-center"><GavelIcon /> Judicial Perspective</span>
                                 <p className="text-sm text-slate-600 italic">"{result.judicialPerspective}"</p>
                              </div>
                           </div>

                           {result.strengtheningAdvice && (
                             <div className="mt-4 bg-green-50 p-3 rounded border border-green-100 flex gap-3">
                                <div className="text-green-600 mt-0.5"><CheckIcon /></div>
                                <div>
                                   <span className="text-xs font-bold text-green-700 uppercase block mb-1">How to Strengthen This</span>
                                   <p className="text-sm text-green-900">{result.strengtheningAdvice}</p>
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        )}

        {activeTab === 'judge' && strategy.judgePrediction && (
          <div className="space-y-6">
             <div className="bg-slate-900 text-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                   <div className="bg-slate-700 p-3 rounded-full"><GavelIcon /></div>
                   <div>
                     <h3 className="text-lg font-bold">Judicial Prediction</h3>
                     <p className="text-slate-400 text-sm">Based on probability analysis of evidence vs statute.</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Likely Outcome</div>
                      <div className={`text-4xl font-extrabold ${
                        strategy.judgePrediction.likelyOutcome?.includes('Claimant') ? 'text-green-400' : 'text-red-400'
                      }`}>{strategy.judgePrediction.likelyOutcome || 'Unknown'}</div>
                      <div className="mt-2 text-sm text-slate-300">Confidence: {strategy.judgePrediction.probabilityScore}%</div>
                   </div>
                   <div>
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">The Turning Point</div>
                      <div className="text-lg font-medium text-white italic">"{strategy.judgePrediction.keyTurningPoint || 'N/A'}"</div>
                   </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-700">
                   <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Judicial Reasoning</div>
                   <p className="text-slate-300 leading-relaxed font-serif text-lg">{strategy.judgePrediction.judicialReasoning || 'No reasoning available.'}</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'claims' && strategy.judgePrediction?.claimSimulations && (
          <div className="space-y-6">
             <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
              <p className="text-sm text-indigo-800">
                <strong>The Quantum Simulator:</strong> Breaking down the win probability for each specific head of claim based on the evidence available.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {(strategy.judgePrediction.claimSimulations || []).map((sim, i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                   <div className={`w-2 md:w-auto md:min-w-[8px] ${
                      sim.probabilitySuccess > 60 ? 'bg-green-500' : sim.probabilitySuccess > 40 ? 'bg-orange-500' : 'bg-red-500'
                   }`}></div>
                   <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                         <h4 className="text-lg font-bold text-slate-900">{sim.claimType}</h4>
                         <div className={`text-xl font-bold ${
                            sim.probabilitySuccess > 60 ? 'text-green-600' : sim.probabilitySuccess > 40 ? 'text-orange-600' : 'text-red-600'
                         }`}>{sim.probabilitySuccess}% Success Probability</div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <span className="text-xs font-bold text-green-700 uppercase mb-2 block">Winning Factors</span>
                          <ul className="space-y-1">
                             {(sim.winningFactors || []).map((f, idx) => (
                               <li key={idx} className="text-sm text-slate-600 flex gap-2"><CheckIcon /> {f}</li>
                             ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-red-700 uppercase mb-2 block">Losing Risks</span>
                          <ul className="space-y-1">
                             {(sim.losingRisks || []).map((f, idx) => (
                               <li key={idx} className="text-sm text-slate-600 flex gap-2"><AlertIcon /> {f}</li>
                             ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100">
                         <span className="text-xs font-bold text-slate-400 uppercase">Relevant Precedent</span>
                         <p className="text-sm text-slate-800 font-medium">{sim.relevantCaseLaw}</p>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'witness' && (
          <div className="space-y-6">
             <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-6">
              <p className="text-sm text-orange-800">
                <strong>The Rashomon Effect:</strong> Below are specific events where witnesses have provided conflicting accounts. The AI has analyzed credibility based on corroborating evidence.
              </p>
            </div>
            
            {!(strategy.conflictingAccounts || []).length ? (
               <div className="text-center p-10 text-slate-400">No direct witness conflicts detected.</div>
            ) : (
               (strategy.conflictingAccounts || []).map((conflict, i) => (
                 <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200">
                       <h4 className="font-bold text-slate-800 text-sm">Event: {conflict.eventDescription}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2">
                       <div className="p-4 border-r border-slate-100">
                          <div className="text-xs font-bold text-slate-400 uppercase mb-2">{conflict.witnessA?.name || 'Witness A'}'s Version</div>
                          <div className="bg-red-50 p-3 rounded text-sm text-slate-700 italic border-l-4 border-red-300">
                            "{conflict.witnessA?.version || 'N/A'}"
                          </div>
                          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1"><FileIcon /> {conflict.witnessA?.source || 'Unknown Source'}</div>
                       </div>
                       <div className="p-4">
                          <div className="text-xs font-bold text-slate-400 uppercase mb-2">{conflict.witnessB?.name || 'Witness B'}'s Version</div>
                          <div className="bg-blue-50 p-3 rounded text-sm text-slate-700 italic border-l-4 border-blue-300">
                            "{conflict.witnessB?.version || 'N/A'}"
                          </div>
                          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1"><FileIcon /> {conflict.witnessB?.source || 'Unknown Source'}</div>
                       </div>
                    </div>
                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                       <span className="text-xs font-bold text-slate-500 uppercase">Credibility Finding</span>
                       <p className="text-sm text-slate-800 mt-1">{conflict.analysis}</p>
                    </div>
                 </div>
               ))
            )}
          </div>
        )}

        {activeTab === 'research' && (
          <div className="space-y-6">
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
              <p className="text-sm text-blue-800">
                <strong>AI Legal Research:</strong> The system has performed Google Searches to find specific UK Case Law precedents that match the facts of this case.
              </p>
            </div>

            <PrecedentFinder apiKey={apiKey} />

            <div className="my-6 border-t border-slate-200"></div>
            <h4 className="font-bold text-slate-700 mb-4">Auto-Generated Precedents</h4>

            {!(strategy.legalResearch || []).length ? (
               <div className="text-center p-10 text-slate-400">No specific case law precedents found yet.</div>
            ) : (
               (strategy.legalResearch || []).map((note, i) => (
                 <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <h4 className="text-lg font-bold text-slate-800">{note.relevantPrecedent}</h4>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded mt-1 inline-block">{note.topic}</span>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <div>
                          <span className="text-xs font-bold text-slate-400 uppercase">Principle of Law</span>
                          <p className="text-sm text-slate-700 mt-1">{note.summaryOfLaw}</p>
                       </div>
                       <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                          <span className="text-xs font-bold text-green-700 uppercase">Application to Your Facts</span>
                          <p className="text-sm text-green-900 mt-1 font-medium">{note.applicationToFact}</p>
                       </div>
                       {note.sourceUrl && (
                         <div className="text-right">
                           <a href={note.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View Source</a>
                         </div>
                       )}
                    </div>
                 </div>
               ))
            )}
          </div>
        )}


        {activeTab === 'medical' && (
          <div className="space-y-4">
             {(!(strategy.medicalHighlights || []).length) ? (
               <div className="text-center p-10 text-slate-400">No specific medical markers found in the analysis context.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(strategy.medicalHighlights || []).map((m, i) => (
                   <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                         <span className="text-xs font-bold text-slate-500 uppercase">{m.date}</span>
                         <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide">{m.type}</span>
                      </div>
                      <h4 className="font-semibold text-slate-800 mb-2">{m.value}</h4>
                      <p className="text-sm text-slate-600 italic mb-3">"{m.context}"</p>
                   </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'adjustments' && (
           <div className="space-y-4">
            {(!(strategy.adjustmentsAnalysis || []).length) ? (
               <div className="text-center p-10 text-slate-400">No adjustment requests identified.</div>
            ) : (
              <div className="space-y-3">
                {(strategy.adjustmentsAnalysis || []).map((adj, i) => (
                  <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className={`w-3 h-24 rounded-full flex-shrink-0 ${
                      adj.status === 'Implemented' ? 'bg-green-500' : 
                      adj.status === 'Refused' ? 'bg-red-500' : 
                      'bg-orange-400'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                         <h4 className="font-semibold text-slate-900">{adj.adjustment}</h4>
                         <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded text-white ${
                            adj.status === 'Implemented' ? 'bg-green-500' : 
                            adj.status === 'Refused' ? 'bg-red-500' : 
                            adj.status === 'Delayed' ? 'bg-yellow-500' : 
                            'bg-orange-400' 
                         }`}>{adj.status}</span>
                      </div>
                      <p className="text-sm text-slate-600">{adj.evidence}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
           </div>
        )}

        {activeTab === 'procedure' && (
          <div className="space-y-4">
            {(!(strategy.proceduralBreaches || []).length) ? (
               <div className="text-center p-10 text-slate-400">No obvious ACAS Code breaches detected.</div>
            ) : (
              (strategy.proceduralBreaches || []).map((b, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-12 rounded-full ${
                      b.severity === 'Fatal' ? 'bg-red-500' : b.severity === 'Major' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-500 uppercase">{b.step}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase text-white ${
                           b.severity === 'Fatal' ? 'bg-red-500' : b.severity === 'Major' ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}>{b.severity} Breach</span>
                      </div>
                      <h4 className="font-semibold text-slate-800">{b.breach}</h4>
                      <p className="text-xs text-slate-500 font-mono mt-1">{b.acasCodeRef}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'cross-exam' && (
          <div className="space-y-4">
            {(strategy.questions || []).map((q, index) => (
              <div key={index} className="group bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div 
                  className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleQuestion(index.toString())}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      q.asker === 'Respondent' ? 'border-red-500 text-red-600 bg-red-50' : 'border-blue-500 text-blue-600 bg-blue-50'
                    }`}>
                      {q.asker === 'Respondent' ? 'RES' : 'JUD'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">"{q.question}"</p>
                      <div className="mt-2 text-xs text-slate-400 uppercase tracking-wide">
                        Intent: {q.intent}
                      </div>
                    </div>
                    <div className="text-slate-400">{expandedQuestion === index.toString() ? '−' : '+'}</div>
                  </div>
                </div>
                {expandedQuestion === index.toString() && (
                  <div className="bg-blue-50 p-5 border-t border-blue-100">
                    <h4 className="text-xs font-bold text-blue-800 mb-2 uppercase">Recommended Answer</h4>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {q.suggestedResponse}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default TribunalPrepView;
