
import { GoogleGenAI, Type, Chat, GenerateContentResponse, Part, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { 
    AnalysisResult, 
    TimelineEvent, 
    Issue, 
    MedicalEvidence, 
    Entity, 
    PolicyReference, 
    ChatMessage,
    ConsolidatedIssue,
    EthicsRadar,
    ScottScheduleItem,
    PCP,
    ProtectedAct,
    LegalResearchNote,
    ClaimantActionPlan,
    PreliminaryHearingStrategy,
    ContinuingActLink,
    DraftDocument,
    PatternAnalysisResult,
    CaseGraphNode, 
    CaseGraphLink,
    RealityCheckResult,
    SuggestedAdjustment,
    CoachingModule,
    CastMember,
    ForensicData,
    PolicyAudit,
    MedicalNexus,
    NegotiationStrategy,
    LegalGuide,
    BundleFolder,
    UserNote,
    FullCaseData,
    TribunalStrategy,
    FairnessCheckResult,
    DocumentMetadata,
    AppealPack,
    Chapter
} from "../types";

export interface DiagnosticResult {
  name: string;
  status: 'Pass' | 'Fail' | 'Warning';
  details: string;
  latency?: number;
}

// ------------------------------------------------------------------
// Core Utilities
// ------------------------------------------------------------------

export const getAiClient = (apiKey?: string) => {
    const key = apiKey || process.env.API_KEY;
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
};

// CRITICAL: Disable safety settings for Legal/Medical content
// Employment law cases often contain descriptions of harassment, bullying, and medical conditions
// which triggers standard AI safety filters.
// FIX: Use HarmCategory and HarmBlockThreshold enums for safety settings
const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const cleanJsonString = (str: string) => {
    // 1. Remove Markdown code blocks
    let cleaned = str.replace(/```json\n?|```/g, '').trim();
    
    // 2. Find the first '{' and the last '}' to handle conversational wrapping
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    return cleaned;
};

export const parsePossiblyTruncatedJson = (text: string) => {
    try {
        return JSON.parse(cleanJsonString(text));
    } catch (e) {
        // Try simple repair for truncated JSON
        let fixed = cleanJsonString(text);
        if (fixed.lastIndexOf('}') < fixed.lastIndexOf('{')) fixed += '}';
        if (fixed.lastIndexOf(']') < fixed.lastIndexOf('[')) fixed += ']';
        try { return JSON.parse(fixed); } catch (e2) { return null; }
    }
};

// --- Retry Logic Wrapper ---
async function retryOperation<T>(operation: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    try {
        return await operation();
    } catch (err: any) {
        // Do not retry 400 Bad Request errors (Invalid Argument, etc.)
        if (err.message && (err.message.includes('400') || err.message.includes('INVALID_ARGUMENT'))) {
            console.error("Non-retriable error:", err.message);
            throw err; 
        }
        
        if (retries <= 0) throw err;
        await new Promise(resolve => setTimeout(resolve, delay));
        console.warn(`Retrying AI operation... attempts left: ${retries}`);
        return retryOperation(operation, retries - 1, delay * 2);
    }
}

// ------------------------------------------------------------------
// Analysis Functions
// ------------------------------------------------------------------

export const analyzeDocument = async (
    content: { type: string, value?: string, mimeType?: string, data?: string }, 
    fileName: string, 
    docId: string, 
    apiKey?: string
): Promise<AnalysisResult | null> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;

    let parts: Part[] = [];
    if (content.type === 'text' && content.value) {
        if (!content.value.trim()) return null;
        parts.push({ text: content.value });
    } else if (content.mimeType && content.data) {
        // Validation: Ensure data is not empty
        if (!content.data || content.data.length === 0) {
            console.error("Skipping empty file data for", fileName);
            return null;
        }
        parts.push({ inlineData: { mimeType: content.mimeType, data: content.data } });
    } else {
        return null;
    }

    const prompt = `
    Analyze this document (${fileName}). Extract the following JSON structure:
    {
      "summary": ["point 1", "point 2", "point 3"],
      "chapters": [{ "title": "Chapter 1 Name / Section Header", "summary": "1 sentence summary", "pageEstimate": 1 }],
      "timeline": [{ "date": "YYYY-MM-DD", "event": "Description", "severity": "Low|Medium|High|Critical", "quote": "Exact quote" }],
      "issues": [{ "category": "Discrimination|Procedure|etc", "description": "Issue details", "severity": "Low|Medium|High" }],
      "entities": [{ "name": "Person Name", "role": "HR|Manager|etc", "sentiment": "Hostile|Neutral|Supportive" }],
      "medicalEvidence": [{ "date": "YYYY-MM-DD", "type": "Symptom|Diagnosis", "value": "Details", "context": "Context" }],
      "policyReferences": [{ "policyName": "Name", "complianceStatus": "Breached|Followed", "quote": "Quote" }]
    }
    Ensure every timeline event has a unique 'id'.
    If the document is a book or long report, populate the 'chapters' array with the extracted structure.
    `;
    parts.push({ text: prompt });

    try {
        return await retryOperation(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: { parts },
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS // CRITICAL FIX
                }
            });
            
            const responseText = response.text;

            // Explicit Safety Check
            if (!responseText) {
                const candidate = response.candidates?.[0];
                if (candidate?.finishReason) {
                    // Throw distinct error for App.tsx to catch
                    throw new Error(`AI blocked content. Reason: ${candidate.finishReason}. Try redacting sensitive names.`);
                }
                console.warn("AI returned an empty response text without a finish reason.");
                return null;
            }
            
            const result = parsePossiblyTruncatedJson(responseText);
            if (!result) {
                console.error("Failed to parse JSON from AI response:", responseText);
                return null;
            }

            const timeline = Array.isArray(result.timeline) ? result.timeline : [];
            const issues = Array.isArray(result.issues) ? result.issues : [];
            const entities = Array.isArray(result.entities) ? result.entities : [];
            const medicalEvidence = Array.isArray(result.medicalEvidence) ? result.medicalEvidence : [];
            const policyReferences = Array.isArray(result.policyReferences) ? result.policyReferences : [];
            const summary = Array.isArray(result.summary) ? result.summary : [];
            const chapters = Array.isArray(result.chapters) ? result.chapters : [];

            return {
                summary: summary,
                chapters: chapters,
                keyFindings: [],
                timeline: timeline.map((t: any) => ({...t, sourceDoc: fileName, id: t.id || Math.random().toString()})),
                issues: issues.map((i: any) => ({...i, sourceDoc: fileName})),
                entities: entities.map((e: any) => ({...e, sourceDoc: fileName})),
                medicalEvidence: medicalEvidence.map((m: any) => ({...m, sourceDoc: fileName})),
                policyReferences: policyReferences.map((p: any) => ({...p, sourceDoc: fileName}))
            };
        });
    } catch (e: any) {
        console.error("Analysis failed", e);
        // Rethrow so App.tsx sees the actual error (like 400 Invalid Argument or Safety block)
        throw e;
    }
};

