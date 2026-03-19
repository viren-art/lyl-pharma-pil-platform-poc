// LYL_DEP: @anthropic-ai/sdk@^0.20.0
// LYL_DEP: diff@^5.1.0

import Anthropic from '@anthropic-ai/sdk';
import { diffWords, diffLines, Change } from 'diff';
import type { ExtractionResult, ExtractedSection } from '../extraction/extraction.schema';
import { getMarketById } from '../services/market.service';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = 'claude-3-sonnet-20240229';
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 60000;

export interface DiffChange {
  type: 'added' | 'deleted' | 'modified';
  oldText?: string;
  newText?: string;
  position: number; // Character position in section
  length: number;
  regulatorySignificance: 'critical' | 'major' | 'minor';
  explanation: string;
}

export interface SectionDiff {
  sectionName: string;
  changeType: 'Added' | 'Modified' | 'Deleted';
  oldContent?: string;
  newContent?: string;
  changes: DiffChange[];
  regulatoryImpact: string;
  requiresReview: boolean;
}

export interface ComplicatedDiff {
  sections: SectionDiff[];
  summary: {
    totalSections: number;
    sectionsAdded: number;
    sectionsModified: number;
    sectionsDeleted: number;
    criticalChanges: number;
    majorChanges: number;
    minorChanges: number;
  };
  overallImpact: string;
  recommendedActions: string[];
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
 * Generate diff analysis prompt
 */
const generateDiffPrompt = (
  sectionName: string,
  oldContent: string,
  newContent: string,
  marketId: number
): string => {
  const market = getMarketById(marketId);

  return `You are a pharmaceutical regulatory expert analyzing changes in a PIL section for ${market.name} (${market.regulatoryAuthority}).

SECTION: ${sectionName}

OLD CONTENT:
${oldContent}

NEW CONTENT:
${newContent}

Analyze the changes and assess their regulatory impact. For each change, determine:
1. Type: added, deleted, or modified
2. Regulatory significance: critical (safety/efficacy), major (regulatory format), or minor (editorial)
3. Explanation of why this change matters

Provide your analysis in this exact JSON format:
{
  "changes": [
    {
      "type": "added" | "deleted" | "modified",
      "oldText": "original text (if modified/deleted)",
      "newText": "new text (if added/modified)",
      "regulatorySignificance": "critical" | "major" | "minor",
      "explanation": "why this change is significant"
    }
  ],
  "regulatoryImpact": "overall impact assessment for this section",
  "requiresReview": true | false
}

Focus on pharmaceutical content: dosages, warnings, contraindications, adverse reactions, drug interactions.`;
};

/**
 * Perform text-level diff using diff library
 */
const performTextDiff = (oldContent: string, newContent: string): Change[] => {
  // Use word-level diff for better granularity
  return diffWords(oldContent, newContent, { ignoreCase: false });
};

/**
 * Convert diff library changes to DiffChange format
 */
const convertToDiffChanges = (changes: Change[]): DiffChange[] => {
  const diffChanges: DiffChange[] = [];
  let position = 0;

  for (const change of changes) {
    if (change.added) {
      diffChanges.push({
        type: 'added',
        newText: change.value,
        position,
        length: change.value.length,
        regulatorySignificance: 'minor', // Will be updated by AI analysis
        explanation: 'Text added',
      });
      position += change.value.length;
    } else if (change.removed) {
      diffChanges.push({
        type: 'deleted',
        oldText: change.value,
        position,
        length: change.value.length,
        regulatorySignificance: 'minor',
        explanation: 'Text removed',
      });
    } else {
      // Unchanged text
      position += change.value.length;
    }
  }

  return diffChanges;
};

/**
 * Analyze section diff with AI
 */
const analyzeSectionDiff = async (
  sectionName: string,
  oldContent: string,
  newContent: string,
  marketId: number
): Promise<{ changes: DiffChange[]; regulatoryImpact: string; requiresReview: boolean }> => {
  const client = getClient();
  const prompt = generateDiffPrompt(sectionName, oldContent, newContent, marketId);

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
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

    const parsed = JSON.parse(textContent.text);

    // Convert AI analysis to DiffChange format
    const changes: DiffChange[] = (parsed.changes || []).map((c: any, index: number) => ({
      type: c.type || 'modified',
      oldText: c.oldText,
      newText: c.newText,
      position: index * 100, // Approximate position
      length: (c.newText || c.oldText || '').length,
      regulatorySignificance: c.regulatorySignificance || 'minor',
      explanation: c.explanation || 'No explanation provided',
    }));

    return {
      changes,
      regulatoryImpact: parsed.regulatoryImpact || 'No impact assessment provided',
      requiresReview: parsed.requiresReview !== false, // Default to true
    };
  } catch (error) {
    console.error(`AI diff analysis failed for section ${sectionName}:`, error);
    
    // Fall back to basic text diff
    const textDiff = performTextDiff(oldContent, newContent);
    const changes = convertToDiffChanges(textDiff);

    return {
      changes,
      regulatoryImpact: 'Unable to assess regulatory impact (AI analysis failed)',
      requiresReview: true,
    };
  }
};

