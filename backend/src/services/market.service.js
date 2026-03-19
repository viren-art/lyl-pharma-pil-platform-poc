/**
 * Market Service
 * Mock implementation for market configuration retrieval
 * In production, this would query the database
 */

const mockMarkets = [
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
      'Drug Interactions',
      'Use in Special Populations',
      'Overdosage',
      'Pharmacology',
      'Storage',
      'Packaging',
      'Manufacturer Information',
      'Local Emergency Contacts',
    ],
    sectionOrdering: {
      'Product Name': 1,
      'Composition': 2,
      'Indications': 3,
      'Dosage and Administration': 4,
      'Contraindications': 5,
      'Warnings and Precautions': 6,
      'Adverse Reactions': 7,
      'Drug Interactions': 8,
      'Use in Special Populations': 9,
      'Overdosage': 10,
      'Pharmacology': 11,
      'Storage': 12,
      'Packaging': 13,
      'Manufacturer Information': 14,
      'Local Emergency Contacts': 15,
    },
    extractionProviderPreference: 'GoogleDocAI',
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
      'Therapeutic Indications',
      'Posology and Method of Administration',
      'Contraindications',
      'Special Warnings and Precautions',
      'Undesirable Effects',
      'Interactions',
      'Pregnancy and Lactation',
      'Overdose',
      'Pharmacodynamic Properties',
      'Pharmacokinetic Properties',
      'Storage Conditions',
      'Shelf Life',
      'Manufacturer',
      'Emergency Contact Information',
    ],
    sectionOrdering: {
      'Product Name': 1,
      'Composition': 2,
      'Therapeutic Indications': 3,
      'Posology and Method of Administration': 4,
      'Contraindications': 5,
      'Special Warnings and Precautions': 6,
      'Undesirable Effects': 7,
      'Interactions': 8,
      'Pregnancy and Lactation': 9,
      'Overdose': 10,
      'Pharmacodynamic Properties': 11,
      'Pharmacokinetic Properties': 12,
      'Storage Conditions': 13,
      'Shelf Life': 14,
      'Manufacturer': 15,
      'Emergency Contact Information': 16,
    },
    extractionProviderPreference: 'ClaudeVision',
  },
];

export const getMarketById = (marketId) => {
  const market = mockMarkets.find((m) => m.id === marketId);
  if (!market) {
    throw new Error(`Market not found: ${marketId}`);
  }
  return market;
};

export const getAllMarkets = () => {
  return mockMarkets;
};