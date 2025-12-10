
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import DocumentsView from './components/DocumentsView';
import TimelineView from './components/TimelineView';
import IssuesView from './components/IssuesView';
import TribunalPrepView from './components/TribunalPrepView';
import ClaimantRepresentativeView from './components/ClaimantRepresentativeView'; 
import PreliminaryHearingView from './components/PreliminaryHearingView'; 
import UserNotesView from './components/UserNotesView'; 
import ChatInterface from './components/ChatInterface';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import DocumentReviewModal from './components/DocumentReviewModal';
import LegalRoadmapView from './components/LegalRoadmapView'; 
import DraftingStudio from './components/DraftingStudio'; 
import PatternAnalysisView from './components/PatternAnalysisView';
import CoPilotView from './components/CoPilotView'; 
import CoachingView from './components/CoachingView'; 
import SystemDiagnostics from './components/SystemDiagnostics'; 
import ScheduleOfLossView from './components/ScheduleOfLossView'; 
import ImpactStatementView from './components/ImpactStatementView'; 
import CastListView from './components/CastListView'; 
import ForensicAnalysisView from './components/ForensicAnalysisView'; 
import PolicyAuditView from './components/PolicyAuditView'; 
import MedicalNexusView from './components/MedicalNexusView'; 
import NegotiationView from './components/NegotiationView'; 
import LegalLibraryView from './components/LegalLibraryView'; 
import BundleBuilderView from './components/BundleBuilderView'; 
import SmartScottScheduleView from './components/SmartScottScheduleView'; 
import LegalDocsView from './components/LegalDocsView'; 
import GrievanceAppealView from './components/GrievanceAppealView';
import Modal from './components/Modal';
import ToastContainer, { ToastMessage } from './components/Toast';
import UploadClassificationModal from './components/UploadClassificationModal';
import SettingsModal from './components/SettingsModal';
import { DocumentMetadata, DocStatus, TimelineEvent, Issue, TribunalStrategy, Entity, MedicalEvidence, PolicyReference, FileRegistry, ChatMessage, PreliminaryHearingStrategy, UserNote, FullCaseData, CaseMetadata, DraftDocument, PatternAnalysisResult, ConsolidatedIssue, EthicsRadar, CaseGraphNode, CaseGraphLink, CoachingModule, RealityCheckResult, SuggestedAdjustment, CastMember, ScheduleOfLossData, ForensicData, PolicyAudit, MedicalNexus, NegotiationStrategy, ClaimantActionPlan, LegalGuide, BundleFolder, ScottScheduleItem, ImpactStatementData, AppealPack, AiProvider } from './types';
import { analyzeDocument, validateApiKey, deduplicateTimelineEvents, createChatSession, transcribeAudio, extractDocumentContent } from './services/aiService';
import { saveCase, loadCase, listSavedCases, loadLastActiveCase } from './utils/storageUtils';
import { downloadJSON, downloadCSV, generateChronologyCSV, generateScottScheduleCSV, generateBundleIndexCSV } from './utils/exportUtils';
import { validateAndSanitizePdf } from './services/pdfService';
import mammoth from 'mammoth';
import { LoaderIcon } from './components/Icons';
import { Chat } from '@google/genai'; 

// Reduced to 12MB to ensure Base64 overhead (1.33x) fits within Gemini's 20MB payload limit
const MAX_FILE_SIZE_MB = 12; 
const UPLOAD_CONCURRENCY = 3; 

