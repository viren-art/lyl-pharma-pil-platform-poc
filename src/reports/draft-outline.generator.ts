// LYL_DEP: docx@^8.5.0

import { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type {
  SectionAlignmentResult,
  GapAnalysisResult,
  DraftOutline,
  DraftSection,
} from '../workflows/draft-creation/new-submission/workflow.schema';

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/pil-lens';

// Baseline manual time ranges (hours)
const BASELINE_MIN_HOURS = 8;
const BASELINE_MAX_HOURS = 32;
const BASELINE_AVG_HOURS = 20; // Average baseline for comparison

// Target AI-assisted time ranges (hours)
const TARGET_MIN_HOURS = 2;
const TARGET_MAX_HOURS = 8;

interface GenerateDraftOutlineParams {
  alignmentResult: SectionAlignmentResult;
  gapAnalysisResult: GapAnalysisResult;
  marketConfig: {
    name: string;
    regulatoryAuthority: string;
    language: string;
    sectionOrdering: Record<string, number>;
  };
}

/**
 * Calculate translation complexity score based on content characteristics
 */
const calculateTranslationComplexity = (content: string, notes: string[]): {
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedHours: number;
} => {
  let complexityScore = 0;
  
  // Content length factor
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 200) complexityScore += 2;
  else if (wordCount > 100) complexityScore += 1;
  
  // Medical terminology indicators
  const medicalTerms = ['mg', 'kg', 'dose', 'adverse', 'contraindication', 'pharmacokinetic', 'hepatic', 'renal'];
  const medicalTermCount = medicalTerms.filter(term => content.toLowerCase().includes(term)).length;
  complexityScore += medicalTermCount;
  
  // Special formatting indicators
  if (content.includes('²') || content.includes('₂')) complexityScore += 2; // Subscripts/superscripts
  if (content.match(/\d+\s*mg\/kg/)) complexityScore += 2; // Dosage calculations
  if (content.includes('Table') || content.includes('table')) complexityScore += 3; // Tables
  
  // Translation notes complexity
  const complexNotes = notes.filter(note => 
    note.toLowerCase().includes('complex') || 
    note.toLowerCase().includes('certified') ||
    note.toLowerCase().includes('specialist')
  );
  complexityScore += complexNotes.length * 2;
  
  // Determine complexity level and estimate hours
  let complexity: 'simple' | 'moderate' | 'complex';
  let estimatedHours: number;
  
  if (complexityScore <= 3) {
    complexity = 'simple';
    estimatedHours = 0.5 + (wordCount / 200); // ~30 min + word count factor
  } else if (complexityScore <= 7) {
    complexity = 'moderate';
    estimatedHours = 1.5 + (wordCount / 150); // ~1.5 hours + word count factor
  } else {
    complexity = 'complex';
    estimatedHours = 3 + (wordCount / 100); // ~3 hours + word count factor
  }
  
  return { complexity, estimatedHours };
};

/**
 * Build draft sections from alignment and gap analysis
 */
