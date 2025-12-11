
export enum DocStatus {
  UPLOADED = "uploaded",
  PROCESSING = "processing",
  READY = "ready",
  ERROR = "error"
}

export type AiProvider = 'gemini' | 'webllm' | "groq";

export interface ExtractionStats {
  eventCount: number;
  issueCount: number;
  medicalCount: number;
  entityCount: number;
}

export interface Chapter {
  title: string;
  summary: string;
  pageEstimate?: number;
}

export interface DocumentMetadata {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  status: DocStatus;
  size: string;
  pageCount?: number; 
  pageRange?: string;
  textContent?: string; 
  extractionStats?: ExtractionStats;
  summary?: string[]; 
  chapters?: Chapter[];
  bundleCategory?: 'Medical' | 'CSP_Evidence' | 'IPI_Evidence' | 'Grievance_Appeal' | 'Other'; 
  author?: 'Claimant' | 'Respondent';
}

export type FileRegistry = { [id: string]: File };

export interface TimelineEvent {
  id?: string; 
  date: string;
  event: string;
  sourceDoc: string;
  quote: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  category: string;
  page?: number;
  originalDocIds?: string[]; 
  matchScore?: number; 
  relevanceTag?: 'Support' | 'Contradiction' | 'Timeline' | 'Neutral'; 
}

export interface ScottScheduleItem {
  id: string;
  date: string;
  allegation: string; 
  detriment: string; 
  legalClaim: string; 
  legalBasis: string; 
  respondentDefencePrediction?: string; 
  presentationStrategy?: string; 
  evidenceRef: string;
}

export interface PCP {
  description: string; 
  appliedTo: string; 
  disadvantage: string; 
  statute: "s20 Equality Act";
  sourceDoc: string;
}

export interface ProtectedAct {
  date: string;
  description: string; 
  type: "Grievance" | "Oral Complaint" | "ET1" | "ACAS";
  sourceDoc: string;
}

export interface Issue {
  id?: string;
  category: string;
  description: string;
  sourceQuote: string;
  sourceDoc: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  recommendedEvidence?: string;
  legalRationale?: string; 
  relevantStatutes?: string[]; 
  precedentCases?: string[]; 
  legalElements?: {
    element: string; 
    status: "Met" | "Missing" | "Weak";
    reasoning: string;
  }[];
}

export interface ConsolidatedIssue {
  id: string;
  legalHead: string; 
  statute: string;
  primaFacieStrength: "Strong" | "Moderate" | "Weak";
  summaryOfBreach: string;
  combinedEvidence: { doc: string; quote: string; date?: string }[];
  tribunalPerspective: string; 
  legalImplications: string; 
  missingProof: string; 
  victimImpact: string; 
  remedyAssessment: string; 
  temporalStatus: "Active/Ongoing" | "Resolved (Factually)" | "Historic Breach";
  evolution: string; 
  resolutionDate?: string; 
}

export interface EthicsRadar {
  tactic: string; 
  evidenceCount: number;
  description: string;
  legalRelevance: string; 
}

export interface Entity {
  name: string;
  role: "HR" | "Management" | "Occupational Health" | "Union" | "Colleague" | "Other";
  sentiment: "Hostile" | "Supportive" | "Neutral";
  sourceDoc: string;
}

export interface CastMember {
  name: string;
  role: string;
  relevance: string;
  firstMention: string;
}

export interface MedicalEvidence {
  date: string;
  type: "BP Reading" | "Symptom" | "Diagnosis" | "Medication" | "Admission";
  value: string;
  context: string;
  sourceDoc: string;
  page?: number;
}

export interface PolicyReference {
  policyName: string;
  clause?: string;
  complianceStatus: "Breached" | "Followed" | "Unclear";
  quote: string;
  sourceDoc: string;
}

export interface TribunalQuestion {
  id: string;
  asker: 'Judge' | 'Respondent' | 'Panel';
  question: string;
  intent: string;
  suggestedResponse: string;
  relatedEvidence?: string;
}

export interface Contradiction {
  description: string;
  sourceA: string;
  sourceB: string;
  impact: string; 
}