// Robust MIME type detection for Audio
const getAudioMimeType = (fileName: string, fileType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    // Specific overrides for formats where browsers are unreliable
    if (ext === 'm4a') return 'audio/mp4'; 
    if (ext === 'mp3') return 'audio/mp3';
    if (ext === 'wav') return 'audio/wav';
    if (ext === 'aac') return 'audio/aac';
    
    // Fallback to browser detection if valid audio type
    if (fileType && fileType.startsWith('audio/')) return fileType;
    
    // Generic fallback based on extension
    switch (ext) {
        case 'ogg': return 'audio/ogg';
        case 'mpeg': return 'audio/mpeg';
        case 'mpga': return 'audio/mpeg';
        case 'webm': return 'audio/webm';
        default: return 'audio/mp3'; 
    }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Initialize from LocalStorage if available to support custom keys, else fallback to env
  const [userApiKey, setUserApiKey] = useState<string>(() => {
      return localStorage.getItem('evidence_master_api_key') || process.env.API_KEY || '';
  });

  const [aiProvider, setAiProvider] = useState<AiProvider>(() => {
      return (localStorage.getItem('ai_provider') as AiProvider) || 'gemini';
  });

  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [filesRegistry, setFilesRegistry] = useState<FileRegistry>({});
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [consolidatedIssues, setConsolidatedIssues] = useState<ConsolidatedIssue[]>([]);
  const [ethicsRadar, setEthicsRadar] = useState<EthicsRadar[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [medicalEvidence, setMedicalEvidence] = useState<MedicalEvidence[]>([]);
  const [policies, setPolicies] = useState<PolicyReference[]>([]);
  const [tribunalStrategy, setTribunalStrategy] = useState<TribunalStrategy | null>(null);
  const [prelimStrategy, setPrelimStrategy] = useState<PreliminaryHearingStrategy | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [draftDocuments, setDraftDocuments] = useState<DraftDocument[]>([]);
  const [patternAnalysis, setPatternAnalysis] = useState<PatternAnalysisResult | null>(null);
  const [graphNodes, setGraphNodes] = useState<CaseGraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<CaseGraphLink[]>([]);
  const [coachingModules, setCoachingModules] = useState<CoachingModule[]>([]);
  const [realityChecks, setRealityChecks] = useState<RealityCheckResult[]>([]);
  const [suggestedAdjustments, setSuggestedAdjustments] = useState<SuggestedAdjustment[]>([]);
  const [castList, setCastList] = useState<CastMember[]>([]); 
  
  // Lifted State for Persistence
  const [scheduleOfLoss, setScheduleOfLoss] = useState<ScheduleOfLossData | null>(null); 
  const [impactStatement, setImpactStatement] = useState<ImpactStatementData | null>(null);
  const [forensicData, setForensicData] = useState<ForensicData | null>(null);
  const [policyAudit, setPolicyAudit] = useState<PolicyAudit | null>(null);
  const [medicalNexus, setMedicalNexus] = useState<MedicalNexus | null>(null);
  const [negotiationStrategy, setNegotiationStrategy] = useState<NegotiationStrategy | null>(null);
  const [claimantActionPlan, setClaimantActionPlan] = useState<ClaimantActionPlan | null>(null);
  const [legalGuides, setLegalGuides] = useState<LegalGuide[]>([]); 
  const [bundleFolders, setBundleFolders] = useState<BundleFolder[]>([]);
  const [scottSchedule, setScottSchedule] = useState<ScottScheduleItem[]>([]);
  const [appealPack, setAppealPack] = useState<AppealPack | null>(null); 

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [modalConfig, setModalConfig] = useState<any>({ isOpen: false, title: '', message: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [caseName, setCaseName] = useState('');
  const [caseId, setCaseId] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);

  const [selectedReviewDocId, setSelectedReviewDocId] = useState<string | null>(null);
  const [isStorageLoading, setIsStorageLoading] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  
  const [isClassificationModalOpen, setIsClassificationModalOpen] = useState(false);
  const [filesToClassify, setFilesToClassify] = useState<File[]>([]);

  // Auto-Save Ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChangesRef = useRef(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Ensure case ID exists before adding data
  const ensureCaseInitialized = () => {
      if (!caseId) {
          const newId = Date.now().toString();
          const newName = `Case ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
          setCaseId(newId);
          setCaseName(newName);
          showToast(`Started new case: ${newName}`, 'success');
          return newName; // Return name to confirm creation
      }
      return caseName;
  };

  useEffect(() => {
    const init = async () => {
      // 1. Request Persistent Storage to prevent browser eviction
      if (navigator.storage && navigator.storage.persist) {
        const isPersisted = await navigator.storage.persisted();
        if (!isPersisted) {
          await navigator.storage.persist();
        }
      }

      // 2. Load Last Case
      setIsStorageLoading(true);
      try {
        const lastCase = await loadLastActiveCase();
        if (lastCase) {
          await loadCaseIntoState(lastCase);
          showToast(`Resumed case: ${lastCase.metadata.name}`, 'info');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsStorageLoading(false);
      }
    };
    init();
  }, []);

  // Before Unload Warning
  useEffect(() => {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
          if (hasChangesRef.current) {
              e.preventDefault();
              e.returnValue = ''; 
          }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Auto-Save Logic
  useEffect(() => {
      if (caseId) {
          hasChangesRef.current = true;
          if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
          
          saveTimeoutRef.current = setTimeout(() => {
              if (hasChangesRef.current && caseId) {
                  performSave(caseName || "Untitled Case", true);
              }
          }, 10000); // Save every 10s if changes
      }
  }, [
      documents, timeline, issues, userNotes, scheduleOfLoss, impactStatement, 
      scottSchedule, bundleFolders, appealPack, caseName, prelimStrategy, tribunalStrategy, castList
  ]);

  useEffect(() => {
    if (userApiKey && aiProvider === 'gemini') {
      createChatSession(userApiKey).then(setChatInstance);
    }
  }, [userApiKey, aiProvider]);

  const loadCaseIntoState = async (data: FullCaseData) => {
    setCaseId(data.metadata.id);
    setCaseName(data.metadata.name);
    setCaseDescription(data.metadata.description || '');
    
    // STRICTLY LOAD ALL FIELDS WITH DEFAULTS
    setDocuments(data.documents || []);
    setTimeline(data.timelineEvents || []);
    setIssues(data.issues || []);
    setConsolidatedIssues(data.consolidatedIssues || []);
    setEthicsRadar(data.ethicsRadar || []);
    setEntities(data.entities || []);
    setMedicalEvidence(data.medicalEvidence || []);
    setPolicies(data.policyReferences || []);
    setChatHistory(data.chatHistory || []);
    setUserNotes(data.userNotes || []);
    setDraftDocuments(data.draftDocuments || []);
    setGraphNodes(data.graphNodes || []);
    setGraphLinks(data.graphLinks || []);
    setCoachingModules(data.coachingModules || []);
    setRealityChecks(data.realityChecks || []);
    setSuggestedAdjustments(data.suggestedAdjustments || []);
    setCastList(data.castList || []);
    setLegalGuides(data.legalGuides || []); 
    setBundleFolders(data.bundleFolders || []); 
    setScottSchedule(data.scottSchedule || []);

    // Nullable fields must be explicitly nulled if missing in source
    setTribunalStrategy(data.tribunalStrategy || null);
    setPrelimStrategy(data.prelimStrategy || null);
    setPatternAnalysis(data.patternAnalysis || null);
    setScheduleOfLoss(data.scheduleOfLoss || null);
    setImpactStatement(data.impactStatement || null);
    setForensicData(data.forensicData || null);
    setPolicyAudit(data.policyAudit || null);
    setMedicalNexus(data.medicalNexus || null);
    setNegotiationStrategy(data.negotiationStrategy || null);
    setClaimantActionPlan(data.claimantActionPlan || null);
    setAppealPack(data.appealPack || null);

    // Rehydrate Files
    if (data.fileAttachments) {
        const newRegistry: FileRegistry = {};
        for (const [id, attachment] of Object.entries(data.fileAttachments)) {
            try {
                const att = attachment as { name: string; type: string; data: string };
                const res = await fetch(`data:${att.type};base64,${att.data}`);
                const blob = await res.blob();
                const file = new File([blob as any], att.name, { type: att.type });
                newRegistry[id] = file;
            } catch (e) {
                console.error("Failed to rehydrate file", id, e);
            }
        }
        setFilesRegistry(newRegistry);
    } else {
        setFilesRegistry({}); // Clear registry if no files in this case
    }
    
    setLastAutoSave(new Date(data.metadata.lastModified));
    hasChangesRef.current = false;
  };

  const resetSession = () => {
    setDocuments([]);
    setTimeline([]);
    setIssues([]);
    setConsolidatedIssues([]);
    setEthicsRadar([]);
    setEntities([]);
    setMedicalEvidence([]);
    setPolicies([]);
    setTribunalStrategy(null);
    setPrelimStrategy(null);
    setChatHistory([]);
    setUserNotes([]);
    setDraftDocuments([]);
    setPatternAnalysis(null);
    setGraphNodes([]);
    setGraphLinks([]);
    setCoachingModules([]);
    setRealityChecks([]);
    setSuggestedAdjustments([]);
    setCastList([]);
    setScheduleOfLoss(null);
    setImpactStatement(null);
    setForensicData(null);
    setPolicyAudit(null);
    setMedicalNexus(null);
    setNegotiationStrategy(null);
    setClaimantActionPlan(null);
    setLegalGuides([]); 
    setBundleFolders([]); 
    setScottSchedule([]);
    setAppealPack(null);
    setCaseName('');
    setCaseId('');
    setCaseDescription('');
    setFilesRegistry({});
    setSelectedReviewDocId(null);
    setLastAutoSave(null);
    hasChangesRef.current = false;
  };

  const handleSaveCurrentCase = () => {
    if (!caseName) {
      setModalConfig({
        isOpen: true,
        title: "Save Case",
        type: 'prompt',
        message: "Enter a name for this case:",
        inputPlaceholder: "e.g. Smith v Jones Ltd",
        onConfirm: (name: string) => {
          if (name) {
             setCaseName(name);
             performSave(name);
          }
        },
        onClose: closeModal
      });
      return;
    }
    performSave(caseName);
  };

  const performSave = async (name: string, silent = false) => {
     if (!silent) setIsStorageLoading(true);
     
     // Serialize files
     const attachments: { [id: string]: { name: string, type: string, data: string } } = {};
     for (const [id, fileVal] of Object.entries(filesRegistry)) {
         const file = fileVal as File;
         try {
             const base64 = await new Promise<string>((resolve) => {
                 const reader = new FileReader();
                 reader.onload = () => resolve((reader.result as string).split(',')[1]);
                 reader.readAsDataURL(file);
             });
             attachments[id] = { name: file.name, type: file.type, data: base64 };
         } catch (e) {
             console.error("Failed to serialize file", file.name, e);
         }
     }

     const meta: CaseMetadata = {
       id: caseId || Date.now().toString(),
       name: name,
       lastModified: Date.now(),
       description: caseDescription
     };

     const fullData: FullCaseData = {
        metadata: meta,
        documents,
        timelineEvents: timeline,
        issues,
        consolidatedIssues,
        ethicsRadar,
        entities,
        medicalEvidence,
        policyReferences: policies,
        contextSummary: contextSummary,
        tribunalStrategy,
        chatHistory,
        prelimStrategy,
        userNotes,
        draftDocuments,
        patternAnalysis,
        graphNodes,
        graphLinks,
        coachingModules,
        realityChecks,
        suggestedAdjustments,
        castList,
        scheduleOfLoss: scheduleOfLoss || undefined,
        impactStatement: impactStatement || undefined,
        forensicData,
        policyAudit,
        medicalNexus,
        negotiationStrategy,
        legalGuides,
        bundleFolders,
        claimantActionPlan,
        scottSchedule,
        appealPack: appealPack || undefined,
        fileAttachments: attachments
     };
     
     try {
       await saveCase(fullData);
       setCaseId(meta.id);
       hasChangesRef.current = false;
       setLastAutoSave(new Date());
       if (!silent) showToast("Case saved successfully", "success");
     } catch (e) {
       console.error(e);
       if (!silent) showToast("Failed to save case", "error");
     } finally {
       if (!silent) setIsStorageLoading(false);
     }
  };

  const handleImportCase = async (file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              // Basic validation check
              if (json.metadata && json.metadata.id) {
                  // Prompt user before overwriting if they have unsaved work
                  if (documents.length > 0 && hasChangesRef.current) {
                      if (!window.confirm("Importing will overwrite your current session. Continue?")) return;
                  }
                  
                  setIsStorageLoading(true);
                  await saveCase(json); // Save imported case to DB immediately
                  await loadCaseIntoState(json); // Load to state
                  showToast("Project imported successfully", "success");
              } else {
                  showToast("Invalid project file format", "error");
              }
          } catch (err) {
              console.error(err);
              showToast("Failed to parse project file", "error");
          } finally {
              setIsStorageLoading(false);
          }
      };
      reader.readAsText(file);
  };

  const handleReset = () => {
    setModalConfig({
      isOpen: true,
      title: "Clear Session",
      type: 'confirm',
      message: "Are you sure you want to clear the current session? Unsaved progress will be lost.",
      onConfirm: () => {
        resetSession();
        showToast("Session cleared", "info");
      },
      onClose: closeModal
    });
  };

  const handleNewCase = () => {
    const hasData = documents.length > 0 || userNotes.length > 0;
    const startNewCaseFlow = () => {
        resetSession();
        setTimeout(() => {
            setModalConfig({
                isOpen: true,
                title: "Create New Case",
                type: 'prompt',
                message: "Enter a name for your new case:",
                inputPlaceholder: "e.g. Doe v MegaCorp",
                confirmText: "Create Case",
                onConfirm: (name: string) => {
                    if (name) {
                        setCaseName(name);
                        setCaseId(Date.now().toString());
                        showToast(`New case '${name}' created`, "success");
                    }
                },
                onClose: closeModal
            });
        }, 100);
    };

    if (hasData) {
        setModalConfig({
            isOpen: true,
            title: "Start New Case",
            type: 'confirm',
            message: "Starting a new case will clear your current session. Have you saved your work?",
            confirmText: "Discard & Start New",
            onConfirm: startNewCaseFlow,
            onClose: closeModal
        });
    } else {
        startNewCaseFlow();
    }
  };

  const processSingleFile = async (file: File, docId: string) => {
      // 1. Strict Size Check (12MB limit for safety)
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          showToast(`Skipped ${file.name}: Exceeds ${MAX_FILE_SIZE_MB}MB limit for AI processing`, 'error');
          setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: DocStatus.ERROR, summary: [`File too large for AI analysis (>${MAX_FILE_SIZE_MB}MB)`] } : d));
          return;
      }

      try {
          let contentToAnalyze: any = null;
          let textContent = '';
          
          // 2. Robust File Type Detection (Fallback to extension if file.type is empty)
          const fileType = file.type || '';
          const fileName = file.name.toLowerCase();
          
          const isPdf = fileType === 'application/pdf' || fileName.endsWith('.pdf');
          const isDocx = fileName.endsWith('.docx');
          const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic)$/i.test(fileName);
          const isAudio = fileType.startsWith('audio/') || /\.(mp3|wav|m4a|mpga|mpeg|ogg|aac|webm)$/i.test(fileName);

          if (isPdf) {
              // Special handling for PDF to validate structure first
              const sanitizedPdf = await validateAndSanitizePdf(file);
              if (!sanitizedPdf) {
                  showToast(`Skipped invalid or password-protected PDF: ${file.name}`, 'error');
                  setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: DocStatus.ERROR } : d));
                  return;
              }
              
              // Optimized Base64 Conversion using FileReader (Async)
              const pdfBlob = new Blob([sanitizedPdf], { type: 'application/pdf' });
              const base64String = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                      const result = reader.result as string;
                      // Data URL format: "data:application/pdf;base64,....."
                      // Split to get just the base64 data
                      const base64 = result.split(',')[1];
                      resolve(base64);
                  };
                  reader.onerror = (err) => reject(err);
                  reader.readAsDataURL(pdfBlob);
              });
              
              contentToAnalyze = { mimeType: 'application/pdf', data: base64String };
              
              // Extract text so the Chat can "read" the document
              try {
                  const extracted = await extractDocumentContent({ mimeType: 'application/pdf', data: base64String }, userApiKey);
                  textContent = extracted || "(PDF Text Extraction Empty)";
              } catch (err) {
                  console.warn("Text extraction failed for PDF", err);
                  textContent = "(Text extraction failed - relied on visual analysis)";
              }
              
          } else if (isImage) {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              await new Promise<void>((resolve, reject) => {
                  reader.onload = async () => {
                      try {
                        const result = reader.result as string;
                        const base64 = result.split(',')[1];
                        const mime = fileType || 'image/jpeg';
                        contentToAnalyze = { mimeType: mime, data: base64 };
                        
                        // Extract text via OCR (Must AWAIT here to ensure textContent is ready)
                        try {
                            const extracted = await extractDocumentContent({ mimeType: mime, data: base64 }, userApiKey);
                            textContent = extracted || "(Image Text Extraction Empty)";
                        } catch (e) {
                            textContent = "(Image OCR failed)";
                        }
                        
                        resolve();
                      } catch (e) {
                        reject(e);
                      }
                  };
                  reader.onerror = reject;
              });
          } else if (isDocx) {
              const arrayBuffer = await file.arrayBuffer();
              const result = await mammoth.extractRawText({ arrayBuffer });
              textContent = result.value;
              contentToAnalyze = { type: 'text', value: textContent };
          } else if (isAudio) {
              const detectedMime = getAudioMimeType(fileName, fileType);
              console.log(`Transcribing ${fileName} as ${detectedMime}`);
              
              textContent = await transcribeAudio({ 
                  mimeType: detectedMime, 
                  data: await new Promise(r => { 
                      const fr = new FileReader(); 
                      fr.onload = () => r((fr.result as string).split(',')[1]); 
                      fr.readAsDataURL(file);
                  }) 
              }, userApiKey);
              contentToAnalyze = { type: 'text', value: textContent };
          } else {
              // Fallback for text files
              textContent = await file.text();
              contentToAnalyze = { type: 'text', value: textContent };
          }

          // Pre-flight check for empty text content to prevent "AI returned empty result" error
          if (contentToAnalyze && contentToAnalyze.type === 'text' && (!contentToAnalyze.value || contentToAnalyze.value.trim().length === 0)) {
               console.warn(`Empty content extracted from ${file.name}`);
               setDocuments(prev => prev.map(d => d.id === docId ? { 
                  ...d, 
                  status: DocStatus.READY,
                  textContent: "(No readable text extracted)",
                  summary: ["No text content could be extracted from this file. It may be an image-only PDF (OCR required) or empty."],
                  extractionStats: { eventCount: 0, issueCount: 0, medicalCount: 0, entityCount: 0 }
               } : d));
               showToast(`No text found in ${file.name} - Analysis skipped.`, 'info');
               return; 
          }

          const analysis = await analyzeDocument(contentToAnalyze, file.name, docId, userApiKey, (p) => {
              // Optional: Update progress specific to docId
          });

          if (analysis) {
              setDocuments(prev => prev.map(d => d.id === docId ? { 
                  ...d, 
                  status: DocStatus.READY,
                  textContent: textContent, 
                  summary: analysis.summary, 
                  extractionStats: {
                      eventCount: analysis.timeline?.length || 0,
                      issueCount: analysis.issues?.length || 0,
                      medicalCount: analysis.medicalEvidence?.length || 0,
                      entityCount: analysis.entities?.length || 0
                  }
              } : d));

              setTimeline(prev => deduplicateTimelineEvents([...prev, ...(analysis.timeline || [])]));
              setIssues(prev => [...prev, ...(analysis.issues || [])]);
              setEntities(prev => [...prev, ...(analysis.entities || [])]);
              setMedicalEvidence(prev => [...prev, ...(analysis.medicalEvidence || [])]);
              setPolicies(prev => [...prev, ...(analysis.policyReferences || [])]);
              showToast(`Processed ${file.name}`, 'success');
          } else {
              throw new Error("AI Analysis returned empty result (possibly due to safety filters or connection issue)");
          }
      } catch (e: any) {
          console.error(`Error processing ${file.name}:`, e);
          const errorMsg = e.message || "Unknown error";
          setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: DocStatus.ERROR, summary: [`Error: ${errorMsg}`] } : d));
          showToast(`Failed to process ${file.name}: ${errorMsg}`, 'error');
      }
  };

  const handleUpload = (files: File[]) => {
    if (!userApiKey && aiProvider === 'gemini') {
      setModalConfig({
         isOpen: true,
         title: "API Key Required",
         message: "Please configure your Google Gemini API Key in the settings before uploading documents.",
         onClose: closeModal
      });
      return;
    }

    ensureCaseInitialized();
    setFilesToClassify(files);
    setIsClassificationModalOpen(true);
  };
  
  const handleStartProcessing = (classifications: { [fileName: string]: 'Claimant' | 'Respondent' }) => {
    setIsClassificationModalOpen(false);
    const files = filesToClassify;

    const newDocs: DocumentMetadata[] = files.map(f => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: f.name,
      fileType: f.type,
      uploadedAt: new Date().toISOString(),
      status: DocStatus.PROCESSING,
      size: (f.size / 1024).toFixed(2) + ' KB',
      author: classifications[f.name] || 'Respondent'
    }));

    setDocuments(prev => [...prev, ...newDocs]);
    
    const newRegistry = { ...filesRegistry };
    newDocs.forEach((doc, i) => {
      newRegistry[doc.id] = files[i];
    });
    setFilesRegistry(newRegistry);

    showToast(`Processing ${files.length} files in background...`, 'info');

    processBatch(files, newDocs);
    setFilesToClassify([]);
  };

  const processBatch = async (files: File[], newDocs: DocumentMetadata[]) => {
    const queue = files.map((file, i) => ({ file, docId: newDocs[i].id }));
    const running: Promise<void>[] = [];

    // Helper to run next item
    const runNext = () => {
        if (queue.length === 0) return;
        const item = queue.shift();
        if (!item) return;

        const p = processSingleFile(item.file, item.docId)
            .catch(err => console.error("Batch item failed", err)) // Catch individual errors so batch continues
            .finally(() => {
                running.splice(running.indexOf(p), 1);
                runNext(); // Chain reaction
            });
        
        running.push(p);
    };

    // Start initial batch
    for (let i = 0; i < UPLOAD_CONCURRENCY; i++) {
        runNext();
    }
  };

  const handleDeleteDoc = (id: string) => {
     setModalConfig({
        isOpen: true,
        title: "Delete Document",
        type: 'confirm',
        message: "This will remove the document and all associated evidence.",
        onConfirm: () => {
           setDocuments(prev => prev.filter(d => d.id !== id));
           setTimeline(prev => prev.filter(e => !e.originalDocIds?.includes(id)));
           setIssues(prev => prev.filter(i => i.sourceDoc !== documents.find(d => d.id === id)?.fileName));
           const newRegistry = { ...filesRegistry };
           delete newRegistry[id];
           setFilesRegistry(newRegistry);
           showToast("Document deleted", "info");
        },
        onClose: closeModal
     });
  };

  const handleUpdateDocument = (id: string, updates: Partial<DocumentMetadata>) => {
      setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const handleUpdateIssue = (index: number, updatedIssue: Issue) => {
    setIssues(prev => { const n = [...prev]; n[index] = updatedIssue; return n; });
    showToast("Issue updated", "success");
  };

  const handleUpdateTimeline = (index: number, updatedEvent: TimelineEvent) => {
    setTimeline(prev => { const n = [...prev]; n[index] = updatedEvent; return n; });
    showToast("Timeline updated", "success");
  };

  const handleAddTimelineEvent = (event: TimelineEvent) => {
      ensureCaseInitialized();
      const eventWithId = { ...event, id: event.id || Math.random().toString(36).substr(2, 9) };
      setTimeline(prev => deduplicateTimelineEvents([...prev, eventWithId]));
      showToast("Manual event added", "success");
  };

  const handleDeleteTimeline = (index: number) => {
    setTimeline(prev => prev.filter((_, i) => i !== index));
    showToast("Event deleted", "info");
  };

  const handleAddNote = (note: UserNote) => {
      ensureCaseInitialized();
      setUserNotes(prev => [note, ...prev]);
  };

  const handleExport = (type: 'json' | 'chronology' | 'scott' | 'bundle') => {
    switch (type) {
      case 'json':
        downloadJSON({ 
          metadata: { id: caseId, name: caseName }, 
          timeline, issues, documents 
        }, `Case_${caseName || 'Untitled'}_Export`);
        break;
      case 'chronology':
        downloadCSV(generateChronologyCSV(timeline), `Chronology_${caseName}`);
        break;
      case 'scott':
        downloadCSV(generateScottScheduleCSV(issues), `Scott_Schedule_${caseName}`);
        break;
      case 'bundle':
        downloadCSV(generateBundleIndexCSV(documents), `Bundle_Index_${caseName}`);
        break;
    }
    showToast("Export started", "success");
  };

  const handleChangeApiKey = () => {
    setModalConfig({
      isOpen: true,
      title: "Update API Key",
      type: 'prompt',
      message: "Enter your Google Gemini API Key:",
      defaultValue: userApiKey, // Pre-fill with current key
      inputPlaceholder: "Paste key here (starts with AIza...)",
      onConfirm: async (key: string) => {
        if (key) {
           const cleanKey = key.replace(/^(Gemini API Key|API Key|Key)[:\s-]*/i, '').trim();
           const validation = await validateApiKey(cleanKey);
           if (validation.isValid) {
             setUserApiKey(cleanKey);
             localStorage.setItem('evidence_master_api_key', cleanKey); // Persist
             showToast("API Key updated and verified", "success");
           } else {
             showToast(`Invalid Key: ${validation.error}`, "error");
           }
        }
      },
      onClose: closeModal
    });
  };

  const handleProviderChange = (provider: AiProvider) => {
      setAiProvider(provider);
      localStorage.setItem('ai_provider', provider);
      showToast(`Switched AI Provider to ${provider === 'gemini' ? 'Gemini Cloud' : 'WebLLM (Local)'}`, 'success');
  };

  const handleLoadCaseClick = async () => {
     setIsStorageLoading(true);
     const cases = await listSavedCases();
     setIsStorageLoading(false);

     if (cases.length === 0) {
       showToast("No saved cases found", "info");
       return;
     }
     
     setModalConfig({
        isOpen: true,
        title: "Load Case",
        type: 'prompt',
        message: (
            <div className="max-h-64 overflow-y-auto">
                <p className="mb-2">Enter the ID of the case to load:</p>
                <div className="space-y-2">
                    {cases.map(c => (
                        <div key={c.id} className="text-xs bg-slate-50 p-2 rounded border border-slate-200 cursor-pointer hover:bg-blue-50" onClick={() => {
                            // Helper to auto-fill input? 
                            // Current Modal implementation doesn't support click-to-fill easily without refactor
                            // Just showing ID for now
                        }}>
                            <strong>{c.name}</strong> <span className="text-slate-400 font-mono select-all">({c.id})</span>
                            <br/><span className="text-[10px] text-slate-500">{new Date(c.lastModified).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        ),
        inputPlaceholder: "Paste Case ID here...",
        onConfirm: async (id: string) => {
           if (id) {
             setIsStorageLoading(true);
             const data = await loadCase(id.trim());
             setIsStorageLoading(false);
             if (data) {
               await loadCaseIntoState(data);
               showToast(`Loaded case: ${data.metadata.name}`, "success");
             } else {
               showToast("Case ID not found", "error");
             }
           }
        },
        onClose: closeModal
     });
  };

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  const contextSummary = useMemo(() => {
    // Inject full text of documents into context for better analysis by Chat and other modules
    const fullDocs = documents.map(d => 
        `=== DOCUMENT START: ${d.fileName} (Author: ${d.author || 'Respondent'}) ===\n${d.textContent || '(No extracted text)'}\n=== DOCUMENT END ===`
    ).join('\n\n');

    return `
      CASE: ${caseName}
      
      *** FULL DOCUMENTARY EVIDENCE ***
      ${fullDocs}
      
      *** ANALYSIS SUMMARY ***
      KEY TIMELINE EVENTS:
      ${timeline.slice(0, 50).map(e => `- [${e.date}] ${e.event} (${e.category})`).join('\n')}
      
      KEY ISSUES:
      ${issues.slice(0, 20).map(i => `- ${i.description} (Severity: ${i.severity})`).join('\n')}
      
      MEDICAL CONTEXT:
      ${medicalEvidence.slice(0, 10).map(m => `- ${m.date}: ${m.value} (${m.type})`).join('\n')}
      
      USER NOTES:
      ${userNotes.map(n => `- [${n.category}] ${n.title}: ${n.content}`).join('\n')}
    `;
  }, [documents, timeline, issues, medicalEvidence, userNotes, caseName]);

  const filteredTimeline = useMemo(() => {
     if (!searchQuery) return timeline;
     const q = searchQuery.toLowerCase();
     return timeline.filter(t => 
       (t.event || '').toLowerCase().includes(q) || 
       (t.quote || '').toLowerCase().includes(q) ||
       (t.date || '').includes(q)
     );
  }, [timeline, searchQuery]);

  const filteredIssues = useMemo(() => {
     if (!searchQuery) return issues;
     const q = searchQuery.toLowerCase();
     return issues.filter(i => 
       (i.description || '').toLowerCase().includes(q) || 
       (i.category || '').toLowerCase().includes(q)
     );
  }, [issues, searchQuery]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AnalyticsDashboard documents={documents} timeline={timeline} issues={issues} entities={entities} />;
      case 'documents': return <DocumentsView documents={documents} onUpload={handleUpload} onDelete={handleDeleteDoc} onReview={setSelectedReviewDocId} onAddEvent={handleAddTimelineEvent} />;
      case 'timeline': return <TimelineView events={filteredTimeline} onEdit={handleUpdateTimeline} onDelete={handleDeleteTimeline} onAdd={handleAddTimelineEvent} />;
      case 'scott_schedule': return <SmartScottScheduleView timeline={timeline} contextSummary={contextSummary} apiKey={userApiKey} schedule={scottSchedule} setSchedule={setScottSchedule} />;
      case 'issues': return <IssuesView issues={filteredIssues} consolidatedIssues={consolidatedIssues} ethicsRadar={ethicsRadar} onUpdate={handleUpdateIssue} apiKey={userApiKey} contextSummary={contextSummary} />;
      case 'tribunal': return <TribunalPrepView timeline={timeline} issues={issues} strategy={tribunalStrategy} setStrategy={setTribunalStrategy} apiKey={userApiKey} contextSummary={contextSummary} medicalEvidence={medicalEvidence} userNotes={userNotes} />;
      case 'chat': return <ChatInterface contextSummary={contextSummary} apiKey={userApiKey} chatHistory={chatHistory} setChatHistory={setChatHistory} chatInstance={chatInstance} />;
      case 'claimant_rep': return <ClaimantRepresentativeView timeline={timeline} issues={issues} contextSummary={contextSummary} apiKey={userApiKey} actionPlan={claimantActionPlan} setActionPlan={setClaimantActionPlan} />;
      case 'prelim_hearing': return <PreliminaryHearingView timeline={timeline} issues={issues} contextSummary={contextSummary} userNotes={userNotes} strategy={prelimStrategy} setStrategy={setPrelimStrategy} apiKey={userApiKey} />;
      case 'notes': return <UserNotesView notes={userNotes} onAddNote={handleAddNote} onDeleteNote={(id) => setUserNotes(prev => prev.filter(n => n.id !== id))} apiKey={userApiKey} />;
      case 'roadmap': return <LegalRoadmapView timeline={timeline} />;
      case 'drafting': return <DraftingStudio contextSummary={contextSummary} issues={issues} timeline={timeline} apiKey={userApiKey} />;
      case 'patterns': return <PatternAnalysisView timeline={timeline} contextSummary={contextSummary} issues={issues} apiKey={userApiKey} analysis={patternAnalysis} setAnalysis={setPatternAnalysis} />;
      case 'copilot': return <CoPilotView timeline={timeline} issues={issues} contextSummary={contextSummary} medicalEvidence={medicalEvidence} apiKey={userApiKey} />;
      case 'coaching': return <CoachingView issues={issues} apiKey={userApiKey} modules={coachingModules} setModules={setCoachingModules} />;
      case 'loss': return <ScheduleOfLossView data={scheduleOfLoss} setData={setScheduleOfLoss} />;
      case 'cast': return <CastListView contextSummary={contextSummary} apiKey={userApiKey} cast={castList} setCast={setCastList} />;
      case 'impact': return <ImpactStatementView apiKey={userApiKey} medicalContext={medicalEvidence.map(m => `${m.date}: ${m.value}`).join(' ')} data={impactStatement} setData={setImpactStatement} />;
      case 'forensic': return <ForensicAnalysisView timeline={timeline} contextSummary={contextSummary} apiKey={userApiKey} data={forensicData} setData={setForensicData} />;
      case 'policy': return <PolicyAuditView contextSummary={contextSummary} issues={issues} apiKey={userApiKey} audit={policyAudit} setAudit={setPolicyAudit} />;
      case 'medical_nexus': return <MedicalNexusView timeline={timeline} medicalEvidence={medicalEvidence} apiKey={userApiKey} nexus={medicalNexus} setNexus={setMedicalNexus} />;
      case 'negotiation': return <NegotiationView contextSummary={contextSummary} apiKey={userApiKey} strategy={negotiationStrategy} setStrategy={setNegotiationStrategy} />;
      case 'library': return <LegalLibraryView contextSummary={contextSummary} apiKey={userApiKey} guides={legalGuides} setGuides={setLegalGuides} />;
      case 'bundle': return <BundleBuilderView documents={documents} apiKey={userApiKey} folders={bundleFolders} setFolders={setBundleFolders} onUpdateDocument={handleUpdateDocument} />;
      case 'legaldocs': return <LegalDocsView documents={documents} filesRegistry={filesRegistry} timeline={timeline} issues={issues} contextSummary={contextSummary} apiKey={userApiKey} caseName={caseName || "My Case"} bundleFolders={bundleFolders} />;
      case 'appeal': return <GrievanceAppealView timeline={timeline} contextSummary={contextSummary} apiKey={userApiKey} pack={appealPack} setPack={setAppealPack} documents={documents} />;
      case 'diagnostics': return <SystemDiagnostics apiKey={userApiKey} />;
      default: return <div>Select a tab</div>;
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onReset={handleReset} 
        onExport={handleExport}
        onChangeKey={handleChangeApiKey}
        onOpenSettings={() => setIsSettingsOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        caseName={caseName}
        onSaveCase={handleSaveCurrentCase}
        onLoadCase={handleLoadCaseClick}
        onNewCase={handleNewCase}
        onImportCase={handleImportCase}
        hasApiKey={!!userApiKey}
      >
        {isStorageLoading && (
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center p-1 bg-yellow-100 text-yellow-800 text-xs font-medium shadow-sm">
                <LoaderIcon className="w-3 h-3 mr-2 animate-spin" /> Saving/Loading Data...
            </div>
        )}
        {lastAutoSave && !isStorageLoading && (
            <div className="absolute top-0 right-0 z-20 p-2 text-[10px] text-slate-400">
                Auto-saved: {lastAutoSave.toLocaleTimeString()}
            </div>
        )}
        
        {/* Render Main Content */}
        {renderContent()}

        {isClassificationModalOpen && (
            <UploadClassificationModal
              files={filesToClassify}
              onConfirm={handleStartProcessing}
              onClose={() => setIsClassificationModalOpen(false)}
            />
        )}

        {/* Modal Safety Check: Only render if document exists */}
        {selectedReviewDocId && (
          <DocumentReviewModal 
             document={documents.find(d => d.id === selectedReviewDocId)!} 
             file={filesRegistry[selectedReviewDocId]}
             onClose={() => setSelectedReviewDocId(null)} 
             extractedEntities={entities}
             extractedMedical={medicalEvidence}
             extractedPolicies={policies}
             onAddEvent={handleAddTimelineEvent}
          />
        )}
      </Layout>
      
      <Modal 
        isOpen={modalConfig.isOpen} 
        onClose={modalConfig.onClose}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        inputPlaceholder={modalConfig.inputPlaceholder}
        defaultValue={modalConfig.defaultValue}
      />

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentProvider={aiProvider}
        onProviderChange={handleProviderChange}
      />
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default App;
