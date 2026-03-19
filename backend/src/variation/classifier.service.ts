// LYL_DEP: @anthropic-ai/sdk@^0.20.0

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractionResult, ExtractedSection } from '../extraction/extraction.schema';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = 'claude-3-sonnet-20240229'; // Sonnet for cost-effective classification
const MAX_TOKENS = 2048;
const TIMEOUT_MS = 30000;

export interface VariationClassification {
  type: 'complicated' | 'general';
  confidence: number; // 0.0 - 1.0
  rationale: string;
  sectionsAffected: string[];
  changeTypes: {
    contentChanges: number;
    formattingChanges: number;
    safetyUpdates: number;
    dosageChanges: number;
    indicationChanges: number;
  };
  regulatoryImpact: 'high' | 'medium' | 'low';
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
 * Generate classification prompt
 */
const generateClassificationPrompt = (
  approvedSections: ExtractedSection[],
  changeTriggerSections: ExtractedSection[],
  marketName: string,
  regulatoryAuthority: string
): string => {
  return `You are a pharmaceutical regulatory expert analyzing PIL (Patient Information Leaflet) variations for ${marketName} (${regulatoryAuthority}).

TASK: Classify this PIL variation as either "complicated" or "general" based on the scope and regulatory impact of changes.

CLASSIFICATION RULES:

COMPLICATED variations (require new Draft PIL and full approval cycle):
- Multiple sections affected (3+ sections with substantive changes)
- Safety-critical updates (warnings, contraindications, adverse reactions)
- Dosage or administration changes
- Indication changes (new uses, expanded/restricted indications)
- Chemical composition changes
- Pharmacological mechanism changes
- Any change requiring regulatory authority review

GENERAL variations (direct to AW with revision comments):
- Minor wording improvements or clarifications
- Typographical corrections
- Formatting adjustments (spacing, fonts, layout)
- Contact information updates
- Non-substantive editorial changes
- Single section with minor content update
- Changes that don't affect safety or efficacy information

APPROVED PIL SECTIONS:
${approvedSections.map(s => `[${s.sectionName}]\n${s.content.substring(0, 500)}...`).join('\n\n')}

CHANGE TRIGGER SECTIONS:
${changeTriggerSections.map(s => `[${s.sectionName}]\n${s.content.substring(0, 500)}...`).join('\n\n')}

Analyze the differences and provide your classification in this exact JSON format:
{
  "type": "complicated" | "general",
  "confidence": 0.0-1.0,
  "rationale": "detailed explanation of classification decision",
  "sectionsAffected": ["section1", "section2"],
  "changeTypes": {
    "contentChanges": number,
    "formattingChanges": number,
    "safetyUpdates": number,
    "dosageChanges": number,
    "indicationChanges": number
  },
  "regulatoryImpact": "high" | "medium" | "low"
}

Focus on regulatory significance, not just volume of changes. A single safety update is more significant than many formatting changes.`;
};

/**
 * Apply rule-based classification filters
 */
const applyRuleBasedFilters = (
  approvedSections: ExtractedSection[],
  changeTriggerSections: ExtractedSection[]
): Partial<VariationClassification> | null => {
  // Build section map for comparison
  const approvedMap = new Map(approvedSections.map(s => [s.sectionName, s]));
  const triggerMap = new Map(changeTriggerSections.map(s => [s.sectionName, s]));

  // Check for new or deleted sections (always complicated)
  const approvedNames = new Set(approvedSections.map(s => s.sectionName));
  const triggerNames = new Set(changeTriggerSections.map(s => s.sectionName));
  
  const newSections = [...triggerNames].filter(name => !approvedNames.has(name));
  const deletedSections = [...approvedNames].filter(name => !triggerNames.has(name));

  if (newSections.length > 0 || deletedSections.length > 0) {
    return {
      type: 'complicated',
      confidence: 0.95,
      rationale: `Structural changes detected: ${newSections.length} new sections, ${deletedSections.length} deleted sections. Requires full regulatory review.`,
      sectionsAffected: [...newSections, ...deletedSections],
      regulatoryImpact: 'high',
    };
  }

  // Check for safety-critical section changes
  const safetySections = [
    'Warnings and Precautions',
    'Contraindications',
    'Adverse Reactions',
    'Drug Interactions',
    'Overdosage',
  ];

  const safetySectionsChanged = safetySections.filter(name => {
    const approved = approvedMap.get(name);
    const trigger = triggerMap.get(name);
    if (!approved || !trigger) return false;
    
    // Simple content comparison (in production, use more sophisticated diff)
    return approved.content !== trigger.content;
  });

  if (safetySectionsChanged.length > 0) {
    return {
      type: 'complicated',
      confidence: 0.90,
      rationale: `Safety-critical sections modified: ${safetySectionsChanged.join(', ')}. Requires regulatory review.`,
      sectionsAffected: safetySectionsChanged,
      regulatoryImpact: 'high',
    };
  }

  // Check for dosage section changes
  const dosageSections = ['Dosage and Administration', 'How to Use'];
  const dosageSectionsChanged = dosageSections.filter(name => {
    const approved = approvedMap.get(name);
    const trigger = triggerMap.get(name);
    if (!approved || !trigger) return false;
    return approved.content !== trigger.content;
  });

  if (dosageSectionsChanged.length > 0) {
    return {
      type: 'complicated',
      confidence: 0.85,
      rationale: `Dosage information modified: ${dosageSectionsChanged.join(', ')}. Requires regulatory review.`,
      sectionsAffected: dosageSectionsChanged,
      regulatoryImpact: 'high',
    };
  }

  // Check for indication section changes
  const indicationSections = ['Indications', 'Therapeutic Indications', 'Uses'];
  const indicationSectionsChanged = indicationSections.filter(name => {
    const approved = approvedMap.get(name);
    const trigger = triggerMap.get(name);
    if (!approved || !trigger) return false;
    return approved.content !== trigger.content;
  });

  if (indicationSectionsChanged.length > 0) {
    return {
      type: 'complicated',
      confidence: 0.85,
      rationale: `Indication information modified: ${indicationSectionsChanged.join(', ')}. Requires regulatory review.`,
      sectionsAffected: indicationSectionsChanged,
      regulatoryImpact: 'high',
    };
  }

  // Check for multiple sections affected (3+ sections = complicated)
  const changedSections = [...approvedNames].filter(name => {
    const approved = approvedMap.get(name);
    const trigger = triggerMap.get(name);
    if (!approved || !trigger) return false;
    return approved.content !== trigger.content;
  });

  if (changedSections.length >= 3) {
    return {
      type: 'complicated',
      confidence: 0.80,
      rationale: `Multiple sections affected (${changedSections.length} sections). Requires comprehensive review.`,
      sectionsAffected: changedSections,
      regulatoryImpact: 'medium',
    };
  }

  // No rule-based classification, defer to AI
  return null;
};

/**
 * Parse Claude classification response
 */
const parseClassificationResponse = (response: string): VariationClassification => {
  try {
    const parsed = JSON.parse(response);
    
    // Validate required fields
    if (!parsed.type || !['complicated', 'general'].includes(parsed.type)) {
      throw new Error('Invalid classification type');
    }
    
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1) {
      throw new Error('Invalid confidence score');
    }

    return {
      type: parsed.type,
      confidence: parsed.confidence,
      rationale: parsed.rationale || 'No rationale provided',
      sectionsAffected: parsed.sectionsAffected || [],
      changeTypes: {
        contentChanges: parsed.changeTypes?.contentChanges || 0,
        formattingChanges: parsed.changeTypes?.formattingChanges || 0,
        safetyUpdates: parsed.changeTypes?.safetyUpdates || 0,
        dosageChanges: parsed.changeTypes?.dosageChanges || 0,
        indicationChanges: parsed.changeTypes?.indicationChanges || 0,
      },
      regulatoryImpact: parsed.regulatoryImpact || 'medium',
    };
  } catch (error) {
    throw new Error(`Failed to parse classification response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Classify variation using AI and rule-based filters
 */
export const classifyVariation = async (
  approvedPilExtraction: ExtractionResult,
  changeTriggerExtraction: ExtractionResult,
  marketId: number
): Promise<VariationClassification> => {
  const startTime = Date.now();

  try {
    // Try rule-based classification first
    const ruleBasedResult = applyRuleBasedFilters(
      approvedPilExtraction.sections,
      changeTriggerExtraction.sections
    );

    if (ruleBasedResult) {
      console.log(`Rule-based classification completed in ${Date.now() - startTime}ms`);
      return {
        ...ruleBasedResult,
        changeTypes: {
          contentChanges: 0,
          formattingChanges: 0,
          safetyUpdates: ruleBasedResult.sectionsAffected?.length || 0,
          dosageChanges: 0,
          indicationChanges: 0,
        },
      } as VariationClassification;
    }

    // Fall back to AI classification
    const client = getClient();
    
    // Mock market data for now
    const marketName = marketId === 1 ? 'Taiwan' : 'Thailand';
    const regulatoryAuthority = marketId === 1 ? 'TFDA' : 'Thai FDA';
    
    const prompt = generateClassificationPrompt(
      approvedPilExtraction.sections,
      changeTriggerExtraction.sections,
      marketName,
      regulatoryAuthority
    );

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.3, // Lower temperature for consistent classification
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      timeout: TIMEOUT_MS,
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const classification = parseClassificationResponse(textContent.text);

    console.log(`AI classification completed in ${Date.now() - startTime}ms`);
    console.log(`Classification: ${classification.type} (confidence: ${classification.confidence})`);

    return classification;
  } catch (error) {
    console.error('Variation classification failed:', error);
    throw new Error(`Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Batch classify multiple variations
 */
export const batchClassifyVariations = async (
  requests: Array<{
    approvedPilExtraction: ExtractionResult;
    changeTriggerExtraction: ExtractionResult;
    marketId: number;
  }>
): Promise<VariationClassification[]> => {
  const results: VariationClassification[] = [];

  for (const request of requests) {
    try {
      const classification = await classifyVariation(
        request.approvedPilExtraction,
        request.changeTriggerExtraction,
        request.marketId
      );
      results.push(classification);
    } catch (error) {
      console.error('Batch classification error:', error);
      // Continue with other requests
      results.push({
        type: 'complicated', // Default to complicated on error (safer)
        confidence: 0.0,
        rationale: `Classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sectionsAffected: [],
        changeTypes: {
          contentChanges: 0,
          formattingChanges: 0,
          safetyUpdates: 0,
          dosageChanges: 0,
          indicationChanges: 0,
        },
        regulatoryImpact: 'high',
      });
    }
  }

  return results;
};