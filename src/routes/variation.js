import { Router } from 'express';
import { requireAuth, extractIpAddress } from '../middleware/auth.middleware.js';
import { interpret } from 'xstate';
import { variationWorkflowMachine, getWorkflowStatus, getCurrentStep, getProgressPercentage } from '../workflows/draft-creation/variation/variation.workflow.js';
import { exportRevisionCommentsToDocument } from '../variation/revision-comments.generator.js';
import { createAuditLog } from '../services/audit.service.js';
import { getDocumentById } from '../services/document.service.js';
import { getMarketById } from '../services/market.service.js';

const router = Router();

// Apply authentication and IP extraction to all routes
router.use(requireAuth);
router.use(extractIpAddress);

// In-memory workflow state storage (in production, use database)
const workflowStates = new Map();

/**
 * POST /api/variation/initiate
 * Initiate variation workflow
 */
router.post('/initiate', async (req, res) => {
  try {
    const { productId, marketId, approvedPilDocumentId, changeTriggerDocumentId } = req.body;

    // Validate required fields
    if (!productId || !marketId || !approvedPilDocumentId || !changeTriggerDocumentId) {
      return res.status(400).json({
        error: 'Missing required fields: productId, marketId, approvedPilDocumentId, changeTriggerDocumentId',
      });
    }

    // Validate documents exist and are correct types
    const approvedPilDoc = await getDocumentById(approvedPilDocumentId);
    const changeTriggerDoc = await getDocumentById(changeTriggerDocumentId);

    if (!approvedPilDoc) {
      return res.status(404).json({
        error: 'Approved PIL document not found',
      });
    }

    if (!changeTriggerDoc) {
      return res.status(404).json({
        error: 'Change trigger document not found',
      });
    }

    // Validate approved PIL is correct type
    if (approvedPilDoc.type !== 'ApprovedPIL') {
      return res.status(400).json({
        error: 'First document must be an Approved PIL',
      });
    }

    // Validate change trigger is one of allowed types
    const allowedChangeTriggerTypes = ['RegulatoryAnnouncement', 'InnovatorPIL', 'CommercialAW'];
    if (!allowedChangeTriggerTypes.includes(changeTriggerDoc.type)) {
      return res.status(400).json({
        error: 'Change trigger must be RegulatoryAnnouncement, InnovatorPIL, or CommercialAW',
      });
    }

    // Validate market exists
    const market = await getMarketById(marketId);
    if (!market) {
      return res.status(404).json({
        error: 'Market not found',
      });
    }

    // Create workflow ID (in production, insert into database)
    const workflowId = Date.now();

    // Initialize workflow state machine
    const context = {
      workflowId,
      productId,
      marketId,
      approvedPilDocumentId,
      changeTriggerDocumentId,
      userId: req.user.id,
      ipAddress: req.ipAddress,
    };

    const service = interpret(variationWorkflowMachine.provide({
      context,
    }));

    service.start();

    // Store service
    workflowStates.set(workflowId, { service, context });

    // Start workflow
    service.send({ type: 'START' });

    // Log workflow initiation
    await createAuditLog({
      userId: req.user.id,
      action: 'WorkflowStarted',
      entityType: 'Workflow',
      entityId: workflowId,
      details: {
        type: 'Variation',
        productId,
        marketId,
        approvedPilDocumentId,
        changeTriggerDocumentId,
        approvedPilType: approvedPilDoc.type,
        changeTriggerType: changeTriggerDoc.type,
      },
      ipAddress: req.ipAddress,
    });

    res.status(201).json({
      workflowId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Variation workflow initiation failed:', error);
    res.status(500).json({
      error: 'Failed to initiate variation workflow',
      details: error.message,
    });
  }
});

/**
 * GET /api/variation/:workflowId/status
 * Get workflow status
 */
router.get('/:workflowId/status', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const workflowData = workflowStates.get(workflowId);

    if (!workflowData) {
      return res.status(404).json({
        error: 'Workflow not found',
      });
    }

    const { service, context } = workflowData;
    const snapshot = service.getSnapshot();
    const state = snapshot.value;

    const status = getWorkflowStatus(state);
    const currentStep = getCurrentStep(state);
    const percentComplete = getProgressPercentage(state);

    res.json({
      workflowId,
      type: 'Variation',
      status,
      progress: {
        currentStep,
        percentComplete,
      },
      createdAt: new Date(workflowId).toISOString(),
      completedAt: status === 'Complete' || status === 'Failed' ? new Date().toISOString() : null,
      errorMessage: context.error,
    });
  } catch (error) {
    console.error('Failed to get workflow status:', error);
    res.status(500).json({
      error: 'Failed to get workflow status',
      details: error.message,
    });
  }
});

