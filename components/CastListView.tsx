import React, { useState, useEffect } from 'react';
import { generateCastList } from '../services/geminiService';
import { CastMember } from '../types';
import { UsersIcon, LoaderIcon, SearchIcon } from './Icons';

interface CastListViewProps {
  contextSummary: string;
  apiKey?: string;
  cast: CastMember[]; // Changed to prop
  setCast: (cast: CastMember[]) => void; // Changed to prop
}

const CastListView: React.FC<CastListViewProps> = ({ contextSummary, apiKey, cast, setCast }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    const result = await generateCastList(contextSummary, apiKey);
    setCast(result);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 flex justify-between items-center">
         <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><UsersIcon /> Cast List (Dramatis Personae)</h2>
            <p className="text-sm text-slate-500">A "Who's Who" for the Judge. Essential for the Final Hearing Bundle.</p>
         </div>
         <button onClick={handleGenerate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2">
            {isLoading ? <LoaderIcon /> : <SearchIcon />} Generate List
         </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-sm">
         {cast.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400">Click generate to build the cast list.</div>
         ) : (
            <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                     <th className="p-4 font-medium">Name</th>
                     <th className="p-4 font-medium">Role</th>
                     <th className="p-4 font-medium">Relevance to Case</th>
                     <th className="p-4 font-medium">First Mention</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {cast.map((member, i) => (
                     <tr key={i} className="hover:bg-slate-50">
                        <td className="p-4 font-bold text-slate-800">{member.name}</td>
                        <td className="p-4 text-slate-600">{member.role}</td>
                        <td className="p-4 text-slate-600">{member.relevance}</td>
                        <td className="p-4 text-slate-400 font-mono text-xs">{member.firstMention}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         )}
      </div>
    </div>
  );
};

export default CastListView;