export const consolidateAndAnalyzeIssues = async (issues: Issue[], context: string, apiKey?: string) => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    
    const prompt = `
    You are a Senior Employment Judge. Analyze these issues and the context.
    Group them into "Master Claims" (ConsolidatedIssues) and identify bad faith tactics (EthicsRadar).

    CONTEXT: ${context.substring(0, 15000)}
    ISSUES LIST: ${JSON.stringify(issues)}

    You MUST return a JSON object with this EXACT structure:
    {
      "consolidatedIssues": [
        {
          "id": "string",
          "legalHead": "string (e.g. 's15 Discrimination Arising from Disability')",
          "statute": "string (e.g. 'Equality Act 2010 s.15')",
          "primaFacieStrength": "Strong" | "Moderate" | "Weak",
          "summaryOfBreach": "string",
          "combinedEvidence": [{ "doc": "string", "quote": "string", "date": "string" }],
          "tribunalPerspective": "string",
          "missingProof": "string",
          "victimImpact": "string",
          "remedyAssessment": "string",
          "temporalStatus": "Active/Ongoing" | "Resolved (Factually)" | "Historic Breach",
          "evolution": "string"
        }
      ],
      "ethicsRadar": [
        {
          "tactic": "string",
          "evidenceCount": number,
          "description": "string",
          "legalRelevance": "string"
        }
      ]
    }
    `;

    try {
        return await retryOperation(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            const result = parsePossiblyTruncatedJson(response.text || "{}");
            if (!result) return { consolidatedIssues: [], ethicsRadar: [] };
            
            return {
                consolidatedIssues: Array.isArray(result.consolidatedIssues) ? result.consolidatedIssues : [],
                ethicsRadar: Array.isArray(result.ethicsRadar) ? result.ethicsRadar : []
            };
        });
    } catch (e) { 
        return { consolidatedIssues: [], ethicsRadar: [] }; 
    }
};

