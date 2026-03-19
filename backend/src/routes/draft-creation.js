import { Router } from 'express';
import { requireAuth, extractIpAddress } from '../middleware/auth.middleware.js';
import {
  startNewSubmissionWorkflow,
  getWorkflowStatus,
  getWorkflowResults,
} from '../workflows/draft-creation/new-submission/workflow.service.js';
import { exportDraftOutlineToWord, generateDraftOutlineSummary } from '../reports/draft-outline.generator.js';
import { createAuditLog } from '../services/audit.service.js';

const router = Router();

// Apply authentication and IP extraction to all routes
router.use(requireAuth);
router.use(extractIpAddress);

// In-memory workflow storage (in production, use database)
const activeWorkflows = new Map();

/**
 * POST /api/draft-creation/new-submission
 * Initiate New Submission workflow
 */
router.post('/new-submission', async (req, res) => {
  try {
    const { productId, marketId, innovatorPilDocumentId, regulatorySourceDocumentId } = req.body;

    // Validate required fields
    if (!productId || !marketId || !innovatorPilDocumentId || !regulatorySourceDocumentId) {
      return res.status(400).json({
        error: 'Missing required fields: productId, marketId, innovatorPilDocumentId, regulatorySourceDocumentId',
      });
    }

    // Generate workflow ID (in production, create in database)
    const workflowId = Date.now();

    // Start workflow
    const { service, context } = await startNewSubmissionWorkflow({
      workflowId,
      productId,
      marketId,
      innovatorPilDocumentId,
      regulatorySourceDocumentId,
      initiatedByUserId: req.user.id,
    });

    // Store workflow service
    activeWorkflows.set(workflowId, service);

    // Log workflow initiation
    await createAuditLog({
      userId: req.user.id,
      action: 'WorkflowStarted',
      entityType: 'Workflow',
      entityId: workflowId,
      details: {
        type: 'NewSubmission',
        productId,
        marketId,
        innovatorPilDocumentId,
        regulatorySourceDocumentId,
      },
      ipAddress: req.ipAddress,
    });

    res.status(201).json({
      workflowId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('New Submission workflow initiation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/draft-creation/workflows/:id/status
 * Get workflow status
 */
router.get('/workflows/:id/status', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const service = activeWorkflows.get(workflowId);

    if (!service) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const status = getWorkflowStatus(service);

    res.json({
      workflowId,
      type: 'NewSubmission',
      status: status.state,
      progress: status.progress,
      createdAt: new Date(workflowId).toISOString(),
      completedAt: status.state === 'complete' ? new Date().toISOString() : null,
    });
  } catch (error) {
    console.error('Get workflow status failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/draft-creation/workflows/:id/results
 * Get workflow results
 */
router.get('/workflows/:id/results', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const service = activeWorkflows.get(workflowId);

    if (!service) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const status = getWorkflowStatus(service);

    if (status.state !== 'complete') {
      return res.status(400).json({ error: 'Workflow not complete' });
    }

    const results = getWorkflowResults(service.state.context);

    // Generate Word document
    const wordFilePath = await exportDraftOutlineToWord(results.draftOutline);

    // Generate summary
    const summary = generateDraftOutlineSummary(results.draftOutline);

    res.json({
      workflowId,
      type: 'NewSubmission',
      status: 'Complete',
      results: {
        draftOutline: {
          sections: results.draftOutline.sections,
          metadata: results.draftOutline.metadata,
        },
        summary,
        alignmentResult: {
          matchedPairs: results.alignmentResult.metadata.matchedPairs,
          confidence: results.alignmentResult.confidence,
          orphanedSections: results.alignmentResult.orphanedInnovatorSections.length,
          unmatchedSections: results.alignmentResult.unmatchedRegulatorySections.length,
        },
        gapAnalysisResult: {
          totalGaps: results.gapAnalysisResult.metadata.totalGaps,
          criticalGaps: results.gapAnalysisResult.metadata.criticalGaps,
          specialAttentionSections: results.gapAnalysisResult.specialAttentionSections.length,
        },
        downloadUrl: `/api/draft-creation/workflows/${workflowId}/download`,
      },
      metrics: results.metrics,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get workflow results failed:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/draft-creation/workflows/:id/download
 * Download draft outline Word document
 */
router.get('/workflows/:id/download', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.id);
    const service = activeWorkflows.get(workflowId);

    if (!service) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const status = getWorkflowStatus(service);

    if (status.state !== 'complete') {
      return res.status(400).json({ error: 'Workflow not complete' });
    }

    const results = getWorkflowResults(service.state.context);

    // Generate Word document
    const wordFilePath = await exportDraftOutlineToWord(results.draftOutline);

    // Send file
    res.download(wordFilePath, `PIL-Draft-Outline-${workflowId}.docx`, (err) => {
      if (err) {
        console.error('Download failed:', err);
      }
      // Clean up temp file
      import('fs').then((fs) => fs.promises.unlink(wordFilePath).catch(() => {}));
    });
  } catch (error) {
    console.error('Download draft outline failed:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;