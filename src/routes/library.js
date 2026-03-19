import { Router } from 'express';
import { requireAuth, extractIpAddress } from '../middleware/auth.middleware.js';
import {
  searchDocuments,
  getDocumentVersionHistory,
  getLibraryStatistics,
  advancedFilter,
  getComparisonCandidates
} from '../services/library.service.js';
import { getAvailableLanguages, getAvailableUploaders } from '../services/document.service.js';

const router = Router();

// Apply IP extraction to all routes
router.use(extractIpAddress);

/**
 * GET /api/library/search
 * Search documents by product name with partial match
 */
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { searchTerm, ...filters } = req.query;
    const result = await searchDocuments({ searchTerm, ...filters });
    res.json(result);
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({ error: 'Failed to search documents' });
  }
});

/**
 * GET /api/library/filter
 * Advanced filter with multiple criteria
 */
router.get('/filter', requireAuth, async (req, res) => {
  try {
    const {
      searchTerm,
      types,
      markets,
      languages,
      uploadDateFrom,
      uploadDateTo,
      uploadedBy,
      status,
      page,
      limit
    } = req.query;

    // Parse array parameters
    const parsedFilters = {
      searchTerm,
      types: types ? (Array.isArray(types) ? types : [types]) : [],
      markets: markets ? (Array.isArray(markets) ? markets : [markets]) : [],
      languages: languages ? (Array.isArray(languages) ? languages : [languages]) : [],
      uploadDateFrom,
      uploadDateTo,
      uploadedBy,
      status,
      page,
      limit
    };

    const result = await advancedFilter(parsedFilters);
    res.json(result);
  } catch (error) {
    console.error('Error filtering documents:', error);
    res.status(500).json({ error: 'Failed to filter documents' });
  }
});

/**
 * GET /api/library/statistics
 * Get document statistics for library dashboard
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
 * Get document version history for a product and market
 */
router.get('/version-history', requireAuth, async (req, res) => {
  try {
    const { productId, marketId, type } = req.query;

    if (!productId || !type) {
      return res.status(400).json({ 
        error: 'Missing required parameters: productId and type are required' 
      });
    }

    const history = await getDocumentVersionHistory({ productId, marketId, type });
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

/**
 * GET /api/library/metadata/languages
 * Get available languages for filter dropdown
 */
router.get('/metadata/languages', requireAuth, async (req, res) => {
  try {
    const languages = getAvailableLanguages();
    res.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

/**
 * GET /api/library/metadata/uploaders
 * Get available uploaders for filter dropdown
 */
router.get('/metadata/uploaders', requireAuth, async (req, res) => {
  try {
    const uploaders = getAvailableUploaders();
    res.json({ uploaders });
  } catch (error) {
    console.error('Error fetching uploaders:', error);
    res.status(500).json({ error: 'Failed to fetch uploaders' });
  }
});

export default router;