const buildDraftSections = (
  alignmentResult: SectionAlignmentResult,
  gapAnalysisResult: GapAnalysisResult,
  sectionOrdering: Record<string, number>
): DraftSection[] => {
  const sections: DraftSection[] = [];

  // Add aligned sections
  for (const alignment of alignmentResult.alignments) {
    const translationReq = gapAnalysisResult.translationRequirements.find(
      (t) => t.sectionName === alignment.regulatorySection.name
    );

    const specialAttention = gapAnalysisResult.specialAttentionSections.find(
      (s) => s.sectionName === alignment.regulatorySection.name
    );

    const gaps = gapAnalysisResult.gaps.filter(
      (g) => g.regulatorySectionName === alignment.regulatorySection.name
    );

    sections.push({
      order: sectionOrdering[alignment.regulatorySection.name] || 999,
      sectionName: alignment.regulatorySection.name,
      sourceContent: alignment.innovatorSection.content,
      targetRequirements: alignment.regulatorySection.requirements,
      translationNotes: translationReq?.notes || [],
      formattingRequirements: alignment.notes || [],
      specialAttention: !!specialAttention,
      specialAttentionDetails: specialAttention,
      gaps: gaps.length > 0 ? gaps : undefined,
    });
  }

  // Add unmatched regulatory sections as gaps
  for (const unmatched of alignmentResult.unmatchedRegulatorySections) {
    const gaps = gapAnalysisResult.gaps.filter(
      (g) => g.regulatorySectionName === unmatched.sectionName
    );

    sections.push({
      order: sectionOrdering[unmatched.sectionName] || 999,
      sectionName: unmatched.sectionName,
      sourceContent: '[NO INNOVATOR CONTENT - REQUIRES LOCAL CONTENT]',
      targetRequirements: unmatched.requirements,
      translationNotes: ['This section requires locally-sourced content'],
      formattingRequirements: [],
      specialAttention: true,
      specialAttentionDetails: {
        sectionName: unmatched.sectionName,
        attentionType: 'local_contacts',
        description: 'Section not present in Innovator PIL',
        requirements: [unmatched.requirements],
      },
      gaps,
    });
  }

  // Sort by order
  sections.sort((a, b) => a.order - b.order);

  return sections;
};

/**
 * Calculate estimated translation time based on actual content complexity
 * Returns both AI-assisted time and baseline manual time for comparison
 */
const calculateEstimatedTime = (sections: DraftSection[]): {
  aiAssistedHours: number;
  baselineManualHours: number;
  timeSavingsHours: number;
  timeSavingsPercentage: number;
  breakdown: { simple: number; moderate: number; complex: number };
  formattedAiTime: string;
  formattedBaselineTime: string;
} => {
  let aiAssistedHours = 0;
  const breakdown = { simple: 0, moderate: 0, complex: 0 };

  for (const section of sections) {
    // Skip sections with no innovator content (local content only)
    if (section.sourceContent.includes('[NO INNOVATOR CONTENT')) {
      // Local content creation: 1-2 hours per section (AI-assisted research)
      aiAssistedHours += 1.5;
      breakdown.moderate += 1.5;
      continue;
    }

    const { complexity, estimatedHours } = calculateTranslationComplexity(
      section.sourceContent,
      section.translationNotes
    );

    aiAssistedHours += estimatedHours;
    breakdown[complexity] += estimatedHours;
  }

  // Add review time (20% of translation time)
  const reviewHours = aiAssistedHours * 0.2;
  aiAssistedHours += reviewHours;

  // Calculate baseline manual time (without AI assistance)
  // Manual process: section identification (2h) + manual alignment (4h) + gap analysis (2h) + translation (same as AI) + review (30%)
  const manualOverhead = 8; // Hours for manual section identification, alignment, gap analysis
  const manualTranslationMultiplier = 1.5; // Manual translation takes 50% longer without AI-generated outline
  const manualReviewMultiplier = 0.3; // Manual review takes 30% of translation time (vs 20% with AI)
  
  const baselineManualHours = manualOverhead + (aiAssistedHours * manualTranslationMultiplier) + (aiAssistedHours * manualReviewMultiplier);

  // Clamp to realistic ranges
  const clampedAiHours = Math.max(TARGET_MIN_HOURS, Math.min(TARGET_MAX_HOURS, aiAssistedHours));
  const clampedBaselineHours = Math.max(BASELINE_MIN_HOURS, Math.min(BASELINE_MAX_HOURS, baselineManualHours));

  const timeSavingsHours = clampedBaselineHours - clampedAiHours;
  const timeSavingsPercentage = (timeSavingsHours / clampedBaselineHours) * 100;

  // Format time strings
  const formatTime = (hours: number): string => {
    if (hours < 8) {
      return `${hours.toFixed(1)} hours`;
    } else {
      const days = (hours / 8).toFixed(1);
      return `${days} days (${hours.toFixed(0)} hours)`;
    }
  };

  console.log(`[Time Estimation] AI-assisted: ${clampedAiHours.toFixed(1)}h, Baseline manual: ${clampedBaselineHours.toFixed(1)}h, Savings: ${timeSavingsHours.toFixed(1)}h (${timeSavingsPercentage.toFixed(0)}%)`);

  return {
    aiAssistedHours: clampedAiHours,
    baselineManualHours: clampedBaselineHours,
    timeSavingsHours,
    timeSavingsPercentage,
    breakdown,
    formattedAiTime: formatTime(clampedAiHours),
    formattedBaselineTime: formatTime(clampedBaselineHours),
  };
};

