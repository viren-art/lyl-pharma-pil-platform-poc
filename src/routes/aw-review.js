import { Router } from 'express';
import { requireAuth, extractIpAddress } from '../middleware/auth.middleware.js';
import {
  initiateAWReview,
  getWorkflowStatus,
  getWorkflowResults
} from '../workflows/aw-review/aw-review.service.js';
import { createAuditLog } from '../services/audit.service.js';

const router = Router();

// Apply authentication and IP extraction to all routes
router.use(requireAuth);
router.use(extractIpAddress);

/**
 * POST /api/aw-review/initiate
 * Initiate AW Review workflow
 */
router.post('/initiate', async (req, res) => {
  try {
    const { productId, marketId, awDraftDocumentId, approvedPilDocumentId } = req.body;

    // Validate required fields
    if (!productId || !marketId || !awDraftDocumentId || !approvedPilDocumentId) {
      return res.status(400).json({
        error: 'Missing required fields: productId, marketId, awDraftDocumentId, approvedPilDocumentId'
      });
    }

    // Initiate workflow
    const result = await initiateAWReview({
      productId,
      marketId,
      awDraftDocumentId,
      approvedPilDocumentId,
      initiatedByUserId: req.user.id
    });

    // Log workflow initiation
    await createAuditLog({
      userId: req.user.id,
      action: 'WorkflowStarted',
      entityType: 'Workflow',
      entityId: result.workflowId,
      details: {
        workflowType: 'AWReview',
        productId,
        marketId,
        awDraftDocumentId,
        approvedPilDocumentId
      },
      ipAddress: req.ipAddress
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('AW Review initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/aw-review/status/:workflowId
 * Get workflow status
 */
router.get('/status/:workflowId', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.workflowId);

    if (isNaN(workflowId)) {
      return res.status(400).json({ error: 'Invalid workflow ID' });
    }

    const status = await getWorkflowStatus(workflowId);

    res.status(200).json(status);
  } catch (error) {
    console.error('Get workflow status error:', error);
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/aw-review/results/:workflowId
 * Get workflow results
 */
router.get('/results/:workflowId', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.workflowId);

    if (isNaN(workflowId)) {
      return res.status(400).json({ error: 'Invalid workflow ID' });
    }

    const results = await getWorkflowResults(workflowId);

    res.status(200).json(results);
  } catch (error) {
    console.error('Get workflow results error:', error);

    if (error.message === 'Workflow not complete') {
      return res.status(400).json({ error: error.message });
    }

    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/aw-review/workflows
 * List all AW Review workflows
 */
router.get('/workflows', async (req, res) => {
  try {
    // In production, this would query the database
    // For MVP, return mock data
    const mockWorkflows = [
      {
        id: 1,
        productId: 1,
        productName: 'Paracetamol 500mg',
        marketId: 1,
        marketName: 'Taiwan',
        status: 'Complete',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        deviationCount: 15
      },
      {
        id: 2,
        productId: 2,
        productName: 'Ibuprofen 400mg',
        marketId: 2,
        marketName: 'Thailand',
        status: 'Comparing',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        completedAt: null,
        deviationCount: null
      }
    ];

    res.status(200).json({ workflows: mockWorkflows });
  } catch (error) {
    console.error('List workflows error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;