/**
 * Generate complicated variation diff
 */
export const generateComplicatedDiff = async (
  approvedPilExtraction: ExtractionResult,
  changeTriggerExtraction: ExtractionResult,
  marketId: number
): Promise<ComplicatedDiff> => {
  const startTime = Date.now();

  try {
    // Build section maps
    const approvedMap = new Map(approvedPilExtraction.sections.map(s => [s.sectionName, s]));
    const triggerMap = new Map(changeTriggerExtraction.sections.map(s => [s.sectionName, s]));

    const allSectionNames = new Set([
      ...approvedPilExtraction.sections.map(s => s.sectionName),
      ...changeTriggerExtraction.sections.map(s => s.sectionName),
    ]);

    const sectionDiffs: SectionDiff[] = [];

    // Analyze each section
    for (const sectionName of allSectionNames) {
      const approvedSection = approvedMap.get(sectionName);
      const triggerSection = triggerMap.get(sectionName);

      if (!approvedSection && triggerSection) {
        // Section added
        sectionDiffs.push({
          sectionName,
          changeType: 'Added',
          newContent: triggerSection.content,
          changes: [
            {
              type: 'added',
              newText: triggerSection.content,
              position: 0,
              length: triggerSection.content.length,
              regulatorySignificance: 'major',
              explanation: 'New section added to PIL',
            },
          ],
          regulatoryImpact: 'New section requires regulatory review',
          requiresReview: true,
        });
      } else if (approvedSection && !triggerSection) {
        // Section deleted
        sectionDiffs.push({
          sectionName,
          changeType: 'Deleted',
          oldContent: approvedSection.content,
          changes: [
            {
              type: 'deleted',
              oldText: approvedSection.content,
              position: 0,
              length: approvedSection.content.length,
              regulatorySignificance: 'major',
              explanation: 'Section removed from PIL',
            },
          ],
          regulatoryImpact: 'Section deletion requires regulatory review',
          requiresReview: true,
        });
      } else if (approvedSection && triggerSection) {
        // Section modified
        if (approvedSection.content !== triggerSection.content) {
          const analysis = await analyzeSectionDiff(
            sectionName,
            approvedSection.content,
            triggerSection.content,
            marketId
          );

          sectionDiffs.push({
            sectionName,
            changeType: 'Modified',
            oldContent: approvedSection.content,
            newContent: triggerSection.content,
            changes: analysis.changes,
            regulatoryImpact: analysis.regulatoryImpact,
            requiresReview: analysis.requiresReview,
          });
        }
      }
    }

    // Calculate summary
    const summary = {
      totalSections: sectionDiffs.length,
      sectionsAdded: sectionDiffs.filter(s => s.changeType === 'Added').length,
      sectionsModified: sectionDiffs.filter(s => s.changeType === 'Modified').length,
      sectionsDeleted: sectionDiffs.filter(s => s.changeType === 'Deleted').length,
      criticalChanges: sectionDiffs.reduce(
        (sum, s) => sum + s.changes.filter(c => c.regulatorySignificance === 'critical').length,
        0
      ),
      majorChanges: sectionDiffs.reduce(
        (sum, s) => sum + s.changes.filter(c => c.regulatorySignificance === 'major').length,
        0
      ),
      minorChanges: sectionDiffs.reduce(
        (sum, s) => sum + s.changes.filter(c => c.regulatorySignificance === 'minor').length,
        0
      ),
    };

    // Generate overall impact and recommendations
    const overallImpact = `${summary.totalSections} sections affected: ${summary.sectionsAdded} added, ${summary.sectionsModified} modified, ${summary.sectionsDeleted} deleted. ${summary.criticalChanges} critical changes, ${summary.majorChanges} major changes, ${summary.minorChanges} minor changes.`;

    const recommendedActions: string[] = [
      'Create new Draft PIL incorporating all changes',
      'Submit to regulatory authority for approval',
      'Update internal documentation',
    ];

    if (summary.criticalChanges > 0) {
      recommendedActions.unshift('Priority review required for critical safety changes');
    }

    console.log(`Complicated diff generated in ${Date.now() - startTime}ms`);

    return {
      sections: sectionDiffs,
      summary,
      overallImpact,
      recommendedActions,
    };
  } catch (error) {
    console.error('Complicated diff generation failed:', error);
    throw new Error(`Diff generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};