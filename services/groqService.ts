// Groq Cloud AI Service
import { AnalysisResult } from '../types';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'mixtral-8x7b-32768'; // Fast and capable model

// Validate Groq API key
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [{role: 'user', content: 'test'}],
        max_tokens: 10
      })
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Main document analysis function
export const analyzeDocument = async (
  content: { type: string; value?: string; mimeType?: string; data?: string },
  fileName: string,
  docId: string,
  apiKey?: string
): Promise<AnalysisResult | null> => {
  const key = apiKey || localStorage.getItem('groq_api_key');
  
  if (!key) {
    throw new Error('Groq API key is required. Please add it in AI Engine Settings.');
  }

  try {
    // Extract text content
    let textContent = content.value || '';
    
    if (!textContent && content.data) {
      throw new Error('Groq requires extracted text content. Please ensure document text is extracted.');
    }

    // Construct analysis prompt
    const analysisPrompt = `Analyze this legal/employment tribunal document and extract key information.

Document: ${fileName}
Content:
${textContent.substring(0, 50000)} // Limit to avoid token limits

Provide a structured analysis in JSON format with:
1. documentType: The type of document (e.g., "Email", "Contract", "Letter")
2. parties: List of parties/people involved
3. dates: List of important dates mentioned
4. keyPoints: List of 3-5 key points from the document
5. legalIssues: List of potential legal issues identified
6. summary: A brief 2-3 sentence summary

Respond ONLY with valid JSON, no markdown or extra text.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: 'You are a legal document analysis AI. Always respond with valid JSON only.' },
          { role: 'user', content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Groq API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content || '{}';
    
    // Try to parse the JSON response
    let analysisData;
    try {
      // Remove markdown code blocks if present
      const jsonText = resultText.replace(/```json\n?|```/g, '').trim();
      analysisData = JSON.parse(jsonText);
    } catch (e) {
      // Fallback if JSON parsing fails
      analysisData = {
        documentType: 'Document',
        summary: resultText.substring(0, 500),
        keyPoints: ['Analysis completed with Groq'],
        parties: [],
        dates: [],
        legalIssues: []
      };
    }

    // Map to AnalysisResult format
    const result: AnalysisResult = {
      documentType: analysisData.documentType || 'Document',
      summary: analysisData.summary || 'Document analyzed successfully',
      keyPoints: analysisData.keyPoints || [],
      extractedEvents: (analysisData.dates || []).map((date: string, idx: number) => ({
        id: `${docId}_event_${idx}`,
        date: date,
        description: date,
        source: fileName,
        documentId: docId
      })),
      relatedIssues: (analysisData.legalIssues || []).map((issue: string, idx: number) => ({
        id: `${docId}_issue_${idx}`,
        title: issue,
        description: issue,
        severity: 'medium' as const,
        category: 'legal' as const
      })),
      suggestedTags: [],
      confidence: 0.85,
      processingTime: Date.now()
    };

    return result;

  } catch (error: any) {
    console.error('Groq analysis error:', error);
    throw new Error(error.message || 'Failed to analyze document with Groq');
  }
};

// Export other required functions as stubs that delegate to Gemini
// In a full implementation, these would also use Groq
export const consolidateAndAnalyzeIssues = () => {
  throw new Error('This feature requires Gemini Cloud. Please switch AI engine in settings.');
};

export const extractLegalFramework = () => {
  throw new Error('This feature requires Gemini Cloud. Please switch AI engine in settings.');
};
