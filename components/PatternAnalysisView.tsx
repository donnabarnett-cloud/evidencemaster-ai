
import React, { useState } from 'react';
import { generatePatternAnalysis } from '../services/geminiService';
import { PatternAnalysisResult, TimelineEvent, Issue } from '../types';
import { LoaderIcon, ChartIcon, UsersIcon, SearchIcon, LightbulbIcon, AlertIcon } from './Icons';

interface PatternAnalysisViewProps {
  timeline: TimelineEvent[];
  contextSummary: string;
  issues: Issue[];
  apiKey?: string;
  analysis: PatternAnalysisResult | null;
  setAnalysis: (result: PatternAnalysisResult | null) => void;
}

const PatternAnalysisView: React.FC<PatternAnalysisViewProps> = ({ timeline, contextSummary, issues, apiKey, analysis, setAnalysis }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'patterns' | 'comparators' | 'collective'>('patterns');

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    const result = await generatePatternAnalysis(timeline, contextSummary, issues, apiKey);
    if (result) {
      setAnalysis(result);
    } else {
      setError("Analysis failed. Please try again.");
    }
    setIsLoading(false);
  };

  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center max-w-lg mx-auto">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-indigo-500">
          <ChartIcon />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Pattern Recognition Engine</h3>
        <p className="text-slate-500 mb-6">
          Upload documents to allow the AI to spot temporal themes and suggest comparators.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-indigo-600 mb-4 scale-150">
          <LoaderIcon />
        </div>
        <h3 className="text-lg font-medium text-slate-700">Connecting the Dots...</h3>
        <p className="text-slate-500 mt-2 max-w-md text-center">
          Detecting temporal correlations, retaliatory patterns, and identifying comparators.
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="max-w-2xl bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-center mb-6 text-indigo-600">
             <ChartIcon />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Advanced Evidence Analysis</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            EvidenceMaster will analyze your timeline to find hidden themes.
            <br/><br/>
            <strong>New Capabilities:</strong>
            <ul className="text-sm mt-4 space-y-2 text-slate-500 text-left pl-20 inline-block">
              <li className="flex items-center gap-2"><span className="text-indigo-500 font-bold">📈</span> <strong>Temporal Patterns:</strong> "Did disciplinary action start 3 days after your sick leave?"</li>
              <li className="flex items-center gap-2"><span className="text-teal-500 font-bold">👥</span> <strong>Comparator Helper:</strong> Identifies colleagues treated better (Actual or Hypothetical).</li>
              <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">🧠</span> <strong>Collective Intelligence:</strong> Common pitfalls from 1000s of similar cases.</li>
            </ul>
          </p>
          
          <button 
            onClick={handleGenerate}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-3 mx-auto"
          >
            Run Pattern Analysis
          </button>
          {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 h-full flex flex-col">
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Advanced Pattern Analysis</h2>
            <p className="text-sm text-slate-500 mt-1">Comparator Suggestions • Temporal Correlations • Collective Intelligence</p>
          </div>
          <button 
              onClick={handleGenerate} 
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Re-run Analysis"
            >
              <div className="w-5 h-5"><SearchIcon /></div>
            </button>
        </div>
        
        <div className="flex gap-1 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'patterns' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Temporal Patterns & Themes
          </button>
          <button
            onClick={() => setActiveTab('comparators')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'comparators' ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Comparator Suggestions
          </button>
          <button
            onClick={() => setActiveTab('collective')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'collective' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Collective Intelligence
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        
        {/* TAB: PATTERNS */}
        {activeTab === 'patterns' && (
          <div className="space-y-6">
             <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-2">
                <p className="text-sm text-indigo-800 font-medium">
                  <strong>Thematic Insight:</strong> {(analysis.themes || []).join(" • ")}
                </p>
             </div>

             <div className="grid grid-cols-1 gap-4">
               {(analysis.patterns || []).map((pat, i) => (
                 <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                       <h4 className="font-bold text-slate-800">{pat.name}</h4>
                       <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          pat.type === 'Retaliatory' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                       }`}>{pat.type} Pattern</span>
                    </div>
                    <div className="p-5">
                       <p className="text-slate-700 font-medium mb-3">{pat.description}</p>
                       <div className="bg-orange-50 p-3 rounded border border-orange-100 mb-3">
                          <span className="text-xs font-bold text-orange-700 uppercase block mb-1">Significance</span>
                          <p className="text-sm text-orange-900">{pat.significance}</p>
                       </div>
                       <div>
                          <span className="text-xs font-bold text-slate-400 uppercase">Related Events</span>
                          <ul className="mt-1 space-y-1">
                             {(pat.relatedEvents || []).map((ev, idx) => (
                               <li key={idx} className="text-xs text-slate-500 flex gap-2"><ChartIcon /> {ev}</li>
                             ))}
                          </ul>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* TAB: COMPARATORS */}
        {activeTab === 'comparators' && (
          <div className="space-y-6">
             <div className="bg-teal-50 p-4 rounded-lg border border-teal-100 mb-4">
                <div className="flex items-start gap-3">
                   <div className="mt-1 text-teal-600"><LightbulbIcon /></div>
                   <div>
                      <h4 className="font-bold text-teal-800 text-sm">Why do I need a Comparator?</h4>
                      <p className="text-xs text-teal-700 mt-1">
                        For Direct Discrimination (s13 EqA), you must prove you were treated <em>less favourably</em> than someone else (a comparator) in similar circumstances who does not share your disability.
                      </p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 gap-4">
               {(analysis.comparators || []).map((comp, i) => (
                 <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 flex flex-col md:flex-row gap-6">
                       <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                             <h4 className="font-bold text-lg text-slate-900">{comp.name}</h4>
                             {comp.isReal ? (
                               <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Real Colleague</span>
                             ) : (
                               <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Hypothetical</span>
                             )}
                          </div>
                          <p className="text-sm text-slate-500 mb-3 font-mono">{comp.role}</p>
                          
                          <div className="bg-red-50 p-3 rounded border border-red-100">
                             <span className="text-xs font-bold text-red-700 uppercase block mb-1">Differential Treatment</span>
                             <p className="text-sm text-red-900 font-medium">{comp.treatmentDifference}</p>
                          </div>
                       </div>
                       
                       <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                          <span className="text-xs font-bold text-slate-400 uppercase block mb-2">Supporting Evidence</span>
                          <p className="text-sm text-slate-600 italic leading-relaxed">"{comp.evidence}"</p>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        {/* TAB: COLLECTIVE INTELLIGENCE */}
        {activeTab === 'collective' && (
          <div className="space-y-6">
             <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                <div className="flex items-start gap-3">
                   <div className="mt-1 text-purple-600"><UsersIcon /></div>
                   <div>
                      <h4 className="font-bold text-purple-800 text-sm">Collective Intelligence</h4>
                      <p className="text-xs text-purple-700 mt-1">
                        These insights are derived from the AI's knowledge base of thousands of similar discrimination cases. They highlight common pitfalls claimants with your fact pattern often encounter.
                      </p>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {(analysis.collectiveInsights || []).map((insight, i) => (
                 <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h4 className="font-bold text-slate-800 mb-3 text-lg flex gap-2">
                      <span className="text-red-500">⚠</span> {insight.commonPitfall}
                    </h4>
                    <p className="text-sm text-slate-600 mb-4 flex-1">
                      {insight.relevanceToYou}
                    </p>
                    <div className="bg-green-50 p-3 rounded border border-green-100 mt-auto">
                       <span className="text-xs font-bold text-green-700 uppercase block mb-1">Mitigation Strategy</span>
                       <p className="text-sm text-green-900">{insight.mitigationStrategy}</p>
                    </div>
                    {insight.caseRef && (
                      <div className="mt-2 text-right">
                         <span className="text-xs font-mono text-slate-400">Ref: {insight.caseRef}</span>
                      </div>
                    )}
                 </div>
               ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PatternAnalysisView;
