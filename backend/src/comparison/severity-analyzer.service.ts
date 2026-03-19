// LYL_DEP: @anthropic-ai/sdk@^0.20.0

import Anthropic from '@anthropic-ai/sdk';
import type { Deviation } from './deviation-detector.service';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = 'claude-3-sonnet-20240229'; // Faster model for classification
const MAX_TOKENS = 1024;

/**
 * Pharmaceutical-critical content patterns
 */
const CRITICAL_PATTERNS = {
  dosage: [
    /\d+\s*(mg|ml|g|mcg|μg|iu|units?|tablets?|capsules?)/i,
    /dose|dosage|dosing/i,
    /\d+\s*times?\s*(daily|per\s+day|a\s+day)/i,
    /maximum\s+dose/i,
    /initial\s+dose/i
  ],
  contraindications: [
    /contraindication/i,
    /do\s+not\s+use/i,
    /should\s+not\s+be\s+used/i,
    /must\s+not\s+be\s+used/i,
    /hypersensitivity/i,
    /allergy|allergic/i
  ],
  warnings: [
    /warning/i,
    /caution/i,
    /serious\s+adverse/i,
    /black\s+box/i,
    /life-threatening/i,
    /fatal/i,
    /death/i
  ],
  specialPopulations: [
    /pregnancy/i,
    /lactation|breastfeeding/i,
    /pediatric|children/i,
    /geriatric|elderly/i,
    /renal\s+impairment/i,
    /hepatic\s+impairment/i
  ],
  interactions: [
    /drug\s+interaction/i,
    /interaction/i,
    /concomitant/i,
    /combination\s+with/i
  ],
  adverseReactions: [
    /adverse\s+reaction/i,
    /side\s+effect/i,
    /adverse\s+event/i,
    /undesirable\s+effect/i
  ]
};

/**
 * Major violation patterns (regulatory format)
 */
const MAJOR_PATTERNS = {
  mandatorySections: [
    /product\s+name/i,
    /composition/i,
    /indication/i,
    /dosage\s+and\s+administration/i,
    /contraindication/i,
    /warning/i,
    /precaution/i,
    /adverse\s+reaction/i,
    /storage/i,
    /manufacturer/i
  ],
  formatViolations: [
    /font\s+size/i,
    /font\s+type/i,
    /bold|italic|underline/i,
    /alignment/i,
    /spacing/i,
    /margin/i
  ]
};

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
 * Check if text matches critical patterns
 */
const matchesCriticalPattern = (text: string): { matches: boolean; category: string } => {
  for (const [category, patterns] of Object.entries(CRITICAL_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(text))) {
      return { matches: true, category };
    }
  }
  return { matches: false, category: '' };
};

/**
 * Check if text matches major violation patterns
 */
const matchesMajorPattern = (text: string): { matches: boolean; category: string } => {
  for (const [category, patterns] of Object.entries(MAJOR_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(text))) {
      return { matches: true, category };
    }
  }
  return { matches: false, category: '' };
};

/**
 * Rule-based severity classification
 */
const ruleBasedClassification = (deviation: Deviation): 'Critical' | 'Major' | 'Minor' => {
  const combinedText = `${deviation.sectionName} ${deviation.description} ${deviation.approvedText} ${deviation.awText}`;

  // Check for missing sections
  if (deviation.changeType === 'Missing') {
    const majorSection = matchesMajorPattern(deviation.sectionName);
    if (majorSection.matches) {
      return 'Critical';
    }
    return 'Major';
  }

  // Check for critical pharmaceutical content
  const criticalMatch = matchesCriticalPattern(combinedText);
  if (criticalMatch.matches) {
    return 'Critical';
  }

  // Check for major violations
  const majorMatch = matchesMajorPattern(combinedText);
  if (majorMatch.matches) {
    return 'Major';
  }

  // Check for length of change (significant changes are Major)
  const approvedLength = deviation.approvedText.length;
  const awLength = deviation.awText.length;
  const lengthDiff = Math.abs(approvedLength - awLength);

  if (lengthDiff > 100) {
    return 'Major';
  }

  return 'Minor';
};

/**
 * AI-powered severity classification using Claude
 */
const aiClassification = async (deviation: Deviation): Promise<'Critical' | 'Major' | 'Minor'> => {
  const client = getClient();

  const prompt = `You are a pharmaceutical regulatory expert. Classify the severity of this deviation in an Artwork (AW) draft compared to an approved Patient Information Leaflet (PIL).

DEVIATION:
Section: ${deviation.sectionName}
Change Type: ${deviation.changeType}
Description: ${deviation.description}
Approved PIL Text: ${deviation.approvedText}
AW Draft Text: ${deviation.awText}

SEVERITY LEVELS:
- CRITICAL: Content errors, dosage mismatches, missing warnings/contraindications, incorrect chemical formulas, missing mandatory sections, changes affecting patient safety
- MAJOR: Regulatory format violations, missing non-critical sections, significant text changes, formatting issues affecting readability
- MINOR: Typographical errors, formatting inconsistencies, minor wording changes that don't affect meaning

Respond with ONLY one word: Critical, Major, or Minor`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    const severity = textContent.text.trim();
    if (severity === 'Critical' || severity === 'Major' || severity === 'Minor') {
      return severity;
    }

    throw new Error(`Invalid severity response: ${severity}`);
  } catch (error) {
    console.error('Claude classification error:', error);
    // Fallback to rule-based
    return ruleBasedClassification(deviation);
  }
};

/**
 * Classify deviation severity (hybrid approach)
 */
export const classifyDeviationSeverity = async (
  deviation: Deviation
): Promise<'Critical' | 'Major' | 'Minor'> => {
  // First try rule-based classification
  const ruleSeverity = ruleBasedClassification(deviation);

  // If rule-based is Critical or Minor, trust it
  if (ruleSeverity === 'Critical' || ruleSeverity === 'Minor') {
    return ruleSeverity;
  }

  // For Major, use AI to refine (could be Critical or Minor)
  try {
    const aiSeverity = await aiClassification(deviation);
    return aiSeverity;
  } catch (error) {
    console.error('AI classification failed, using rule-based:', error);
    return ruleSeverity;
  }
};

/**
 * Batch classify deviations
 */
export const batchClassifyDeviations = async (
  deviations: Deviation[]
): Promise<Deviation[]> => {
  const classified: Deviation[] = [];

  for (const deviation of deviations) {
    const severity = await classifyDeviationSeverity(deviation);
    classified.push({
      ...deviation,
      severity
    });
  }

  return classified;
};

/**
 * Get severity statistics
 */
export const getSeverityStatistics = (deviations: Deviation[]): {
  total: number;
  critical: number;
  major: number;
  minor: number;
  criticalPercentage: number;
  majorPercentage: number;
  minorPercentage: number;
} => {
  const total = deviations.length;
  const critical = deviations.filter((d) => d.severity === 'Critical').length;
  const major = deviations.filter((d) => d.severity === 'Major').length;
  const minor = deviations.filter((d) => d.severity === 'Minor').length;

  return {
    total,
    critical,
    major,
    minor,
    criticalPercentage: total > 0 ? (critical / total) * 100 : 0,
    majorPercentage: total > 0 ? (major / total) * 100 : 0,
    minorPercentage: total > 0 ? (minor / total) * 100 : 0
  };
};