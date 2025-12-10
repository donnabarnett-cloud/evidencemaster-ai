
import React, { useState } from 'react';
import { generateCoachingModules } from '../services/geminiService';
import { CoachingModule, Issue } from '../types';
import { UserCheckIcon, LoaderIcon } from './Icons';

interface CoachingViewProps {
  issues: Issue[];
  apiKey?: string;
  modules: CoachingModule[];
  setModules: (modules: CoachingModule[]) => void;
}

const CoachingView: React.FC<CoachingViewProps> = ({ issues, apiKey, modules, setModules }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    setIsLoading(true);
    const result = await generateCoachingModules(issues, apiKey);
    setModules(result);
    setIsLoading(false);
  };

  if (!modules.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto">
        <div className="bg-slate-100 p-6 rounded-full mb-6 text-pink-500">
          <UserCheckIcon />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Litigant Skills Coach</h3>
        <p className="text-slate-500 mb-6">
          Litigation is 50% facts and 50% presentation. This module will train you on cross-examination, emotional regulation, and clarity.
        </p>
        <button onClick={handleStart} className="px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg transition-all">Start Coaching Session</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
         <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><UserCheckIcon /> Skills Coach</h2>
         <p className="text-sm text-slate-500">Personalized training based on the weaknesses in your case.</p>
      </div>

      <div className="flex-1 overflow-auto space-y-6">
         {isLoading ? (
            <div className="text-center p-10"><LoaderIcon className="mx-auto text-pink-500 scale-150" /></div>
         ) : (
            modules.map((mod, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-slate-800">{mod.title}</h3>
                    <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold uppercase">{mod.skill}</span>
                 </div>
                 <p className="text-slate-700 leading-relaxed mb-6">{mod.content}</p>
                 
                 <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase block mb-3">Practical Exercises</span>
                    <ul className="space-y-3">
                       {(mod.exercises || []).map((ex, j) => (
                         <li key={j} className="flex gap-3 text-sm text-slate-700">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center font-bold text-xs">{j+1}</span>
                            {ex}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>
            ))
         )}
      </div>
    </div>
  );
};

export default CoachingView;