/**
 * GET /api/variation/:workflowId/results
 * Get workflow results
 */
router.get('/:workflowId/results', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const workflowData = workflowStates.get(workflowId);

    if (!workflowData) {
      return res.status(404).json({
        error: 'Workflow not found',
      });
    }

    const { service, context } = workflowData;
    const snapshot = service.getSnapshot();
    const state = snapshot.value;

    if (state !== 'complete') {
      return res.status(400).json({
        error: 'Workflow not complete',
        currentStatus: getWorkflowStatus(state),
      });
    }

    if (!context.classification) {
      return res.status(500).json({
        error: 'Classification results not available',
      });
    }

    // Build response based on classification type
    const response = {
      workflowId,
      type: 'Variation',
      status: 'Complete',
      classification: context.classification.type,
      classificationRationale: context.classification.rationale,
      confidence: context.classification.confidence,
      sectionsAffected: context.classification.sectionsAffected,
      regulatoryImpact: context.classification.regulatoryImpact,
      changeTypes: context.classification.changeTypes,
      completedAt: new Date().toISOString(),
    };

    if (context.classification.type === 'complicated' && context.complicatedDiff) {
      response.diff = context.complicatedDiff;
      response.downloadUrl = `/api/variation/${workflowId}/download/diff`;
    } else if (context.classification.type === 'general' && context.revisionComments) {
      response.revisionComments = context.revisionComments;
      response.downloadUrl = `/api/variation/${workflowId}/download/comments`;
    }

    res.json(response);
  } catch (error) {
    console.error('Failed to get workflow results:', error);
    res.status(500).json({
      error: 'Failed to get workflow results',
      details: error.message,
    });
  }
});

/**
 * GET /api/variation/:workflowId/download/diff
 * Download complicated variation diff report
 */
router.get('/:workflowId/download/diff', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const workflowData = workflowStates.get(workflowId);

    if (!workflowData) {
      return res.status(404).json({
        error: 'Workflow not found',
      });
    }

    const { context } = workflowData;

    if (!context.complicatedDiff) {
      return res.status(404).json({
        error: 'Diff report not available',
      });
    }

    // In production, generate actual PDF/Word document
    // For now, return JSON
    res.json(context.complicatedDiff);
  } catch (error) {
    console.error('Failed to download diff report:', error);
    res.status(500).json({
      error: 'Failed to download diff report',
      details: error.message,
    });
  }
});

/**
 * GET /api/variation/:workflowId/download/comments
 * Download general variation revision comments
 */
router.get('/:workflowId/download/comments', async (req, res) => {
  try {
    const workflowId = parseInt(req.params.workflowId);
    const workflowData = workflowStates.get(workflowId);

    if (!workflowData) {
      return res.status(404).json({
        error: 'Workflow not found',
      });
    }

    const { context } = workflowData;

    if (!context.revisionComments) {
      return res.status(404).json({
        error: 'Revision comments not available',
      });
    }

    // In production, generate actual PDF/Word document
    // For now, return JSON
    res.json(context.revisionComments);
  } catch (error) {
    console.error('Failed to download revision comments:', error);
    res.status(500).json({
      error: 'Failed to download revision comments',
      details: error.message,
    });
  }
});

export default router;