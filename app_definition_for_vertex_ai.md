
# EvidenceMaster AI: Comprehensive Application Definition for Vertex AI Studio

## 1. Application Name & Purpose

**Name:** EvidenceMaster AI (Platinum Edition)

**Purpose:** EvidenceMaster AI is an elite, AI-powered Litigation Co-Pilot and eDiscovery platform specifically designed for UK Employment Law. It acts as a comprehensive legal team—Solicitor, Barrister, and Judge—specializing in Disability Rights (Equality Act 2010). It is designed to empower Litigants in Person (LiPs) with tools that rival top-tier professional platforms like Relativity, Everlaw, Harvey, and CoCounsel.

**Jurisdiction Guardrails:** The application is strictly locked to **UK Employment Law (Great Britain)**. It enforces British English spelling and explicitly forbids references to US legislation (ADA, EEOC) to ensure radical legal accuracy.

## 2. Core Features & Functional Breakdown

The application is divided into specialized modules, each targeting a specific phase of the litigation lifecycle.

### 2.1. Document Management & Ingestion
*   **Sequential Upload Pipeline:** Processes multiple files (PDF, Word, Text, Image, Audio) sequentially to manage API quotas.
*   **Multimodal Ingestion:** Uses Gemini 2.5 Flash to implicitly OCR images and PDF pages.
*   **Audio Transcription:** Integrated module to transcribe audio evidence (calls, meetings), identifying speakers and emotional tone, which is then fed into the analysis engine.
*   **DOCX & Text Processing:** Client-side conversion using `mammoth.js`.
*   **Cascading Deletion:** Deleting a document removes all linked evidence nodes (events, issues, entities) from the case graph.
*   **"Review Mode" (Verification Layer):** Side-by-side modal to verify AI extractions against the original document source file.

### 2.2. Case Management System
*   **Multi-Case Architecture:** Users can Save, Load, Rename, and Switch between multiple distinct case files stored in LocalStorage.
*   **Legal Roadmap & Deadlines:** Visual roadmap of the Tribunal process (Grievance → ACAS → ET1 → Hearing) with a **Smart Deadline Calculator** (3 months less 1 day rule).
*   **User Notes Engine:** Users can upload offline notes (.docx) or type observations. These are treated as "Contextual Evidence" by the AI to steer strategy.

### 2.3. The Intelligence Engine (AI Analysis)

#### 2.3.1. Initial Extraction & Pattern Recognition
*   **Granular Extraction:** Extracts Entities, Medical Data (BP, Symptoms), Policy Breaches, and Timeline Events.
*   **Chronology Deduplication:** automatically merges overlapping events from multiple documents into a single "Master Truth".
*   **Pattern Analysis Engine:**
    *   **Temporal Correlations:** "Did negative treatment spike after a protected act?"
    *   **Comparator Generator:** Identifies real or constructs hypothetical comparators for s13 Direct Discrimination.
    *   **Collective Intelligence:** Matches the user's fact pattern against a "Pattern Library" of common tribunal pitfalls to offer specific warnings.

#### 2.3.2. Deep Tribunal Preparation ("The Legal Trinity")
This module simulates three distinct legal perspectives simultaneously:
1.  **The Advocate (Claimant Strategy):**
    *   **Case Theory:** Drafts compelling opening statements.
    *   **Precedent Research:** Uses **Google Search Grounding** to find real UK EAT/Court of Appeal cases matching the specific facts.
    *   **Vento Band Assessment:** Estimates Injury to Feelings awards (Lower/Middle/Upper) with monetary ranges.
2.  **The Defence (Respondent Strategy):**
    *   **Psychological Profiling:** Profiles the Respondent (Aggressive, Incompetent, Risk-Averse) based on communication tone.
    *   **Fatal Weakness Detector:** Identifies the fragile points in the Claimant's case.
3.  **The Judge (Quantum Simulator):**
    *   **Outcome Modelling:** Generates 3 future scenarios (Settlement, Partial Win, Full Win) with probability percentages.
    *   **Win Probability:** Runs a "Claims Simulator" for each legal head (e.g., s15 Discrimination: 65% Chance) based on evidentiary burden.
    *   **Rashomon Analysis:** Identifies "Conflicting Accounts" where witnesses give contradictory versions of the same event.

#### 2.3.3. Argument Stress-Test
*   **Judicial Archetypes:** Simulates the case before 3 judge types: The Strict Procedural Judge, The Empathetic Judge, and The Forensic Judge.
*   **Fragility Scores:** Assigns a 0-100 fragility score to key arguments and identifies their "Breaking Point".

