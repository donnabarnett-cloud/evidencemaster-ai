import React, { useState } from 'react';
import { ScottScheduleItem, TimelineEvent } from '../types';
import { enrichScottSchedule } from '../services/geminiService';
import { GavelIcon, LoaderIcon, AlertIcon, DownloadIcon, RefreshIcon, CheckIcon, ClipboardIcon } from './Icons';
import { downloadCSV } from '../utils/exportUtils';

interface SmartScottScheduleViewProps {
  timeline: TimelineEvent[];
  contextSummary: string;
  apiKey?: string;
  schedule: ScottScheduleItem[];
  setSchedule: (schedule: ScottScheduleItem[]) => void;
}

const SmartScottScheduleView: React.FC<SmartScottScheduleViewProps> = ({ timeline, contextSummary, apiKey, schedule, setSchedule }) => {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const populateFromTimeline = () => {
      // Safety check for timeline array
      if (!timeline) return;

      // Filter for significant events (Medium/High/Critical or tagged)
      const meaningfulEvents = timeline.filter(e => 
          ['High', 'Critical'].includes(e.severity) || 
          e.relevanceTag === 'Support' || 
          e.relevanceTag === 'Contradiction'
      );

      const newItems: ScottScheduleItem[] = meaningfulEvents.map(e => ({
          id: Math.random().toString(36).substr(2, 9),
          date: e.date,
          allegation: e.event,
          detriment: '',
          legalClaim: '',
          legalBasis: '',
          respondentDefencePrediction: '',
          evidenceRef: e.sourceDoc
      }));

      if (schedule.length === 0) {
          setSchedule(newItems);
      } else {
          setSchedule([...schedule, ...newItems]);
      }
  };

  const analyzeRow = async (item: ScottScheduleItem) => {
      if (!apiKey) {
          alert("Please set your API Key first.");
          return;
      }
      setAnalyzingId(item.id);
      try {
          const enriched = await enrichScottSchedule(item, contextSummary, apiKey);
          if (enriched) {
              setSchedule(schedule.map(s => s.id === item.id ? enriched : s));
          } else {
              // Graceful failure - keep original but maybe flag or log
              console.warn("Enrichment returned null");
              // Silent fail for smoother UX, or use a toast if available
          }
      } catch (e) {
          console.error("Analysis failed", e);
      } finally {
          setAnalyzingId(null);
      }
  };

  const updateRow = (id: string, field: keyof ScottScheduleItem, value: string) => {
      setSchedule(schedule.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeRow = (id: string) => {
      setSchedule(schedule.filter(s => s.id !== id));
  };

  const handleExport = () => {
      const headers = ['Date', 'Allegation / Incident', 'Detriment', 'Legal Claim', 'Legal Basis / Nexus', 'Advocacy Strategy', 'Predicted Defence', 'Evidence Ref'];
      const rows = schedule.map(s => [
          `"${s.date}"`,
          `"${s.allegation.replace(/"/g, '""')}"`,
          `"${s.detriment.replace(/"/g, '""')}"`,
          `"${s.legalClaim.replace(/"/g, '""')}"`,
          `"${s.legalBasis.replace(/"/g, '""')}"`,
          `"${s.presentationStrategy?.replace(/"/g, '""') || ''}"`,
          `"${s.respondentDefencePrediction?.replace(/"/g, '""') || ''}"`,
          `"${s.evidenceRef.replace(/"/g, '""')}"`
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      downloadCSV(csv, 'Smart_Scott_Schedule_Full');
  };

  return (
    <div className="h-full flex flex-col space-y-6 pb-10">
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><ClipboardIcon /> Smart Scott Schedule</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Your master document for the Tribunal. It translates <strong>Facts → Law → Advocacy</strong>.
                    <br/>Click the gavel to auto-generate the legal nexus and courtroom script for each breach.
                </p>
             </div>
             <div className="flex gap-2">
                <button onClick={populateFromTimeline} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2">
                    <RefreshIcon /> Populate from Timeline
                </button>
                <button onClick={handleExport} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-2">
                    <DownloadIcon /> Export CSV for Tribunal
                </button>
             </div>
          </div>
       </div>

       <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200 shadow-sm">
          {schedule.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <ClipboardIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p>Your Scott Schedule is empty.</p>
                  <button onClick={populateFromTimeline} className="mt-4 text-blue-600 font-bold hover:underline">Import significant events from Timeline</button>
              </div>
          ) : (
              <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 shadow-sm z-10">
                      <tr>
                          <th className="p-3 w-24">Date</th>
                          <th className="p-3 w-1/5">Allegation & Detriment</th>
                          <th className="p-3 w-1/12">Claim</th>
                          <th className="p-3 w-1/4">Legal Analysis & Strategy</th>
                          <th className="p-3 w-1/6">Predicted Defence</th>
                          <th className="p-3 w-16 text-center">Analyze</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {schedule.map((item, i) => (
                          <tr key={item.id} className="hover:bg-slate-50 group align-top">
                              {/* Date Column */}
                              <td className="p-3">
                                  <input 
                                    className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold" 
                                    value={item.date} 
                                    onChange={e => updateRow(item.id, 'date', e.target.value)}
                                  />
                                  <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[80px]" title={item.evidenceRef}>{item.evidenceRef}</div>
                              </td>
                              
                              {/* Allegation Column */}
                              <td className="p-3">
                                  <textarea 
                                    className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded p-1 text-sm font-medium text-slate-800 resize-none h-20 mb-2" 
                                    value={item.allegation} 
                                    onChange={e => updateRow(item.id, 'allegation', e.target.value)}
                                    placeholder="What happened?"
                                  />
                                  <input 
                                    className="w-full text-xs text-slate-500 bg-transparent border-none p-0 placeholder:italic"
                                    placeholder="Detriment (How it hurt you)..."
                                    value={item.detriment}
                                    onChange={e => updateRow(item.id, 'detriment', e.target.value)}
                                  />
                              </td>

                              {/* Claim Column */}
                              <td className="p-3">
                                  <input 
                                    className="w-full font-bold text-indigo-700 bg-transparent border-none p-0 text-center"
                                    placeholder="s15"
                                    value={item.legalClaim}
                                    onChange={e => updateRow(item.id, 'legalClaim', e.target.value)}
                                  />
                              </td>

                              {/* Analysis Column (Split View) */}
                              <td className="p-3">
                                  <div className="flex flex-col gap-2">
                                      <div className="bg-blue-50 p-2 rounded border border-blue-100">
                                          <span className="text-[10px] font-bold text-blue-700 uppercase block mb-1">Legal Basis (The Nexus)</span>
                                          <textarea 
                                            className="w-full bg-transparent border-none text-xs text-blue-900 resize-none h-16 focus:ring-0" 
                                            value={item.legalBasis} 
                                            placeholder="Why is this discrimination?"
                                            onChange={e => updateRow(item.id, 'legalBasis', e.target.value)}
                                          />
                                      </div>
                                      <div className="bg-purple-50 p-2 rounded border border-purple-100">
                                          <span className="text-[10px] font-bold text-purple-700 uppercase block mb-1">Presentation Strategy (Say This)</span>
                                          <textarea 
                                            className="w-full bg-transparent border-none text-xs text-purple-900 resize-none h-12 focus:ring-0 italic" 
                                            value={item.presentationStrategy} 
                                            placeholder="What to tell the Judge..."
                                            onChange={e => updateRow(item.id, 'presentationStrategy', e.target.value)}
                                          />
                                      </div>
                                  </div>
                              </td>

                              {/* Defence Column */}
                              <td className="p-3">
                                  <textarea 
                                    className="w-full bg-transparent border border-transparent hover:border-slate-200 rounded p-1 text-xs text-slate-500 italic resize-none h-24" 
                                    value={item.respondentDefencePrediction} 
                                    placeholder="AI will predict defence..."
                                    onChange={e => updateRow(item.id, 'respondentDefencePrediction', e.target.value)}
                                  />
                              </td>

                              {/* Actions Column */}
                              <td className="p-3 text-center">
                                  <button 
                                    onClick={() => analyzeRow(item)} 
                                    disabled={analyzingId === item.id}
                                    className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 mb-2 w-full flex justify-center shadow-sm border border-indigo-100 transition-colors"
                                    title="AI: Analyze this specific allegation"
                                  >
                                      {analyzingId === item.id ? <LoaderIcon /> : <GavelIcon />}
                                  </button>
                                  <button onClick={() => removeRow(item.id)} className="p-2 text-slate-300 hover:text-red-500 w-full">×</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          )}
       </div>
    </div>
  );
};

export default SmartScottScheduleView;