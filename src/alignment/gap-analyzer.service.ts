// LYL_DEP: @anthropic-ai/sdk@^0.20.0

import Anthropic from '@anthropic-ai/sdk';
import type {
  SectionAlignmentResult,
  GapAnalysisResult,
  ContentGap,
  TranslationRequirement,
  SpecialAttentionSection,
} from '../workflows/draft-creation/new-submission/workflow.schema';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = 'claude-3-opus-20240229';
const MAX_TOKENS = 4096;

interface AnalyzeGapsParams {
  alignmentResult: SectionAlignmentResult;
  marketConfig: {
    requiredSections: string[];
    language: string;
    regulatoryAuthority: string;
  };
}

/**
 * Generate Claude prompt for gap analysis
 */
const generateGapAnalysisPrompt = (
  alignmentResult: SectionAlignmentResult,
  marketConfig: { requiredSections: string[]; language: string; regulatoryAuthority: string }
): string => {
  return `You are a pharmaceutical regulatory expert analyzing content gaps for PIL draft creation.

TARGET MARKET: ${marketConfig.regulatoryAuthority}
TARGET LANGUAGE: ${marketConfig.language}

SECTION ALIGNMENTS:
${alignmentResult.alignments
  .map(
    (a, i) =>
      `${i + 1}. ${a.regulatorySection.name} (Mandatory: ${a.regulatorySection.mandatory})
   - Innovator content: ${a.innovatorSection.content.substring(0, 150)}...
   - Alignment confidence: ${(a.confidence * 100).toFixed(1)}%
   - Type: ${a.alignmentType}`
  )
  .join('\n\n')}

UNMATCHED REGULATORY SECTIONS (Gaps):
${alignmentResult.unmatchedRegulatorySections
  .map(
    (u, i) =>
      `${i + 1}. ${u.sectionName} (Mandatory: ${u.mandatory})
   - Requirements: ${u.requirements}
   - Reason: ${u.reason}`
  )
  .join('\n\n')}

ORPHANED INNOVATOR SECTIONS:
${alignmentResult.orphanedInnovatorSections
  .map(
    (o, i) =>
      `${i + 1}. ${o.sectionName}
   - Reason: ${o.reason}
   - Suggested: ${o.suggestedDisposition}`
  )
  .join('\n\n')}

TASK: Perform comprehensive gap analysis for PIL draft creation.

IDENTIFY:
1. CONTENT GAPS: Missing sections, insufficient detail, local requirements
   - Classify severity: critical (regulatory non-compliance), major (significant omission), minor (enhancement)
   - Provide specific regulatory requirement and suggested action

2. TRANSLATION REQUIREMENTS: For each aligned section
   - Assess complexity: simple (direct translation), moderate (terminology research), complex (cultural adaptation)
   - Estimate effort in hours
   - Flag pharmaceutical terminology challenges

3. SPECIAL ATTENTION SECTIONS: Flag sections requiring extra care
   - Dosage tables (unit conversions, formatting)
   - Chemical formulas (subscripts, superscripts, Greek letters)
   - Local emergency contacts (country-specific)
   - Measurement unit conversions (metric/imperial)
   - Regulatory body references (local authority names)
   - Complex formatting (multi-column tables, nested lists)

OUTPUT FORMAT (JSON):
{
  "gaps": [
    {
      "regulatorySectionName": "Local Emergency Contacts",
      "gapType": "missing_section",
      "severity": "critical",
      "description": "Section required by ${marketConfig.regulatoryAuthority} but not present in Innovator PIL",
      "regulatoryRequirement": "Must include country-specific poison control center and emergency hotline",
      "suggestedAction": "Add local emergency contact information from ${marketConfig.regulatoryAuthority} guidelines"
    }
  ],
  "translationRequirements": [
    {
      "sectionName": "Indications and Usage",
      "sourceLanguage": "en",
      "targetLanguage": "${marketConfig.language}",
      "complexity": "moderate",
      "notes": ["Medical terminology requires certified translator", "Verify local disease name conventions"],
      "estimatedEffort": "4-6 hours"
    }
  ],
  "specialAttentionSections": [
    {
      "sectionName": "Dosage and Administration",
      "attentionType": "dosage_table",
      "description": "Contains dosage table with weight-based calculations",
      "requirements": ["Convert imperial units (lbs) to metric (kg)", "Verify dosage calculations", "Preserve table formatting"],
      "examples": ["Adult: 10 mg/kg/day → verify conversion accuracy"]
    }
  ]
}`;
};