export const extractLegalFramework = async (context: string, apiKey?: string) => {
     const ai = getAiClient(apiKey);
    if (!ai) return null;
    
    const prompt = `
    Analyze the context for UK Equality Act 2010 elements.
    Extract specific PCPs (Provisions, Criterions, Practices) and Protected Acts.

    CONTEXT: ${context.substring(0, 15000)}

    You MUST return a JSON object with this EXACT structure:
    {
      "pcps": [
        {
          "description": "string",
          "appliedTo": "string",
          "disadvantage": "string",
          "statute": "s20 Equality Act 2010",
          "sourceDoc": "string"
        }
      ],
      "protectedActs": [
        {
          "date": "string",
          "description": "string",
          "type": "Grievance" | "Oral Complaint" | "ET1" | "ACAS",
          "sourceDoc": "string"
        }
      ]
    }
    `;

     try {
        return await retryOperation(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            const result = parsePossiblyTruncatedJson(response.text || "{}");
            if (!result) return { pcps: [], protectedActs: [] };
            
            return {
                pcps: Array.isArray(result.pcps) ? result.pcps : [],
                protectedActs: Array.isArray(result.protectedActs) ? result.protectedActs : []
            };
        });
    } catch (e) { 
        return { pcps: [], protectedActs: [] }; 
    }
};

export const performDeepCrossAnalysis = async (timeline: TimelineEvent[], issues: Issue[], context: string, medical: MedicalEvidence[], notes: UserNote[], apiKey?: string): Promise<TribunalStrategy | null> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    const prompt = `Act as a Tribunal Judge. Perform a deep analysis of this case. Context: ${context.substring(0, 25000)}. Return JSON matching the TribunalStrategy interface.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS
            }
        });
        return parsePossiblyTruncatedJson(response.text || "{}");
    } catch (e) { return null; }
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
    const ai = getAiClient(apiKey);
    if (!ai) return null;

    const truncatedEvidence = fullEvidenceCorpus.substring(0, 3000000);

    const prompt = `
        You are a King's Counsel (KC) Barrister, the best in the UK for employment law. Your sole task is to create an overwhelmingly persuasive and "water-tight" Appeal Pack to overturn a flawed grievance decision. You must be aggressive, forensic, and legally precise.

        The output MUST be a single JSON object matching the 'AppealPack' interface.

        **YOUR PROCESS:**

        1.  **Cover Letter:** Draft a formal, professional, and firm letter to the Appeal Manager. Set a serious tone.
        2.  **Executive Summary:** Write a high-impact summary. Clearly state that the original decision is fundamentally flawed, perverse, and procedurally unfair.
        3.  **Procedural Flaw Analysis:** Forensically audit the original investigation against the **ACAS Code of Practice on Disciplinary and Grievance Procedures (2015)**. Find every breach (e.g., failure to interview key witnesses, unreasonable delays, biased investigator) and explain its legal significance for an Employment Tribunal.
        4.  **Legal Risk Assessment:** Put on your commercial hat. Warn the business of the specific, high-value legal claims (e.g., "s.15 Discrimination Arising from Disability") that will likely succeed at a Tribunal if this appeal is denied. Assign a risk level (High/Medium/Low) to each and explain why.
        5.  **Forensic Evidence Matrix:** This is the core of the appeal. Dissect the [OUTCOME LETTER] sentence by sentence. For every flawed finding, create a row in the \`forensicAppealPoints\` array. For 'smokingGunEvidence', you MUST find direct quotes from the [FULL DOCUMENTARY EVIDENCE] that prove the contradiction.
        6.  **Requested Remedy:** State the required outcome clearly and unambiguously.

        **INPUT DATA:**
        1. [OUTCOME LETTER]: "${outcomeText}"
        2. [USER'S DRAFT APPEAL]: "${myAppealText || 'Not provided.'}"
        3. [RESPONDENT'S INVITE POINTS]: "${respondentInviteText || 'Not provided.'}"
        4. [FULL DOCUMENTARY EVIDENCE]: (Provided below, tagged with author)
        *** FULL DOCUMENTARY EVIDENCE START ***
        ${truncatedEvidence}
        *** FULL DOCUMENTARY EVIDENCE END ***
        
        **RETURN JSON STRUCTURE (AppealPack):**
        {
          "coverLetter": "string (Formal letter to the Appeal Manager)",
          "executiveSummary": "string (High-impact summary of why the decision is flawed)",
          "proceduralFlaws": [
            {
              "area": "Investigation" | "Hearing" | "Outcome" | "General Fairness",
              "breachDescription": "string (e.g., 'Failure to interview the claimant's key witness, Jane Doe.')",
              "acasCodeReference": "string (e.g., 'ACAS Code of Practice, para 12')",
              "legalSignificance": "string (e.g., 'This renders the investigation unreasonable and the findings unsafe.')"
            }
          ],
          "legalRisksForEmployer": [
            {
              "claim": "string (e.g., 's.15 Discrimination Arising From Disability')",
              "riskLevel": "High" | "Medium" | "Low",
              "rationale": "string (e.g., 'The causal link between the 'something arising' and the unfavourable treatment is clearly established by email evidence.')"
            }
          ],
          "forensicAppealPoints": [
            { 
              "id": "string",
              "findingNumber": number,
              "employerFinding": "The exact quote or summary of the finding from the outcome letter.",
              "rebuttalCategory": "Perverse Finding" | "Factual Error" | "Procedural Flaw" | "Misrepresentation",
              "claimantArgument": "A detailed explanation of WHY the employer's finding is wrong.",
              "smokingGunEvidence": [
                {
                  "quote": "The exact quote from the document that proves the point.",
                  "documentRef": "The name of the source document (e.g., 'HR_Meeting_Minutes.pdf').",
                  "pageNumber": 1
                }
              ],
              "impactOnCase": "Explain the legal significance of this error.",
              "questionForDecisionMaker": "A precise cross-examination question to ask the manager."
            }
          ],
          "requestedRemedy": "string (The specific outcome sought, e.g., 'To overturn the original decision in its entirety and uphold the grievance on all points.')"
        }
    `;

    try {
        return await retryOperation(async () => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash", 
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            return parsePossiblyTruncatedJson(response.text || "{}");
        });
    } catch(e) { 
        console.error("Appeal Pack generation failed", e);
        return null; 
    }
};