export interface ConflictingAccount {
  eventDescription: string;
  witnessA: { name: string; version: string; source: string };
  witnessB: { name: string; version: string; source: string };
  analysis: string; 
}

export interface ProceduralBreach {
  step: string;
  breach: string;
  acasCodeRef: string; 
  severity: "Minor" | "Major" | "Fatal";
}

export interface AdjustmentAnalysis {
  adjustment: string;
  status: "Implemented" | "Refused" | "Delayed" | "Ignored";
  evidence: string;
}

export interface ClaimOutcomeSimulation {
  claimType: string; 
  probabilitySuccess: number; 
  winningFactors: string[];
  losingRisks: string[];
  relevantCaseLaw: string; 
}

export interface OutcomeScenario {
  name: string; 
  probability: number;
  financialRange: string;
  description: string;
  strategicAdvice: string;
}

export interface StressTestResult {
  argument: string;
  fragilityScore: number; 
  breakingPoint: string; 
  judicialPerspective: string; 
  strengtheningAdvice: string; 
}

export interface JudgePrediction {
  likelyOutcome: "Claimant Win" | "Respondent Win" | "Split Decision";
  probabilityScore: number; 
  keyTurningPoint: string;
  judicialReasoning: string;
  claimSimulations?: ClaimOutcomeSimulation[]; 
}

export interface LegalResearchNote {
  topic: string; 
  relevantPrecedent: string; 
  summaryOfLaw: string;
  applicationToFact: string; 
  sourceUrl?: string;
}

export interface RespondentPsychology {
  profile: "Aggressive/Litigious" | "Risk-Averse/Settler" | "Incompetent/Chaotic" | "By-The-Book";
  pressurePoints: string[];
  likelyNextMove: string;
  settlementPropensity: string; 
}

export interface RespondentArgument {
  argument: string; 
  likelihood: "High" | "Medium" | "Low";
  weakness: string; 
  counterArgument: string; 
}

export interface WeaknessAnalysis {
  weakness: string;
  impact: "High" | "Medium" | "Low";
  rebuttalStrategy: string; 
}

export interface FactFinding {
    fact: string;
    source: string;
    status: "Agreed" | "Disputed";
    relevance: string;
}

export interface TribunalStrategy {
  caseTheory: string;
  strengths: string[];
  weaknesses: string[]; 
  weaknessAnalysis?: WeaknessAnalysis[]; 
  findingsOfFact?: FactFinding[]; 
  respondentTactics: string[];
  respondentPsychology?: RespondentPsychology; 
  respondentArguments?: RespondentArgument[]; 
  questions: TribunalQuestion[];
  contradictions: Contradiction[];
  conflictingAccounts: ConflictingAccount[]; 
  proceduralBreaches: ProceduralBreach[];
  credibilityScore: number; 
  medicalHighlights: MedicalEvidence[]; 
  adjustmentsAnalysis: AdjustmentAnalysis[];
  strongestCaseSide?: 'Claimant' | 'Respondent' | 'Even';
  ventoBandAssessment?: {
    band: 'Lower' | 'Middle' | 'Upper' | 'Exceptional';
    estimate: string; 
    rationale: string;
  };
  compensationEstimate?: string; 
  judgePrediction?: JudgePrediction; 
  legalResearch?: LegalResearchNote[]; 
  outcomeScenarios?: OutcomeScenario[]; 
  stressTestResults?: StressTestResult[]; 
}

export interface CrossExamQuestion {
  targetWitness: string; 
  question: string; 
  purpose: string; 
  trap: string; 
  supportingDoc: string; 
}

export interface ArgumentPoint {
  headline: string; 
  legalBasis: string; 
  keyEvidence: string;
  rebuttal: string; 
}

export interface ClaimantActionPlan {
  openingStatement: string; 
  closingStatement: string; 
  respondentDestruction: string[]; 
  claimantShield: string[]; 
  crossExaminationStrategy: CrossExamQuestion[];
  skeletonArgument: ArgumentPoint[];
  claimSummary?: string; 
}

export interface UserNote {
  id: string;
  date: string;
  title: string;
  content: string;
  category: 'Observation' | 'Rebuttal' | 'Context' | 'Question';
}

