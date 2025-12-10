
import { TimelineEvent, Issue, DocumentMetadata, PreliminaryHearingStrategy, AppealPack } from '../types';

export const downloadJSON = (data: any, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadTXT = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateChronologyCSV = (events: TimelineEvent[]) => {
  const headers = ['Date', 'Time/Page', 'Event Description', 'Category', 'Severity', 'Source Document', 'Quote'];
  const rows = events.map(e => [
    `"${e.date}"`,
    `"${e.page ? `Pg ${e.page}` : ''}"`,
    `"${(e.event || '').replace(/"/g, '""')}"`,
    `"${e.category}"`,
    `"${e.severity}"`,
    `"${e.sourceDoc}"`,
    `"${(e.quote || '').replace(/"/g, '""')}"`
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const generateScottScheduleCSV = (issues: Issue[]) => {
  const headers = ['No.', 'Claim Type', 'Alleged Incident / Failure to Adjust', 'Supporting Evidence (Quote)', 'Source Document', 'Severity', 'Respondents Response (Leave Blank)'];
  const rows = issues.map((issue, index) => [
    index + 1,
    `"${(issue.category || '').replace(/"/g, '""')}"`,
    `"${(issue.description || '').replace(/"/g, '""')}"`,
    `"${(issue.sourceQuote || '').replace(/"/g, '""')}"`,
    `"${issue.sourceDoc}"`,
    `"${issue.severity}"`,
    `""`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};

export const generateAppealPackTXT = (pack: AppealPack): string => {
  let content = "GRIEVANCE APPEAL SUBMISSION\n";
  content += "========================================\n\n";
  
  content += "SECTION 1: COVER LETTER\n";
  content += "--------------------------\n";
  content += `${pack.coverLetter}\n\n`;

  content += "SECTION 2: EXECUTIVE SUMMARY\n";
  content += "------------------------------\n";
  content += `${pack.executiveSummary}\n\n`;

  content += "SECTION 3: PROCEDURAL FLAWS (ACAS CODE OF PRACTICE)\n";
  content += "-----------------------------------------------------\n";
  (pack.proceduralFlaws || []).forEach(flaw => {
    content += `\nAREA: ${flaw.area}\n`;
    content += `BREACH: ${flaw.breachDescription}\n`;
    content += `ACAS REFERENCE: ${flaw.acasCodeReference}\n`;
    content += `SIGNIFICANCE: ${flaw.legalSignificance}\n`;
  });

  content += "\n\nSECTION 4: LEGAL RISKS FOR THE EMPLOYER\n";
  content += "-----------------------------------------\n";
  (pack.legalRisksForEmployer || []).forEach(risk => {
    content += `\nCLAIM: ${risk.claim}\n`;
    content += `RISK LEVEL: ${risk.riskLevel}\n`;
    content += `RATIONALE: ${risk.rationale}\n`;
  });

  content += "\n\nSECTION 5: FORENSIC EVIDENCE MATRIX\n";
  content += "-------------------------------------\n";
  (pack.forensicAppealPoints || []).forEach(p => {
    content += `\nFINDING #${p.findingNumber}: "${p.employerFinding}"\n`;
    content += `REBUTTAL: ${p.rebuttalCategory} - ${p.claimantArgument}\n`;
    content += `IMPACT: ${p.impactOnCase}\n`;
    content += `QUESTION: "${p.questionForDecisionMaker}"\n`;
    content += `EVIDENCE:\n`;
    (p.smokingGunEvidence || []).forEach(ev => {
      content += `  - "${ev.quote}" [Ref: ${ev.documentRef}${ev.pageNumber ? `, p.${ev.pageNumber}`: ''}]\n`;
    });
  });

  content += "\n\nSECTION 6: REQUESTED REMEDY\n";
  content += "-----------------------------\n";
  content += `${pack.requestedRemedy}\n`;

  return content;
};

export const generateStrategyTextFile = (strategy: PreliminaryHearingStrategy): string => {
  let content = "PRELIMINARY HEARING STRATEGY DOSSIER\n=======================================\n\n";
  
  content += `CASE SUMMARY FOR JUDGE:\n-------------------------\n${strategy.caseSummaryForJudge}\n\n`;
  content += `HEARING OBJECTIVES:\n-------------------\n${(strategy.hearingObjectives || []).map(o => `- ${o}`).join('\n')}\n\n`;

  content += `LIST OF ISSUES BATTLEGROUND:\n----------------------------\n`;
  (strategy.listOfIssuesBattleground || []).forEach(item => {
    content += `\nISSUE: ${item.issue}\n`;
    content += `  - Claimant Wording: ${item.claimantWording}\n`;
    content += `  - Respondent Objection (Predicted): ${item.respondentLikelyObjection}\n`;
    content += `  - Advice: ${item.advice}\n`;
  });

  content += `\n\nCASE MANAGEMENT ORDER ANALYSIS:\n-------------------------------\n`;
   (strategy.caseManagementOrderAnalysis || []).forEach(item => {
    content += `\nORDER: ${item.order}\n`;
    content += `  - Claimant's Request: ${item.claimantRequest}\n`;
    content += `  - Respondent Resistance (Predicted): ${item.respondentLikelyResistance}\n`;
    content += `  - Risk/Opportunity: ${item.riskOpportunity}\n`;
  });

  if (strategy.jurisdictionStrategy) {
    content += `\n\nJURISDICTION STRATEGY: ${strategy.jurisdictionStrategy.issue}\n---------------------------------------\n`;
    content += `  - Claimant Argument: ${strategy.jurisdictionStrategy.claimantArgument}\n`;
    content += `  - Respondent Counter: ${strategy.jurisdictionStrategy.respondentCounter}\n`;
    content += `  - Key Evidence: ${strategy.jurisdictionStrategy.keyEvidenceToCite}\n`;
  }
  
  return content;
};

export const generateBundleIndexCSV = (documents: DocumentMetadata[]) => {
  // Generates a court-compliant bundle index
  const headers = ['Tab', 'Document Description', 'Date', 'Pages', 'Status'];
  const rows = documents
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .map((doc, index) => [
      index + 1,
      `"${doc.fileName}"`,
      `"${new Date(doc.uploadedAt).toLocaleDateString()}"`,
      `"${doc.pageCount ? `${doc.pageCount} pages` : '1'}"`,
      `"${doc.status}"`
    ]);
    
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};