export const generateForensicAnalysis = async (timeline: TimelineEvent[], context: string, apiKey?: string): Promise<ForensicData | null> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    
    const prompt = `
    Perform a Forensic Data Analysis on the timeline.
    CONTEXT: ${context.substring(0, 5000)}
    TIMELINE: ${JSON.stringify(timeline.slice(0, 50))}

    RETURN JSON ForensicData:
    {
      "emailHeatmap": [{ "date": "YYYY-MM-DD", "count": number, "sentiment": "Hostile|Neutral" }],
      "timelineGaps": [{ "startDate": "string", "endDate": "string", "duration": "string", "suspicionLevel": "High|Medium" }],
      "keywordTrends": [{ "keyword": "string", "trend": "Rising|Falling", "frequency": number }],
      "inconsistencies": [{ "docA": "string", "docB": "string", "contradiction": "string" }]
    }
    `;
    
    try {
         return await retryOperation(async () => {
             const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            return parsePossiblyTruncatedJson(response.text || "{}");
         });
    } catch(e) { return null; }
};

export const auditPolicies = async (context: string, issues: Issue[], apiKey?: string): Promise<PolicyAudit | null> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    
    const prompt = `
    Audit the employer's actions against the ACAS Code of Practice on Disciplinary and Grievance Procedures (2015).
    CONTEXT: ${context.substring(0, 8000)}
    
    RETURN JSON PolicyAudit:
    {
      "complianceScore": number (0-100),
      "breaches": [{ "policy": "string", "breach": "string", "severity": "Minor|Major|Fatal", "evidence": "string" }],
      "fairnessAssessment": "string",
      "repScript": [{ "phase": "string", "question": "string", "reason": "string" }],
      "escalationAdvice": "string"
    }
    `;
    
     try {
         return await retryOperation(async () => {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            return parsePossiblyTruncatedJson(response.text || "{}");
         });
    } catch(e) { return null; }
};

