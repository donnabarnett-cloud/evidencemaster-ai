
import React, { useState, useEffect, useRef } from 'react';
import { TimelineIcon, AlertIcon, ChatIcon, FileIcon, GavelIcon, DownloadIcon, FilterIcon, SearchIcon, BriefcaseIcon, CalendarIcon, ClipboardIcon, SaveIcon, EditIcon, ChartIcon, BrainIcon, GraphIcon, UserCheckIcon, VerifiedIcon, ActivityIcon, UsersIcon, MicroscopeIcon, BookIcon, HeartPulseIcon, HandshakeIcon, GraduationCapIcon, FolderIcon, UploadIcon, TargetIcon, MagicWandIcon, LightbulbIcon } from './Icons';

// Simple Cog Icon for Settings
export const CogIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.35a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

export interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReset: () => void;
  onExport: (type: 'json' | 'chronology' | 'scott' | 'bundle') => void;
  onChangeKey: () => void;
  onOpenSettings?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  caseName: string;
  onSaveCase: () => void;
  onLoadCase: () => void;
  onNewCase: () => void;
  onImportCase: (file: File) => void;
  hasApiKey?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, onReset, onExport, onChangeKey, onOpenSettings, searchQuery, setSearchQuery,
  caseName, onSaveCase, onLoadCase, onNewCase, onImportCase, hasApiKey
}) => {
  const [dyslexiaFont, setDyslexiaFont] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dyslexiaFont) {
      document.body.classList.add('font-dyslexia');
      document.body.style.fontFamily = 'Comic Sans MS, Chalkboard SE, sans-serif'; 
    } else {
      document.body.classList.remove('font-dyslexia');
      document.body.style.fontFamily = '';
    }
  }, [dyslexiaFont]);

  const toggleFont = () => {
    setDyslexiaFont(!dyslexiaFont);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onImportCase(e.target.files[0]);
    }
    if (importInputRef.current) importInputRef.current.value = '';
  };

  const navItems = [
    { id: 'dashboard', label: 'Discovery Dashboard', icon: <FilterIcon /> },
    { id: 'copilot', label: 'Case Co-Pilot', icon: <BrainIcon /> }, 
    { id: 'library', label: 'Legal Library & Research', icon: <GraduationCapIcon /> }, 
    { id: 'roadmap', label: 'Legal Roadmap', icon: <CalendarIcon /> }, 
    { id: 'documents', label: 'Documents & Uploads', icon: <UploadIcon /> },
    { id: 'bundle', label: 'Bundle Builder', icon: <FolderIcon /> },
    { id: 'legaldocs', label: 'Court Documents & Forms', icon: <GavelIcon /> }, 
    { id: 'notes', label: 'My Case Notes', icon: <ClipboardIcon /> },
    { id: 'timeline', label: 'Chronology', icon: <TimelineIcon /> },
    { id: 'scott_schedule', label: 'Smart Scott Schedule', icon: <ClipboardIcon /> }, 
    { id: 'issues', label: 'Issues & Risk', icon: <AlertIcon /> },
    { id: 'patterns', label: 'Pattern Recognition', icon: <ChartIcon /> },
    { id: 'forensic', label: 'Forensic Analyst', icon: <MicroscopeIcon /> },
    { id: 'appeal', label: 'Grievance Appeal', icon: <GavelIcon /> }, 
    { id: 'policy', label: 'Union Rep (Policy)', icon: <BookIcon /> },
    { id: 'medical_nexus', label: 'Medical Expert', icon: <HeartPulseIcon /> },
    { id: 'negotiation', label: 'Mediator', icon: <HandshakeIcon /> },
    { id: 'impact', label: 'Impact Statement', icon: <EditIcon /> },
    { id: 'loss', label: 'Schedule of Loss', icon: <ChartIcon /> },
    { id: 'cast', label: 'Cast List', icon: <UsersIcon /> },
    { id: 'coaching', label: 'Skills Coach', icon: <UserCheckIcon /> }, 
    { id: 'drafting', label: 'Drafting Studio', icon: <EditIcon /> },
    { id: 'claimant_rep', label: "Claimant's War Room", icon: <BriefcaseIcon /> },
    { id: 'prelim_hearing', label: 'Preliminary Hearing', icon: <CalendarIcon /> },
    { id: 'tribunal', label: 'Tribunal Prep', icon: <GavelIcon /> },
    { id: 'chat', label: 'CoCounsel Chat', icon: <ChatIcon /> },
    { id: 'diagnostics', label: 'System Diagnostics', icon: <ActivityIcon /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              EvidenceMaster
            </h1>
            <p className="text-xs text-slate-400 mt-1">AI-Powered eDiscovery</p>
          </div>
          <button 
            onClick={onOpenSettings} 
            className="text-slate-400 hover:text-white transition-colors"
            title="AI Settings"
          >
            <CogIcon className="w-5 h-5"/>
          </button>
        </div>
        
        {/* Case Management Buttons */}
        <div className="p-4 border-b border-slate-700 flex flex-col gap-2">
           <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
              <span>Current Case</span>
              <span className="text-blue-400 truncate max-w-[80px]">{caseName || 'Untitled'}</span>
           </div>
           <div className="grid grid-cols-3 gap-1">
              <button onClick={onSaveCase} className="flex flex-col items-center justify-center bg-blue-700 hover:bg-blue-600 p-2 rounded text-[10px] font-medium transition-colors">
                <SaveIcon className="w-4 h-4 mb-1"/> Save
              </button>
              <button onClick={onLoadCase} className="flex flex-col items-center justify-center bg-slate-700 hover:bg-slate-600 p-2 rounded text-[10px] font-medium transition-colors">
                <FileIcon className="w-4 h-4 mb-1"/> Load
              </button>
              <button onClick={handleImportClick} className="flex flex-col items-center justify-center bg-slate-700 hover:bg-slate-600 p-2 rounded text-[10px] font-medium transition-colors text-emerald-400">
                <UploadIcon className="w-4 h-4 mb-1"/> Import
              </button>
              <input type="file" ref={importInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
           </div>
           <button onClick={onNewCase} className="w-full mt-1 bg-slate-800 hover:bg-slate-700 p-2 rounded text-xs text-slate-300 font-medium transition-colors">
             + New Case
           </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-slate-800">
            <button onClick={() => onExport('chronology')} className="flex items-center w-full px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
              <span className="mr-3"><DownloadIcon /></span> Chronology CSV
            </button>
            <button onClick={() => onExport('scott')} className="flex items-center w-full px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
               <span className="mr-3"><DownloadIcon /></span> Scott Schedule CSV
            </button>
            <button onClick={() => onExport('bundle')} className="flex items-center w-full px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
               <span className="mr-3"><DownloadIcon /></span> Bundle Index CSV
            </button>
            <button onClick={() => onExport('json')} className="flex items-center w-full px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
               <span className="mr-3"><DownloadIcon /></span> Full Backup JSON
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2 mt-auto">
          {/* Accessibility Toggle */}
          <div className="flex items-center justify-between px-2">
             <span className="text-xs text-slate-500">Dyslexia Font</span>
             <button 
               onClick={toggleFont} 
               className={`w-8 h-4 rounded-full transition-colors ${dyslexiaFont ? 'bg-blue-500' : 'bg-slate-700'}`}
             >
               <div className={`w-2 h-2 bg-white rounded-full transition-transform ${dyslexiaFont ? 'translate-x-5' : 'translate-x-1'}`} />
             </button>
          </div>

          <div 
            onClick={() => setActiveTab('diagnostics')} 
            className="bg-slate-800 rounded-lg p-3 cursor-pointer hover:bg-slate-700 transition-colors group"
            title="Click to run System Diagnostics"
          >
            <p className="text-xs text-slate-400 font-semibold mb-1 group-hover:text-white">SYSTEM STATUS</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-50 animate-pulse"></div>
              <span className="text-xs text-slate-200">Online & Ready</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Version 3.5 (Platinum)</div>
          </div>
          
          <div className="flex gap-2">
             <button 
              onClick={onReset}
              className="flex-1 py-2 px-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xs font-medium"
            >
              Clear Session
            </button>
            {onChangeKey && (
              <button 
                onClick={onChangeKey}
                className={`py-2 px-3 rounded-lg transition-colors text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
                    hasApiKey 
                    ? 'bg-slate-800 text-green-400 hover:bg-slate-700' 
                    : 'bg-red-900/50 text-red-200 hover:bg-red-900/70 border border-red-800'
                }`}
                title={hasApiKey ? "Update API Key (Active)" : "Set Google Gemini API Key"}
              >
                {hasApiKey ? <><div className="w-2 h-2 rounded-full bg-green-500"></div> Key</> : "⚠️ Set Key"}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-6">
             <h2 className="text-lg font-semibold text-slate-800 capitalize w-48 truncate">
              {activeTab === 'diagnostics' ? 'System Diagnostics' : navItems.find(n => n.id === activeTab)?.label}
            </h2>
            
            {/* Global Search Bar */}
            <div className="relative w-96">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <SearchIcon />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full p-2 pl-10 text-sm text-slate-900 border border-slate-300 rounded-lg bg-slate-50 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors" 
                placeholder="Global Search (Documents, Evidence, Facts)..." 
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
             {/* Radical Accuracy Badge */}
             <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 text-[10px] font-bold uppercase tracking-wider">
               <VerifiedIcon /> Radical Accuracy Active
             </div>
            <span className="text-sm text-slate-500">Case: <span className="font-mono text-slate-700">{caseName || 'Unsaved'}</span></span>
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
              JD
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full relative z-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
