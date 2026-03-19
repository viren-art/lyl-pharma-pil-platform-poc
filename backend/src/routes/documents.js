import { Router } from 'express';
import multer from 'multer';
import { requireAuth, requireRole, extractIpAddress } from '../middleware/auth.middleware.js';
import {
  validateFile,
  validateDocumentMetadata,
  createDocument,
  getDocumentById,
  listDocuments,
  getAllProducts,
  getAllMarkets,
  getDocumentTypes,
  calculateFileHash,
  findDuplicateByHash
} from '../services/document.service.js';
import {
  storeFile,
  retrieveFile,
  scanFileForVirus,
  initializeStorage
} from '../services/storage.service.js';
import { createAuditLog } from '../services/audit.service.js';

// LYL_DEP: multer@1.4.5-lts.1

const router = Router();

// Initialize storage on module load
await initializeStorage();

// Configure multer for memory storage (files stored in memory before processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  }
});

// Apply IP extraction to all routes
router.use(extractIpAddress);

/**
 * POST /api/documents/upload
 * Upload a document with metadata
 */
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { productId, type, marketId, language } = req.body;

    // Validate file
    validateFile(file);

    // Validate metadata
    validateDocumentMetadata({ productId, type, marketId, language });

    // Calculate file hash for duplicate detection
    const fileHash = await calculateFileHash(file.buffer);

    // Check for duplicates
    const duplicate = findDuplicateByHash(fileHash);
    if (duplicate) {
      await createAuditLog({
        userId: req.user.userId,
        action: 'DocumentUploadDuplicate',
        entityType: 'Document',
        entityId: duplicate.id,
        details: {
          fileName: file.originalname,
          duplicateOf: duplicate.fileName,
          fileHash
        },
        ipAddress: req.ipAddress
      });

      return res.status(409).json({
        error: 'Duplicate document detected',
        existingDocument: {
          id: duplicate.id,
          fileName: duplicate.fileName,
          uploadDate: duplicate.uploadDate
        }
      });
    }

    // Virus scan
    const scanResult = await scanFileForVirus(file.buffer);
    if (!scanResult.clean) {
      await createAuditLog({
        userId: req.user.userId,
        action: 'DocumentUploadVirusDetected',
        entityType: 'Document',
        entityId: null,
        details: {
          fileName: file.originalname,
          scanResult
        },
        ipAddress: req.ipAddress
      });

      return res.status(400).json({
        error: 'Virus detected in file'
      });
    }

    // Store file with encryption
    const storageResult = await storeFile(file, {
      productId,
      type,
      marketId,
      language,
      uploadedBy: req.user.userId
    });

    // Create document record
    const document = await createDocument({
      file,
      productId,
      type,
      marketId,
      language,
      uploadUserId: req.user.userId,
      filePath: storageResult.filePath,
      fileHash
    });

    // Log successful upload
    await createAuditLog({
      userId: req.user.userId,
      action: 'DocumentUploaded',
      entityType: 'Document',
      entityId: document.id,
      details: {
        fileName: file.originalname,
        type,
        productId,
        marketId,
        fileSize: file.size
      },
      ipAddress: req.ipAddress
    });

    res.status(201).json({
      id: document.id,
      fileName: document.fileName,
      fileSize: document.fileSize,
      uploadDate: document.uploadDate,
      status: document.status,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('Document upload error:', error);

    // Log failed upload
    await createAuditLog({
      userId: req.user?.userId,
      action: 'DocumentUploadFailed',
      entityType: 'Document',
      entityId: null,
      details: {
        error: error.message,
        fileName: req.file?.originalname
      },
      ipAddress: req.ipAddress
    });

    res.status(400).json({
      error: error.message || 'Document upload failed'
    });
  }
});

/**
 * GET /api/documents
 * List documents with filters
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
    console.error('List documents error:', error);
    res.status(500).json({
      error: 'Failed to list documents'
    });
  }
});

/**
 * GET /api/documents/:id
 * Get document by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const document = getDocumentById(req.params.id);

    // Log document access
    await createAuditLog({
      userId: req.user.userId,
      action: 'DocumentAccessed',
      entityType: 'Document',
      entityId: document.id,
      details: {
        fileName: document.fileName
      },
      ipAddress: req.ipAddress
    });

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(404).json({
      error: error.message || 'Document not found'
    });
  }
});

/**
 * GET /api/documents/download/:filePath
 * Download document file
 */
router.get('/download/:filePath', requireAuth, async (req, res) => {
  try {
    const { filePath } = req.params;

    // Find document by file path
    const documents = listDocuments({ status: 'Active' }).documents;
    const document = documents.find(d => d.filePath === filePath);

    if (!document) {
      return res.status(404).json({
        error: 'Document not found'
      });
    }

    // Retrieve file from storage
    const fileBuffer = await retrieveFile(filePath);

    // Log download
    await createAuditLog({
      userId: req.user.userId,
      action: 'DocumentDownloaded',
      entityType: 'Document',
      entityId: document.id,
      details: {
        fileName: document.fileName
      },
      ipAddress: req.ipAddress
    });

    // Set headers for file download
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize);

    res.send(fileBuffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({
      error: 'Failed to download document'
    });
  }
});

/**
 * GET /api/documents/metadata/products
 * Get all products for dropdown
 */
router.get('/metadata/products', requireAuth, async (req, res) => {
  try {
    const products = getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Failed to get products'
    });
  }
});

/**
 * GET /api/documents/metadata/markets
 * Get all markets for dropdown
 */
router.get('/metadata/markets', requireAuth, async (req, res) => {
  try {
    const markets = getAllMarkets();
    res.json(markets);
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({
      error: 'Failed to get markets'
    });
  }
});

/**
 * GET /api/documents/metadata/types
 * Get all document types for dropdown
 */
router.get('/metadata/types', requireAuth, async (req, res) => {
  try {
    const types = getDocumentTypes();
    res.json(types);
  } catch (error) {
    console.error('Get document types error:', error);
    res.status(500).json({
      error: 'Failed to get document types'
    });
  }
});

export default router;