
import React, { useState } from 'react';
import { generateForensicAnalysis } from '../services/geminiService';
import { ForensicData, TimelineEvent } from '../types';
import { MicroscopeIcon, LoaderIcon, SearchIcon, ChartIcon, AlertIcon, RefreshIcon } from './Icons';

interface ForensicAnalysisViewProps {
  timeline: TimelineEvent[];
  contextSummary: string;
  apiKey?: string;
  data: ForensicData | null;
  setData: (data: ForensicData | null) => void;
}

const ForensicAnalysisView: React.FC<ForensicAnalysisViewProps> = ({ timeline, contextSummary, apiKey, data, setData }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    setIsLoading(true);
    const result = await generateForensicAnalysis(timeline, contextSummary, apiKey);
    setData(result);
    setIsLoading(false);
  };

  if (!data && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="bg-slate-900 p-6 rounded-full mb-6 text-cyan-400"><MicroscopeIcon /></div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Forensic Data Analyst</h2>
        <p className="text-slate-500 mb-6 max-w-md">Find hidden truths in metadata, email patterns, and timeline gaps.</p>
        <button onClick={handleRun} className="px-8 py-3 bg-slate-900 text-white rounded-xl shadow-lg font-bold">Run Forensic Scan</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><MicroscopeIcon /> Forensic Data Lab</h2>
            <p className="text-sm text-slate-500">Metadata Anomalies • Communication Heatmaps • Truth Verification</p>
         </div>
         <button onClick={handleRun} disabled={isLoading} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors">
            <RefreshIcon /> Refresh Scan
         </button>
      </div>

      {isLoading ? (
         <div className="flex-1 flex items-center justify-center"><LoaderIcon className="scale-150 text-slate-900"/></div>
      ) : (
         <div className="flex-1 overflow-auto space-y-6">
            
            {/* Heatmap */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><ChartIcon /> Communication Intensity Heatmap</h3>
               <div className="flex gap-1 overflow-x-auto pb-2">
                  {data?.emailHeatmap.map((day, i) => (
                     <div key={i} className="flex flex-col items-center gap-1 min-w-[40px]">
                        <div 
                          className={`w-8 rounded-t ${day.sentiment === 'Hostile' ? 'bg-red-500' : 'bg-blue-500'}`} 
                          style={{ height: `${Math.min(day.count * 10, 100)}px` }}
                        />
                        <span className="text-[10px] text-slate-400 rotate-90 mt-2 whitespace-nowrap">{day.date}</span>
                     </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Timeline Gaps */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 text-red-600 flex items-center gap-2"><AlertIcon /> Suspicious Timeline Gaps</h3>
                  <div className="space-y-3">
                     {data?.timelineGaps.map((gap, i) => (
                        <div key={i} className="bg-red-50 p-3 rounded border border-red-100">
                           <div className="flex justify-between font-bold text-sm text-red-800">
                              <span>{gap.startDate} ➝ {gap.endDate}</span>
                              <span>{gap.duration}</span>
                           </div>
                           <p className="text-xs text-red-600 mt-1">Suspicion: {gap.suspicionLevel}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Inconsistencies */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Metadata & Fact Inconsistencies</h3>
                  <div className="space-y-3">
                     {data?.inconsistencies.map((inc, i) => (
                        <div key={i} className="p-3 border border-slate-200 rounded">
                           <p className="text-sm text-slate-800 font-medium">{inc.contradiction}</p>
                           <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono">
                              <span>Ref A: {inc.docA}</span>
                              <span>Ref B: {inc.docB}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ForensicAnalysisView;
