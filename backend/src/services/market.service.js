/**
 * Market Service
 * Handles market configuration CRUD operations with versioning
 */

import { validateMarketConfig } from '../config/markets/schema.js';
import { defaultMarkets } from '../config/markets/defaults.js';

// In-memory storage for MVP (replace with database in production)
let markets = [...defaultMarkets];
let marketVersions = {}; // { marketId: [versions] }
let nextMarketId = 5; // Start after pre-configured markets

/**
 * Get all markets (summary view)
 */
export const getAllMarkets = () => {
  return markets.map(m => ({
    id: m.id,
    name: m.name,
    regulatoryAuthority: m.regulatoryAuthority,
    language: m.language,
    script: m.script,
    extractionProviderPreference: m.extractionProviderPreference,
    requiredSectionsCount: m.requiredSections.length,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt
  }));
};

/**
 * Get market by ID (full configuration)
 */
export const getMarketById = (marketId) => {
  const market = markets.find(m => m.id === parseInt(marketId));
  if (!market) {
    throw new Error('Market not found');
  }
  return market;
};

/**
 * Create new market configuration
 */
export const createMarket = async (config, userId) => {
  // Validate configuration
  const validation = validateMarketConfig(config);
  if (!validation.valid) {
    throw new Error(`Invalid market configuration: ${validation.errors.join(', ')}`);
  }

  // Check for duplicate name
  const existingMarket = markets.find(m => 
    m.name.toLowerCase() === config.name.toLowerCase()
  );
  if (existingMarket) {
    throw new Error(`Market with name "${config.name}" already exists`);
  }

  // Create new market
  const newMarket = {
    id: nextMarketId++,
    ...config,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  markets.push(newMarket);

  // Initialize version history
  marketVersions[newMarket.id] = [{
    version: 1,
    config: { ...newMarket },
    changedBy: userId,
    changeNotes: 'Initial configuration',
    timestamp: newMarket.createdAt
  }];

  return newMarket;
};

/**
 * Update market configuration
 */
export const updateMarket = async (marketId, updates, userId, changeNotes) => {
  const marketIndex = markets.findIndex(m => m.id === parseInt(marketId));
  if (marketIndex === -1) {
    throw new Error('Market not found');
  }

  const currentMarket = markets[marketIndex];

  // Merge updates with current config
  const updatedConfig = {
    ...currentMarket,
    ...updates,
    id: currentMarket.id, // Preserve ID
    name: currentMarket.name, // Name cannot be changed
    updatedAt: new Date().toISOString()
  };

  // Validate updated configuration
  const validation = validateMarketConfig(updatedConfig);
  if (!validation.valid) {
    throw new Error(`Invalid market configuration: ${validation.errors.join(', ')}`);
  }

  // Update market
  markets[marketIndex] = updatedConfig;

  // Add to version history
  if (!marketVersions[currentMarket.id]) {
    marketVersions[currentMarket.id] = [];
  }

  const newVersion = {
    version: marketVersions[currentMarket.id].length + 1,
    config: { ...updatedConfig },
    changedBy: userId,
    changeNotes: changeNotes || 'Configuration updated',
    timestamp: updatedConfig.updatedAt
  };

  marketVersions[currentMarket.id].push(newVersion);

  return updatedConfig;
};

/**
 * Delete market configuration
 */
export const deleteMarket = async (marketId, userId) => {
  const marketIndex = markets.findIndex(m => m.id === parseInt(marketId));
  if (marketIndex === -1) {
    throw new Error('Market not found');
  }

  const deletedMarket = markets[marketIndex];
  markets.splice(marketIndex, 1);

  return deletedMarket;
};

/**
 * Get market version history
 */
export const getMarketVersionHistory = (marketId) => {
  const market = markets.find(m => m.id === parseInt(marketId));
  if (!market) {
    throw new Error('Market not found');
  }

  const versions = marketVersions[market.id] || [];

  return {
    marketId: market.id,
    marketName: market.name,
    currentVersion: versions.length,
    totalVersions: versions.length,
    versions: versions.map(v => ({
      version: v.version,
      changedBy: v.changedBy,
      changeNotes: v.changeNotes,
      timestamp: v.timestamp
    }))
  };
};

/**
 * Get specific version of market configuration
 */
export const getMarketVersion = (marketId, version) => {
  const market = markets.find(m => m.id === parseInt(marketId));
  if (!market) {
    throw new Error('Market not found');
  }

  const versions = marketVersions[market.id] || [];
  const versionData = versions.find(v => v.version === parseInt(version));

  if (!versionData) {
    throw new Error('Version not found');
  }

  return {
    marketId: market.id,
    marketName: market.name,
    version: versionData.version,
    config: versionData.config,
    changedBy: versionData.changedBy,
    changeNotes: versionData.changeNotes,
    timestamp: versionData.timestamp
  };
};

/**
 * Get market statistics
 */
export const getMarketStatistics = () => {
  const stats = {
    totalMarkets: markets.length,
    byProvider: {},
    byLanguage: {},
    totalSections: 0,
    averageSections: 0
  };

  markets.forEach(market => {
    // Count by provider
    stats.byProvider[market.extractionProviderPreference] = 
      (stats.byProvider[market.extractionProviderPreference] || 0) + 1;

    // Count by language
    stats.byLanguage[market.language] = 
      (stats.byLanguage[market.language] || 0) + 1;

    // Sum sections
    stats.totalSections += market.requiredSections.length;
  });

  stats.averageSections = markets.length > 0 
    ? Math.round(stats.totalSections / markets.length) 
    : 0;

  return stats;
};