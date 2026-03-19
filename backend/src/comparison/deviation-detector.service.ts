// LYL_DEP: @anthropic-ai/sdk@^0.20.0
// LYL_DEP: diff@^5.1.0

import Anthropic from '@anthropic-ai/sdk';
import { diffWords, diffLines } from 'diff';
import type { ExtractionResult, ExtractedSection } from '../extraction/extraction.schema';
import { getMarketById } from '../services/market.service.js';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = 'claude-3-opus-20240229';
const MAX_TOKENS = 4096;
const COMPARISON_TIMEOUT_MS = 60000; // 60 seconds total timeout
const SECTION_TIMEOUT_MS = 5000; // 5 seconds per section (allows ~12 sections in 60s with buffer)
const MAX_CONCURRENT_SECTIONS = 3; // Process 3 sections in parallel for speed

export interface Deviation {
  sectionName: string;
  severity: 'Critical' | 'Major' | 'Minor';
  description: string;
  pageReference: number;
  approvedText: string;
  awText: string;
  changeType: 'Added' | 'Modified' | 'Deleted' | 'Missing';
  confidenceScore?: number; // 0.0-1.0 for accuracy tracking
}

export interface DeviationReport {
  deviations: Deviation[];
  summary: {
    totalDeviations: number;
    criticalCount: number;
    majorCount: number;
    minorCount: number;
  };
  comparisonDate: string;
  processingTimeMs: number;
  accuracyMetrics?: {
    averageConfidence: number;
    lowConfidenceCount: number; // deviations with confidence < 0.8
  };
}

export interface DetectDeviationsRequest {
  awDraftExtraction: ExtractionResult;
  approvedPilExtraction: ExtractionResult;
  marketId: number;
}

/**
 * Initialize Anthropic client
 */
const getClient = (): Anthropic => {
  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY not configured');
  }
  return new Anthropic({ apiKey: CLAUDE_API_KEY });
};

/**
 * Generate deviation detection prompt with pharmaceutical focus
 */
const generateDeviationPrompt = (
  approvedSection: ExtractedSection,
  awSection: ExtractedSection | null
): string => {
  return `You are a pharmaceutical regulatory expert reviewing an Artwork (AW) draft against an approved Patient Information Leaflet (PIL).

APPROVED PIL SECTION:
Section: ${approvedSection.sectionName}
Content: ${approvedSection.content}

AW DRAFT SECTION:
${awSection ? `Section: ${awSection.sectionName}\nContent: ${awSection.content}` : 'SECTION MISSING IN AW DRAFT'}

TASK:
Compare the AW draft section against the approved PIL section and identify ALL deviations with PHARMACEUTICAL PRECISION.

CRITICAL PHARMACEUTICAL CONTENT TO VERIFY:
- Dosages (exact numbers, units: mg, ml, g, mcg, μg, IU, tablets, capsules)
- Dosing frequency (times per day, intervals)
- Contraindications (hypersensitivity, conditions, patient populations)
- Warnings (black box warnings, serious adverse reactions, life-threatening risks)
- Precautions (monitoring requirements, special populations)
- Adverse reactions (frequency, severity)
- Drug interactions (specific drugs, classes)
- Special populations (pregnancy, lactation, pediatric, geriatric, renal/hepatic impairment)
- Chemical formulas (subscripts, superscripts, Greek letters)
- Storage conditions (temperature, humidity)

DEVIATION TYPES:
1. Content deviations: Text changes, additions, deletions
2. Pharmaceutical content deviations: Dosages, contraindications, warnings, chemical formulas
3. Missing content: Required information from approved PIL not in AW draft
4. Formatting deviations: Font changes, spacing, alignment (if detectable from text)

SEVERITY CLASSIFICATION:
- CRITICAL: Content errors, dosage mismatches, missing warnings/contraindications, incorrect chemical formulas, missing mandatory sections, changes affecting patient safety
- MAJOR: Regulatory format violations, missing non-critical sections, significant text changes, formatting issues affecting readability
- MINOR: Typographical errors, formatting inconsistencies, minor wording changes that don't affect meaning

OUTPUT FORMAT (JSON):
{
  "deviations": [
    {
      "severity": "Critical|Major|Minor",
      "description": "Detailed description of the deviation with exact pharmaceutical content affected",
      "changeType": "Added|Modified|Deleted|Missing",
      "approvedText": "Exact text from approved PIL (if applicable)",
      "awText": "Exact text from AW draft (if applicable)",
      "confidenceScore": 0.95
    }
  ]
}

CONFIDENCE SCORE GUIDELINES:
- 1.0: Exact match or clear deviation (e.g., "500mg" vs "400mg")
- 0.9-0.99: High confidence (clear semantic difference)
- 0.8-0.89: Medium confidence (possible interpretation difference)
- 0.7-0.79: Low confidence (ambiguous or formatting-only)
- <0.7: Very low confidence (uncertain)

If no deviations found, return: {"deviations": []}

Analyze carefully with pharmaceutical precision and return ONLY the JSON object.`;
};

