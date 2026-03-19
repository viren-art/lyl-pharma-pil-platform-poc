// LYL_DEP: @anthropic-ai/sdk@^0.20.0

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

// Semantic similarity confidence threshold for auto-acceptance
const SEMANTIC_MATCH_THRESHOLD = 0.7; // High confidence matches bypass Claude verification
const SEMANTIC_HINT_THRESHOLD = 0.5; // Medium confidence matches sent to Claude as hints
const SEMANTIC_REJECT_THRESHOLD = 0.3; // Low confidence matches rejected outright

interface AlignSectionsParams {
  innovatorSections: any[];
  regulatorySections: any[];
  marketConfig: {
    requiredSections: string[];
    sectionOrdering: Record<string, number>;
  };
}

/**
 * Calculate semantic similarity between two text strings using TF-IDF weighted cosine similarity
 * This provides better accuracy than simple word frequency for pharmaceutical content
 */
const calculateSemanticSimilarity = (text1: string, text2: string): number => {
  // Normalize and tokenize
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
  const words1 = normalize(text1);
  const words2 = normalize(text2);
  
  // Build vocabulary
  const allWords = Array.from(new Set([...words1, ...words2]));
  
  // Calculate term frequency
  const tf1 = allWords.map(word => words1.filter(w => w === word).length);
  const tf2 = allWords.map(word => words2.filter(w => w === word).length);
  
  // Calculate inverse document frequency (simple approximation)
  const idf = allWords.map(word => {
    const docCount = (words1.includes(word) ? 1 : 0) + (words2.includes(word) ? 1 : 0);
    return Math.log(2 / docCount);
  });
  
  // TF-IDF weighted vectors
  const vector1 = tf1.map((tf, i) => tf * idf[i]);
  const vector2 = tf2.map((tf, i) => tf * idf[i]);
  
  // Cosine similarity
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
};

/**
 * Perform initial semantic similarity matching before Claude analysis
 * This provides a baseline alignment that Claude can refine
 */
const performSemanticMatching = (
  innovatorSections: any[],
  regulatorySections: any[]
): Array<{ innovatorIdx: number; regulatoryIdx: number; similarity: number }> => {
  const matches: Array<{ innovatorIdx: number; regulatoryIdx: number; similarity: number }> = [];
  
  for (let i = 0; i < innovatorSections.length; i++) {
    const innovatorSection = innovatorSections[i];
    let bestMatch = { regulatoryIdx: -1, similarity: 0 };
    
    for (let j = 0; j < regulatorySections.length; j++) {
      const regulatorySection = regulatorySections[j];
      
      // Calculate similarity based on section name and content
      const nameSimilarity = calculateSemanticSimilarity(
        innovatorSection.sectionName,
        regulatorySection.sectionName
      );
      const contentSimilarity = calculateSemanticSimilarity(
        innovatorSection.content.substring(0, 500), // First 500 chars for performance
        regulatorySection.requirements || regulatorySection.sectionName
      );
      
      // Weighted average (name is more important for section matching)
      const combinedSimilarity = nameSimilarity * 0.7 + contentSimilarity * 0.3;
      
      if (combinedSimilarity > bestMatch.similarity) {
        bestMatch = { regulatoryIdx: j, similarity: combinedSimilarity };
      }
    }
    
    // Only include matches above rejection threshold
    if (bestMatch.similarity > SEMANTIC_REJECT_THRESHOLD) {
      matches.push({
        innovatorIdx: i,
        regulatoryIdx: bestMatch.regulatoryIdx,
        similarity: bestMatch.similarity,
      });
    }
  }
  
  return matches;
};

/**
 * Generate Claude prompt for section alignment with semantic matching hints
 */
