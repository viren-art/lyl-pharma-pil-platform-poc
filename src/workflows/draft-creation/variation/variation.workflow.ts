// LYL_DEP: xstate@^5.0.0

import { createMachine, assign, fromPromise } from 'xstate';
import type { ExtractionResult } from '../../../extraction/extraction.schema';
import { routeExtraction } from '../../../extraction/router.service';
import { classifyVariation, type VariationClassification } from '../../../variation/classifier.service';
import { generateComplicatedDiff, type ComplicatedDiff } from '../../../variation/diff-generator.service';
import { generateRevisionComments, type RevisionComments } from '../../../variation/revision-comments.generator';
import { createAuditLog } from '../../../services/audit.service';

export interface VariationWorkflowContext {
  workflowId: number;
  productId: number;
  marketId: number;
  approvedPilDocumentId: number;
  changeTriggerDocumentId: number;
  approvedPilExtraction?: ExtractionResult;
  changeTriggerExtraction?: ExtractionResult;
  classification?: VariationClassification;
  complicatedDiff?: ComplicatedDiff;
  revisionComments?: RevisionComments;
  error?: string;
  userId: number;
  ipAddress?: string;
}

export type VariationWorkflowEvent =
  | { type: 'START' }
  | { type: 'EXTRACTION_COMPLETE' }
  | { type: 'CLASSIFICATION_COMPLETE' }
  | { type: 'DIFF_COMPLETE' }
  | { type: 'COMMENTS_COMPLETE' }
  | { type: 'ERROR'; error: string };

/**
 * Extract approved PIL document
 */
const extractApprovedPil = fromPromise(async ({ input }: { input: VariationWorkflowContext }) => {
  const result = await routeExtraction({
    documentId: input.approvedPilDocumentId,
    filePath: '', // Will be fetched from database
    marketId: input.marketId,
    language: '', // Will be fetched from market config
    documentType: 'ApprovedPIL',
  });

  await createAuditLog({
    userId: input.userId,
    action: 'ExtractionCompleted',
    entityType: 'Document',
    entityId: input.approvedPilDocumentId,
    details: {
      workflowId: input.workflowId,
      provider: result.provider,
      processingTimeMs: result.processingTimeMs,
      averageConfidence: result.averageConfidence,
    },
    ipAddress: input.ipAddress,
  });

  return result;
});

/**
 * Extract change trigger document
 */
const extractChangeTrigger = fromPromise(async ({ input }: { input: VariationWorkflowContext }) => {
  const result = await routeExtraction({
    documentId: input.changeTriggerDocumentId,
    filePath: '',
    marketId: input.marketId,
    language: '',
    documentType: 'RegulatoryAnnouncement', // Could be InnovatorPIL or CommercialAW
  });

  await createAuditLog({
    userId: input.userId,
    action: 'ExtractionCompleted',
    entityType: 'Document',
    entityId: input.changeTriggerDocumentId,
    details: {
      workflowId: input.workflowId,
      provider: result.provider,
      processingTimeMs: result.processingTimeMs,
      averageConfidence: result.averageConfidence,
    },
    ipAddress: input.ipAddress,
  });

  return result;
});

/**
 * Classify variation type
 */
const classifyVariationType = fromPromise(async ({ input }: { input: VariationWorkflowContext }) => {
  if (!input.approvedPilExtraction || !input.changeTriggerExtraction) {
    throw new Error('Extractions not available for classification');
  }

  const classification = await classifyVariation(
    input.approvedPilExtraction,
    input.changeTriggerExtraction,
    input.marketId
  );

  await createAuditLog({
    userId: input.userId,
    action: 'ComparisonCompleted',
    entityType: 'Workflow',
    entityId: input.workflowId,
    details: {
      classificationType: classification.type,
      confidence: classification.confidence,
      rationale: classification.rationale,
      sectionsAffected: classification.sectionsAffected,
    },
    ipAddress: input.ipAddress,
  });

  return classification;
});

/**
 * Generate complicated variation diff
 */
const generateDiff = fromPromise(async ({ input }: { input: VariationWorkflowContext }) => {
  if (!input.approvedPilExtraction || !input.changeTriggerExtraction) {
    throw new Error('Extractions not available for diff generation');
  }

  const diff = await generateComplicatedDiff(
    input.approvedPilExtraction,
    input.changeTriggerExtraction,
    input.marketId
  );

  await createAuditLog({
    userId: input.userId,
    action: 'ComparisonCompleted',
    entityType: 'Workflow',
    entityId: input.workflowId,
    details: {
      diffType: 'complicated',
      sectionsChanged: diff.sections.length,
      totalChanges: diff.sections.reduce((sum, s) => sum + s.changes.length, 0),
    },
    ipAddress: input.ipAddress,
  });

  return diff;
});

