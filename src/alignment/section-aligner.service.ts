// LYL_DEP: @anthropic-ai/sdk@^0.20.0
// LYL_DEP: sentence-transformers@^2.2.0

import Anthropic from '@anthropic-ai/sdk';
import type {
  SectionAlignmentResult,
  SectionAlignment,
  OrphanedSection,
  UnmatchedSection,
} from '../workflows/draft-creation/new-submission/workflow.schema';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = 'claude-3-opus-20240229';
const MAX_TOKENS = 4096;

interface AlignSectionsParams {
  innovatorSections: any[];
  regulatorySections: any[];
  marketConfig: {
    requiredSections: string[];
    sectionOrdering: Record<string, number>;
  };
}

/**
 * Calculate semantic similarity between two text strings
 * Uses simple cosine similarity on word vectors as lightweight alternative to sentence-transformers
 */
const calculateSemanticSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const allWords = Array.from(new Set([...words1, ...words2]));
  
  const vector1 = allWords.map(word => words1.filter(w => w === word).length);
  const vector2 = allWords.map(word => words2.filter(w => w === word).length);
  
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Generate Claude prompt for section alignment
 */
const generateAlignmentPrompt = (
  innovatorSections: any[],
  regulatorySections: any[],
  requiredSections: string[]
): string => {
  return `You are a pharmaceutical regulatory expert analyzing Patient Information Leaflet (PIL) sections.

TASK: Align sections from an English Innovator PIL with target market regulatory requirements.

INNOVATOR PIL SECTIONS (English):
${innovatorSections.map((s, i) => `${i + 1}. ${s.sectionName}\n   Content preview: ${s.content.substring(0, 200)}...`).join('\n\n')}

TARGET MARKET REGULATORY SECTIONS (Required):
${regulatorySections.map((s, i) => `${i + 1}. ${s.sectionName} (Order: ${s.order}, Mandatory: ${s.mandatory})\n   Requirements: ${s.requirements || 'Standard PIL content'}`).join('\n\n')}

REQUIRED SECTIONS FOR THIS MARKET:
${requiredSections.join(', ')}

INSTRUCTIONS:
1. Match each Innovator PIL section to the most appropriate Regulatory section
2. Identify alignment type: exact (same section name), semantic (similar content), partial (overlapping content), inferred (best guess)
3. Flag Innovator sections with no regulatory match (orphaned)
4. Flag Regulatory sections with no Innovator match (unmatched/gaps)
5. Provide confidence score (0.0-1.0) for each alignment
6. Add notes explaining alignment decisions, especially for semantic/partial/inferred matches

OUTPUT FORMAT (JSON):
{
  "alignments": [
    {
      "innovatorSectionName": "Product Name and Strength",
      "innovatorContent": "...",
      "regulatorySectionName": "Product Name",
      "regulatoryRequirements": "...",
      "regulatoryOrder": 1,
      "regulatoryMandatory": true,
      "confidence": 0.95,
      "alignmentType": "exact",
      "notes": ["Direct match - same section purpose"]
    }
  ],
  "orphanedInnovatorSections": [
    {
      "sectionName": "Patient Counseling Information",
      "content": "...",
      "reason": "Not required in target market regulatory format",
      "suggestedDisposition": "Omit - US-specific section"
    }
  ],
  "unmatchedRegulatorySections": [
    {
      "sectionName": "Local Emergency Contacts",
      "requirements": "Must include country-specific poison control center",
      "order": 15,
      "mandatory": true,
      "reason": "Requires local content not in Innovator PIL"
    }
  ]
}`;
};

/**
 * Parse Claude alignment response
 */
const parseAlignmentResponse = (response: string): {
  alignments: any[];
  orphaned: any[];
  unmatched: any[];
} => {
  try {
    const parsed = JSON.parse(response);
    return {
      alignments: parsed.alignments || [],
      orphaned: parsed.orphanedInnovatorSections || [],
      unmatched: parsed.unmatchedRegulatorySections || [],
    };
  } catch (error) {
    throw new Error(`Failed to parse alignment response: ${error}`);
  }
};

