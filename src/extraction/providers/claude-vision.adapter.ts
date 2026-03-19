// LYL_DEP: @anthropic-ai/sdk@^0.20.0

import Anthropic from '@anthropic-ai/sdk';
import type {
  ExtractedSection,
  NormalizedResponse,
  SpecialContent,
  BoundingBox
} from '../extraction.schema';
import { imageToBase64 } from '../converter.service';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = 'claude-3-opus-20240229'; // Best for complex pharmaceutical content
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 30000; // FIXED: 30 seconds to match Google Document AI

/**
 * Initialize Anthropic client
 */
const getClient = (): Anthropic => {
  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY environment variable not set');
  }

  return new Anthropic({
    apiKey: CLAUDE_API_KEY
  });
};

/**
 * Generate pharmaceutical content extraction prompt
 */
const generateExtractionPrompt = (language: string): string => {
  return `You are a pharmaceutical document extraction specialist. Extract structured content from this Patient Information Leaflet (PIL) page.

CRITICAL REQUIREMENTS:
1. Preserve ALL pharmaceutical formatting:
   - Subscripts: H₂O, CO₂ (use Unicode subscript characters)
   - Superscripts: mg/m², 10³ (use Unicode superscript characters)
   - Greek letters: μg, β-blocker, α, γ (use actual Greek characters)
   - Chemical formulas: maintain exact notation

2. Identify section headers (typically bold, larger font, or numbered)

3. Extract content with structure:
   - Section name
   - Full text content
   - Tables (preserve row/column structure)
   - Lists (maintain numbering/bullets)

4. Language: ${language}

OUTPUT FORMAT (JSON):
{
  "sections": [
    {
      "sectionName": "Product Name",
      "content": "Full text content with preserved formatting...",
      "hasTable": false,
      "hasList": true,
      "specialContent": [
        {
          "type": "subscript|superscript|greek_letter|chemical_formula|table",
          "content": "H₂O",
          "context": "surrounding text for reference"
        }
      ]
    }
  ],
  "confidence": 0.95
}

Extract ALL sections from this page. Be thorough and precise.`;
};

/**
 * FIXED: Parse Claude Vision response with complete section structure
 * Ensures all sections have required fields: sectionName, content, pageReferences, confidence, boundingBoxes
 */
const parseClaudeResponse = (
  response: string,
  pageNumber: number
): { sections: ExtractedSection[]; confidence: number } => {
  try {
    const parsed = JSON.parse(response);

    const sections: ExtractedSection[] = parsed.sections.map((section: any) => {
      const specialContent: SpecialContent[] = (section.specialContent || []).map((sc: any) => ({
        type: sc.type,
        content: sc.content,
        position: { pageNumber },
        confidence: 0.90
      }));

      // FIXED: Ensure all required fields are present
      return {
        sectionName: section.sectionName || 'Untitled Section',
        content: section.content || '',
        pageReferences: [{ pageNumber }],
        confidence: parsed.confidence || 0.85,
        boundingBoxes: [], // Claude Vision doesn't provide bounding boxes, use empty array
        specialContent,
        metadata: {
          hasTable: section.hasTable || false,
          hasList: section.hasList || false,
          hasFormula: specialContent.some(sc => sc.type === 'chemical_formula'),
          language: 'unknown'
        }
      };
    });

    return {
      sections,
      confidence: parsed.confidence || 0.85
    };
  } catch (error) {
    throw new Error(`Failed to parse Claude response: ${error.message}`);
  }
};

/**
 * FIXED: Process single page with Claude Vision with timeout
 */