export const analyzeMedicalNexus = async (medical: MedicalEvidence[], timeline: TimelineEvent[], apiKey?: string): Promise<MedicalNexus | null> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    
    const prompt = `
    Analyze Medical Causation for Disability Status (s6 EqA 2010).
    MEDICAL: ${JSON.stringify(medical)}
    TIMELINE: ${JSON.stringify(timeline.slice(0, 50))}
    
    RETURN JSON MedicalNexus:
    {
      "symptomActionOverlay": [{ "date": "string", "medicalEvent": "string", "managementAction": "string", "correlation": "string" }],
      "longTermProof": { "diagnosisDate": "string", "duration": "string", "status": "Likely|Unlikely", "evidence": "string" },
      "functionalEffects": [{ "medicalTerm": "string", "laymansTerm": "string", "impact": "string" }],
      "adjustmentFeasibility": [{ "adjustment": "string", "employerRefusal": "string", "scientificRebuttal": "string" }]
    }
    `;
    
     try {
         return await retryOperation(async () => {
             const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            return parsePossiblyTruncatedJson(response.text || "{}");
         });
    } catch(e) { return null; }
};

export const generateNegotiationStrategy = async (context: string, apiKey?: string): Promise<NegotiationStrategy | null> => {
     const ai = getAiClient(apiKey);
    if (!ai) return null;
    
    const prompt = `
    Generate Settlement Strategy.
    CONTEXT: ${context.substring(0, 8000)}
    
    RETURN JSON NegotiationStrategy:
    {
      "riskAdjustedValue": number,
      "batna": "string",
      "openingOffer": number,
      "walkAwayPoint": number,
      "negotiationScript": [{ "stage": "string", "tactic": "string", "script": "string" }],
      "settlementLetterDraft": "string"
    }
    `;
    
     try {
         return await retryOperation(async () => {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            return parsePossiblyTruncatedJson(response.text || "{}");
         });
    } catch(e) { return null; }
};

export const enrichScottSchedule = async (item: ScottScheduleItem, context: string, apiKey?: string): Promise<ScottScheduleItem | null> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    
    const prompt = `
    Enrich this Scott Schedule row for an Employment Tribunal.
    ROW: ${JSON.stringify(item)}
    CONTEXT: ${context.substring(0, 5000)}
    
    TASK:
    1. Identify the specific Legal Claim (e.g. s15 EqA).
    2. Explain the "Legal Basis" (Nexus).
    3. Predict the Respondent's Defence.
    4. Write a "Presentation Strategy" (Advocacy script).
    
    RETURN JSON ScottScheduleItem (same fields as input, populated).
    `;
    
    try {
         return await retryOperation(async () => {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            return parsePossiblyTruncatedJson(response.text || "{}");
         });
    } catch(e) { return null; }
};

export const generateCoachingModules = async (issues: Issue[], apiKey?: string): Promise<CoachingModule[]> => {
     const ai = getAiClient(apiKey);
    if (!ai) return [];
    
    const prompt = `
    Generate coaching modules for a Litigant in Person.
    ISSUES: ${JSON.stringify(issues)}
    
    RETURN JSON array of CoachingModule:
    [{ "id": "string", "title": "string", "skill": "string", "content": "string", "exercises": ["string"] }]
    `;
    
     try {
         return await retryOperation(async () => {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            const res = parsePossiblyTruncatedJson(response.text || "[]");
            return Array.isArray(res) ? res : [];
         });
    } catch(e) { return []; }
};

export const generateCastList = async (context: string, apiKey?: string): Promise<CastMember[]> => {
    const ai = getAiClient(apiKey);
    if (!ai) return [];
    
    const prompt = `
    Extract the Cast List (Dramatis Personae) from the case.
    CONTEXT: ${context.substring(0, 10000)}
    
    RETURN JSON array of CastMember:
    [{ "name": "string", "role": "string", "relevance": "string", "firstMention": "string" }]
    `;
    
     try {
         return await retryOperation(async () => {
             const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    safetySettings: SAFETY_SETTINGS
                }
            });
            const res = parsePossiblyTruncatedJson(response.text || "[]");
            return Array.isArray(res) ? res : [];
         });
    } catch(e) { return []; }
};

export const extractDocumentContent = async (content: { mimeType: string, data: string }, apiKey?: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    if (!ai) return "";
    try {
        const response = await ai.models.generateContent({
             model: "gemini-2.5-flash",
             contents: { parts: [{ inlineData: content }, { text: "Extract all readable text from this document. Provide ONLY the text content, no markdown or comments. If no text is found, return 'No readable text'." }] },
             config: { safetySettings: SAFETY_SETTINGS }
        });
        return response.text || "";
    } catch (e) { 
        console.error("Text extraction error:", e);
        return ""; 
    }
};

