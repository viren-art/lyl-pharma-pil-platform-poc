/**
 * Get market by ID
 * @param {number} marketId - Market ID
 * @returns {Promise<Object|null>} Market object or null if not found
 */
export const getMarketById = async (marketId) => {
  // Mock implementation - in production, query database
  const mockMarkets = {
    1: { 
      id: 1, 
      name: 'Taiwan', 
      regulatoryAuthority: 'TFDA',
      language: 'zh-TW',
      script: 'Traditional Chinese',
      extractionProviderPreference: 'GoogleDocAI',
    },
    2: { 
      id: 2, 
      name: 'Thailand', 
      regulatoryAuthority: 'Thai FDA',
      language: 'th',
      script: 'Thai',
      extractionProviderPreference: 'ClaudeVision',
    },
  };

  return mockMarkets[marketId] || null;
};