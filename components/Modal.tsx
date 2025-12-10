
import React, { useState, useEffect } from 'react';
import { XIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type?: 'alert' | 'confirm' | 'prompt';
  message?: React.ReactNode;
  onConfirm?: (inputValue?: string) => void;
  confirmText?: string;
  cancelText?: string;
  inputPlaceholder?: string;
  defaultValue?: string;
  children?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, onClose, title, type = 'alert', message, onConfirm, 
  confirmText = 'OK', cancelText = 'Cancel', inputPlaceholder, defaultValue, children 
}) => {
  const [inputValue, setInputValue] = useState(defaultValue || '');

  useEffect(() => {
    if (isOpen && defaultValue) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(type === 'prompt' ? inputValue : undefined);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200">
            <XIcon />
          </button>
        </div>
        
        <div className="p-6">
          {message && <div className="text-slate-600 mb-4">{message}</div>}
          
          {children}

          {type === 'prompt' && (
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          {(type === 'confirm' || type === 'prompt') && (
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={handleConfirm}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