/**
 * Generate draft outline structure
 */
export const generateDraftOutline = async (
  params: GenerateDraftOutlineParams
): Promise<DraftOutline> => {
  const sections = buildDraftSections(
    params.alignmentResult,
    params.gapAnalysisResult,
    params.marketConfig.sectionOrdering
  );

  const timeEstimate = calculateEstimatedTime(sections);

  console.log(`[Draft Outline] Generated outline with ${sections.length} sections`);
  console.log(`[Draft Outline] AI-assisted time: ${timeEstimate.formattedAiTime} (vs baseline: ${timeEstimate.formattedBaselineTime})`);
  console.log(`[Draft Outline] Time savings: ${timeEstimate.timeSavingsHours.toFixed(1)}h (${timeEstimate.timeSavingsPercentage.toFixed(0)}%)`);
  console.log(`[Draft Outline] Complexity breakdown: Simple=${timeEstimate.breakdown.simple.toFixed(1)}h, Moderate=${timeEstimate.breakdown.moderate.toFixed(1)}h, Complex=${timeEstimate.breakdown.complex.toFixed(1)}h`);

  return {
    sections,
    metadata: {
      targetMarket: params.marketConfig.name,
      regulatoryAuthority: params.marketConfig.regulatoryAuthority,
      language: params.marketConfig.language,
      generatedAt: new Date().toISOString(),
      totalSections: sections.length,
      estimatedTranslationTime: timeEstimate.formattedAiTime,
      baselineManualTimeHours: timeEstimate.baselineManualHours,
      estimatedAiTimeHours: timeEstimate.aiAssistedHours,
      timeSavingsHours: timeEstimate.timeSavingsHours,
      timeSavingsPercentage: timeEstimate.timeSavingsPercentage,
    },
  };
};

/**
 * Export draft outline to Word document
 */
