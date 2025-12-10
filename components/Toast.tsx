
import React, { useEffect } from 'react';
import { CheckIcon, AlertIcon, InfoIcon, XIcon } from './Icons';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const icons = {
    success: <CheckIcon className="text-green-500" />,
    error: <AlertIcon className="text-red-500" />,
    info: <InfoIcon className="text-blue-500" />
  };

  const colors = {
    success: 'border-green-100 bg-white',
    error: 'border-red-100 bg-white',
    info: 'border-blue-100 bg-white'
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg shadow-lg border ${colors[toast.type]} min-w-[300px] animate-in slide-in-from-right duration-300`}>
      <div className={`p-2 rounded-full bg-opacity-10 ${
        toast.type === 'success' ? 'bg-green-100' : toast.type === 'error' ? 'bg-red-100' : 'bg-blue-100'
      }`}>
        {icons[toast.type]}
      </div>
      <p className="text-sm font-medium text-slate-700 flex-1">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="text-slate-400 hover:text-slate-600">
        <XIcon />
      </button>
    </div>
  );
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
