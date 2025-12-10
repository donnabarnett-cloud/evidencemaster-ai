
import React, { useState, useEffect } from 'react';
import { ChartIcon, DownloadIcon } from './Icons';
import { ScheduleOfLossData } from '../types';

interface ScheduleOfLossViewProps {
  data: ScheduleOfLossData | null;
  setData: (data: ScheduleOfLossData) => void;
}

const ScheduleOfLossView: React.FC<ScheduleOfLossViewProps> = ({ data, setData }) => {
  const [age, setAge] = useState(data?.age || 40);
  const [serviceYears, setServiceYears] = useState(data?.serviceYears || 5);
  const [grossWeekly, setGrossWeekly] = useState(data?.grossWeeklyPay || 500);
  const [netWeekly, setNetWeekly] = useState(data?.netWeeklyPay || 400);
  const [lossMonths, setLossMonths] = useState(data?.lossOfEarningsMonths || 6);
  const [injuryToFeelings, setInjuryToFeelings] = useState(data?.injuryToFeelings || 15000);
  const [startDate, setStartDate] = useState(data?.employmentStartDate || '');
  const [endDate, setEndDate] = useState(data?.employmentEndDate || '');
  
  const [basicAward, setBasicAward] = useState(0);
  const [compensatoryAward, setCompensatoryAward] = useState(0);
  const [lossOfStatutoryRights, setLossOfStatutoryRights] = useState(500);
  const [total, setTotal] = useState(0);

  const STATUTORY_CAP_WEEKLY = 700; // 2024/25 approx

  // Auto-calculate Years of Service if dates are present
  useEffect(() => {
      if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              const diffTime = Math.abs(end.getTime() - start.getTime());
              const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
              if (years >= 0 && years !== serviceYears) {
                  setServiceYears(years);
              }
          }
      }
  }, [startDate, endDate]);

  useEffect(() => {
    // Basic Award Calc (Simplified)
    let factor = 1.0;
    if (age >= 41) factor = 1.5;
    if (age < 22) factor = 0.5;
    
    const cappedWeekly = Math.min(grossWeekly, STATUTORY_CAP_WEEKLY);
    const basic = factor * serviceYears * cappedWeekly;
    setBasicAward(basic);

    // Compensatory
    const comp = (netWeekly * 4.33 * lossMonths) + lossOfStatutoryRights;
    setCompensatoryAward(comp);

    // Total
    setTotal(basic + comp + injuryToFeelings);

    // Sync to parent
    setData({
        age,
        serviceYears,
        grossWeeklyPay: grossWeekly,
        netWeeklyPay: netWeekly,
        lossOfEarningsMonths: lossMonths,
        injuryToFeelings,
        employmentStartDate: startDate,
        employmentEndDate: endDate
    });
  }, [age, serviceYears, grossWeekly, netWeekly, lossMonths, injuryToFeelings, lossOfStatutoryRights, startDate, endDate]);

  return (
    <div className="space-y-6 pb-10">
       <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
             <div className="bg-green-100 p-2 rounded-lg text-green-600"><ChartIcon /></div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Smart Schedule of Loss</h2>
                <p className="text-sm text-slate-500">Calculate the value of your claim for settlement or ET1. Data auto-saves.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">Employment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Start Date</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border p-2 rounded text-sm"/>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Effective Date of Termination</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border p-2 rounded text-sm"/>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Age at Dismissal</label>
                      <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="w-full border p-2 rounded text-sm"/>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Full Years Service</label>
                      <input type="number" value={serviceYears} onChange={e => setServiceYears(Number(e.target.value))} className="w-full border p-2 rounded text-sm bg-slate-50"/>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Gross Weekly Pay (£)</label>
                      <input type="number" value={grossWeekly} onChange={e => setGrossWeekly(Number(e.target.value))} className="w-full border p-2 rounded text-sm"/>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Net Weekly Pay (£)</label>
                      <input type="number" value={netWeekly} onChange={e => setNetWeekly(Number(e.target.value))} className="w-full border p-2 rounded text-sm"/>
                   </div>
                </div>

                <h3 className="font-bold text-slate-700 border-b pb-2 mt-6">Compensatory Factors</h3>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Months out of work (Future Loss)</label>
                   <input type="number" value={lossMonths} onChange={e => setLossMonths(Number(e.target.value))} className="w-full border p-2 rounded text-sm"/>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-1">Injury to Feelings Estimate (£)</label>
                   <input type="number" value={injuryToFeelings} onChange={e => setInjuryToFeelings(Number(e.target.value))} className="w-full border p-2 rounded text-sm"/>
                   <p className="text-[10px] text-slate-400 mt-1">Based on Vento Bands (Lower: £1.1k-£11k, Middle: £11k-£35k, Upper: £35k-£58k)</p>
                </div>
             </div>

             <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 h-fit">
                <h3 className="font-bold text-slate-800 mb-4 text-center">Estimated Claim Value</h3>
                
                <div className="space-y-3 text-sm">
                   <div className="flex justify-between">
                      <span className="text-slate-600">Basic Award</span>
                      <span className="font-mono font-bold">£{basicAward.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-600">Loss of Earnings ({lossMonths} mo)</span>
                      <span className="font-mono font-bold">£{(netWeekly * 4.33 * lossMonths).toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-slate-600">Loss of Statutory Rights</span>
                      <span className="font-mono font-bold">£{lossOfStatutoryRights.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-300 pb-3">
                      <span className="text-slate-600">Injury to Feelings</span>
                      <span className="font-mono font-bold">£{injuryToFeelings.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between pt-2 text-lg">
                      <span className="font-bold text-slate-800">TOTAL</span>
                      <span className="font-mono font-bold text-green-600">£{total.toFixed(2)}</span>
                   </div>
                </div>

                <div className="mt-6 bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                   <strong>Disclaimer:</strong> Estimates only. Does not include interest, grossing up, or pension loss. Consult a solicitor for the final schedule.
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default ScheduleOfLossView;
