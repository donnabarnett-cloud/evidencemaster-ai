
import React, { useState } from 'react';
import { generateNegotiationStrategy } from '../services/geminiService';
import { NegotiationStrategy } from '../types';
import { HandshakeIcon, LoaderIcon, ChartIcon, FileIcon, RefreshIcon } from './Icons';

interface NegotiationViewProps {
  contextSummary: string;
  apiKey?: string;
  strategy: NegotiationStrategy | null;
  setStrategy: (strategy: NegotiationStrategy | null) => void;
}

const NegotiationView: React.FC<NegotiationViewProps> = ({ contextSummary, apiKey, strategy, setStrategy }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    setIsLoading(true);
    const result = await generateNegotiationStrategy(contextSummary, apiKey);
    setStrategy(result);
    setIsLoading(false);
  };

  if (!strategy && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-amber-500"><HandshakeIcon /></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">The Mediator Engine</h2>
        <p className="text-slate-500 mb-6 max-w-md">Calculate your BATNA, risk-adjusted value, and draft a 'Without Prejudice' offer.</p>
        <button onClick={handleRun} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg font-bold">Build Settlement Strategy</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><HandshakeIcon /> Negotiation & Settlement</h2>
               <p className="text-sm text-slate-500">Risk-Adjusted Valuation • BATNA • Without Prejudice Correspondence</p>
            </div>
            <button 
              onClick={handleRun} 
              disabled={isLoading}
              className="px-4 py-2 bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshIcon /> Re-Calculate
            </button>
         </div>
      </div>

      {isLoading ? (
         <div className="flex-1 flex items-center justify-center"><LoaderIcon className="scale-150 text-amber-500"/></div>
      ) : (
         <div className="flex-1 overflow-auto space-y-6">
            
            {/* The Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Opening Offer</span>
                  <div className="text-3xl font-bold text-green-600">£{strategy?.openingOffer.toLocaleString()}</div>
               </div>
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center bg-amber-50 border-amber-100">
                  <span className="text-xs font-bold text-amber-600 uppercase">Risk-Adjusted Value</span>
                  <div className="text-3xl font-bold text-amber-700">£{strategy?.riskAdjustedValue.toLocaleString()}</div>
                  <p className="text-[10px] text-amber-600 mt-1">Real world value</p>
               </div>
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Walk Away Point</span>
                  <div className="text-3xl font-bold text-red-600">£{strategy?.walkAwayPoint.toLocaleString()}</div>
               </div>
            </div>

            <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
               <h3 className="font-bold uppercase text-xs tracking-wider text-slate-400 mb-2">Your BATNA (Best Alternative to Negotiated Agreement)</h3>
               <p className="text-lg font-medium leading-relaxed">"{strategy?.batna}"</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Negotiation Script */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ChartIcon /> Negotiation Playbook</h3>
                  <div className="space-y-4">
                     {strategy?.negotiationScript.map((step, i) => (
                        <div key={i} className="border-l-2 border-amber-400 pl-4 py-1">
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-amber-600 uppercase">{step.stage}</span>
                              <span className="text-[10px] bg-slate-100 px-2 rounded text-slate-500">{step.tactic}</span>
                           </div>
                           <p className="text-sm text-slate-700 italic">"{step.script}"</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* WP Letter */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileIcon /> Without Prejudice Draft</h3>
                  <div className="flex-1 bg-slate-50 p-4 rounded-lg font-mono text-xs text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-200">
                     {strategy?.settlementLetterDraft}
                  </div>
                  <button className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-sm transition-colors">Copy to Clipboard</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default NegotiationView;
