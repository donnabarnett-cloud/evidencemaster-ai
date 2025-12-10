
import React, { useState } from 'react';
import { auditPolicies } from '../services/geminiService';
import { PolicyAudit, Issue } from '../types';
import { BookIcon, LoaderIcon, CheckIcon, AlertIcon, RefreshIcon } from './Icons';

interface PolicyAuditViewProps {
  contextSummary: string;
  issues: Issue[];
  apiKey?: string;
  audit: PolicyAudit | null;
  setAudit: (audit: PolicyAudit | null) => void;
}

const PolicyAuditView: React.FC<PolicyAuditViewProps> = ({ contextSummary, issues, apiKey, audit, setAudit }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    setIsLoading(true);
    const result = await auditPolicies(contextSummary, issues, apiKey);
    setAudit(result);
    setIsLoading(false);
  };

  if (!audit && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-emerald-600"><BookIcon /></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Union Representative Mode</h2>
        <p className="text-slate-500 mb-6 max-w-md">Audit compliance against ACAS Code of Practice and prepare your hearing script.</p>
        <button onClick={handleRun} className="px-8 py-3 bg-emerald-600 text-white rounded-xl shadow-lg font-bold">Start Compliance Audit</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><BookIcon /> Policy & Procedure Audit</h2>
               <p className="text-sm text-slate-500">ACAS Code Compliance • Fairness Assessment</p>
            </div>
            <button 
              onClick={handleRun} 
              disabled={isLoading}
              className="px-4 py-2 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshIcon /> Re-Audit
            </button>
         </div>
      </div>

      {isLoading ? (
         <div className="flex-1 flex items-center justify-center"><LoaderIcon className="scale-150 text-emerald-600"/></div>
      ) : (
         <div className="flex-1 overflow-auto space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-2">Procedural Fairness Assessment</h3>
               <p className="text-slate-600 italic border-l-4 border-emerald-500 pl-4 py-2 bg-slate-50 rounded-r">
                  "{audit?.fairnessAssessment}"
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 text-red-600 flex items-center gap-2"><AlertIcon /> Policy Breaches</h3>
                  <div className="space-y-3">
                     {audit?.breaches.map((b, i) => (
                        <div key={i} className="bg-red-50 p-3 rounded border border-red-100">
                           <div className="flex justify-between mb-1">
                              <span className="font-bold text-red-800 text-sm">{b.policy}</span>
                              <span className="text-[10px] bg-red-200 text-red-800 px-2 rounded-full">{b.severity}</span>
                           </div>
                           <p className="text-sm text-red-700">{b.breach}</p>
                           <p className="text-xs text-red-500 mt-1 font-mono">Ev: {b.evidence}</p>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 text-blue-600 flex items-center gap-2"><BookIcon /> Rep's Hearing Script</h3>
                  <div className="space-y-3">
                     {audit?.repScript.map((q, i) => (
                        <div key={i} className="border-l-2 border-blue-500 pl-3 py-1">
                           <span className="text-xs text-blue-500 uppercase font-bold">{q.phase}</span>
                           <p className="font-bold text-slate-800 text-sm">"{q.question}"</p>
                           <p className="text-xs text-slate-500 italic">{q.reason}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
            
            <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg">
               <h3 className="font-bold uppercase text-xs tracking-wider text-slate-400 mb-2">Escalation Advice</h3>
               <p className="font-medium">{audit?.escalationAdvice}</p>
            </div>
         </div>
      )}
    </div>
  );
};

export default PolicyAuditView;
