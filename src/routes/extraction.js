import { Router } from 'express';
import { requireAuth, extractIpAddress } from '../middleware/auth.middleware.js';
import { routeExtraction } from '../extraction/router.service.js';

const router = Router();

// Apply authentication and IP extraction to all routes
router.use(requireAuth);
router.use(extractIpAddress);

/**
 * POST /api/extraction/extract
 * Extract content from document
 */
router.post('/extract', async (req, res) => {
  try {
    const { documentId, filePath, marketId, language, documentType } = req.body;

    // Validate required fields
    if (!documentId || !filePath || !marketId || !language || !documentType) {
      return res.status(400).json({
        error: 'Missing required fields: documentId, filePath, marketId, language, documentType'
      });
    }

    // Route extraction
    const result = await routeExtraction({
      documentId,
      filePath,
      marketId,
      language,
      documentType
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;