
import React, { useState, useEffect } from 'react';
import { CalendarIcon, CheckIcon, AlertIcon } from './Icons';
import { TimelineEvent } from '../types';

interface LegalRoadmapViewProps {
    timeline?: TimelineEvent[];
}

const LegalRoadmapView: React.FC<LegalRoadmapViewProps> = ({ timeline = [] }) => {
  const [actDate, setActDate] = useState('');
  
  // ACAS State
  const [dayA, setDayA] = useState(''); // Start EC
  const [dayB, setDayB] = useState(''); // End EC (Certificate)
  const [limitationDate, setLimitationDate] = useState<string | null>(null);
  const [calculationLog, setCalculationLog] = useState<string>('');

  // Dynamic Step Status
  const [steps, setSteps] = useState([
    {
      id: 1,
      title: 'Formal Grievance',
      description: 'Submit formal written grievance to employer. Wait for outcome.',
      docs: ['Grievance Letter', 'Evidence Bundle'],
      status: 'pending',
      keywords: ['grievance', 'formal complaint', 'stage 1']
    },
    {
      id: 2,
      title: 'Grievance Appeal',
      description: 'If outcome unsatisfactory, submit appeal within typically 5-7 days.',
      docs: ['Appeal Letter'],
      status: 'pending',
      keywords: ['appeal', 'outcome', 'stage 2', 'final decision']
    },
    {
      id: 3,
      title: 'ACAS Early Conciliation',
      description: 'Mandatory before Tribunal. Pauses the clock (stop the clock).',
      docs: ['ACAS Certificate'],
      status: 'pending',
      keywords: ['acas', 'conciliation', 'certificate', 'ec number']
    },
    {
      id: 4,
      title: 'Form ET1 Submission',
      description: 'The strict deadline. Must include ACAS number.',
      docs: ['Form ET1', 'Paper of Particulars'],
      status: 'pending',
      keywords: ['et1', 'claim submitted', 'form et1']
    },
    {
      id: 5,
      title: 'Preliminary Hearing',
      description: 'Case management. Setting the List of Issues.',
      docs: ['Agenda', 'Schedule of Loss'],
      status: 'pending',
      keywords: ['preliminary hearing', 'ph', 'case management']
    },
     {
      id: 6,
      title: 'Final Hearing',
      description: 'Witnesses, Cross-Examination, Judgment.',
      docs: ['Witness Statements', 'Final Bundle'],
      status: 'pending',
      keywords: ['final hearing', 'judgment', 'witness statement']
    }
  ]);

  useEffect(() => {
      if (timeline.length > 0) {
          const updatedSteps = steps.map(step => {
              const isCompleted = timeline.some(event => 
                  step.keywords.some(kw => 
                    (event.event || '').toLowerCase().includes(kw) || 
                    (event.category || '').toLowerCase().includes(kw)
                  )
              );
              return { ...step, status: isCompleted ? 'completed' : 'active' }; // Simple active/complete toggle for now
          });
          
          // Refine logic: Make future steps pending if previous is not complete? 
          // For now, just marking found items as completed makes the UI feel responsive.
          setSteps(updatedSteps);
      }
  }, [timeline]);

  const calculateDeadline = () => {
    if (!actDate) return;
    setCalculationLog('');
    
    // 1. Calculate Primary Limitation Date (PLD)
    const pld = new Date(actDate);
    pld.setMonth(pld.getMonth() + 3);
    pld.setDate(pld.getDate() - 1);
    
    let finalDate = new Date(pld);
    let log = `Act: ${actDate}\nPrimary Limitation Date (PLD): ${pld.toLocaleDateString('en-GB')}\n`;

    // 2. Apply ACAS Extension
    if (dayA && dayB) {
        const da = new Date(dayA);
        const db = new Date(dayB);
        
        // Calculate "Stop the Clock" duration
        const diffTime = Math.abs(db.getTime() - da.getTime());
        const daysPause = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        log += `ACAS Pause: ${daysPause} days (${dayA} to ${dayB})\n`;

        if (da <= pld) {
            // Case A: Conciliation started BEFORE the PLD
            // Method 1: Add the pause days to the PLD
            const method1Date = new Date(pld);
            method1Date.setDate(method1Date.getDate() + daysPause);
            log += `Method 1 (PLD + Pause): ${method1Date.toLocaleDateString('en-GB')}\n`;

            // Method 2: Day B + 1 Month
            const method2Date = new Date(db);
            method2Date.setMonth(method2Date.getMonth() + 1);
            log += `Method 2 (Day B + 1 Month): ${method2Date.toLocaleDateString('en-GB')}\n`;

            // The deadline is the LATER of the two
            if (method2Date > method1Date) {
                finalDate = method2Date;
                log += `Result: Method 2 is later.\n`;
            } else {
                finalDate = method1Date;
                log += `Result: Method 1 is later.\n`;
            }
        } else {
            log += `WARNING: ACAS started AFTER the Primary Limitation Date. The claim may be out of time unless you prove it was 'Not Reasonably Practicable' to file earlier.\n`;
        }
    } else {
        log += `No ACAS dates provided. Using Primary Limitation Date.\n`;
    }
    
    setLimitationDate(finalDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    setCalculationLog(log);
  };

  return (
    <div className="space-y-8 pb-10">
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
         <div className="flex-1 mr-8">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarIcon /> Tribunal Deadline Calculator (ACAS Aware)
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Calculates the exact limitation date applying the "Stop the Clock" rules.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date of Act Complained Of</label>
                  <input 
                    type="date" 
                    value={actDate}
                    onChange={(e) => setActDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ACAS Start (Day A)</label>
                  <input 
                    type="date" 
                    value={dayA}
                    onChange={(e) => setDayA(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ACAS End (Day B)</label>
                  <input 
                    type="date" 
                    value={dayB}
                    onChange={(e) => setDayB(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-sm"
                  />
               </div>
            </div>
            
            <button 
                 onClick={calculateDeadline}
                 className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 Calculate Precision Deadline
            </button>

            {calculationLog && (
                <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 font-mono text-xs text-slate-600 whitespace-pre-wrap">
                    {calculationLog}
                </div>
            )}
         </div>
         {limitationDate && (
           <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center min-w-[300px]">
              <span className="text-red-500 font-bold uppercase text-xs tracking-wider">Deadline to Submit ET1</span>
              <div className="text-xl font-bold text-red-700 mt-1">{limitationDate}</div>
              <p className="text-xs text-red-400 mt-2 italic">Strict Liability. Do not miss this.</p>
           </div>
         )}
       </div>

       <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800">Case Stage Roadmap (Live Tracker)</h3>
          <div className="relative">
             <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>
             {steps.map((step, i) => (
                <div key={step.id} className="relative pl-16 pb-8">
                   <div className={`absolute left-0 w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-lg z-10 transition-colors duration-500 ${
                     step.status === 'completed' ? 'bg-green-100 border-green-500 text-green-600' :
                     step.status === 'active' ? 'bg-blue-100 border-blue-500 text-blue-600' :
                     'bg-white border-slate-200 text-slate-300'
                   }`}>
                      {step.status === 'completed' ? <CheckIcon /> : i + 1}
                   </div>
                   <div className={`bg-white p-5 rounded-xl border shadow-sm transition-all duration-500 ${
                      step.status === 'active' ? 'border-blue-500 ring-1 ring-blue-200' : 
                      step.status === 'completed' ? 'border-green-200 bg-green-50/20' : 'border-slate-200'
                   }`}>
                      <h4 className="font-bold text-slate-900">{step.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                      <div className="mt-3 flex gap-2">
                         {step.docs.map(d => (
                           <span key={d} className="px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded font-medium border border-slate-200">
                             {d}
                           </span>
                         ))}
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );
};

export default LegalRoadmapView;
