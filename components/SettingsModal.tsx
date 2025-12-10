
import React, { useState, useEffect } from 'react';
import { XIcon, CheckIcon, DownloadIcon, BrainIcon } from './Icons';
import { AiProvider } from '../types';
import { getWebLLMEngine } from '../services/webllmService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: AiProvider;
  onProviderChange: (provider: AiProvider) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, currentProvider, onProviderChange }) => {
  const [downloadProgress, setDownloadProgress] = useState<{ progress: number, text: string } | null>(null);
  const [isEngineReady, setIsEngineReady] = useState(false);

  useEffect(() => {
    // Check if engine is already loaded
    // This is a simplified check, ideally we query the service state
  }, []);

  const handleSelectWebLLM = async () => {
    onProviderChange('webllm');
    // Trigger download/init
    try {
      setDownloadProgress({ progress: 0, text: "Initializing..." });
      await getWebLLMEngine((report) => {
        setDownloadProgress({ 
            progress: report.progress || 0, 
            text: report.text 
        });
      });
      setIsEngineReady(true);
      setDownloadProgress(null);
    } catch (e) {
      console.error(e);
      alert("Failed to load WebLLM model. Check console or GPU compatibility.");
      onProviderChange('gemini'); // Revert
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <BrainIcon className="text-slate-600"/> AI Engine Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200">
            <XIcon />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          {/* Gemini Option */}
          <div 
            onClick={() => onProviderChange('gemini')}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                currentProvider === 'gemini' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-800">Google Gemini API (Cloud)</h4>
                {currentProvider === 'gemini' && <CheckIcon className="text-blue-600" />}
            </div>
            <p className="text-sm text-slate-600">
                Processing happens on Google's secure servers. Requires an API Key.
                <br/><strong>Best for:</strong> Speed, complex reasoning, heavy files.
            </p>
          </div>

          {/* WebLLM Option */}
          <div 
            onClick={handleSelectWebLLM}
            className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                currentProvider === 'webllm' 
                ? 'border-teal-500 bg-teal-50' 
                : 'border-slate-200 hover:border-teal-300'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-slate-800">WebLLM (Local Browser)</h4>
                {currentProvider === 'webllm' && <CheckIcon className="text-teal-600" />}
            </div>
            <p className="text-sm text-slate-600 mb-2">
                Runs entirely in your browser using WebGPU. No data leaves your device.
                <br/><strong>Best for:</strong> Total privacy, offline usage (after download).
            </p>
            <div className="text-xs bg-slate-100 p-2 rounded text-slate-500">
                Requires ~4GB download on first use. Requires a GPU.
            </div>
            
            {/* Download Progress Bar */}
            {downloadProgress && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs font-bold text-teal-700 mb-1">
                        <span>{downloadProgress.text}</span>
                        <span>{Math.round(downloadProgress.progress * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                            className="bg-teal-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${downloadProgress.progress * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}
          </div>

        </div>

        <div className="px-6 py-4 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