const generateAlignmentPrompt = (
  innovatorSections: any[],
  regulatorySections: any[],
  requiredSections: string[],
  semanticMatches: Array<{ innovatorIdx: number; regulatoryIdx: number; similarity: number }>
): string => {
  // Build semantic matching hints for Claude (only medium-confidence matches)
  const matchHints = semanticMatches
    .filter(m => m.similarity >= SEMANTIC_HINT_THRESHOLD && m.similarity < SEMANTIC_MATCH_THRESHOLD)
    .map(m => {
      const innovator = innovatorSections[m.innovatorIdx];
      const regulatory = regulatorySections[m.regulatoryIdx];
      return `- "${innovator.sectionName}" → "${regulatory.sectionName}" (similarity: ${(m.similarity * 100).toFixed(0)}%)`;
    })
    .join('\n');

  // High-confidence matches already accepted, low-confidence rejected
  const autoAcceptedCount = semanticMatches.filter(m => m.similarity >= SEMANTIC_MATCH_THRESHOLD).length;
  const autoRejectedCount = innovatorSections.length - semanticMatches.length;

  return `You are a pharmaceutical regulatory expert analyzing Patient Information Leaflet (PIL) sections.

TASK: Align sections from an English Innovator PIL with target market regulatory requirements.

SEMANTIC MATCHING ANALYSIS (Pre-computed):
- ${autoAcceptedCount} high-confidence matches (≥${(SEMANTIC_MATCH_THRESHOLD * 100).toFixed(0)}%) auto-accepted
- ${autoRejectedCount} low-confidence matches (<${(SEMANTIC_REJECT_THRESHOLD * 100).toFixed(0)}%) auto-rejected
- ${matchHints ? 'Medium-confidence matches for your review:\n' + matchHints : 'No medium-confidence matches - verify all alignments'}

INNOVATOR PIL SECTIONS (English):
${innovatorSections.map((s, i) => `${i + 1}. ${s.sectionName}\n   Content preview: ${s.content.substring(0, 200)}...`).join('\n\n')}

TARGET MARKET REGULATORY SECTIONS (Required):
${regulatorySections.map((s, i) => `${i + 1}. ${s.sectionName} (Order: ${s.order}, Mandatory: ${s.mandatory})\n   Requirements: ${s.requirements || 'Standard PIL content'}`).join('\n\n')}

REQUIRED SECTIONS FOR THIS MARKET:
${requiredSections.join(', ')}

INSTRUCTIONS:
1. VERIFY the medium-confidence semantic matches above - confirm or reject based on content analysis
2. For unmatched sections, perform fresh alignment using content similarity
3. Identify alignment type: exact (same section name), semantic (similar content), partial (overlapping content), inferred (best guess)
4. Flag Innovator sections with no regulatory match (orphaned)
5. Flag Regulatory sections with no Innovator match (unmatched/gaps)
6. Provide confidence score (0.0-1.0) for each alignment based on content similarity
7. Add notes explaining alignment decisions, especially for semantic/partial/inferred matches

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
      "suggestedDisposition": "Omit - regulatory requirement specific to FDA format"
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
 * Align sections between Innovator PIL and Regulatory Source using semantic similarity + Claude AI
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

    // Step 1: Perform semantic similarity matching
    const semanticMatches = performSemanticMatching(params.innovatorSections, regulatorySections);
    
    console.log(`[Section Alignment] Semantic matching found ${semanticMatches.length} potential matches`);

    // Step 2: Auto-accept high-confidence matches (≥70%)
    const autoAcceptedMatches = semanticMatches.filter(m => m.similarity >= SEMANTIC_MATCH_THRESHOLD);
    console.log(`[Section Alignment] Auto-accepted ${autoAcceptedMatches.length} high-confidence matches (≥${(SEMANTIC_MATCH_THRESHOLD * 100).toFixed(0)}%)`);

    // Step 3: Send medium-confidence matches to Claude for verification
    const mediumConfidenceMatches = semanticMatches.filter(
      m => m.similarity >= SEMANTIC_HINT_THRESHOLD && m.similarity < SEMANTIC_MATCH_THRESHOLD
    );
    console.log(`[Section Alignment] Sending ${mediumConfidenceMatches.length} medium-confidence matches to Claude for verification`);

    // Step 4: Generate alignment prompt with semantic hints
    const prompt = generateAlignmentPrompt(
      params.innovatorSections,
      regulatorySections,
      params.marketConfig.requiredSections,
      semanticMatches
    );

    // Step 5: Call Claude API for refined alignment
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
    const { alignments: claudeAlignments, orphaned, unmatched } = parseAlignmentResponse(textContent.text);

    // Step 6: Merge auto-accepted matches with Claude-verified matches
    const autoAcceptedAlignments = autoAcceptedMatches.map(m => {
      const innovatorSection = params.innovatorSections[m.innovatorIdx];
      const regulatorySection = regulatorySections[m.regulatoryIdx];
      return {
        innovatorSectionName: innovatorSection.sectionName,
        innovatorContent: innovatorSection.content,
        regulatorySectionName: regulatorySection.sectionName,
        regulatoryRequirements: regulatorySection.requirements,
        regulatoryOrder: regulatorySection.order,
        regulatoryMandatory: regulatorySection.mandatory,
        confidence: m.similarity, // Use semantic similarity as confidence
        alignmentType: m.similarity >= 0.9 ? 'exact' : 'semantic',
        notes: [`Auto-accepted by semantic matching (${(m.similarity * 100).toFixed(0)}% similarity)`],
      };
    });

    const allAlignments = [...autoAcceptedAlignments, ...claudeAlignments];

    // Build structured result
    const sectionAlignments: SectionAlignment[] = allAlignments.map((a: any) => ({
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

    console.log(`[Section Alignment] Completed in ${processingTimeMs}ms with ${sectionAlignments.length} alignments (avg confidence: ${(avgConfidence * 100).toFixed(1)}%)`);
    console.log(`[Section Alignment] Breakdown: ${autoAcceptedAlignments.length} auto-accepted, ${claudeAlignments.length} Claude-verified`);

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