export const transcribeAudio = async (audio: { mimeType: string, data: string }, apiKey?: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    if (!ai) throw new Error("API Key missing");
    
    // Safety check for payload size (approx)
    if (audio.data.length > 20 * 1024 * 1024) {
         throw new Error("Audio file too large for inline transcription (limit ~15MB)");
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { 
                parts: [
                    { inlineData: audio }, 
                    { text: "Transcribe this audio file verbatim. Identify speakers if possible (e.g., SPEAKER 1, SPEAKER 2). Output ONLY the transcript." }
                ] 
            },
            config: { safetySettings: SAFETY_SETTINGS }
        });
        
        if (!response.text) {
             throw new Error("Model returned empty transcription.");
        }
        
        return response.text;
    } catch (e: any) { 
        console.error("Transcribe Error:", e);
        throw new Error(`Transcription failed: ${e.message}`);
    }
};

export const createChatSession = async (apiKey: string) => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        history: [],
        config: { 
            systemInstruction: "You are an expert UK Employment Law assistant (EvidenceMaster AI). You have FULL ACCESS to the user's uploaded documents and evidence. The documents have been processed and converted to text for you in the context window. When asked about a document, you MUST read the provided context verbatim and cite it. Do NOT say you cannot read documents. Always refer to the specific evidence provided.",
            safetySettings: SAFETY_SETTINGS 
        }
    });
};

export const sendChatMessageStream = async (chat: Chat, message: string, context: string, history: ChatMessage[]) => {
    const responseStream = await chat.sendMessageStream({ 
        message: `Context: ${context}\n\nUser: ${message}` 
    });
    async function* streamGenerator() {
        for await (const chunk of responseStream) {
            if (chunk.text) yield chunk.text;
        }
    }
    return streamGenerator();
};

export const searchPrecedents = async (query: string, apiKey?: string): Promise<LegalResearchNote[]> => {
     const ai = getAiClient(apiKey);
    if (!ai) return [];
    const prompt = `Find UK employment precedents for: "${query}". Return JSON array of LegalResearchNote.`;
     try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS
            }
        });
        const result = parsePossiblyTruncatedJson(response.text || "[]");
        return Array.isArray(result) ? result : [];
    } catch (e) { return []; }
};

export const generateClaimantActionPlan = async (timeline: TimelineEvent[], issues: Issue[], context: string, apiKey?: string): Promise<ClaimantActionPlan | null> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    const prompt = `Generate ClaimantActionPlan. Context: ${context}. Return JSON.`;
    try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS
            }
        });
        return parsePossiblyTruncatedJson(response.text || "{}");
    } catch(e) { return null; }
};

export const generateJustificationRebuttal = async (treatment: string, aim: string, apiKey?: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    if (!ai) return "";
    const prompt = `Draft s15 rebuttal. Treatment: ${treatment}. Aim: ${aim}.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { safetySettings: SAFETY_SETTINGS }
        });
        return response.text || "";
    } catch(e) { return ""; }
};

export const generatePreliminaryHearingStrategy = async (context: string, issues: Issue[], notes: UserNote[], apiKey?: string): Promise<PreliminaryHearingStrategy | null> => {
     const ai = getAiClient(apiKey);
    if (!ai) return null;
    const prompt = `
        You are a Tribunal Judge preparing for a Case Management Preliminary Hearing.
        Your task is to create a comprehensive strategy dossier for the Claimant (a Litigant in Person).
        Role-play a mock hearing between a Claimant Barrister, a Respondent Solicitor, and yourself (the Judge) to generate the analysis.

        CONTEXT: ${context}
        ISSUES: ${JSON.stringify(issues)}
        NOTES: ${JSON.stringify(notes)}

        RETURN a JSON object with the EXACT structure of the 'PreliminaryHearingStrategy' interface. Be extremely detailed.
        - caseSummaryForJudge: A 30-second summary for the Judge.
        - hearingObjectives: The Claimant's top 3 goals.
        - listOfIssuesBattleground: For each core issue, provide the Claimant's ideal wording, predict the Respondent's likely objection/wording, and give advice on how to argue for the Claimant's version.
        - caseManagementOrderAnalysis: For Disclosure, Witness Statements, and Bundle preparation, detail the Claimant's request, predict the Respondent's resistance, and analyze the risk/opportunity for the Claimant.
        - jurisdictionStrategy: Specifically address Time Limits / Continuing Act. Formulate the Claimant's argument, predict the Respondent's counter, and list key evidence to cite.
        - adjustmentsForHearing: Based on the medical context, suggest reasonable adjustments for the hearing itself.
        - respondentTacticsRadar: Predict 3 unethical or sharp tactics the Respondent might use at the PH and provide a counter-move for each.
    `;
     try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS
            }
        });
        return parsePossiblyTruncatedJson(response.text || "{}");
    } catch(e) { console.error("PH Strategy failed:", e); return null; }
};

export const generateContinuingActArgument = async (startEvent: TimelineEvent, endEvent: TimelineEvent, context: string, apiKey?: string): Promise<ContinuingActLink | null> => {
     const ai = getAiClient(apiKey);
    if (!ai) return null;
    const prompt = `Link event ${startEvent.date} to ${endEvent.date}. Context: ${context}. Return JSON ContinuingActLink.`;
     try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS
            }
        });
        return parsePossiblyTruncatedJson(response.text || "{}");
    } catch(e) { return null; }
};

export const generateDisclosureLetter = async (items: string[], context: string, apiKey?: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    if (!ai) return "";
    const prompt = `Draft disclosure letter for: ${items.join(', ')}. Context: ${context}.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { safetySettings: SAFETY_SETTINGS }
        });
        return response.text || "";
    } catch(e) { return ""; }
};

