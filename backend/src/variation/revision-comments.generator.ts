// LYL_DEP: @anthropic-ai/sdk@^0.20.0

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractionResult, ExtractedSection } from '../extraction/extraction.schema';
import { getMarketById } from '../services/market.service';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = 'claude-3-sonnet-20240229';
const MAX_TOKENS = 4096;
const TIMEOUT_MS = 60000;

export interface RevisionComment {
  sectionName: string;
  pageReference: number;
  oldText: string;
  newText: string;
  instruction: string;
  priority: 'high' | 'medium' | 'low';
  category: 'content' | 'formatting' | 'editorial';
}

export interface RevisionComments {
  comments: RevisionComment[];
  summary: {
    totalComments: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    contentChanges: number;
    formattingChanges: number;
    editorialChanges: number;
  };
  instructions: string;
  estimatedTime: string; // e.g., "2-4 hours"
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
 * Generate revision comments prompt
 */
const generateRevisionPrompt = (
  approvedSections: ExtractedSection[],
  changeTriggerSections: ExtractedSection[],
  marketId: number
): string => {
  const market = getMarketById(marketId);

  return `You are a pharmaceutical regulatory expert creating revision comments for AW (Artwork) Technicians for ${market.name} (${market.regulatoryAuthority}).

TASK: Generate specific, actionable revision comments for updating the approved PIL artwork with changes from the change trigger document.

APPROVED PIL SECTIONS:
${approvedSections.map(s => `[${s.sectionName}] (Page ${s.pageReferences[0] || 1})\n${s.content.substring(0, 300)}...`).join('\n\n')}

CHANGE TRIGGER SECTIONS:
${changeTriggerSections.map(s => `[${s.sectionName}]\n${s.content.substring(0, 300)}...`).join('\n\n')}

For each change, provide:
1. Section name and page reference
2. Old text (exact quote from approved PIL)
3. New text (exact replacement text)
4. Specific instruction for AW Technician (e.g., "Replace text on page 2, paragraph 3")
5. Priority: high (affects safety/efficacy), medium (regulatory format), low (editorial)
6. Category: content, formatting, or editorial

Provide your analysis in this exact JSON format:
{
  "comments": [
    {
      "sectionName": "section name",
      "pageReference": page number,
      "oldText": "exact text to replace",
      "newText": "exact replacement text",
      "instruction": "specific instruction for AW Technician",
      "priority": "high" | "medium" | "low",
      "category": "content" | "formatting" | "editorial"
    }
  ],
  "instructions": "overall instructions for AW Technician",
  "estimatedTime": "estimated time to complete all revisions (e.g., '2-4 hours')"
}

Be precise with text quotes and page references. AW Technicians need exact locations and replacement text.`;
};

/**
 * Compare sections and identify changes
 */
const identifyChanges = (
  approvedSections: ExtractedSection[],
  changeTriggerSections: ExtractedSection[]
): Array<{ sectionName: string; approved: ExtractedSection; trigger: ExtractedSection }> => {
  const changes: Array<{ sectionName: string; approved: ExtractedSection; trigger: ExtractedSection }> = [];

  const approvedMap = new Map(approvedSections.map(s => [s.sectionName, s]));
  const triggerMap = new Map(changeTriggerSections.map(s => [s.sectionName, s]));

  // Find modified sections
  for (const [sectionName, approvedSection] of approvedMap) {
    const triggerSection = triggerMap.get(sectionName);
    if (triggerSection && approvedSection.content !== triggerSection.content) {
      changes.push({
        sectionName,
        approved: approvedSection,
        trigger: triggerSection,
      });
    }
  }

  return changes;
};

/**
 * Parse revision comments response
 */
const parseRevisionResponse = (response: string): RevisionComments => {
  try {
    const parsed = JSON.parse(response);

    const comments: RevisionComment[] = (parsed.comments || []).map((c: any) => ({
      sectionName: c.sectionName || 'Unknown',
      pageReference: c.pageReference || 1,
      oldText: c.oldText || '',
      newText: c.newText || '',
      instruction: c.instruction || 'No instruction provided',
      priority: c.priority || 'medium',
      category: c.category || 'content',
    }));

    const summary = {
      totalComments: comments.length,
      highPriority: comments.filter(c => c.priority === 'high').length,
      mediumPriority: comments.filter(c => c.priority === 'medium').length,
      lowPriority: comments.filter(c => c.priority === 'low').length,
      contentChanges: comments.filter(c => c.category === 'content').length,
      formattingChanges: comments.filter(c => c.category === 'formatting').length,
      editorialChanges: comments.filter(c => c.category === 'editorial').length,
    };

    return {
      comments,
      summary,
      instructions: parsed.instructions || 'Review and apply all revision comments to the approved PIL artwork.',
      estimatedTime: parsed.estimatedTime || 'Not estimated',
    };
  } catch (error) {
    throw new Error(`Failed to parse revision comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Generate revision comments for general variations
 */
export const generateRevisionComments = async (
  approvedPilExtraction: ExtractionResult,
  changeTriggerExtraction: ExtractionResult,
  marketId: number
): Promise<RevisionComments> => {
  const startTime = Date.now();

  try {
    // Identify changed sections
    const changes = identifyChanges(
      approvedPilExtraction.sections,
      changeTriggerExtraction.sections
    );

    if (changes.length === 0) {
      return {
        comments: [],
        summary: {
          totalComments: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0,
          contentChanges: 0,
          formattingChanges: 0,
          editorialChanges: 0,
        },
        instructions: 'No changes detected between approved PIL and change trigger.',
        estimatedTime: '0 hours',
      };
    }

    // Generate revision comments with AI
    const client = getClient();
    const prompt = generateRevisionPrompt(
      approvedPilExtraction.sections,
      changeTriggerExtraction.sections,
      marketId
    );

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

    const revisionComments = parseRevisionResponse(textContent.text);

    console.log(`Revision comments generated in ${Date.now() - startTime}ms`);
    console.log(`Total comments: ${revisionComments.summary.totalComments}`);

    return revisionComments;
  } catch (error) {
    console.error('Revision comments generation failed:', error);
    throw new Error(`Comments generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Export revision comments to structured document format
 */
export const exportRevisionCommentsToDocument = (
  comments: RevisionComments,
  productName: string,
  marketName: string
): string => {
  const lines: string[] = [];

  lines.push('PIL REVISION COMMENTS');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Product: ${productName}`);
  lines.push(`Market: ${marketName}`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Total Comments: ${comments.summary.totalComments}`);
  lines.push(`High Priority: ${comments.summary.highPriority}`);
  lines.push(`Medium Priority: ${comments.summary.mediumPriority}`);
  lines.push(`Low Priority: ${comments.summary.lowPriority}`);
  lines.push(`Estimated Time: ${comments.estimatedTime}`);
  lines.push('');
  lines.push('INSTRUCTIONS');
  lines.push('-'.repeat(80));
  lines.push(comments.instructions);
  lines.push('');
  lines.push('REVISION COMMENTS');
  lines.push('-'.repeat(80));
  lines.push('');

  // Group by priority
  const highPriority = comments.comments.filter(c => c.priority === 'high');
  const mediumPriority = comments.comments.filter(c => c.priority === 'medium');
  const lowPriority = comments.comments.filter(c => c.priority === 'low');

  const printComments = (priority: string, commentList: RevisionComment[]) => {
    if (commentList.length === 0) return;

    lines.push(`${priority.toUpperCase()} PRIORITY (${commentList.length})`);
    lines.push('');

    commentList.forEach((comment, index) => {
      lines.push(`${index + 1}. ${comment.sectionName} (Page ${comment.pageReference})`);
      lines.push(`   Category: ${comment.category}`);
      lines.push(`   Old Text: "${comment.oldText}"`);
      lines.push(`   New Text: "${comment.newText}"`);
      lines.push(`   Instruction: ${comment.instruction}`);
      lines.push('');
    });
  };

  printComments('HIGH', highPriority);
  printComments('MEDIUM', mediumPriority);
  printComments('LOW', lowPriority);

  return lines.join('\n');
};