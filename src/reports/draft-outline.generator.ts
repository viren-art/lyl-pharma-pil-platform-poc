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
 * Calculate estimated translation time
 */
const calculateEstimatedTime = (translationRequirements: any[]): string => {
  let totalHours = 0;

  for (const req of translationRequirements) {
    const effort = req.estimatedEffort || '2-4 hours';
    const match = effort.match(/(\d+)-(\d+)/);
    if (match) {
      const avg = (parseInt(match[1]) + parseInt(match[2])) / 2;
      totalHours += avg;
    }
  }

  if (totalHours < 8) {
    return `${totalHours.toFixed(0)} hours`;
  } else {
    const days = (totalHours / 8).toFixed(1);
    return `${days} days (${totalHours.toFixed(0)} hours)`;
  }
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

  const estimatedTime = calculateEstimatedTime(params.gapAnalysisResult.translationRequirements);

  return {
    sections,
    metadata: {
      targetMarket: params.marketConfig.name,
      regulatoryAuthority: params.marketConfig.regulatoryAuthority,
      language: params.marketConfig.language,
      generatedAt: new Date().toISOString(),
      totalSections: sections.length,
      estimatedTranslationTime: estimatedTime,
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
      text: `Estimated Translation Time: ${outline.metadata.estimatedTranslationTime}`,
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
  sectionBreakdown: { name: string; hasGaps: boolean; specialAttention: boolean }[];
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

  return {
    totalSections: outline.sections.length,
    specialAttentionCount,
    criticalGapsCount,
    estimatedTime: outline.metadata.estimatedTranslationTime,
    sectionBreakdown,
  };
};