/**
 * Generate general variation revision comments
 */
const generateComments = fromPromise(async ({ input }: { input: VariationWorkflowContext }) => {
  if (!input.approvedPilExtraction || !input.changeTriggerExtraction) {
    throw new Error('Extractions not available for comments generation');
  }

  const comments = await generateRevisionComments(
    input.approvedPilExtraction,
    input.changeTriggerExtraction,
    input.marketId
  );

  await createAuditLog({
    userId: input.userId,
    action: 'ComparisonCompleted',
    entityType: 'Workflow',
    entityId: input.workflowId,
    details: {
      commentsType: 'general',
      totalComments: comments.comments.length,
      sectionsAffected: [...new Set(comments.comments.map(c => c.sectionName))].length,
    },
    ipAddress: input.ipAddress,
  });

  return comments;
});

/**
 * Variation workflow state machine
 */
export const variationWorkflowMachine = createMachine({
  id: 'variationWorkflow',
  initial: 'idle',
  types: {} as {
    context: VariationWorkflowContext;
    events: VariationWorkflowEvent;
  },
  context: {} as VariationWorkflowContext,
  states: {
    idle: {
      on: {
        START: 'extractingApprovedPil',
      },
    },
    extractingApprovedPil: {
      invoke: {
        src: extractApprovedPil,
        input: ({ context }) => context,
        onDone: {
          target: 'extractingChangeTrigger',
          actions: assign({
            approvedPilExtraction: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'failed',
          actions: assign({
            error: ({ event }) => event.error?.message || 'Approved PIL extraction failed',
          }),
        },
      },
    },
    extractingChangeTrigger: {
      invoke: {
        src: extractChangeTrigger,
        input: ({ context }) => context,
        onDone: {
          target: 'classifying',
          actions: assign({
            changeTriggerExtraction: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'failed',
          actions: assign({
            error: ({ event }) => event.error?.message || 'Change trigger extraction failed',
          }),
        },
      },
    },
    classifying: {
      invoke: {
        src: classifyVariationType,
        input: ({ context }) => context,
        onDone: [
          {
            target: 'generatingDiff',
            guard: ({ event }) => event.output.type === 'complicated',
            actions: assign({
              classification: ({ event }) => event.output,
            }),
          },
          {
            target: 'generatingComments',
            guard: ({ event }) => event.output.type === 'general',
            actions: assign({
              classification: ({ event }) => event.output,
            }),
          },
        ],
        onError: {
          target: 'failed',
          actions: assign({
            error: ({ event }) => event.error?.message || 'Classification failed',
          }),
        },
      },
    },
    generatingDiff: {
      invoke: {
        src: generateDiff,
        input: ({ context }) => context,
        onDone: {
          target: 'complete',
          actions: assign({
            complicatedDiff: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'failed',
          actions: assign({
            error: ({ event }) => event.error?.message || 'Diff generation failed',
          }),
        },
      },
    },
    generatingComments: {
      invoke: {
        src: generateComments,
        input: ({ context }) => context,
        onDone: {
          target: 'complete',
          actions: assign({
            revisionComments: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'failed',
          actions: assign({
            error: ({ event }) => event.error?.message || 'Comments generation failed',
          }),
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
 * Get workflow status from state
 */
export const getWorkflowStatus = (state: string): 'Pending' | 'Extracting' | 'Comparing' | 'Complete' | 'Failed' => {
  if (state === 'idle') return 'Pending';
  if (state.includes('extracting')) return 'Extracting';
  if (state === 'classifying' || state.includes('generating')) return 'Comparing';
  if (state === 'complete') return 'Complete';
  if (state === 'failed') return 'Failed';
  return 'Pending';
};

/**
 * Get current step description
 */
export const getCurrentStep = (state: string): string => {
  const steps: Record<string, string> = {
    idle: 'Waiting to start',
    extractingApprovedPil: 'Extracting Approved PIL',
    extractingChangeTrigger: 'Extracting change trigger document',
    classifying: 'Classifying variation type',
    generatingDiff: 'Generating section-by-section diff',
    generatingComments: 'Generating revision comments',
    complete: 'Workflow complete',
    failed: 'Workflow failed',
  };
  return steps[state] || 'Processing';
};

/**
 * Calculate progress percentage
 */
export const getProgressPercentage = (state: string): number => {
  const progress: Record<string, number> = {
    idle: 0,
    extractingApprovedPil: 20,
    extractingChangeTrigger: 40,
    classifying: 60,
    generatingDiff: 80,
    generatingComments: 80,
    complete: 100,
    failed: 0,
  };
  return progress[state] || 0;
};