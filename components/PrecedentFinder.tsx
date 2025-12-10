
import React, { useState } from 'react';
import { searchPrecedents } from '../services/geminiService';
import { LegalResearchNote } from '../types';
import { SearchIcon, LoaderIcon, GavelIcon } from './Icons';

interface PrecedentFinderProps {
  apiKey?: string;
}

const PrecedentFinder: React.FC<PrecedentFinderProps> = ({ apiKey }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LegalResearchNote[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !apiKey) return;
    setIsSearching(true);
    const data = await searchPrecedents(query, apiKey);
    setResults(data);
    setIsSearching(false);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><GavelIcon /> Precedent Finder</h3>
      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 'Dyslexia and performance plans' or 'Constructive dismissal tests'"
          className="flex-1 p-3 border border-slate-300 rounded-lg text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          disabled={isSearching}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {isSearching ? <LoaderIcon /> : <SearchIcon />} Search
        </button>
      </div>

      <div className="space-y-4">
        {results.length === 0 && !isSearching && query && (
           <p className="text-center text-slate-400 text-sm">No results found. Try broader keywords.</p>
        )}
        
        {results.map((res, i) => (
          <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
             <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900">{res.relevantPrecedent}</h4>
                <span className="text-xs bg-white border px-2 py-1 rounded text-slate-500">{res.topic}</span>
             </div>
             <p className="text-sm text-slate-700 mb-2">{res.summaryOfLaw}</p>
             <div className="bg-white p-3 rounded border border-slate-100 text-xs text-slate-600">
                <strong>Application:</strong> {res.applicationToFact}
             </div>
             {res.sourceUrl && (
                <div className="mt-2 text-right">
                   <a href={res.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Source Link</a>
                </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrecedentFinder;