### 2.4. Claimant's War Room (Advocacy Module)
*   **Attack Plan:** A prioritized list of Respondent weaknesses to exploit.
*   **Defense Shield:** Pre-prepared rebuttals for the Claimant's own weaknesses.
*   **Cross-Examination Builder:** Generates specific "Killer Questions" for Respondent witnesses, detailing the *Purpose* and the *Trap* for each question.
*   **Scripting:** Generates Opening and Closing submissions.

### 2.5. Preliminary Hearing (PH) Navigator
*   **Agenda Strategy:** Guides the user through the Case Management Agenda.
*   **Tactics Radar:** Flags unethical Respondent tactics (e.g., document dumping) and suggests counter-moves.
*   **Disclosure Requests:** Generates a specific list of documents to demand from the Respondent.

### 2.6. Case Co-Pilot & Coaching
*   **Living Case Graph:** Visual node-link graph showing connections between Evidence, Issues, and Witnesses. Highlights "Orphan Issues" (claims with no evidence).
*   **Reality Check:** Users input a planned action (e.g., "I will refuse the meeting"), and the AI calculates a "Backfire Probability" and likely Tribunal reaction.
*   **Disability Architect:** Suggests specific **Reasonable Adjustments** (s20 EqA) based on the specific medical evidence and job role.
*   **Skills Coach:** Educational modules teaching cross-examination techniques and emotional regulation.

### 2.7. Drafting Studio
*   **Legal Drafting:** Generates formal documents (Grievance, Appeal, ET1, Witness Statements).
*   **Fairness & Bias Checker:** Audits user drafts for "Unconscious Bias", "Emotional Aggression", or "Ambiguity", enforcing professional, neutral language.

### 2.8. CoCounsel Chat (Conversational AI)
*   **Persona:** Act as a Senior UK Employment Solicitor.
*   **Capabilities:** Full context awareness, streaming responses, and capability to answer complex strategic questions ("Which side is stronger?", "What is the settlement value?").

## 3. Technical Architecture & Vertex AI Config

### 3.1. AI Model Strategy (Multi-Model Cascade)
To achieve "Gold Star" reliability, the app uses a specific cascade strategy:

1.  **Primary Model:** `gemini-2.5-flash`
    *   **Config:** `thinkingConfig: { thinkingBudget: 16000 }`, `temperature: 0.1`
    *   **Role:** Deep reasoning, extraction, and drafting. The "Thinking" budget allows it to perform internal chain-of-thought verification before outputting legal advice.
2.  **Fallback Model:** `gemini-3-pro-preview`
    *   **Config:** `temperature: 0.0`, `tools: [{ googleSearch: {} }]`
    *   **Role:** Used specifically for "Deep Legal Research" and complex logic if Flash fails or for specific "Precedent Finding" tasks.
3.  **Tools:**
    *   **Google Search:** Enabled for the "Legal Research" and "Chat" modules to ensure grounding in up-to-date Case Law.

### 3.2. Data Schemas (TypeScript)
The application relies on highly structured, nested JSON schemas to force the AI into legal precision.

*   `TribunalStrategy`: The master object containing `judgePrediction`, `respondentPsychology`, `outcomeScenarios`, `stressTestResults`, etc.
*   `ClaimantActionPlan`: Contains `crossExaminationStrategy` and `skeletonArgument`.
*   `PatternAnalysisResult`: Contains `comparators` (Real vs Hypothetical) and `collectiveInsights`.
*   `FairnessCheckResult`: Structured audit of user text.
*   `CaseGraph`: Nodes and Links for visualization.

### 3.3. Prompt Engineering (System Instructions)
*   **Negative Constraints:** "DO NOT reference US Law." "DO NOT invent citations."
*   **Persona:** "You are a Tier 1 Employment Tribunal Solicitor."
*   **Chain of Thought:** "First, identify the facts. Second, apply the statutory test (s15 EqA). Third, look for contradictions. Finally, generate the strategy."

## 4. Deployment Requirements
*   **Frontend:** React 19, Tailwind CSS, Lucide React (Icons), Mammoth.js (DOCX), Recharts (optional for visualization).
*   **Backend/AI:** Google Vertex AI (Gemini Models), Google Cloud Storage (File persistence), Vertex AI Search (if scaling to RAG).
*   **Security:** End-to-End Encryption recommended for legal data.

This definition represents the complete functional specification of EvidenceMaster AI v3.0 (Platinum).