/**
 * Detect deviations using Claude API with timeout
 */
const detectSectionDeviations = async (
  approvedSection: ExtractedSection,
  awSection: ExtractedSection | null
): Promise<Deviation[]> => {
  const client = getClient();
  const prompt = generateDeviationPrompt(approvedSection, awSection);

  try {
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Section comparison timeout')), SECTION_TIMEOUT_MS);
    });

    // Race between API call and timeout
    const response = await Promise.race([
      client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
      timeoutPromise
    ]);

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const parsed = JSON.parse(textContent.text);
    const deviations: Deviation[] = parsed.deviations.map((d: any) => ({
      sectionName: approvedSection.sectionName,
      severity: d.severity,
      description: d.description,
      pageReference: approvedSection.pageReferences[0] || 0,
      approvedText: d.approvedText || approvedSection.content.substring(0, 200),
      awText: d.awText || (awSection?.content.substring(0, 200) || ''),
      changeType: d.changeType,
      confidenceScore: d.confidenceScore || 0.85 // Default if not provided
    }));

    return deviations;
  } catch (error) {
    console.error('Claude API error or timeout:', error);
    // Fallback to enhanced pharmaceutical-aware diff
    return enhancedPharmaceuticalDiff(approvedSection, awSection);
  }
};

/**
 * Enhanced pharmaceutical-aware text diff (fallback)
 */
const enhancedPharmaceuticalDiff = (
  approvedSection: ExtractedSection,
  awSection: ExtractedSection | null
): Deviation[] => {
  if (!awSection) {
    return [
      {
        sectionName: approvedSection.sectionName,
        severity: 'Critical',
        description: `Section "${approvedSection.sectionName}" is missing in AW draft`,
        pageReference: approvedSection.pageReferences[0] || 0,
        approvedText: approvedSection.content.substring(0, 200),
        awText: '',
        changeType: 'Missing',
        confidenceScore: 1.0 // High confidence for missing sections
      }
    ];
  }

  const deviations: Deviation[] = [];

  // Pharmaceutical content patterns for high-accuracy detection
  const pharmaceuticalPatterns = {
    dosage: /\d+\s*(mg|ml|g|mcg|μg|iu|units?|tablets?|capsules?)/gi,
    frequency: /\d+\s*times?\s*(daily|per\s+day|a\s+day|every\s+\d+\s+hours?)/gi,
    contraindication: /contraindication|do\s+not\s+use|should\s+not\s+be\s+used|hypersensitivity/gi,
    warning: /warning|caution|serious\s+adverse|black\s+box|life-threatening/gi,
    chemicalFormula: /[A-Z][a-z]?[₀-₉⁰-⁹]+|[A-Z][a-z]?[²³⁴⁵⁶⁷⁸⁹]/g
  };

  // Extract pharmaceutical content from both sections
  const approvedPharmContent: Record<string, string[]> = {};
  const awPharmContent: Record<string, string[]> = {};

  Object.entries(pharmaceuticalPatterns).forEach(([key, pattern]) => {
    approvedPharmContent[key] = approvedSection.content.match(pattern) || [];
    awPharmContent[key] = awSection.content.match(pattern) || [];
  });

  // Check for pharmaceutical content mismatches
  Object.entries(approvedPharmContent).forEach(([category, approvedMatches]) => {
    const awMatches = awPharmContent[category];

    // Check for missing pharmaceutical content
    approvedMatches.forEach((match) => {
      if (!awMatches.includes(match)) {
        deviations.push({
          sectionName: approvedSection.sectionName,
          severity: category === 'dosage' || category === 'contraindication' || category === 'warning' ? 'Critical' : 'Major',
          description: `Pharmaceutical content mismatch in ${category}: "${match}" found in approved PIL but not in AW draft`,
          pageReference: approvedSection.pageReferences[0] || 0,
          approvedText: approvedSection.content.substring(0, 200),
          awText: awSection.content.substring(0, 200),
          changeType: 'Modified',
          confidenceScore: 0.95 // High confidence for exact pharmaceutical content matches
        });
      }
    });

    // Check for added pharmaceutical content
    awMatches.forEach((match) => {
      if (!approvedMatches.includes(match)) {
        deviations.push({
          sectionName: approvedSection.sectionName,
          severity: category === 'dosage' || category === 'contraindication' || category === 'warning' ? 'Critical' : 'Major',
          description: `Pharmaceutical content mismatch in ${category}: "${match}" found in AW draft but not in approved PIL`,
          pageReference: approvedSection.pageReferences[0] || 0,
          approvedText: approvedSection.content.substring(0, 200),
          awText: awSection.content.substring(0, 200),
          changeType: 'Added',
          confidenceScore: 0.95
        });
      }
    });
  });

  // If no pharmaceutical content mismatches, check for general text changes
  if (deviations.length === 0) {
    const diff = diffWords(approvedSection.content, awSection.content);
    let hasChanges = false;

    diff.forEach((part) => {
      if (part.added || part.removed) {
        hasChanges = true;
      }
    });

    if (hasChanges) {
      // Classify severity based on content
      const isCritical =
        approvedSection.content.toLowerCase().includes('dosage') ||
        approvedSection.content.toLowerCase().includes('contraindication') ||
        approvedSection.content.toLowerCase().includes('warning') ||
        approvedSection.content.toLowerCase().includes('mg') ||
        approvedSection.content.toLowerCase().includes('ml');

      deviations.push({
        sectionName: approvedSection.sectionName,
        severity: isCritical ? 'Critical' : 'Major',
        description: `Text changes detected in section "${approvedSection.sectionName}"`,
        pageReference: approvedSection.pageReferences[0] || 0,
        approvedText: approvedSection.content.substring(0, 200),
        awText: awSection.content.substring(0, 200),
        changeType: 'Modified',
        confidenceScore: 0.75 // Lower confidence for general text changes
      });
    }
  }

  return deviations;
};

