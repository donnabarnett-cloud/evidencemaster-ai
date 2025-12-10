
import { AiProvider, AnalysisResult, TimelineEvent, Issue, MedicalEvidence, UserNote, ChatMessage, TribunalStrategy, PreliminaryHearingStrategy, ClaimantActionPlan, AppealPack } from "../types";
import * as geminiService from "./geminiService";
import * as webllmService from "./webllmService";

// Helper to get current provider from storage or default
export const getProvider = (): AiProvider => {
    return (localStorage.getItem('ai_provider') as AiProvider) || 'gemini';
};

// --- WRAPPER FUNCTIONS ---

export const analyzeDocument = async (
    content: { type: string, value?: string, mimeType?: string, data?: string }, 
    fileName: string, 
    docId: string, 
    apiKey?: string,
    onProgress?: (p: any) => void
): Promise<AnalysisResult | null> => {
    const provider = getProvider();
    
    if (provider === 'webllm') {
        // WebLLM needs text content primarily. If we have raw bytes of PDF/Image, 
        // we might rely on the frontend extraction passed in `value`.
        // If content.value is missing (e.g. raw image bytes only), WebLLM service might struggle without OCR.
        // We assume App.tsx extracts text for Docx/Text. For PDF/Image, we need the text passed.
        
        let textToAnalyze = content.value || "";
        
        // If no text but we have base64, we can't easily do local OCR with simple WebLLM yet.
        // We'll throw a specific error or fallback to whatever text we have.
        if (!textToAnalyze && content.data) {
             throw new Error("WebLLM requires extracted text. Local OCR is not supported yet for this file type.");
        }

        return await webllmService.analyzeDocumentWebLLM(textToAnalyze, fileName, onProgress);
    } else {
        return await geminiService.analyzeDocument(content, fileName, docId, apiKey);
    }
};

// For complex functions where WebLLM implementation is too heavy for this demo,
// we fallback to Gemini or return a specific "Not Supported Locally" error/mock.
// In a full prod app, we would implement the specific prompts for Llama 3.

export const performDeepCrossAnalysis = async (
    timeline: TimelineEvent[], 
    issues: Issue[], 
    context: string, 
    medical: MedicalEvidence[], 
    notes: UserNote[], 
    apiKey?: string
): Promise<TribunalStrategy | null> => {
    const provider = getProvider();
    if (provider === 'webllm') {
        // Fallback or simplified local version could go here
        // For now, we enforce cloud for heavy lifting or throw
        throw new Error("Deep Cross Analysis is currently only available with Gemini Cloud due to model complexity.");
    }
    return await geminiService.performDeepCrossAnalysis(timeline, issues, context, medical, notes, apiKey);
};

export const generateAppealPack = async (
    outcomeText: string, 
    timeline: TimelineEvent[], 
    context: string, 
    fullEvidenceCorpus: string, 
    apiKey?: string,
    myAppealText?: string,
    respondentInviteText?: string
): Promise<AppealPack | null> => {
    const provider = getProvider();
    if (provider === 'webllm') {
         throw new Error("Appeal Pack generation is currently only available with Gemini Cloud.");
    }
    return await geminiService.generateAppealPack(outcomeText, timeline, context, fullEvidenceCorpus, apiKey, myAppealText, respondentInviteText);
};

// Chat is a good candidate for WebLLM
export const sendChatMessage = async (
    message: string, 
    context: string, 
    history: ChatMessage[],
    apiKey?: string,
    onProgress?: (p: any) => void
): Promise<string> => {
    const provider = getProvider();
    if (provider === 'webllm') {
        return await webllmService.chatWebLLM(message, context, history, onProgress);
    } else {
        // Gemini service uses streaming, we need to adapt or use non-streaming for unified interface
        // For this wrapper, we might need to break the stream pattern or expose it.
        // Existing app uses `sendChatMessageStream`.
        // To support both, we should ideally have `sendChatMessageStream` in the wrapper.
        return "Chat via wrapper requires stream adaptation. Use direct stream for Gemini.";
    }
};

// Re-export services for direct access where necessary (e.g. specific tool calls)
export { geminiService, webllmService };

// Forwarding other calls directly to Gemini for now to maintain stability
export const consolidateAndAnalyzeIssues = geminiService.consolidateAndAnalyzeIssues;
export const extractLegalFramework = geminiService.extractLegalFramework;
export const generateClaimantActionPlan = geminiService.generateClaimantActionPlan;
export const generateJustificationRebuttal = geminiService.generateJustificationRebuttal;
export const generatePreliminaryHearingStrategy = geminiService.generatePreliminaryHearingStrategy;
export const generateContinuingActArgument = geminiService.generateContinuingActArgument;
export const generateDisclosureLetter = geminiService.generateDisclosureLetter;
export const generateDraftDocument = geminiService.generateDraftDocument;
export const checkDraftFairness = geminiService.checkDraftFairness;
export const generateLegalParagraph = geminiService.generateLegalParagraph;
export const generatePatternAnalysis = geminiService.generatePatternAnalysis;
export const generateCaseGraph = geminiService.generateCaseGraph;
export const performRealityCheck = geminiService.performRealityCheck;
export const generateDisabilityAdjustments = geminiService.generateDisabilityAdjustments;
export const runSystemDiagnostics = geminiService.runSystemDiagnostics;
export const generateImpactStatementDraft = geminiService.generateImpactStatementDraft;
export const generateLegalGuide = geminiService.generateLegalGuide;
export const organizeEvidenceBundle = geminiService.organizeEvidenceBundle;
export const generateET1Content = geminiService.generateET1Content;
export const generatePHAgendaContent = geminiService.generatePHAgendaContent;
export const extractDocumentContent = geminiService.extractDocumentContent;
export const transcribeAudio = geminiService.transcribeAudio;
export const createChatSession = geminiService.createChatSession;
export const sendChatMessageStream = geminiService.sendChatMessageStream;
export const searchPrecedents = geminiService.searchPrecedents;
export const validateApiKey = geminiService.validateApiKey;
export const deduplicateTimelineEvents = geminiService.deduplicateTimelineEvents;
