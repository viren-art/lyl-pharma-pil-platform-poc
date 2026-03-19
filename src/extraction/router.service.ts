import type { ExtractionResult } from './extraction.schema';
import { getMarketById } from '../services/market.service.js';
import { extractWithGoogleDocumentAI } from './google-documentai.adapter.js';
import { extractWithClaudeVision } from './claude-vision.adapter.js';

export interface RouteExtractionRequest {
  documentId: number;
  filePath: string;
  marketId: number;
  language: string;
  documentType: string;
}

/**
 * Route extraction to appropriate provider based on market configuration
 */
export const routeExtraction = async (
  request: RouteExtractionRequest
): Promise<ExtractionResult> => {
  const { documentId, filePath, marketId, language, documentType } = request;

  // Get market configuration to determine extraction provider preference
  const market = getMarketById(marketId);
  const provider = market.extractionProviderPreference;

  console.log(`Routing extraction for document ${documentId} to ${provider} (market: ${market.name})`);

  try {
    if (provider === 'GoogleDocAI') {
      return await extractWithGoogleDocumentAI(filePath, language, documentType, documentId);
    } else if (provider === 'ClaudeVision') {
      return await extractWithClaudeVision(filePath, language, documentType, documentId);
    } else {
      throw new Error(`Unknown extraction provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Extraction failed with ${provider}, attempting fallback...`);
    
    // Fallback to alternative provider
    const fallbackProvider = provider === 'GoogleDocAI' ? 'ClaudeVision' : 'GoogleDocAI';
    console.log(`Falling back to ${fallbackProvider}`);

    if (fallbackProvider === 'GoogleDocAI') {
      return await extractWithGoogleDocumentAI(filePath, language, documentType, documentId);
    } else {
      return await extractWithClaudeVision(filePath, language, documentType, documentId);
    }
  }
};