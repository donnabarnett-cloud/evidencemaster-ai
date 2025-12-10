

import React, { useState, useEffect } from 'react';
import { generatePreliminaryHearingStrategy, generateContinuingActArgument, generateDisclosureLetter } from '../services/geminiService';
import { PreliminaryHearingStrategy, Issue, UserNote, TimelineEvent, ContinuingActLink } from '../types';
import { LoaderIcon, CalendarIcon, SearchIcon, CheckIcon, AlertIcon, GavelIcon, ClipboardIcon, HandshakeIcon, TimelineIcon, DownloadIcon, FileIcon } from './Icons';
import { generateStrategyTextFile, downloadTXT } from '../utils/exportUtils';

interface PreliminaryHearingViewProps {
  issues: Issue[];
  contextSummary: string;
  userNotes: UserNote[];
  strategy: PreliminaryHearingStrategy | null;
  setStrategy: (strategy: PreliminaryHearingStrategy | null) => void;
  apiKey?: string;
  timeline?: TimelineEvent[]; 
}

const PreliminaryHearingView: React.FC<PreliminaryHearingViewProps> = ({ 
  issues, contextSummary, userNotes, strategy, setStrategy, apiKey, timeline = []
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'issues' | 'orders' | 'jurisdiction'>('summary');
  
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    const result = await generatePreliminaryHearingStrategy(contextSummary, issues, userNotes, apiKey);
    if (result) {
      setStrategy(result);
    } else {
      setError("Failed to generate strategy. Please try again.");
    }
    setIsLoading(false);
  };

  const handleExport = () => {
    if (!strategy) return;
    const content = generateStrategyTextFile(strategy);
    downloadTXT(content, 'Preliminary_Hearing_Strategy');
  };

  if (!issues || issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center max-w-lg mx-auto">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-teal-500">
          <CalendarIcon />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Preliminary Hearing (PH) Navigator</h3>
        <p className="text-slate-500 mb-6">
          Upload documents and extract issues first. This tool will then prepare your Agenda and "List of Issues".
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-teal-600 mb-4 scale-150">
          <LoaderIcon />
        </div>
        <h3 className="text-lg font-medium text-slate-700">Preparing Case Management Strategy...</h3>
        <p className="text-slate-500 mt-2 max-w-md text-center">
          Analysing agenda items, anticipating strike-out tactics, and identifying procedural misrepresentation.
        </p>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="max-w-3xl bg-white p-10 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-center mb-6 text-teal-600">
             <CalendarIcon />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Preliminary Hearing (Case Management)</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            The Preliminary Hearing (PH) is where the Judge decides the "List of Issues" and timetable. 
            <strong>It is administrative, not argumentative.</strong>
            <br/><br/>
            EvidenceMaster will now generate:
            <ul className="text-sm mt-4 space-y-2 text-slate-500 text-left pl-20 inline-block">
              <li className="flex items-center gap-2"><span className="text-teal-500 font-bold">📋</span> <strong>Verbal Summary:</strong> A clear script to read to the Judge.</li>
              <li className="flex items-center gap-2"><span className="text-red-500 font-bold">⚠️</span> <strong>Continuing Act:</strong> Arguments to link early acts to recent ones (Time Limits).</li>
              <li className="flex items-center gap-2"><span className="text-indigo-500 font-bold">⚖️</span> <strong>Draft Timetable:</strong> Proposed dates for CMOs.</li>
              <li className="flex items-center gap-2"><span className="text-orange-500 font-bold">📂</span> <strong>Specific Disclosure:</strong> Documents you MUST demand now.</li>
              <li className="flex items-center gap-2"><span className="text-purple-500 font-bold">🎤</span> <strong>Judge Q&A Prep:</strong> Rehearse answers to common questions.</li>
            </ul>
          </p>
          
          <button 
            onClick={handleGenerate}
            className="px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-3 mx-auto"
          >
            Generate PH Strategy
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
            <h2 className="text-xl font-bold text-slate-800">Preliminary Hearing War Room</h2>
            <p className="text-sm text-slate-500 mt-1">Adversarial analysis of Case Management Orders, List of Issues, and Jurisdiction.</p>
          </div>
          <div className="flex gap-2">
             <button onClick={handleExport} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2">
                <DownloadIcon /> Export Strategy
             </button>
             <button onClick={handleGenerate} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Re-run Analysis">
                <div className="w-5 h-5"><SearchIcon /></div>
             </button>
          </div>
        </div>
        
        <div className="flex gap-1 border-b border-slate-200">
          <button onClick={() => setActiveTab('summary')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'summary' ? 'border-teal-600 text-teal-700 bg-teal-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Summary & Objectives</button>
          <button onClick={() => setActiveTab('issues')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'issues' ? 'border-indigo-600 text-indigo-700 bg-indigo-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>List of Issues</button>
          <button onClick={() => setActiveTab('orders')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'orders' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Case Orders</button>
          <button onClick={() => setActiveTab('jurisdiction')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'jurisdiction' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Jurisdiction & Time</button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        
        {activeTab === 'summary' && (
          <div className="space-y-6">
             <div className="bg-teal-50 p-6 rounded-xl border border-teal-200">
               <h3 className="text-teal-800 font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><ClipboardIcon /> Case Summary for Judge</h3>
               <div className="bg-white p-4 rounded-lg border border-teal-100 text-slate-800 font-medium leading-relaxed shadow-sm">"{strategy.caseSummaryForJudge}"</div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Hearing Objectives</h3>
                   <ul className="space-y-2">{(strategy.hearingObjectives || []).map((obj, i) => (<li key={i} className="text-slate-700 text-sm flex gap-2"><CheckIcon /> {obj}</li>))}</ul>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 text-red-700">Respondent Tactics Radar</h3>
                   <ul className="space-y-3">{(strategy.respondentTacticsRadar || []).map((t, i) => (<li key={i} className="text-sm"><strong className="text-red-600">TACTIC:</strong> {t.tactic} <br/><span className="text-xs text-slate-500 pl-4"><strong>COUNTER:</strong> {t.counterMove}</span></li>))}</ul>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'issues' && (
            <div className="space-y-4">
                {(strategy.listOfIssuesBattleground || []).map((item, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-4 bg-slate-50 border-b border-slate-200"><h4 className="font-bold text-slate-800">Issue: {item.issue}</h4></div>
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="p-4 border-b md:border-b-0 md:border-r border-slate-100">
                                <span className="text-xs font-bold text-green-700 uppercase">Your Wording</span>
                                <p className="text-sm text-slate-700 mt-1 italic">"{item.claimantWording}"</p>
                            </div>
                            <div className="p-4">
                                <span className="text-xs font-bold text-red-700 uppercase">Respondent's Likely Objection</span>
                                <p className="text-sm text-slate-700 mt-1 italic">"{item.respondentLikelyObjection}"</p>
                            </div>
                        </div>
                        <div className="p-4 bg-indigo-50 border-t border-indigo-100">
                            <span className="text-xs font-bold text-indigo-700 uppercase">Strategic Advice</span>
                            <p className="text-sm text-indigo-900 mt-1">{item.advice}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'orders' && (
            <div className="space-y-4">
                {(strategy.caseManagementOrderAnalysis || []).map((item, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm">
                        <div className="p-4 bg-slate-50 border-b border-slate-200"><h4 className="font-bold text-slate-800">Order: {item.order}</h4></div>
                        <div className="p-4">
                            <div className="mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Your Request</span>
                                <p className="text-sm text-slate-800 mt-1">{item.claimantRequest}</p>
                            </div>
                            <div className="mb-4">
                                <span className="text-xs font-bold text-slate-500 uppercase">Respondent's Likely Resistance</span>
                                <p className="text-sm text-slate-600 mt-1 italic">"{item.respondentLikelyResistance}"</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded border border-purple-100">
                                <span className="text-xs font-bold text-purple-700 uppercase">Risk / Opportunity Analysis</span>
                                <p className="text-sm text-purple-900 mt-1">{item.riskOpportunity}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'jurisdiction' && strategy.jurisdictionStrategy && (
            <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm">
                <h3 className="font-bold text-xl text-red-800 mb-4">{strategy.jurisdictionStrategy.issue}</h3>
                <div className="space-y-6">
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Your Legal Argument</span>
                        <p className="text-slate-800 mt-1 p-4 bg-slate-50 rounded border border-slate-200">{strategy.jurisdictionStrategy.claimantArgument}</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Respondent's Predicted Counter-Argument</span>
                        <p className="text-slate-600 mt-1 p-4 bg-slate-50 rounded border border-slate-200 italic">"{strategy.jurisdictionStrategy.respondentCounter}"</p>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-500 uppercase">Key Evidence to Cite</span>
                        <p className="text-blue-700 mt-1 p-4 bg-blue-50 rounded border border-blue-200 font-mono text-sm">{strategy.jurisdictionStrategy.keyEvidenceToCite}</p>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default PreliminaryHearingView;