const processPageWithClaude = async (
  client: Anthropic,
  imagePath: string,
  pageNumber: number,
  language: string,
  timeoutMs: number
): Promise<{ sections: ExtractedSection[]; confidence: number }> => {
  const imageBase64 = await imageToBase64(imagePath);
  const prompt = generateExtractionPrompt(language);

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Page ${pageNumber} processing timeout`)), timeoutMs);
  });

  try {
    const responsePromise = client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageBase64
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    });

    const response = await Promise.race([responsePromise, timeoutPromise]);

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    return parseClaudeResponse(textContent.text, pageNumber);
  } catch (error) {
    throw new Error(`Claude Vision API call failed: ${error.message}`);
  }
};

/**
 * FIXED: Merge sections from multiple pages with complete structure preservation
 */
const mergeSections = (allSections: ExtractedSection[][]): ExtractedSection[] => {
  const merged: ExtractedSection[] = [];
  let currentSection: ExtractedSection | null = null;

  for (const pageSections of allSections) {
    for (const section of pageSections) {
      // Check if this continues the previous section
      if (currentSection && section.sectionName === currentSection.sectionName) {
        // Merge content
        currentSection.content += '\n' + section.content;
        currentSection.pageReferences.push(...section.pageReferences);
        currentSection.boundingBoxes.push(...section.boundingBoxes);
        currentSection.specialContent = [
          ...(currentSection.specialContent || []),
          ...(section.specialContent || [])
        ];
        currentSection.confidence = (currentSection.confidence + section.confidence) / 2;
      } else {
        // New section
        if (currentSection) {
          merged.push(currentSection);
        }
        currentSection = { ...section };
      }
    }
  }

  if (currentSection) {
    merged.push(currentSection);
  }

  return merged;
};

/**
 * FIXED: Extract document with Claude Vision using parallel processing
 * Processes pages in parallel to meet <30s requirement for 10-20 page documents
 */
export const extractWithClaudeVision = async (
  imagePaths: string[],
  language: string
): Promise<NormalizedResponse> => {
  const startTime = Date.now();
  const client = getClient();

  // FIXED: Calculate per-page timeout to stay within global 30s limit
  const perPageTimeout = Math.floor(TIMEOUT_MS / Math.max(imagePaths.length, 1));

  try {
    // FIXED: Process pages in parallel with individual timeouts
    const processingPromises = imagePaths.map((imagePath, i) => {
      const pageNumber = i + 1;
      return processPageWithClaude(client, imagePath, pageNumber, language, perPageTimeout);
    });

    // FIXED: Global timeout for entire extraction (30 seconds)
    const globalTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Claude Vision extraction timeout exceeded 30 seconds')), TIMEOUT_MS);
    });

    const results = await Promise.race([
      Promise.all(processingPromises),
      globalTimeoutPromise
    ]);

    const allSections = results.map(r => r.sections);
    const confidences = results.map(r => r.confidence);

    // Merge sections across pages
    const sections = mergeSections(allSections);

    // Calculate metrics
    const processingTimeMs = Date.now() - startTime;
    const totalPages = imagePaths.length;
    
    // Cost estimation: ~$0.01 per image (Claude Vision pricing)
    const costUsd = totalPages * 0.01;

    const averageConfidence = confidences.length > 0
      ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length
      : 0;

    return {
      sections,
      pageImages: imagePaths,
      processingTimeMs,
      costUsd,
      averageConfidence,
      metadata: {
        totalPages,
        language
      }
    };
  } catch (error) {
    throw new Error(`Claude Vision extraction failed: ${error.message}`);
  }
};

/**
 * Batch process multiple documents
 */
export const batchExtractWithClaudeVision = async (
  documents: Array<{ imagePaths: string[]; language: string }>
): Promise<NormalizedResponse[]> => {
  const results: NormalizedResponse[] = [];

  for (const doc of documents) {
    const result = await extractWithClaudeVision(doc.imagePaths, doc.language);
    results.push(result);
  }

  return results;
};

/**
 * Validate extraction quality
 */
export const validateExtractionQuality = (result: NormalizedResponse): {
  valid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  if (result.averageConfidence < 0.80) {
    issues.push(`Low confidence score: ${result.averageConfidence.toFixed(2)}`);
  }

  if (result.sections.length === 0) {
    issues.push('No sections extracted');
  }

  const sectionsWithLowConfidence = result.sections.filter(s => s.confidence < 0.70);
  if (sectionsWithLowConfidence.length > 0) {
    issues.push(`${sectionsWithLowConfidence.length} sections with confidence < 0.70`);
  }

  const sectionsWithoutContent = result.sections.filter(s => !s.content || s.content.trim().length === 0);
  if (sectionsWithoutContent.length > 0) {
    issues.push(`${sectionsWithoutContent.length} sections with no content`);
  }

  return {
    valid: issues.length === 0,
    issues
  };
};