/**
 * Parse Claude gap analysis response
 */
const parseGapAnalysisResponse = (response: string): {
  gaps: any[];
  translationRequirements: any[];
  specialAttentionSections: any[];
} => {
  try {
    const parsed = JSON.parse(response);
    return {
      gaps: parsed.gaps || [],
      translationRequirements: parsed.translationRequirements || [],
      specialAttentionSections: parsed.specialAttentionSections || [],
    };
  } catch (error) {
    throw new Error(`Failed to parse gap analysis response: ${error}`);
  }
};

/**
 * Analyze content gaps for PIL draft creation
 */
export const analyzeGaps = async (params: AnalyzeGapsParams): Promise<GapAnalysisResult> => {
  const startTime = Date.now();
  const client = new Anthropic({ apiKey: CLAUDE_API_KEY });

  try {
    // Generate gap analysis prompt
    const prompt = generateGapAnalysisPrompt(params.alignmentResult, params.marketConfig);

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
    const { gaps, translationRequirements, specialAttentionSections } = parseGapAnalysisResponse(
      textContent.text
    );

    // Build structured result
    const contentGaps: ContentGap[] = gaps.map((g: any) => ({
      regulatorySectionName: g.regulatorySectionName,
      gapType: g.gapType || 'missing_content',
      severity: g.severity || 'major',
      description: g.description || '',
      regulatoryRequirement: g.regulatoryRequirement || '',
      suggestedAction: g.suggestedAction || '',
    }));

    const translations: TranslationRequirement[] = translationRequirements.map((t: any) => ({
      sectionName: t.sectionName,
      sourceLanguage: t.sourceLanguage || 'en',
      targetLanguage: t.targetLanguage || params.marketConfig.language,
      complexity: t.complexity || 'moderate',
      notes: t.notes || [],
      estimatedEffort: t.estimatedEffort || '2-4 hours',
    }));

    const specialAttention: SpecialAttentionSection[] = specialAttentionSections.map((s: any) => ({
      sectionName: s.sectionName,
      attentionType: s.attentionType || 'complex_formatting',
      description: s.description || '',
      requirements: s.requirements || [],
      examples: s.examples || [],
    }));

    const processingTimeMs = Date.now() - startTime;

    return {
      gaps: contentGaps,
      translationRequirements: translations,
      specialAttentionSections: specialAttention,
      metadata: {
        totalGaps: contentGaps.length,
        criticalGaps: contentGaps.filter((g) => g.severity === 'critical').length,
        processingTimeMs,
      },
    };
  } catch (error: any) {
    throw new Error(`Gap analysis failed: ${error.message}`);
  }
};

/**
 * Validate gap analysis completeness
 */
export const validateGapAnalysis = (result: GapAnalysisResult): {
  valid: boolean;
  warnings: string[];
} => {
  const warnings: string[] = [];

  // Check for critical gaps
  if (result.metadata.criticalGaps > 0) {
    warnings.push(
      `${result.metadata.criticalGaps} critical gaps identified - regulatory compliance at risk`
    );
  }

  // Check for missing translation requirements
  if (result.translationRequirements.length === 0) {
    warnings.push('No translation requirements identified - verify if this is expected');
  }

  // Check for special attention sections
  if (result.specialAttentionSections.length === 0) {
    warnings.push('No special attention sections flagged - verify pharmaceutical content review');
  }

  return {
    valid: result.metadata.criticalGaps === 0,
    warnings,
  };
};