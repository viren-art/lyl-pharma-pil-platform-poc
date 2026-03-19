import { Router } from 'express';
import { requireAuth, extractIpAddress } from '../middleware/auth.middleware.js';
import {
  searchDocuments,
  getDocumentVersionHistory,
  getLibraryStatistics,
  advancedFilter,
  getComparisonCandidates
} from '../services/library.service.js';
import { createAuditLog } from '../services/audit.service.js';

const router = Router();

// Apply IP extraction to all routes
router.use(extractIpAddress);

/**
 * GET /api/library/search
 * Search documents by product name with partial match
 */
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { searchTerm, productId, type, marketId, status, page, limit } = req.query;

    const result = await searchDocuments({
      searchTerm,
      productId,
      type,
      marketId,
      status,
      page,
      limit
    });

    res.json(result);
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

/**
 * POST /api/library/filter
 * Advanced filter with multiple criteria
 */
router.post('/filter', requireAuth, async (req, res) => {
  try {
    const filters = req.body;
    const result = await advancedFilter(filters);
    res.json(result);
  } catch (error) {
    console.error('Error filtering documents:', error);
    res.status(500).json({ error: 'Failed to filter documents' });
  }
});

/**
 * GET /api/library/statistics
 * Get document library statistics
 */
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const stats = await getLibraryStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching library statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/library/version-history
 * Get document version history for a product/market/type
 */
router.get('/version-history', requireAuth, async (req, res) => {
  try {
    const { productId, marketId, type } = req.query;

    if (!productId || !type) {
      return res.status(400).json({ 
        error: 'Product ID and document type are required' 
      });
    }

    const history = await getDocumentVersionHistory({
      productId,
      marketId,
      type
    });

    // Log version history access
    await createAuditLog({
      userId: req.user.userId,
      action: 'DocumentUploaded',
      entityType: 'Document',
      entityId: null,
      details: {
        action: 'version_history_viewed',
        productId: parseInt(productId),
        marketId: marketId ? parseInt(marketId) : null,
        type
      },
      ipAddress: req.ipAddress
    });

    res.json(history);
  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({ error: 'Failed to fetch version history' });
  }
});

/**
 * GET /api/library/comparison-candidates/:documentId
 * Get documents that can be compared with the specified document
 */
router.get('/comparison-candidates/:documentId', requireAuth, async (req, res) => {
  try {
    const candidates = await getComparisonCandidates(req.params.documentId);
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching comparison candidates:', error);
    if (error.message === 'Source document not found') {
      res.status(404).json({ error: 'Document not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch comparison candidates' });
    }
  }
});

export default router;