/**
 * Align sections between approved PIL and AW draft
 */
const alignSections = (
  approvedSections: ExtractedSection[],
  awSections: ExtractedSection[]
): Array<{ approved: ExtractedSection; aw: ExtractedSection | null }> => {
  const aligned: Array<{ approved: ExtractedSection; aw: ExtractedSection | null }> = [];

  approvedSections.forEach((approvedSection) => {
    // Try exact name match first
    let awSection = awSections.find((s) => s.sectionName === approvedSection.sectionName);

    // Try fuzzy match if exact match fails
    if (!awSection) {
      awSection = awSections.find((s) =>
        s.sectionName.toLowerCase().includes(approvedSection.sectionName.toLowerCase()) ||
        approvedSection.sectionName.toLowerCase().includes(s.sectionName.toLowerCase())
      );
    }

    aligned.push({ approved: approvedSection, aw: awSection || null });
  });

  return aligned;
};

/**
 * Detect pharmaceutical-critical content
 */
const detectCriticalContent = (text: string): boolean => {
  const criticalPatterns = [
    /\d+\s*(mg|ml|g|mcg|μg|iu|units?)/i, // Dosages
    /contraindication/i,
    /warning/i,
    /precaution/i,
    /adverse\s+reaction/i,
    /side\s+effect/i,
    /overdose/i,
    /interaction/i,
    /pregnancy/i,
    /lactation/i,
    /pediatric/i,
    /geriatric/i
  ];

  return criticalPatterns.some((pattern) => pattern.test(text));
};

/**
 * Check for missing mandatory sections based on market configuration
 */
const checkMandatorySections = (
  approvedSections: ExtractedSection[],
  awSections: ExtractedSection[],
  marketId: number
): Deviation[] => {
  const market = getMarketById(marketId);
  const requiredSections = market.requiredSections;
  const deviations: Deviation[] = [];

  // Get section names from AW draft (case-insensitive)
  const awSectionNames = new Set(
    awSections.map(s => s.sectionName.toLowerCase().trim())
  );

  // Check each required section
  requiredSections.forEach((requiredSection) => {
    const requiredLower = requiredSection.toLowerCase().trim();
    
    // Check if required section exists in AW draft (exact or fuzzy match)
    const exists = awSections.some(awSection => {
      const awLower = awSection.sectionName.toLowerCase().trim();
      return awLower === requiredLower || 
             awLower.includes(requiredLower) || 
             requiredLower.includes(awLower);
    });

    if (!exists) {
      // Find the section in approved PIL for reference
      const approvedSection = approvedSections.find(s => {
        const approvedLower = s.sectionName.toLowerCase().trim();
        return approvedLower === requiredLower || 
               approvedLower.includes(requiredLower) || 
               requiredLower.includes(approvedLower);
      });

      deviations.push({
        sectionName: requiredSection,
        severity: 'Critical',
        description: `Mandatory section "${requiredSection}" is missing in AW draft (required by ${market.regulatoryAuthority})`,
        pageReference: approvedSection?.pageReferences[0] || 0,
        approvedText: approvedSection?.content.substring(0, 200) || `Section required by ${market.regulatoryAuthority}`,
        awText: '',
        changeType: 'Missing',
        confidenceScore: 1.0
      });
    }
  });

  return deviations;
};

