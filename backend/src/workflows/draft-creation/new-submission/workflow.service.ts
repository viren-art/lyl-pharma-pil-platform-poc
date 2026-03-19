// LYL_DEP: xstate@^5.0.0

import { createMachine, interpret } from 'xstate';
import type {
  NewSubmissionWorkflowContext,
  NewSubmissionWorkflowState,
  NewSubmissionWorkflowEvent,
} from './workflow.schema';
import { routeExtraction } from '../../../extraction/router.service';
import { alignSections } from '../../../alignment/section-aligner.service';
import { analyzeGaps } from '../../../alignment/gap-analyzer.service';
import { generateDraftOutline } from '../../../reports/draft-outline.generator';
import { createAuditLog } from '../../../services/audit.service';
import { getDocumentById } from '../../../services/document.service';
import { getMarketById } from '../../../services/market.service';

/**
 * New Submission Workflow State Machine
 */
const newSubmissionMachine = createMachine({
  id: 'newSubmission',
  initial: 'idle' as NewSubmissionWorkflowState,
  context: {} as NewSubmissionWorkflowContext,
  states: {
    idle: {
      on: {
        START: 'extracting_innovator',
      },
    },
    extracting_innovator: {
      invoke: {
        src: 'extractInnovatorPil',
        onDone: {
          target: 'extracting_regulatory',
          actions: 'saveInnovatorExtraction',
        },
        onError: {
          target: 'failed',
          actions: 'saveError',
        },
      },
    },
    extracting_regulatory: {
      invoke: {
        src: 'extractRegulatorySource',
        onDone: {
          target: 'aligning_sections',
          actions: 'saveRegulatoryExtraction',
        },
        onError: {
          target: 'failed',
          actions: 'saveError',
        },
      },
    },
    aligning_sections: {
      invoke: {
        src: 'alignSections',
        onDone: {
          target: 'analyzing_gaps',
          actions: 'saveAlignmentResult',
        },
        onError: {
          target: 'failed',
          actions: 'saveError',
        },
      },
    },
    analyzing_gaps: {
      invoke: {
        src: 'analyzeGaps',
        onDone: {
          target: 'generating_outline',
          actions: 'saveGapAnalysisResult',
        },
        onError: {
          target: 'failed',
          actions: 'saveError',
        },
      },
    },
    generating_outline: {
      invoke: {
        src: 'generateOutline',
        onDone: {
          target: 'complete',
          actions: 'saveDraftOutline',
        },
        onError: {
          target: 'failed',
          actions: 'saveError',
        },
      },
    },
    complete: {
      type: 'final',
    },
    failed: {
      type: 'final',
    },
  },
});

/**
 * Initialize and start New Submission workflow
 */