/**
 * Align sections between Innovator PIL and Regulatory Source
 */
export const alignSections = async (
  params: AlignSectionsParams
): Promise<SectionAlignmentResult> => {
  const startTime = Date.now();
  const client = new Anthropic({ apiKey: CLAUDE_API_KEY });

  try {
    // Prepare regulatory sections with metadata
    const regulatorySections = params.marketConfig.requiredSections.map((sectionName) => ({
      sectionName,
      order: params.marketConfig.sectionOrdering[sectionName] || 999,
      mandatory: true,
      requirements: `Standard PIL content for ${sectionName}`,
    }));

    // Generate alignment prompt
    const prompt = generateAlignmentPrompt(
      params.innovatorSections,
      regulatorySections,
      params.marketConfig.requiredSections
    );

    // Call Claude API
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse response
    const { alignments, orphaned, unmatched } = parseAlignmentResponse(textContent.text);

    // Build structured result
    const sectionAlignments: SectionAlignment[] = alignments.map((a: any) => ({
      innovatorSection: {
        name: a.innovatorSectionName,
        content: a.innovatorContent || '',
        pageReferences: [], // Would be populated from extraction result
      },
      regulatorySection: {
        name: a.regulatorySectionName,
        requirements: a.regulatoryRequirements || '',
        order: a.regulatoryOrder || 999,
        mandatory: a.regulatoryMandatory !== false,
      },
      confidence: a.confidence || 0.5,
      alignmentType: a.alignmentType || 'inferred',
      notes: a.notes || [],
    }));

    const orphanedSections: OrphanedSection[] = orphaned.map((o: any) => ({
      sectionName: o.sectionName,
      content: o.content || '',
      pageReferences: [],
      reason: o.reason || 'No matching regulatory section',
      suggestedDisposition: o.suggestedDisposition || 'Review manually',
    }));

    const unmatchedSections: UnmatchedSection[] = unmatched.map((u: any) => ({
      sectionName: u.sectionName,
      requirements: u.requirements || '',
      order: u.order || 999,
      mandatory: u.mandatory !== false,
      reason: u.reason || 'Not present in Innovator PIL',
    }));

    // Calculate overall confidence
    const avgConfidence =
      sectionAlignments.length > 0
        ? sectionAlignments.reduce((sum, a) => sum + a.confidence, 0) / sectionAlignments.length
        : 0;

    const processingTimeMs = Date.now() - startTime;

    return {
      alignments: sectionAlignments,
      orphanedInnovatorSections: orphanedSections,
      unmatchedRegulatorySections: unmatchedSections,
      confidence: avgConfidence,
      metadata: {
        totalInnovatorSections: params.innovatorSections.length,
        totalRegulatorySections: regulatorySections.length,
        matchedPairs: sectionAlignments.length,
        processingTimeMs,
      },
    };
  } catch (error: any) {
    throw new Error(`Section alignment failed: ${error.message}`);
  }
};

/**
 * Validate alignment quality
 */
export const validateAlignmentQuality = (result: SectionAlignmentResult): {
  valid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  // Check if all mandatory regulatory sections are matched
  const mandatoryUnmatched = result.unmatchedRegulatorySections.filter((s) => s.mandatory);
  if (mandatoryUnmatched.length > 0) {
    issues.push(
      `${mandatoryUnmatched.length} mandatory regulatory sections have no Innovator content: ${mandatoryUnmatched.map((s) => s.sectionName).join(', ')}`
    );
  }

  // Check overall confidence
  if (result.confidence < 0.7) {
    issues.push(`Low overall alignment confidence: ${(result.confidence * 100).toFixed(1)}%`);
  }

  // Check for low-confidence alignments
  const lowConfidenceAlignments = result.alignments.filter((a) => a.confidence < 0.6);
  if (lowConfidenceAlignments.length > 0) {
    issues.push(
      `${lowConfidenceAlignments.length} alignments have low confidence (<60%): ${lowConfidenceAlignments.map((a) => a.regulatorySection.name).join(', ')}`
    );
  }

  return {
    valid: issues.length === 0,
    issues,
  };
};