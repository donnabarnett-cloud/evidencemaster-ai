
import React from 'react';
import { DocumentMetadata, Entity, Issue, TimelineEvent } from '../types';
import { AlertIcon, FileIcon, TimelineIcon, GavelIcon } from './Icons';

interface AnalyticsDashboardProps {
  documents: DocumentMetadata[];
  timeline: TimelineEvent[];
  issues: Issue[];
  entities: Entity[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ documents, timeline, issues, entities }) => {
  
  // Calculate Stats
  const criticalIssues = issues.filter(i => i.severity === 'Critical' || i.severity === 'High');
  const uniqueEntities = Array.from(new Set(entities.map(e => e.name)));
  const hostileEntities = entities.filter(e => e.sentiment === 'Hostile');
  const medicalEvents = timeline.filter(e => (e.category || '').toLowerCase().includes('medical') || (e.category || '').toLowerCase().includes('oh'));

  return (
    <div className="space-y-6">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Documents</span>
            <div className="text-blue-500"><FileIcon /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{documents.length}</div>
          <div className="text-xs text-slate-400 mt-1">Processed & OCR'd</div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Critical Risks</span>
            <div className="text-red-500"><AlertIcon /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{criticalIssues.length}</div>
          <div className="text-xs text-slate-400 mt-1">High Severity Issues</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Key Entities</span>
            <div className="text-purple-500"><GavelIcon /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{uniqueEntities.length}</div>
          <div className="text-xs text-slate-400 mt-1">People Identified</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Timeline Density</span>
            <div className="text-orange-500"><TimelineIcon /></div>
          </div>
          <div className="text-3xl font-bold text-slate-800">{timeline.length}</div>
          <div className="text-xs text-slate-400 mt-1">Total Extracted Events</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entity Analysis (Relativity Style) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Entity Sentiment Analysis</h3>
          </div>
          <div className="p-0 overflow-y-auto max-h-[300px]">
             {entities.length === 0 ? (
               <div className="p-8 text-center text-slate-400 text-sm">No entities extracted yet.</div>
             ) : (
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-50 text-slate-500">
                   <tr>
                     <th className="px-5 py-3 font-medium">Name</th>
                     <th className="px-5 py-3 font-medium">Role</th>
                     <th className="px-5 py-3 font-medium">Sentiment</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {entities.slice(0, 10).map((e, i) => (
                     <tr key={i} className="hover:bg-slate-50">
                       <td className="px-5 py-3 font-medium text-slate-700">{e.name}</td>
                       <td className="px-5 py-3 text-slate-500">{e.role}</td>
                       <td className="px-5 py-3">
                         <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold ${
                           e.sentiment === 'Hostile' ? 'bg-red-100 text-red-700' :
                           e.sentiment === 'Supportive' ? 'bg-green-100 text-green-700' :
                           'bg-slate-100 text-slate-600'
                         }`}>
                           {e.sentiment}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </div>
        </div>

        {/* Risk Heatmap (Luminance Style) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
           <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Risk Heatmap</h3>
          </div>
          <div className="p-5 overflow-y-auto max-h-[300px] space-y-3">
             {issues.length === 0 ? (
                <div className="text-center text-slate-400 text-sm">No risks detected.</div>
             ) : (
               issues.slice(0, 6).map((issue, i) => (
                 <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:shadow-md transition-shadow">
                    <div className={`w-1.5 self-stretch rounded-full ${
                      issue.severity === 'Critical' ? 'bg-red-600' :
                      issue.severity === 'High' ? 'bg-orange-500' :
                      issue.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-400'
                    }`}></div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{issue.category}</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{issue.sourceDoc}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 line-clamp-2">{issue.description}</p>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