export const startNewSubmissionWorkflow = async (params: {
  workflowId: number;
  productId: number;
  marketId: number;
  innovatorPilDocumentId: number;
  regulatorySourceDocumentId: number;
  initiatedByUserId: number;
}): Promise<{ service: any; context: NewSubmissionWorkflowContext }> => {
  const context: NewSubmissionWorkflowContext = {
    ...params,
    startTime: Date.now(),
  };

  const service = interpret(
    newSubmissionMachine.withContext(context).withConfig({
      services: {
        extractInnovatorPil: async (ctx) => {
          const doc = await getDocumentById(ctx.innovatorPilDocumentId);
          const extractionStart = Date.now();
          
          const result = await routeExtraction({
            documentId: ctx.innovatorPilDocumentId,
            filePath: doc.filePath,
            marketId: ctx.marketId,
            language: 'en', // Innovator PIL is always English
            documentType: 'InnovatorPIL',
          });

          ctx.extractionTime = Date.now() - extractionStart;
          
          await createAuditLog({
            userId: ctx.initiatedByUserId,
            action: 'ExtractionCompleted',
            entityType: 'Document',
            entityId: ctx.innovatorPilDocumentId,
            details: {
              workflowId: ctx.workflowId,
              provider: result.provider,
              processingTimeMs: result.processingTimeMs,
              averageConfidence: result.averageConfidence,
            },
          });

          return result;
        },

        extractRegulatorySource: async (ctx) => {
          const doc = await getDocumentById(ctx.regulatorySourceDocumentId);
          const market = await getMarketById(ctx.marketId);
          const extractionStart = Date.now();
          
          const result = await routeExtraction({
            documentId: ctx.regulatorySourceDocumentId,
            filePath: doc.filePath,
            marketId: ctx.marketId,
            language: market.language,
            documentType: 'RegulatorySource',
          });

          if (!ctx.extractionTime) ctx.extractionTime = 0;
          ctx.extractionTime += Date.now() - extractionStart;
          
          await createAuditLog({
            userId: ctx.initiatedByUserId,
            action: 'ExtractionCompleted',
            entityType: 'Document',
            entityId: ctx.regulatorySourceDocumentId,
            details: {
              workflowId: ctx.workflowId,
              provider: result.provider,
              processingTimeMs: result.processingTimeMs,
              averageConfidence: result.averageConfidence,
            },
          });

          return result;
        },

        alignSections: async (ctx) => {
          if (!ctx.innovatorExtraction || !ctx.regulatoryExtraction) {
            throw new Error('Missing extraction results');
          }

          const alignmentStart = Date.now();
          const market = await getMarketById(ctx.marketId);
          
          const result = await alignSections({
            innovatorSections: ctx.innovatorExtraction.sections,
            regulatorySections: ctx.regulatoryExtraction.sections,
            marketConfig: {
              requiredSections: market.requiredSections,
              sectionOrdering: market.sectionOrdering,
            },
          });

          ctx.alignmentTime = Date.now() - alignmentStart;
          
          await createAuditLog({
            userId: ctx.initiatedByUserId,
            action: 'ComparisonCompleted',
            entityType: 'Workflow',
            entityId: ctx.workflowId,
            details: {
              comparisonType: 'Alignment',
              matchedPairs: result.metadata.matchedPairs,
              confidence: result.confidence,
              processingTimeMs: result.metadata.processingTimeMs,
            },
          });

          return result;
        },

        analyzeGaps: async (ctx) => {
          if (!ctx.alignmentResult) {
            throw new Error('Missing alignment result');
          }

          const gapAnalysisStart = Date.now();
          const market = await getMarketById(ctx.marketId);
          
          const result = await analyzeGaps({
            alignmentResult: ctx.alignmentResult,
            marketConfig: {
              requiredSections: market.requiredSections,
              language: market.language,
              regulatoryAuthority: market.regulatoryAuthority,
            },
          });

          ctx.gapAnalysisTime = Date.now() - gapAnalysisStart;

          return result;
        },

        generateOutline: async (ctx) => {
          if (!ctx.alignmentResult || !ctx.gapAnalysisResult) {
            throw new Error('Missing alignment or gap analysis results');
          }

          const outlineStart = Date.now();
          const market = await getMarketById(ctx.marketId);
          
          const outline = await generateDraftOutline({
            alignmentResult: ctx.alignmentResult,
            gapAnalysisResult: ctx.gapAnalysisResult,
            marketConfig: {
              name: market.name,
              regulatoryAuthority: market.regulatoryAuthority,
              language: market.language,
              sectionOrdering: market.sectionOrdering,
            },
          });

          ctx.outlineGenerationTime = Date.now() - outlineStart;

          return outline;
        },
      },

      actions: {
        saveInnovatorExtraction: (ctx, event: any) => {
          ctx.innovatorExtraction = event.data;
        },
        saveRegulatoryExtraction: (ctx, event: any) => {
          ctx.regulatoryExtraction = event.data;
        },
        saveAlignmentResult: (ctx, event: any) => {
          ctx.alignmentResult = event.data;
        },
        saveGapAnalysisResult: (ctx, event: any) => {
          ctx.gapAnalysisResult = event.data;
        },
        saveDraftOutline: (ctx, event: any) => {
          ctx.draftOutline = event.data;
        },
        saveError: (ctx, event: any) => {
          ctx.error = event.data?.message || 'Unknown error';
        },
      },
    })
  );

  service.start();
  service.send({ type: 'START' });

  return { service, context };
};

/**
 * Get workflow status
 */
export const getWorkflowStatus = (service: any): {
  state: NewSubmissionWorkflowState;
  progress: { currentStep: string; percentComplete: number };
} => {
  const state = service.state.value as NewSubmissionWorkflowState;
  
  const stateToProgress: Record<NewSubmissionWorkflowState, { step: string; percent: number }> = {
    idle: { step: 'Initializing', percent: 0 },
    extracting_innovator: { step: 'Extracting Innovator PIL', percent: 10 },
    extracting_regulatory: { step: 'Extracting Regulatory Source', percent: 30 },
    aligning_sections: { step: 'Aligning sections', percent: 50 },
    analyzing_gaps: { step: 'Analyzing content gaps', percent: 70 },
    generating_outline: { step: 'Generating draft outline', percent: 90 },
    complete: { step: 'Complete', percent: 100 },
    failed: { step: 'Failed', percent: 0 },
  };

  const progress = stateToProgress[state];

  return {
    state,
    progress: {
      currentStep: progress.step,
      percentComplete: progress.percent,
    },
  };
};

/**
 * Get workflow results
 */
export const getWorkflowResults = (context: NewSubmissionWorkflowContext) => {
  if (!context.draftOutline) {
    throw new Error('Workflow not complete');
  }

  return {
    draftOutline: context.draftOutline,
    alignmentResult: context.alignmentResult,
    gapAnalysisResult: context.gapAnalysisResult,
    metrics: {
      totalTimeMs: Date.now() - context.startTime,
      extractionTimeMs: context.extractionTime,
      alignmentTimeMs: context.alignmentTime,
      gapAnalysisTimeMs: context.gapAnalysisTime,
      outlineGenerationTimeMs: context.outlineGenerationTime,
    },
  };
};