export const exportDraftOutlineToWord = async (outline: DraftOutline): Promise<string> => {
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: `PIL Draft Outline - ${outline.metadata.targetMarket}`,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      text: `Regulatory Authority: ${outline.metadata.regulatoryAuthority}`,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Target Language: ${outline.metadata.language}`,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Generated: ${new Date(outline.metadata.generatedAt).toLocaleString()}`,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Total Sections: ${outline.metadata.totalSections}`,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Estimated AI-Assisted Time: ${outline.metadata.estimatedTranslationTime}`,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Time Savings vs Manual Process: ${outline.metadata.timeSavingsHours.toFixed(1)} hours (${outline.metadata.timeSavingsPercentage.toFixed(0)}% reduction)`,
          bold: true,
          color: '00AA00',
        }),
      ],
      spacing: { after: 400 },
    })
  );

  // Sections
  for (const section of outline.sections) {
    // Section header
    children.push(
      new Paragraph({
        text: `${section.order}. ${section.sectionName}`,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 },
      })
    );

    // Special attention flag
    if (section.specialAttention) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: '⚠️ SPECIAL ATTENTION REQUIRED',
              bold: true,
              color: 'FF0000',
            }),
          ],
          spacing: { after: 200 },
        })
      );

      if (section.specialAttentionDetails) {
        children.push(
          new Paragraph({
            text: `Type: ${section.specialAttentionDetails.attentionType}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `Description: ${section.specialAttentionDetails.description}`,
            spacing: { after: 200 },
          })
        );
      }
    }

    // Source content
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Source Content (English):',
            bold: true,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: section.sourceContent,
        spacing: { after: 200 },
      })
    );

    // Target requirements
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Target Market Requirements:',
            bold: true,
          }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: section.targetRequirements,
        spacing: { after: 200 },
      })
    );

    // Translation notes
    if (section.translationNotes.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Translation Notes:',
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        })
      );

      for (const note of section.translationNotes) {
        children.push(
          new Paragraph({
            text: `• ${note}`,
            spacing: { after: 100 },
          })
        );
      }

      children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    // Formatting requirements
    if (section.formattingRequirements.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Formatting Requirements:',
              bold: true,
            }),
          ],
          spacing: { after: 100 },
        })
      );

      for (const req of section.formattingRequirements) {
        children.push(
          new Paragraph({
            text: `• ${req}`,
            spacing: { after: 100 },
          })
        );
      }

      children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }

    // Gaps
    if (section.gaps && section.gaps.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Content Gaps:',
              bold: true,
              color: 'FF6600',
            }),
          ],
          spacing: { after: 100 },
        })
      );

      for (const gap of section.gaps) {
        children.push(
          new Paragraph({
            text: `• [${gap.severity.toUpperCase()}] ${gap.description}`,
            spacing: { after: 100 },
          }),
          new Paragraph({
            text: `  Suggested Action: ${gap.suggestedAction}`,
            spacing: { after: 100 },
          })
        );
      }

      children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
    }
  }

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  // Save to temp file
  await fs.mkdir(TEMP_DIR, { recursive: true });
  const outputPath = path.join(TEMP_DIR, `draft-outline-${randomUUID()}.docx`);

  const buffer = await doc.toBuffer();
  await fs.writeFile(outputPath, buffer);

  return outputPath;
};

/**
 * Generate draft outline summary for API response
 */
export const generateDraftOutlineSummary = (outline: DraftOutline): {
  totalSections: number;
  specialAttentionCount: number;
  criticalGapsCount: number;
  estimatedTime: string;
  baselineManualTime: string;
  timeSavingsHours: number;
  timeSavingsPercentage: number;
  sectionBreakdown: { name: string; hasGaps: boolean; specialAttention: boolean }[];
  timeBreakdown: { simple: number; moderate: number; complex: number };
} => {
  const specialAttentionCount = outline.sections.filter((s) => s.specialAttention).length;

  const criticalGapsCount = outline.sections.reduce((count, section) => {
    if (section.gaps) {
      return count + section.gaps.filter((g) => g.severity === 'critical').length;
    }
    return count;
  }, 0);

  const sectionBreakdown = outline.sections.map((s) => ({
    name: s.sectionName,
    hasGaps: !!s.gaps && s.gaps.length > 0,
    specialAttention: s.specialAttention,
  }));

  // Calculate time breakdown
  const timeEstimate = calculateEstimatedTime(outline.sections);

  return {
    totalSections: outline.sections.length,
    specialAttentionCount,
    criticalGapsCount,
    estimatedTime: outline.metadata.estimatedTranslationTime,
    baselineManualTime: timeEstimate.formattedBaselineTime,
    timeSavingsHours: outline.metadata.timeSavingsHours,
    timeSavingsPercentage: outline.metadata.timeSavingsPercentage,
    sectionBreakdown,
    timeBreakdown: {
      simple: parseFloat(timeEstimate.breakdown.simple.toFixed(1)),
      moderate: parseFloat(timeEstimate.breakdown.moderate.toFixed(1)),
      complex: parseFloat(timeEstimate.breakdown.complex.toFixed(1)),
    },
  };
};