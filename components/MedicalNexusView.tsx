
import React, { useState } from 'react';
import { analyzeMedicalNexus } from '../services/geminiService';
import { MedicalNexus, TimelineEvent, MedicalEvidence } from '../types';
import { HeartPulseIcon, LoaderIcon, ActivityIcon, CheckIcon, RefreshIcon } from './Icons';

interface MedicalNexusViewProps {
  timeline: TimelineEvent[];
  medicalEvidence: MedicalEvidence[];
  apiKey?: string;
  nexus: MedicalNexus | null;
  setNexus: (nexus: MedicalNexus | null) => void;
}

const MedicalNexusView: React.FC<MedicalNexusViewProps> = ({ timeline, medicalEvidence, apiKey, nexus, setNexus }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    setIsLoading(true);
    const result = await analyzeMedicalNexus(medicalEvidence, timeline, apiKey);
    setNexus(result);
    setIsLoading(false);
  };

  if (!nexus && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-rose-500"><HeartPulseIcon /></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Occupational Health Nexus</h2>
        <p className="text-slate-500 mb-6 max-w-md">Scientifically link management actions to health decline and prove disability status.</p>
        <button onClick={handleRun} className="px-8 py-3 bg-rose-600 text-white rounded-xl shadow-lg font-bold">Analyze Medical Causation</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><HeartPulseIcon /> Medical Nexus</h2>
               <p className="text-sm text-slate-500">Causation Analysis • Section 6 Proof • Functional Effects</p>
            </div>
            <button 
              onClick={handleRun} 
              disabled={isLoading}
              className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <RefreshIcon /> Refresh Analysis
            </button>
         </div>
      </div>

      {isLoading ? (
         <div className="flex-1 flex items-center justify-center"><LoaderIcon className="scale-150 text-rose-600"/></div>
      ) : (
         <div className="flex-1 overflow-auto space-y-6">
            
            {/* S6 Proof Card */}
            {nexus?.longTermProof ? (
               <div className={`p-6 rounded-xl border shadow-sm ${nexus.longTermProof.status === 'Likely' ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                  <div className="flex justify-between items-start">
                     <h3 className="font-bold text-slate-800 mb-2">Equality Act S6 Status: {nexus.longTermProof.status}</h3>
                     <span className="text-xs font-mono bg-white px-2 py-1 rounded border">Duration: {nexus.longTermProof.duration}</span>
                  </div>
                  <p className="text-sm text-slate-700">{nexus.longTermProof.evidence}</p>
               </div>
            ) : (
               <div className="p-4 border rounded text-slate-400 italic">No proof of long-term status found.</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Symptom-Action Overlay */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ActivityIcon /> Symptom-Action Map</h3>
                  <div className="space-y-4">
                     {(nexus?.symptomActionOverlay || []).length > 0 ? (
                        nexus?.symptomActionOverlay?.map((item, i) => (
                           <div key={i} className="relative pl-4 border-l-2 border-slate-200">
                              <div className="text-xs text-slate-400 font-bold mb-1">{item.date}</div>
                              <div className="text-sm font-bold text-rose-600">{item.medicalEvent}</div>
                              <div className="text-xs text-slate-500 my-1">Followed by: <span className="font-bold text-slate-700">{item.managementAction}</span></div>
                              <div className="text-xs text-blue-600 italic bg-blue-50 p-1 rounded inline-block">{item.correlation}</div>
                           </div>
                        ))
                     ) : (
                        <p className="text-sm text-slate-400 italic">No clear symptom correlations found.</p>
                     )}
                  </div>
               </div>

               {/* Functional Effects */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Translation: Medical to Legal</h3>
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr><th className="p-2">Medical Term</th><th className="p-2">Functional Limit</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {(nexus?.functionalEffects || []).map((fx, i) => (
                           <tr key={i}>
                              <td className="p-2 font-medium text-slate-700">{fx.medicalTerm}</td>
                              <td className="p-2 text-slate-600">{fx.laymansTerm} <span className="text-xs text-slate-400 block">{fx.impact}</span></td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Adjustments Feasibility */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-4">Adjustment Feasibility Rebuttal</h3>
               <div className="space-y-3">
                  {(nexus?.adjustmentFeasibility || []).map((adj, i) => (
                     <div key={i} className="p-4 bg-slate-50 rounded border border-slate-200">
                        <h4 className="font-bold text-teal-700 mb-2">{adj.adjustment}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                           <div className="text-red-700"><strong>Employer Refusal:</strong> "{adj.employerRefusal}"</div>
                           <div className="text-blue-700"><strong>Scientific Rebuttal:</strong> {adj.scientificRebuttal}</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default MedicalNexusView;
