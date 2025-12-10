
import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { AnalysisResult, TimelineEvent, Issue, MedicalEvidence, Entity, PolicyReference, Chapter } from "../types";
import { cleanJsonString, parsePossiblyTruncatedJson } from "./geminiService";

// Uses Llama 3.1 8B Instruct - widely supported and reliable in WebLLM 0.2.64+
// Falls back to standard q4f32_1 quantization for balance of speed/quality
const SELECTED_MODEL = "Llama-3.1-8B-Instruct-q4f32_1-MLC";

let engineInstance: MLCEngine | null = null;

export interface WebLLMInitProgress {
  progress: number;
  text: string;
}

export const getWebLLMEngine = async (onProgress?: (p: WebLLMInitProgress) => void): Promise<MLCEngine> => {
  if (engineInstance) return engineInstance;

  try {
    console.log("Initializing WebLLM with model:", SELECTED_MODEL);
    engineInstance = await CreateMLCEngine(SELECTED_MODEL, {
      initProgressCallback: (report) => {
        if (onProgress) {
          onProgress(report);
        }
        console.log("WebLLM Init:", report.text);
      },
    });
    return engineInstance;
  } catch (err) {
    console.error("Failed to load WebLLM engine:", err);
    throw err;
  }
};

// Generic generation wrapper for WebLLM
export const webLlmGenerate = async (prompt: string, systemInstruction?: string, onProgress?: (p: WebLLMInitProgress) => void): Promise<string> => {
  try {
    const engine = await getWebLLMEngine(onProgress);
    
    const messages = [
      { role: "system", content: systemInstruction || "You are a helpful legal assistant." },
      { role: "user", content: prompt }
    ];

    const reply = await engine.chat.completions.create({
      messages: messages as any,
      temperature: 0.1, // Low temp for factual accuracy
      max_tokens: 4000,
    });

    return reply.choices[0].message.content || "";
  } catch (e) {
    console.error("WebLLM Generate Error:", e);
    throw new Error(`Local AI Generation Failed: ${(e as Error).message}`);
  }
};

export const analyzeDocumentWebLLM = async (
    content: string, 
    fileName: string,
    onProgress?: (p: WebLLMInitProgress) => void
): Promise<AnalysisResult | null> => {
    
    // Safety check for length - local models struggle with massive context
    const TRUNCATE_LIMIT = 15000; // Reduced for 8B model stability
    const truncatedContent = content.length > TRUNCATE_LIMIT ? content.substring(0, TRUNCATE_LIMIT) + "...[TRUNCATED]" : content;

    const systemPrompt = `You are an expert UK Employment Law analyst. You extract structured data from documents.
    You must output valid JSON only. Do not output markdown code blocks.`;

    const userPrompt = `
    Analyze this document (${fileName}). 
    
    DOCUMENT CONTENT:
    ${truncatedContent}

    Extract the following JSON structure:
    {
      "summary": ["point 1", "point 2", "point 3"],
      "chapters": [{ "title": "Chapter Name", "summary": "summary", "pageEstimate": 1 }],
      "timeline": [{ "date": "YYYY-MM-DD", "event": "Description", "severity": "Low|Medium|High|Critical", "quote": "Exact quote" }],
      "issues": [{ "category": "Discrimination|Procedure|etc", "description": "Issue details", "severity": "Low|Medium|High" }],
      "entities": [{ "name": "Person Name", "role": "HR|Manager|etc", "sentiment": "Hostile|Neutral|Supportive" }],
      "medicalEvidence": [{ "date": "YYYY-MM-DD", "type": "Symptom|Diagnosis", "value": "Details", "context": "Context" }],
      "policyReferences": [{ "policyName": "Name", "complianceStatus": "Breached|Followed", "quote": "Quote" }]
    }
    
    Ensure dates are YYYY-MM-DD. If date is unknown, use "Unknown".
    Ensure every timeline event has a unique 'id' (random string).
    Response must be purely JSON.
    `;

    try {
        const resultText = await webLlmGenerate(userPrompt, systemPrompt, onProgress);
        const cleaned = cleanJsonString(resultText);
        const result = parsePossiblyTruncatedJson(cleaned);

        if (!result) return null;

        const timeline = Array.isArray(result.timeline) ? result.timeline : [];
        const issues = Array.isArray(result.issues) ? result.issues : [];
        const entities = Array.isArray(result.entities) ? result.entities : [];
        const medicalEvidence = Array.isArray(result.medicalEvidence) ? result.medicalEvidence : [];
        const policyReferences = Array.isArray(result.policyReferences) ? result.policyReferences : [];
        const summary = Array.isArray(result.summary) ? result.summary : [];
        const chapters = Array.isArray(result.chapters) ? result.chapters : [];

        return {
            summary,
            chapters,
            keyFindings: [],
            timeline: timeline.map((t: any) => ({...t, sourceDoc: fileName, id: t.id || Math.random().toString()})),
            issues: issues.map((i: any) => ({...i, sourceDoc: fileName})),
            entities: entities.map((e: any) => ({...e, sourceDoc: fileName})),
            medicalEvidence: medicalEvidence.map((m: any) => ({...m, sourceDoc: fileName})),
            policyReferences: policyReferences.map((p: any) => ({...p, sourceDoc: fileName}))
        };

    } catch (e) {
        console.error("WebLLM Analysis Failed", e);
        return null;
    }
};

export const chatWebLLM = async (
    message: string, 
    context: string, 
    history: any[], 
    onProgress?: (p: WebLLMInitProgress) => void
): Promise<string> => {
    try {
      const engine = await getWebLLMEngine(onProgress);
      
      const systemMsg = { role: "system", content: "You are an expert UK Employment Law assistant (EvidenceMaster AI). Use the provided context to answer. Be precise and cite the context." };
      
      // Limit history context to save tokens
      const recentHistory = history.slice(-6).map(h => ({
          role: h.role === 'model' ? 'assistant' : 'user',
          content: h.content
      }));

      const finalMessages = [
          systemMsg,
          ...recentHistory,
          { role: "user", content: `CONTEXT:\n${context.substring(0, 8000)}\n\nUSER QUESTION: ${message}` }
      ];

      const completion = await engine.chat.completions.create({
          messages: finalMessages as any,
          stream: false, 
          max_tokens: 1000
      });

      return completion.choices[0].message.content || "No response generated.";
    } catch (e) {
      console.error("WebLLM Chat Error", e);
      return `Error generating response: ${(e as Error).message}`;
    }
};
