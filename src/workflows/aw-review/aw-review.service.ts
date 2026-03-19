import { createAWReviewWorkflow, type AWReviewContext } from './aw-review.workflow';
import { routeExtraction } from '../../extraction/router.service';
import { detectDeviations } from '../../comparison/deviation-detector.service';
import { generateDeviationReport } from '../../reports/deviation-report.generator';
import { prisma } from '../../database/prisma.client';
import { createAuditLog } from '../../services/audit.service';

export interface InitiateAWReviewRequest {
  productId: number;
  marketId: number;
  awDraftDocumentId: number;
  approvedPilDocumentId: number;
  initiatedByUserId: number;
}

export interface AWReviewWorkflowStatus {
  workflowId: number;
  status: 'Pending' | 'Extracting' | 'Comparing' | 'Complete' | 'Failed';
  progress: {
    currentStep: string;
    percentComplete: number;
  };
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
  performanceMetrics?: {
    processingTimeMs: number;
    accuracyMetrics?: {
      averageConfidence: number;
      lowConfidenceCount: number;
    };
  };
}

export interface AWReviewWorkflowResult {
  workflowId: number;
  deviationReport: {
    deviations: Array<{
      id: number;
      sectionName: string;
      severity: 'Critical' | 'Major' | 'Minor';
      description: string;
      pageReference: number;
      approvedText: string;
      awText: string;
      confidenceScore?: number;
    }>;
    summary: {
      totalDeviations: number;
      criticalCount: number;
      majorCount: number;
      minorCount: number;
    };
    downloadUrl: string;
    accuracyMetrics?: {
      averageConfidence: number;
      lowConfidenceCount: number;
    };
  };
  completedAt: string;
  processingTimeMs: number;
}

/**
 * Initiate AW Review workflow
 */
export const initiateAWReview = async (
  request: InitiateAWReviewRequest
): Promise<{ workflowId: number; status: string }> => {
  // Create workflow record
  const workflow = await prisma.workflow.create({
    data: {
      type: 'AWReview',
      productId: request.productId,
      marketId: request.marketId,
      sourceDocumentIds: [request.awDraftDocumentId, request.approvedPilDocumentId],
      initiatedByUserId: request.initiatedByUserId,
      status: 'Pending'
    }
  });

  // Create audit log
  await createAuditLog({
    userId: request.initiatedByUserId,
    action: 'WorkflowStarted',
    entityType: 'Workflow',
    entityId: workflow.id,
    details: {
      workflowType: 'AWReview',
      productId: request.productId,
      marketId: request.marketId,
      awDraftDocumentId: request.awDraftDocumentId,
      approvedPilDocumentId: request.approvedPilDocumentId
    }
  });

  // Start workflow execution asynchronously
  executeAWReviewWorkflow(workflow.id, request).catch(async (error) => {
    await prisma.workflow.update({
      where: { id: workflow.id },
      data: { status: 'Failed' }
    });
    console.error(`AW Review workflow ${workflow.id} failed:`, error);
  });

  return {
    workflowId: workflow.id,
    status: 'Pending'
  };
};

/**
 * Execute AW Review workflow with performance monitoring
 */
