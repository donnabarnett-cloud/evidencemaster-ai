
import React, { useState, useEffect } from 'react';
import { generateImpactStatementDraft } from '../services/geminiService';
import { EditIcon, LoaderIcon, ClipboardIcon } from './Icons';
import { ImpactStatementData } from '../types';

interface ImpactStatementViewProps {
  apiKey?: string;
  medicalContext: string;
  data: ImpactStatementData | null;
  setData: (data: ImpactStatementData) => void;
}

const ImpactStatementView: React.FC<ImpactStatementViewProps> = ({ apiKey, medicalContext, data, setData }) => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState(data ? {
      condition: data.condition,
      washing: data.washing,
      sleeping: data.sleeping,
      concentrating: data.concentrating,
      social: data.social
  } : {
    condition: '',
    washing: '',
    sleeping: '',
    concentrating: '',
    social: ''
  });
  const [draft, setDraft] = useState(data?.draft || '');
  const [isLoading, setIsLoading] = useState(false);

  // Sync to parent on change
  useEffect(() => {
      setData({
          ...answers,
          draft
      });
  }, [answers, draft]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleGenerate = async () => {
    setIsLoading(true);
    const combinedAnswers = `
      Condition: ${answers.condition}
      Effect on Washing/Dressing: ${answers.washing}
      Effect on Sleeping: ${answers.sleeping}
      Effect on Concentration: ${answers.concentrating}
      Effect on Socializing: ${answers.social}
    `;
    const result = await generateImpactStatementDraft(combinedAnswers, medicalContext, apiKey);
    setDraft(result);
    setIsLoading(false);
    setStep(6);
  };

  const updateAnswer = (field: keyof typeof answers, value: string) => {
    setAnswers(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">1. The Impairment</h3>
            <p className="text-sm text-slate-500">What is the medical name of your condition(s)? How long have you had it?</p>
            <textarea className="w-full border p-3 rounded h-32" value={answers.condition} onChange={e => updateAnswer('condition', e.target.value)} placeholder="e.g. I was diagnosed with Fibromyalgia in 2019..." />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">2. Morning Routine (Washing/Dressing)</h3>
            <p className="text-sm text-slate-500">Do you need help? Does it take longer? Is it painful?</p>
            <textarea className="w-full border p-3 rounded h-32" value={answers.washing} onChange={e => updateAnswer('washing', e.target.value)} placeholder="e.g. It takes me 45 mins to get dressed due to stiffness..." />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">3. Sleeping & Fatigue</h3>
            <p className="text-sm text-slate-500">Do you wake up in pain? How does tiredness affect your day?</p>
            <textarea className="w-full border p-3 rounded h-32" value={answers.sleeping} onChange={e => updateAnswer('sleeping', e.target.value)} placeholder="e.g. I wake up 5 times a night..." />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">4. Concentration & Memory</h3>
            <p className="text-sm text-slate-500">Do you forget things? Can you read a book? Brain fog?</p>
            <textarea className="w-full border p-3 rounded h-32" value={answers.concentrating} onChange={e => updateAnswer('concentrating', e.target.value)} placeholder="e.g. I cannot follow complex instructions..." />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">5. Social Interaction</h3>
            <p className="text-sm text-slate-500">Do you avoid people? Anxiety?</p>
            <textarea className="w-full border p-3 rounded h-32" value={answers.social} onChange={e => updateAnswer('social', e.target.value)} placeholder="e.g. I have stopped seeing friends..." />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4 h-full flex flex-col">
            <h3 className="font-bold text-lg text-green-700 flex items-center gap-2"><ClipboardIcon /> Your Draft Statement</h3>
            <textarea className="flex-1 w-full border p-4 rounded bg-slate-50 font-mono text-sm leading-relaxed" value={draft} onChange={e => setDraft(e.target.value)} />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col pb-10">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-shrink-0 mb-6">
         <h2 className="text-xl font-bold text-slate-800">Disability Impact Statement Wizard</h2>
         <p className="text-sm text-slate-500">Step-by-step guide to proving "Substantial Adverse Effect" (s6 Equality Act). Data auto-saves.</p>
      </div>

      <div className="flex-1 bg-white p-8 rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="flex-1 overflow-auto">{renderStep()}</div>
         
         <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between">
            {step > 1 && step < 6 && (
              <button onClick={handleBack} className="px-4 py-2 text-slate-600 font-medium">Back</button>
            )}
            {step < 5 && (
              <button onClick={handleNext} className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-medium">Next Step</button>
            )}
            {step === 5 && (
              <button onClick={handleGenerate} disabled={isLoading} className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg font-medium flex items-center gap-2">
                {isLoading ? <LoaderIcon /> : <EditIcon />} Generate Statement
              </button>
            )}
         </div>
      </div>
    </div>
  );
};

export default ImpactStatementView;
