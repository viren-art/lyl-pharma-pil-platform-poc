import { Router } from 'express';
import { requireAuth, requireRole, extractIpAddress } from '../middleware/auth.middleware.js';
import {
  getAllMarkets,
  getMarketById,
  createMarket,
  updateMarket,
  getMarketVersionHistory,
  getMarketVersion,
  deleteMarket,
  getMarketStatistics
} from '../services/market.service.js';
import { createAuditLog } from '../services/audit.service.js';

const router = Router();

// Apply IP extraction to all routes
router.use(extractIpAddress);

/**
 * GET /api/markets
 * Get all markets (summary view)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const markets = getAllMarkets();
    res.json({ markets });
  } catch (error) {
    console.error('Error fetching markets:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

/**
 * GET /api/markets/statistics
 * Get market statistics
 */
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const stats = getMarketStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching market statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/markets/:id
 * Get market configuration by ID
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const market = getMarketById(req.params.id);
    res.json(market);
  } catch (error) {
    console.error('Error fetching market:', error);
    if (error.message === 'Market not found') {
      res.status(404).json({ error: 'Market not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch market' });
    }
  }
});

/**
 * POST /api/markets
 * Create new market configuration (Admin only)
 */
router.post('/', requireAuth, requireRole(['Admin']), async (req, res) => {
  try {
    const config = req.body;
    const newMarket = await createMarket(config, req.user.userId);

    // Log market creation
    await createAuditLog({
      userId: req.user.userId,
      action: 'ConfigChanged',
      entityType: 'Market',
      entityId: newMarket.id,
      details: {
        action: 'create',
        marketName: newMarket.name,
        regulatoryAuthority: newMarket.regulatoryAuthority
      },
      ipAddress: req.ipAddress
    });

    res.status(201).json(newMarket);
  } catch (error) {
    console.error('Error creating market:', error);
    if (error.message.includes('Invalid market configuration') || 
        error.message.includes('already exists')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create market' });
    }
  }
});

/**
 * PUT /api/markets/:id
 * Update market configuration (Admin only)
 */
router.put('/:id', requireAuth, requireRole(['Admin']), async (req, res) => {
  try {
    const { changeNotes, ...updates } = req.body;
    const updatedMarket = await updateMarket(
      req.params.id,
      updates,
      req.user.userId,
      changeNotes
    );

    // Log market update
    await createAuditLog({
      userId: req.user.userId,
      action: 'ConfigChanged',
      entityType: 'Market',
      entityId: updatedMarket.id,
      details: {
        action: 'update',
        marketName: updatedMarket.name,
        changeNotes: changeNotes || 'Configuration updated',
        updatedFields: Object.keys(updates)
      },
      ipAddress: req.ipAddress
    });

    res.json(updatedMarket);
  } catch (error) {
    console.error('Error updating market:', error);
    if (error.message === 'Market not found') {
      res.status(404).json({ error: 'Market not found' });
    } else if (error.message.includes('Invalid market configuration')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update market' });
    }
  }
});

/**
 * DELETE /api/markets/:id
 * Delete market configuration (Admin only)
 */
router.delete('/:id', requireAuth, requireRole(['Admin']), async (req, res) => {
  try {
    const deletedMarket = await deleteMarket(req.params.id, req.user.userId);

    // Log market deletion
    await createAuditLog({
      userId: req.user.userId,
      action: 'ConfigChanged',
      entityType: 'Market',
      entityId: deletedMarket.id,
      details: {
        action: 'delete',
        marketName: deletedMarket.name
      },
      ipAddress: req.ipAddress
    });

    res.json({ message: 'Market deleted successfully', market: deletedMarket });
  } catch (error) {
    console.error('Error deleting market:', error);
    if (error.message === 'Market not found') {
      res.status(404).json({ error: 'Market not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete market' });
    }
  }
});

/**
 * GET /api/markets/:id/history
 * Get market configuration version history
 */
router.get('/:id/history', requireAuth, async (req, res) => {
  try {
    const history = getMarketVersionHistory(req.params.id);
    res.json(history);
  } catch (error) {
    console.error('Error fetching market history:', error);
    if (error.message === 'Market not found') {
      res.status(404).json({ error: 'Market not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch history' });
    }
  }
});

/**
 * GET /api/markets/:id/versions/:version
 * Get specific version of market configuration
 */
router.get('/:id/versions/:version', requireAuth, async (req, res) => {
  try {
    const versionConfig = getMarketVersion(req.params.id, req.params.version);
    res.json(versionConfig);
  } catch (error) {
    console.error('Error fetching market version:', error);
    if (error.message === 'Market not found' || error.message === 'Version not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to fetch version' });
    }
  }
});

export default router;