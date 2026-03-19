/**
 * New Submission Workflow Schema
 * Defines state machine and data structures for PIL draft creation from Innovator PIL + Regulatory Source
 */

export interface NewSubmissionWorkflowContext {
  workflowId: number;
  productId: number;
  marketId: number;
  innovatorPilDocumentId: number;
  regulatorySourceDocumentId: number;
  initiatedByUserId: number;
  
  // Extraction results
  innovatorExtraction?: any;
  regulatoryExtraction?: any;
  
  // Alignment results
  alignmentResult?: SectionAlignmentResult;
  
  // Gap analysis results
  gapAnalysisResult?: GapAnalysisResult;
  
  // Draft outline
  draftOutline?: DraftOutline;
  
  // Error tracking
  error?: string;
  
  // Metrics
  startTime: number;
  extractionTime?: number;
  alignmentTime?: number;
  gapAnalysisTime?: number;
  outlineGenerationTime?: number;
}

export interface SectionAlignmentResult {
  alignments: SectionAlignment[];
  orphanedInnovatorSections: OrphanedSection[];
  unmatchedRegulatorySections: UnmatchedSection[];
  confidence: number;
  metadata: {
    totalInnovatorSections: number;
    totalRegulatorySections: number;
    matchedPairs: number;
    processingTimeMs: number;
  };
}

export interface SectionAlignment {
  innovatorSection: {
    name: string;
    content: string;
    pageReferences: number[];
  };
  regulatorySection: {
    name: string;
    requirements: string;
    order: number;
    mandatory: boolean;
  };
  confidence: number;
  alignmentType: 'exact' | 'semantic' | 'partial' | 'inferred';
  notes: string[];
}

export interface OrphanedSection {
  sectionName: string;
  content: string;
  pageReferences: number[];
  reason: string; // "No matching regulatory section" | "Content not required in target market"
  suggestedDisposition: string; // "Omit" | "Merge with section X" | "Add as supplementary"
}

export interface UnmatchedSection {
  sectionName: string;
  requirements: string;
  order: number;
  mandatory: boolean;
  reason: string; // "Not present in Innovator PIL" | "Requires local content"
}

export interface GapAnalysisResult {
  gaps: ContentGap[];
  translationRequirements: TranslationRequirement[];
  specialAttentionSections: SpecialAttentionSection[];
  metadata: {
    totalGaps: number;
    criticalGaps: number;
    processingTimeMs: number;
  };
}

export interface ContentGap {
  regulatorySectionName: string;
  gapType: 'missing_section' | 'missing_content' | 'insufficient_detail' | 'local_requirement';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  regulatoryRequirement: string;
  suggestedAction: string;
}

export interface TranslationRequirement {
  sectionName: string;
  sourceLanguage: string;
  targetLanguage: string;
  complexity: 'simple' | 'moderate' | 'complex';
  notes: string[];
  estimatedEffort: string; // "1-2 hours" | "4-8 hours"
}

export interface SpecialAttentionSection {
  sectionName: string;
  attentionType: 'dosage_table' | 'chemical_formula' | 'local_contacts' | 'unit_conversion' | 'regulatory_reference' | 'complex_formatting';
  description: string;
  requirements: string[];
  examples?: string[];
}

export interface DraftOutline {
  sections: DraftSection[];
  metadata: {
    targetMarket: string;
    regulatoryAuthority: string;
    language: string;
    generatedAt: string;
    totalSections: number;
    estimatedTranslationTime: string;
  };
}

export interface DraftSection {
  order: number;
  sectionName: string;
  sourceContent: string; // English from Innovator PIL
  targetRequirements: string; // From Regulatory Source
  translationNotes: string[];
  formattingRequirements: string[];
  specialAttention: boolean;
  specialAttentionDetails?: SpecialAttentionSection;
  gaps?: ContentGap[];
}

export type NewSubmissionWorkflowState =
  | 'idle'
  | 'extracting_innovator'
  | 'extracting_regulatory'
  | 'aligning_sections'
  | 'analyzing_gaps'
  | 'generating_outline'
  | 'complete'
  | 'failed';

export type NewSubmissionWorkflowEvent =
  | { type: 'START' }
  | { type: 'INNOVATOR_EXTRACTED'; extraction: any }
  | { type: 'REGULATORY_EXTRACTED'; extraction: any }
  | { type: 'SECTIONS_ALIGNED'; result: SectionAlignmentResult }
  | { type: 'GAPS_ANALYZED'; result: GapAnalysisResult }
  | { type: 'OUTLINE_GENERATED'; outline: DraftOutline }
  | { type: 'ERROR'; error: string };