export interface ContinuingActLink {
  id: string;
  startEvent: string;
  endEvent: string;
  argument: string;
  strength: 'High' | 'Medium' | 'Low';
}

export interface PHAgendaItemAnalysis {
    item: string;
    claimantPosition: string;
    respondentLikelyPosition: string;
    judgesView: string;
    strategicAdvice: string;
}

export interface PreliminaryHearingStrategy {
  caseSummaryForJudge: string;
  hearingObjectives: string[];
  listOfIssuesBattleground: {
      issue: string;
      claimantWording: string;
      respondentLikelyObjection: string;
      advice: string;
  }[];
  caseManagementOrderAnalysis: {
      order: string;
      claimantRequest: string;
      respondentLikelyResistance: string;
      riskOpportunity: string;
  }[];
  jurisdictionStrategy: {
      issue: string;
      claimantArgument: string;
      respondentCounter: string;
      keyEvidenceToCite: string;
  };
  adjustmentsForHearing: string[];
  respondentTacticsRadar: {
    tactic: string;
    description: string;
    counterMove: string;
    evidenceToCite: string;
  }[];
  continuingActLinks?: ContinuingActLink[];
}

export interface AnalysisResult {
  summary: string[];
  keyFindings: string[];
  timeline: TimelineEvent[];
  issues: Issue[];
  entities: Entity[];
  medicalEvidence: MedicalEvidence[];
  policyReferences: PolicyReference[];
  chapters?: Chapter[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  history: ChatMessage[];
}

export interface CaseMetadata {
  id: string;
  name: string;
  lastModified: number;
  description?: string;
}

export interface DraftDocument {
  id: string;
  type: 'Grievance' | 'Appeal' | 'ET1' | 'Witness Statement' | 'Schedule of Loss' | 'Other' | 'Impact Statement' | 'Settlement Offer';
  title: string;
  content: string;
  createdAt: string;
  lastEdited: string;
}

export interface Pattern {
  name: string;
  description: string;
  type: 'Temporal' | 'Behavioral' | 'Retaliatory';
  relatedEvents: string[]; 
  significance: string;
}

export interface Comparator {
  name: string; 
  role: string;
  isReal: boolean;
  treatmentDifference: string;
  evidence: string;
}

export interface PatternLibraryInsight {
  commonPitfall: string;
  relevanceToYou: string;
  mitigationStrategy: string;
  caseRef?: string;
}

export interface PatternAnalysisResult {
  patterns: Pattern[];
  comparators: Comparator[];
  themes: string[];
  collectiveInsights?: PatternLibraryInsight[]; 
}

export interface FairnessCheckResult {
  flaggedSegment: string;
  issueType: 'Bias' | 'Aggression' | 'Ambiguity' | 'Clarity';
  suggestion: string;
  reasoning: string;
}

export interface CaseGraphNode {
  id: string;
  type: 'Issue' | 'Evidence' | 'Witness' | 'Fact';
  label: string;
  status: 'Proven' | 'Contested' | 'Missing';
}

export interface CaseGraphLink {
  source: string;
  target: string;
  label: string; 
}

export interface CoachingModule {
  id: string;
  title: string;
  skill: string; 
  content: string;
  exercises: string[];
}

export interface RealityCheckResult {
  action: string;
  backfireProbability: number; 
  likelyTribunalReaction: string;
  betterAlternative: string;
}

export interface SuggestedAdjustment {
    adjustment: string;
    rationale: string;
    guidanceLink?: string;
}

export interface ScheduleOfLossData {
  age: number;
  grossWeeklyPay: number;
  netWeeklyPay: number;
  employmentStartDate: string;
  employmentEndDate: string;
  injuryToFeelings: number;
  lossOfEarningsMonths: number;
  serviceYears: number; 
}

export interface ImpactStatementData {
  condition: string;
  washing: string;
  sleeping: string;
  concentrating: string;
  social: string;
  draft: string;
}

export interface ForensicData {
  emailHeatmap: { date: string; count: number; sentiment: string }[];
  timelineGaps: { startDate: string; endDate: string; duration: string; suspicionLevel: string }[];
  keywordTrends: { keyword: string; trend: string; frequency: number }[];
  inconsistencies: { docA: string; docB: string; contradiction: string }[];
}

export interface PolicyAudit {
  complianceScore: number;
  breaches: { policy: string; breach: string; severity: string; evidence: string }[];
  fairnessAssessment: string;
  repScript: { phase: string; question: string; reason: string }[];
  escalationAdvice: string;
}

export interface MedicalNexus {
  symptomActionOverlay: { date: string; medicalEvent: string; managementAction: string; correlation: string }[];
  longTermProof: { diagnosisDate: string; duration: string; status: "Likely" | "Unlikely"; evidence: string };
  functionalEffects: { medicalTerm: string; laymansTerm: string; impact: string }[];
  adjustmentFeasibility: { adjustment: string; employerRefusal: string; scientificRebuttal: string }[];
}

export interface NegotiationStrategy {
  riskAdjustedValue: number;
  batna: string;
  openingOffer: number;
  walkAwayPoint: number;
  negotiationScript: { stage: string; tactic: string; script: string }[];
  settlementLetterDraft: string;
}

export interface LegalGuide {
  topic: string; 
  definition: string;
  burdenOfProof: string;
  respondentDefence: string;
  caseExamples: string[]; 
}

export interface BundleFolder {
  name: string;
  category: 'Medical' | 'CSP' | 'IPI' | 'Grievance' | 'Other';
  docIds: string[];
  summary: string;
}

export interface ForensicAppealPoint {
    id: string;
    findingNumber: number;
    employerFinding: string;
    rebuttalCategory: 'Perverse Finding' | 'Factual Error' | 'Procedural Flaw' | 'Misrepresentation';
    claimantArgument: string;
    smokingGunEvidence: {
        quote: string;
        documentRef: string;
        pageNumber?: number;
    }[];
    impactOnCase: string;
    questionForDecisionMaker: string;
}

export interface ProceduralFlaw {
  area: 'Investigation' | 'Hearing' | 'Outcome' | 'General Fairness';
  breachDescription: string;
  acasCodeReference: string;
  legalSignificance: string;
}

export interface LegalRisk {
  claim: string;
  riskLevel: 'High' | 'Medium' | 'Low';
  rationale: string;
}

export interface AppealPack {
  coverLetter: string;
  executiveSummary: string;
  proceduralFlaws: ProceduralFlaw[];
  legalRisksForEmployer: LegalRisk[];
  forensicAppealPoints: ForensicAppealPoint[];
  requestedRemedy: string;
}

export interface FullCaseData {
  metadata: CaseMetadata;
  documents: DocumentMetadata[];
  timelineEvents: TimelineEvent[];
  issues: Issue[];
  consolidatedIssues?: ConsolidatedIssue[];
  ethicsRadar?: EthicsRadar[];
  entities: Entity[];
  medicalEvidence: MedicalEvidence[];
  policyReferences: PolicyReference[];
  contextSummary: string; 
  tribunalStrategy: TribunalStrategy | null;
  chatHistory: ChatMessage[];
  prelimStrategy: PreliminaryHearingStrategy | null;
  userNotes: UserNote[];
  draftDocuments: DraftDocument[]; 
  patternAnalysis?: PatternAnalysisResult | null; 
  graphNodes?: CaseGraphNode[];
  graphLinks?: CaseGraphLink[];
  coachingModules?: CoachingModule[];
  realityChecks?: RealityCheckResult[];
  suggestedAdjustments?: SuggestedAdjustment[];
  castList?: CastMember[]; 
  scheduleOfLoss?: ScheduleOfLossData; 
  forensicData?: ForensicData | null; 
  policyAudit?: PolicyAudit | null; 
  medicalNexus?: MedicalNexus | null; 
  negotiationStrategy?: NegotiationStrategy | null; 
  claimantActionPlan?: ClaimantActionPlan | null;
  legalGuides?: LegalGuide[];
  bundleFolders?: BundleFolder[];
  pcps?: PCP[]; 
  protectedActs?: ProtectedAct[]; 
  scottSchedule?: ScottScheduleItem[]; 
  impactStatement?: ImpactStatementData | null;
  appealPack?: AppealPack | null; 
  fileAttachments?: { [id: string]: { name: string, type: string, data: string } }; 
}