/**
 * Process sections in batches for parallel processing
 */
const processSectionsInBatches = async (
  alignedSections: Array<{ approved: ExtractedSection; aw: ExtractedSection | null }>,
  batchSize: number
): Promise<Deviation[]> => {
  const allDeviations: Deviation[] = [];
  
  for (let i = 0; i < alignedSections.length; i += batchSize) {
    const batch = alignedSections.slice(i, i + batchSize);
    const batchPromises = batch.map(({ approved, aw }) =>
      detectSectionDeviations(approved, aw)
    );
    
    const batchResults = await Promise.all(batchPromises);
    allDeviations.push(...batchResults.flat());
  }
  
  return allDeviations;
};

/**
 * Detect deviations between AW draft and approved PIL with performance monitoring
 */
export const detectDeviations = async (
  request: DetectDeviationsRequest
): Promise<DeviationReport> => {
  const startTime = Date.now();
  const { awDraftExtraction, approvedPilExtraction, marketId } = request;

  // Enforce overall timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Comparison timeout exceeded 60 seconds')), COMPARISON_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      (async () => {
        // Align sections
        const alignedSections = alignSections(
          approvedPilExtraction.sections,
          awDraftExtraction.sections
        );

        // Detect deviations for each section (parallel processing in batches for speed)
        const allDeviations = await processSectionsInBatches(alignedSections, MAX_CONCURRENT_SECTIONS);

        // Check for extra sections in AW draft (not in approved PIL)
        const approvedSectionNames = new Set(approvedPilExtraction.sections.map((s) => s.sectionName));
        awDraftExtraction.sections.forEach((awSection) => {
          if (!approvedSectionNames.has(awSection.sectionName)) {
            allDeviations.push({
              sectionName: awSection.sectionName,
              severity: 'Major',
              description: `Section "${awSection.sectionName}" exists in AW draft but not in approved PIL`,
              pageReference: awSection.pageReferences[0] || 0,
              approvedText: '',
              awText: awSection.content.substring(0, 200),
              changeType: 'Added',
              confidenceScore: 1.0
            });
          }
        });

        // Check for missing mandatory sections based on market configuration
        const mandatoryDeviations = checkMandatorySections(
          approvedPilExtraction.sections,
          awDraftExtraction.sections,
          marketId
        );
        allDeviations.push(...mandatoryDeviations);

        // Upgrade severity for pharmaceutical-critical content
        allDeviations.forEach((deviation) => {
          if (
            deviation.severity === 'Major' &&
            (detectCriticalContent(deviation.approvedText) || detectCriticalContent(deviation.awText))
          ) {
            deviation.severity = 'Critical';
          }
        });

        // Calculate summary
        const summary = {
          totalDeviations: allDeviations.length,
          criticalCount: allDeviations.filter((d) => d.severity === 'Critical').length,
          majorCount: allDeviations.filter((d) => d.severity === 'Major').length,
          minorCount: allDeviations.filter((d) => d.severity === 'Minor').length
        };

        // Calculate accuracy metrics
        const confidenceScores = allDeviations
          .map((d) => d.confidenceScore || 0.85)
          .filter((score) => score > 0);
        const averageConfidence = confidenceScores.length > 0
          ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
          : 0.85;
        const lowConfidenceCount = allDeviations.filter((d) => (d.confidenceScore || 0.85) < 0.8).length;

        const processingTimeMs = Date.now() - startTime;

        return {
          deviations: allDeviations,
          summary,
          comparisonDate: new Date().toISOString(),
          processingTimeMs,
          accuracyMetrics: {
            averageConfidence,
            lowConfidenceCount
          }
        };
      })(),
      timeoutPromise
    ]);

    return result;
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    if (error instanceof Error && error.message.includes('timeout')) {
      console.error(`Comparison timeout after ${processingTimeMs}ms`);
      throw new Error(`Comparison exceeded 60 second timeout (${processingTimeMs}ms)`);
    }
    throw error;
  }
};

/**
 * Batch detect deviations for multiple document pairs
 */
export const batchDetectDeviations = async (
  requests: DetectDeviationsRequest[]
): Promise<DeviationReport[]> => {
  const reports: DeviationReport[] = [];

  for (const request of requests) {
    const report = await detectDeviations(request);
    reports.push(report);
  }

  return reports;
};