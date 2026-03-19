import { Router } from 'express';
import { requireAuth, extractIpAddress } from '../middleware/auth.middleware.js';
import {
  listDocuments,
  getDocumentById,
  getDocumentMetadata
} from '../services/document.service.js';

const router = Router();

// Apply IP extraction to all routes
router.use(extractIpAddress);

/**
 * GET /api/documents
 * List documents with filters and pagination
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { productId, type, marketId, status, page, limit } = req.query;

    const result = listDocuments({
      productId,
      type,
      marketId,
      status,
      page,
      limit
    });

    res.json(result);
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

/**
 * GET /api/documents/metadata/products
 * Get products for filter dropdown
 */
router.get('/metadata/products', requireAuth, async (req, res) => {
  try {
    const metadata = getDocumentMetadata();
    res.json({ products: metadata.products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/**
 * GET /api/documents/metadata/markets
 * Get markets for filter dropdown
 */
router.get('/metadata/markets', requireAuth, async (req, res) => {
  try {
    const metadata = getDocumentMetadata();
    res.json({ markets: metadata.markets });
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

/**
 * GET /api/documents/metadata/types
 * Get document types for filter dropdown
 */
router.get('/metadata/types', requireAuth, async (req, res) => {
  try {
    const metadata = getDocumentMetadata();
    res.json({ types: metadata.types });
  } catch (error) {
    console.error('Error fetching types:', error);
    res.status(500).json({ error: 'Failed to fetch types' });
  }
});

/**
 * GET /api/documents/:id
 * Get document by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const document = getDocumentById(req.params.id);
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    if (error.message === 'Document not found') {
      res.status(404).json({ error: 'Document not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }
});

export default router;