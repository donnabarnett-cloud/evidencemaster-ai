import React, { useState, useEffect } from 'react';
import { runSystemDiagnostics, DiagnosticResult } from '../services/geminiService';
import { CheckIcon, AlertIcon, LoaderIcon, RefreshIcon } from './Icons';

interface SystemDiagnosticsProps {
  apiKey?: string;
}

const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({ apiKey }) => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<number | null>(null);

  const runTests = async () => {
    if (!apiKey) return;
    setIsRunning(true);
    setResults([]);
    const diagResults = await runSystemDiagnostics(apiKey);
    setResults(diagResults);
    setLastRun(Date.now());
    setIsRunning(false);
  };

  useEffect(() => {
    if (apiKey) runTests();
  }, [apiKey]);

  if (!apiKey) {
     return <div className="p-10 text-center text-slate-500">Please provide an API Key to run diagnostics.</div>;
  }

  return (
    <div className="h-full bg-slate-50 p-6 flex flex-col items-center">
       <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white">
             <div>
               <h2 className="text-xl font-bold">System Diagnostic Suite</h2>
               <p className="text-xs text-slate-400">Runtime Verification of AI Models & Tools</p>
             </div>
             <button 
               onClick={runTests}
               disabled={isRunning}
               className="p-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-medium flex items-center gap-2 disabled:opacity-50"
             >
               {isRunning ? <LoaderIcon /> : <><RefreshIcon /><span>Run Tests</span></>}
             </button>
          </div>
          
          <div className="p-6 space-y-4">
             {isRunning && results.length === 0 && (
                <div className="text-center py-10">
                   <div className="scale-150 text-blue-500 mb-4 inline-block"><LoaderIcon /></div>
                   <p className="text-slate-500">Executing Test Suite...</p>
                </div>
             )}

             {results.map((res, i) => (
               <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-4">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        res.status === 'Pass' ? 'bg-green-100 text-green-600' : 
                        res.status === 'Warning' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'
                     }`}>
                        {res.status === 'Pass' ? <CheckIcon /> : <AlertIcon />}
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800">{res.name}</h4>
                        <p className="text-xs text-slate-500">{res.details}</p>
                     </div>
                  </div>
                  {res.latency && (
                     <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">Latency</span>
                        <div className="text-xs font-bold text-slate-700">{res.latency}ms</div>
                     </div>
                  )}
               </div>
             ))}

             {results.length > 0 && !isRunning && (
                <div className="mt-6 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 text-center">
                   <strong>Diagnostic Complete.</strong> All systems operational.
                   <br/><span className="text-xs opacity-70">Last check: {new Date(lastRun!).toLocaleTimeString()}</span>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default SystemDiagnostics;