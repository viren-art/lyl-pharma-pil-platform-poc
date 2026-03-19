// LYL_DEP: xstate@^5.0.0

import { createMachine, assign, interpret } from 'xstate';
import type { ExtractionResult } from '../../extraction/extraction.schema';
import type { DeviationReport } from '../../comparison/deviation-detector.service';

export interface AWReviewContext {
  workflowId: number;
  productId: number;
  marketId: number;
  awDraftDocumentId: number;
  approvedPilDocumentId: number;
  initiatedByUserId: number;
  awDraftExtraction?: ExtractionResult;
  approvedPilExtraction?: ExtractionResult;
  deviationReport?: DeviationReport;
  error?: string;
  startTime: number;
  endTime?: number;
}

export type AWReviewEvent =
  | { type: 'START_EXTRACTION' }
  | { type: 'AW_DRAFT_EXTRACTED'; extraction: ExtractionResult }
  | { type: 'APPROVED_PIL_EXTRACTED'; extraction: ExtractionResult }
  | { type: 'START_COMPARISON' }
  | { type: 'COMPARISON_COMPLETE'; report: DeviationReport }
  | { type: 'ERROR'; error: string }
  | { type: 'RETRY' };

export const awReviewMachine = createMachine({
  id: 'awReview',
  initial: 'idle',
  context: {} as AWReviewContext,
  states: {
    idle: {
      on: {
        START_EXTRACTION: 'extractingDocuments'
      }
    },
    extractingDocuments: {
      initial: 'extractingAWDraft',
      states: {
        extractingAWDraft: {
          on: {
            AW_DRAFT_EXTRACTED: {
              target: 'extractingApprovedPIL',
              actions: assign({
                awDraftExtraction: ({ event }) => event.extraction
              })
            },
            ERROR: {
              target: '#awReview.failed',
              actions: assign({
                error: ({ event }) => event.error
              })
            }
          }
        },
        extractingApprovedPIL: {
          on: {
            APPROVED_PIL_EXTRACTED: {
              target: '#awReview.comparing',
              actions: assign({
                approvedPilExtraction: ({ event }) => event.extraction
              })
            },
            ERROR: {
              target: '#awReview.failed',
              actions: assign({
                error: ({ event }) => event.error
              })
            }
          }
        }
      }
    },
    comparing: {
      entry: assign({
        startTime: () => Date.now()
      }),
      on: {
        COMPARISON_COMPLETE: {
          target: 'complete',
          actions: assign({
            deviationReport: ({ event }) => event.report,
            endTime: () => Date.now()
          })
        },
        ERROR: {
          target: 'failed',
          actions: assign({
            error: ({ event }) => event.error
          })
        }
      }
    },
    complete: {
      type: 'final'
    },
    failed: {
      on: {
        RETRY: 'idle'
      }
    }
  }
});

export const createAWReviewWorkflow = (context: AWReviewContext) => {
  return interpret(awReviewMachine.withContext(context));
};