export const generateDraftDocument = async (type: string, context: string, issues: Issue[], timeline: TimelineEvent[], instructions: string, apiKey?: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    if (!ai) return "";
    const prompt = `Draft ${type}. Instructions: ${instructions}. Context: ${context}.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", 
            contents: prompt,
            config: { safetySettings: SAFETY_SETTINGS }
        });
        return response.text || "";
    } catch(e) { return ""; }
};

export const checkDraftFairness = async (text: string, apiKey?: string): Promise<FairnessCheckResult[]> => {
     const ai = getAiClient(apiKey);
    if (!ai) return [];
    const prompt = `Fairness check. Text: ${text}. Return JSON array FairnessCheckResult.`;
    try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS
            }
        });
        const result = parsePossiblyTruncatedJson(response.text || "[]");
        return Array.isArray(result) ? result : [];
    } catch(e) { return []; }
};

export const generateLegalParagraph = async (claimType: string, inputs: any, context: string, apiKey?: string): Promise<string> => {
    const ai = getAiClient(apiKey);
    if (!ai) return "";
    const prompt = `Write legal paragraph for ${claimType}. Inputs: ${JSON.stringify(inputs)}. Context: ${context}.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { safetySettings: SAFETY_SETTINGS }
        });
        return response.text || "";
    } catch(e) { return ""; }
};

export const generatePatternAnalysis = async (timeline: TimelineEvent[], context: string, issues: Issue[], apiKey?: string): Promise<PatternAnalysisResult | null> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    const prompt = `Analyze patterns. Context: ${context}. Return JSON PatternAnalysisResult.`;
     try {
         const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS
            }
        });
        return parsePossiblyTruncatedJson(response.text || "{}");
    } catch(e) { return null; }
};

export const generateCaseGraph = async (timeline: TimelineEvent[], issues: Issue[], context: string, apiKey?: string): Promise<{ nodes: CaseGraphNode[], links: CaseGraphLink[] } | null> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    const prompt = `Generate case graph. Context: ${context}. Return JSON {nodes, links}.`;
    try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS
            }
        });
        return parsePossiblyTruncatedJson(response.text || "{}");
    } catch(e) { return null; }
};

export const performRealityCheck = async (action: string, context: string, apiKey?: string): Promise<RealityCheckResult[]> => {
    const ai = getAiClient(apiKey);
    if (!ai) return [];
    const prompt = `Reality check action: "${action}". Context: ${context}. Return JSON array RealityCheckResult.`;
     try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const result = parsePossiblyTruncatedJson(response.text || "[]");
        return Array.isArray(result) ? result : [];
    } catch(e) { return []; }
};

export const generateDisabilityAdjustments = async (context: string, medical: MedicalEvidence[], apiKey?: string): Promise<SuggestedAdjustment[]> => {
    const ai = getAiClient(apiKey);
    if (!ai) return [];
    const prompt = `Suggest adjustments. Context: ${context}. Medical: ${JSON.stringify(medical)}. Return JSON array SuggestedAdjustment.`;
     try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        const result = parsePossiblyTruncatedJson(response.text || "[]");
        return Array.isArray(result) ? result : [];
    } catch(e) { return []; }
};