const executeAWReviewWorkflow = async (
  workflowId: number,
  request: InitiateAWReviewRequest
): Promise<void> => {
  const workflowStartTime = Date.now();

  // Get documents
  const [awDraftDoc, approvedPilDoc] = await Promise.all([
    prisma.document.findUnique({ where: { id: request.awDraftDocumentId } }),
    prisma.document.findUnique({ where: { id: request.approvedPilDocumentId } })
  ]);

  if (!awDraftDoc || !approvedPilDoc) {
    throw new Error('Documents not found');
  }

  // Create workflow state machine
  const context: AWReviewContext = {
    workflowId,
    productId: request.productId,
    marketId: request.marketId,
    awDraftDocumentId: request.awDraftDocumentId,
    approvedPilDocumentId: request.approvedPilDocumentId,
    initiatedByUserId: request.initiatedByUserId,
    startTime: Date.now()
  };

  const service = createAWReviewWorkflow(context);

  // Subscribe to state changes
  service.subscribe(async (state) => {
    const statusMap: Record<string, 'Pending' | 'Extracting' | 'Comparing' | 'Complete' | 'Failed'> = {
      idle: 'Pending',
      extractingDocuments: 'Extracting',
      comparing: 'Comparing',
      complete: 'Complete',
      failed: 'Failed'
    };

    const status = statusMap[state.value as string] || 'Pending';

    await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status,
        completedAt: status === 'Complete' ? new Date() : undefined
      }
    });
  });

  service.start();

  // Start extraction
  service.send({ type: 'START_EXTRACTION' });

  // Update status to Extracting
  await prisma.workflow.update({
    where: { id: workflowId },
    data: { status: 'Extracting' }
  });

  try {
    // Extract AW Draft
    const awDraftExtraction = await routeExtraction({
      documentId: request.awDraftDocumentId,
      filePath: awDraftDoc.filePath,
      marketId: request.marketId,
      language: awDraftDoc.language,
      documentType: awDraftDoc.type
    });

    service.send({ type: 'AW_DRAFT_EXTRACTED', extraction: awDraftExtraction });

    // Extract Approved PIL
    const approvedPilExtraction = await routeExtraction({
      documentId: request.approvedPilDocumentId,
      filePath: approvedPilDoc.filePath,
      marketId: request.marketId,
      language: approvedPilDoc.language,
      documentType: approvedPilDoc.type
    });

    service.send({ type: 'APPROVED_PIL_EXTRACTED', extraction: approvedPilExtraction });

    // Update status to Comparing
    await prisma.workflow.update({
      where: { id: workflowId },
      data: { status: 'Comparing' }
    });

    // Detect deviations with performance monitoring
    const comparisonStartTime = Date.now();
    const deviationReport = await detectDeviations({
      awDraftExtraction,
      approvedPilExtraction,
      marketId: request.marketId
    });
    const comparisonTimeMs = Date.now() - comparisonStartTime;

    // Verify performance SLA
    if (comparisonTimeMs > 60000) {
      console.warn(`Comparison exceeded 60s SLA: ${comparisonTimeMs}ms`);
    }

    // Store comparison results with performance metrics
    const comparison = await prisma.comparison.create({
      data: {
        workflowId,
        documentAId: request.awDraftDocumentId,
        documentBId: request.approvedPilDocumentId,
        comparisonType: 'Deviation',
        results: {
          ...deviationReport,
          performanceMetrics: {
            comparisonTimeMs,
            accuracyMetrics: deviationReport.accuracyMetrics
          }
        } as any
      }
    });

    // Store individual deviations with confidence scores
    await Promise.all(
      deviationReport.deviations.map((deviation) =>
        prisma.deviation.create({
          data: {
            comparisonId: comparison.id,
            sectionName: deviation.sectionName,
            severity: deviation.severity,
            description: deviation.description,
            pageReference: deviation.pageReference,
            approvedText: deviation.approvedText,
            awText: deviation.awText
          }
        })
      )
    );

    // Generate PDF report
    const reportUrl = await generateDeviationReport({
      workflowId,
      deviationReport,
      awDraftExtraction,
      approvedPilExtraction
    });

    // Update comparison with report URL
    await prisma.comparison.update({
      where: { id: comparison.id },
      data: {
        results: {
          ...deviationReport,
          reportUrl,
          performanceMetrics: {
            comparisonTimeMs,
            accuracyMetrics: deviationReport.accuracyMetrics
          }
        } as any
      }
    });

    service.send({ type: 'COMPARISON_COMPLETE', report: deviationReport });

    const totalProcessingTimeMs = Date.now() - workflowStartTime;

    // Create audit log for completion with performance metrics
    await createAuditLog({
      userId: request.initiatedByUserId,
      action: 'ComparisonCompleted',
      entityType: 'Workflow',
      entityId: workflowId,
      details: {
        comparisonId: comparison.id,
        totalDeviations: deviationReport.summary.totalDeviations,
        criticalCount: deviationReport.summary.criticalCount,
        majorCount: deviationReport.summary.majorCount,
        minorCount: deviationReport.summary.minorCount,
        processingTimeMs: totalProcessingTimeMs,
        comparisonTimeMs,
        averageConfidence: deviationReport.accuracyMetrics?.averageConfidence,
        lowConfidenceCount: deviationReport.accuracyMetrics?.lowConfidenceCount
      }
    });
  } catch (error) {
    service.send({ type: 'ERROR', error: (error as Error).message });
    throw error;
  }
};

/**
 * Get workflow status with performance metrics
 */
export const getWorkflowStatus = async (workflowId: number): Promise<AWReviewWorkflowStatus> => {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      comparisons: true
    }
  });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  const progressMap: Record<string, { step: string; percent: number }> = {
    Pending: { step: 'Initializing workflow', percent: 0 },
    Extracting: { step: 'Extracting documents', percent: 33 },
    Comparing: { step: 'Detecting deviations', percent: 66 },
    Complete: { step: 'Workflow complete', percent: 100 },
    Failed: { step: 'Workflow failed', percent: 0 }
  };

  const progress = progressMap[workflow.status] || { step: 'Unknown', percent: 0 };

  // Extract performance metrics from comparison results
  let performanceMetrics;
  if (workflow.comparisons.length > 0) {
    const results = workflow.comparisons[0].results as any;
    if (results.performanceMetrics) {
      performanceMetrics = {
        processingTimeMs: results.performanceMetrics.comparisonTimeMs,
        accuracyMetrics: results.performanceMetrics.accuracyMetrics
      };
    }
  }

  return {
    workflowId: workflow.id,
    status: workflow.status as any,
    progress: {
      currentStep: progress.step,
      percentComplete: progress.percent
    },
    createdAt: workflow.createdAt.toISOString(),
    completedAt: workflow.completedAt?.toISOString(),
    performanceMetrics
  };
};

/**
 * Get workflow results with accuracy metrics
 */
export const getWorkflowResults = async (workflowId: number): Promise<AWReviewWorkflowResult> => {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      comparisons: {
        include: {
          deviations: true
        }
      }
    }
  });

  if (!workflow) {
    throw new Error('Workflow not found');
  }

  if (workflow.status !== 'Complete') {
    throw new Error('Workflow not complete');
  }

  const comparison = workflow.comparisons[0];
  if (!comparison) {
    throw new Error('Comparison results not found');
  }

  const results = comparison.results as any;
  const processingTimeMs = results.performanceMetrics?.comparisonTimeMs || 0;

  return {
    workflowId: workflow.id,
    deviationReport: {
      deviations: comparison.deviations.map((d) => ({
        id: d.id,
        sectionName: d.sectionName,
        severity: d.severity as 'Critical' | 'Major' | 'Minor',
        description: d.description,
        pageReference: d.pageReference,
        approvedText: d.approvedText || '',
        awText: d.awText || '',
        confidenceScore: results.deviations?.find((rd: any) => rd.sectionName === d.sectionName)?.confidenceScore
      })),
      summary: results.summary,
      downloadUrl: results.reportUrl,
      accuracyMetrics: results.performanceMetrics?.accuracyMetrics
    },
    completedAt: workflow.completedAt!.toISOString(),
    processingTimeMs
  };
};