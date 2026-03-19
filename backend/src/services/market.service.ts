export interface Market {
  id: number;
  name: string;
  regulatoryAuthority: string;
  language: string;
  script: string;
  requiredSections: string[];
  sectionOrdering: Record<string, number>;
  extractionProviderPreference: 'GoogleDocAI' | 'ClaudeVision';
  formattingRules?: any;
}

// Mock market data for MVP
const MARKETS: Market[] = [
  {
    id: 1,
    name: 'Taiwan',
    regulatoryAuthority: 'TFDA',
    language: 'zh-TW',
    script: 'Traditional Chinese',
    requiredSections: [
      'Product Name',
      'Composition',
      'Indications',
      'Dosage and Administration',
      'Contraindications',
      'Warnings and Precautions',
      'Adverse Reactions',
      'Storage',
      'Manufacturer'
    ],
    sectionOrdering: {
      'Product Name': 1,
      Composition: 2,
      Indications: 3,
      'Dosage and Administration': 4,
      Contraindications: 5,
      'Warnings and Precautions': 6,
      'Adverse Reactions': 7,
      Storage: 8,
      Manufacturer: 9
    },
    extractionProviderPreference: 'GoogleDocAI'
  },
  {
    id: 2,
    name: 'Thailand',
    regulatoryAuthority: 'Thai FDA',
    language: 'th',
    script: 'Thai',
    requiredSections: [
      'Product Name',
      'Composition',
      'Indications',
      'Dosage and Administration',
      'Contraindications',
      'Warnings',
      'Adverse Reactions',
      'Storage',
      'Manufacturer'
    ],
    sectionOrdering: {
      'Product Name': 1,
      Composition: 2,
      Indications: 3,
      'Dosage and Administration': 4,
      Contraindications: 5,
      Warnings: 6,
      'Adverse Reactions': 7,
      Storage: 8,
      Manufacturer: 9
    },
    extractionProviderPreference: 'ClaudeVision'
  }
];

/**
 * Get market by ID
 */
export const getMarketById = (marketId: number): Market => {
  const market = MARKETS.find((m) => m.id === marketId);
  if (!market) {
    throw new Error(`Market not found: ${marketId}`);
  }
  return market;
};

/**
 * Get all markets
 */
export const getAllMarkets = (): Market[] => {
  return MARKETS;
};