export const runSystemDiagnostics = async (apiKey: string): Promise<DiagnosticResult[]> => {
    const ai = getAiClient(apiKey);
    if (!ai) return [{ name: 'API Key Check', status: 'Fail', details: 'No API Key provided' }];
    try {
        await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "ping" });
        return [{ name: 'Gemini Flash Connection', status: 'Pass', details: 'Operational' }];
    } catch (e: any) {
        return [{ name: 'Gemini Flash Connection', status: 'Fail', details: e.message }];
    }
};

export const generateImpactStatementDraft = async (answers: string, medicalContext: string, apiKey?: string): Promise<string> => {
     const ai = getAiClient(apiKey);
    if (!ai) return "";
    const prompt = `Write Impact Statement. Answers: ${answers}. Medical: ${medicalContext}.`;
     try {
         const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
        });
        return response.text || "";
    } catch(e) { return ""; }
};

export const generateLegalGuide = async (context: string, apiKey?: string): Promise<LegalGuide[]> => {
     const ai = getAiClient(apiKey);
    if (!ai) return [];
    const prompt = `Generate legal guides. Context: ${context}. Return JSON array LegalGuide.`;
     try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS }
        });
        const result = parsePossiblyTruncatedJson(response.text || "[]");
        return Array.isArray(result) ? result : [];
    } catch(e) { return []; }
};

export const organizeEvidenceBundle = async (documents: DocumentMetadata[], apiKey?: string): Promise<BundleFolder[]> => {
     const ai = getAiClient(apiKey);
    if (!ai) return [];
    const docList = documents.map(d => ({ id: d.id, name: d.fileName }));
    const prompt = `Organize docs into folders. Docs: ${JSON.stringify(docList)}. Return JSON array BundleFolder.`;
     try {
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS }
        });
        const result = parsePossiblyTruncatedJson(response.text || "[]");
        return Array.isArray(result) ? result : [];
    } catch(e) { return []; }
};

export const generateET1Content = async (timeline: TimelineEvent[], issues: Issue[], context: string, apiKey?: string): Promise<{ grounds: string, remedy: string }> => {
    const ai = getAiClient(apiKey);
    if (!ai) return { grounds: "", remedy: "" };
    const prompt = `Draft ET1. Context: ${context.slice(0, 15000)}. Return JSON {grounds, remedy}.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS }
        });
        if (response.text) return parsePossiblyTruncatedJson(response.text) || { grounds: "", remedy: "" };
    } catch(e) { console.error(e); }
    return { grounds: "", remedy: "" };
};

export const generatePHAgendaContent = async (context: string, issues: Issue[], apiKey?: string): Promise<any> => {
    const ai = getAiClient(apiKey);
    if (!ai) return null;
    const prompt = `Fill PH Agenda. Context: ${context.slice(0, 15000)}. Return JSON.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", safetySettings: SAFETY_SETTINGS }
        });
        if (response.text) return parsePossiblyTruncatedJson(response.text);
    } catch(e) { console.error(e); }
    return null;
};

export const deduplicateTimelineEvents = (events: TimelineEvent[]) => {
    if (!Array.isArray(events)) return [];
    
    const uniqueEvents: TimelineEvent[] = [];
    const seenSignatures = new Set<string>();

    const sorted = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const event of sorted) {
        const signature = `${event.date}|${(event.event || "").substring(0, 30).toLowerCase()}`;
        
        if (!seenSignatures.has(signature)) {
            seenSignatures.add(signature);
            uniqueEvents.push(event);
        } else {
            const existing = uniqueEvents.find(e => `${e.date}|${(e.event || "").substring(0, 30).toLowerCase()}` === signature);
            if (existing && !existing.sourceDoc.includes(event.sourceDoc)) {
                existing.sourceDoc += `, ${event.sourceDoc}`;
            }
        }
    }
    return uniqueEvents;
};

export const validateApiKey = async (apiKey: string) => { 
    const ai = getAiClient(apiKey);
    if (!ai) return { isValid: false, error: "No client" };
    try { await ai.models.generateContent({ model: "gemini-2.5-flash", contents: "ping" }); return { isValid: true }; }
    catch (e: any) { return { isValid: false, error: e.message }; }
};
