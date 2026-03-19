import { extractWithGoogleDocAI } from './providers/google-docai.adapter';
import { extractWithClaudeVision, validateExtractionQuality } from './providers/claude-vision.adapter';
import { convertDocumentForExtraction, cleanupTempFiles } from './converter.service';
import type { NormalizedResponse } from './extraction.schema';

export interface RouteExtractionRequest {
  documentId: number;
  filePath: string;
  marketId: number;
  language: string;
  documentType: string;
  mimeType: string;
}

export interface ExtractionResult {
  documentId: number;
  documentType: string;
  language: string;
  extractedAt: string;
  sections: Array<{
    sectionName: string;
    content: string;
    pageReferences: number[];
    confidence: number;
  }>;
  metadata: {
    totalPages: number;
    processingTimeMs: number;
    provider: string;
    costUsd?: number;
    averageConfidence?: number;
    fallbackUsed?: boolean;
  };
}

/**
 * FIXED: Get market-specific extraction provider preference
 */
const getMarketProviderPreference = async (marketId: number): Promise<'GoogleDocAI' | 'ClaudeVision'> => {
  // TODO: Query database for market configuration
  // For now, default to Google Document AI for CJK markets
  const cjkMarkets = [1, 2, 3, 4]; // Taiwan, Thailand, Vietnam, Korea
  return cjkMarkets.includes(marketId) ? 'GoogleDocAI' : 'ClaudeVision';
};

/**
 * FIXED: Route extraction to appropriate provider with fallback mechanism
 * Implements AC-8: Fallback to alternative provider if primary extraction fails
 */
export const routeExtraction = async (
  request: RouteExtractionRequest
): Promise<ExtractionResult> => {
  const startTime = Date.now();
  let tempFiles: string[] = [];
  let fallbackUsed = false;

  try {
    // Step 1: Convert document to images at 300 DPI
    const { imagePaths, pageCount } = await convertDocumentForExtraction(
      request.filePath,
      request.mimeType
    );
    tempFiles = imagePaths;

    // Step 2: Determine primary provider based on market configuration
    const primaryProvider = await getMarketProviderPreference(request.marketId);
    const fallbackProvider = primaryProvider === 'GoogleDocAI' ? 'ClaudeVision' : 'GoogleDocAI';

    let extractionResult: NormalizedResponse | null = null;
    let usedProvider = primaryProvider;

    // Step 3: Try primary provider
    try {
      console.log(`Attempting extraction with primary provider: ${primaryProvider}`);
      
      if (primaryProvider === 'GoogleDocAI') {
        extractionResult = await extractWithGoogleDocAI(imagePaths, request.language);
      } else {
        extractionResult = await extractWithClaudeVision(imagePaths, request.language);
      }

      // Validate extraction quality
      const validation = validateExtractionQuality(extractionResult);
      if (!validation.valid) {
        console.warn(`Primary provider quality issues: ${validation.issues.join(', ')}`);
        throw new Error(`Extraction quality validation failed: ${validation.issues.join(', ')}`);
      }
    } catch (primaryError) {
      console.error(`Primary provider (${primaryProvider}) failed:`, primaryError.message);
      
      // Step 4: FIXED - Fallback to alternative provider
      try {
        console.log(`Falling back to alternative provider: ${fallbackProvider}`);
        fallbackUsed = true;
        usedProvider = fallbackProvider;

        if (fallbackProvider === 'GoogleDocAI') {
          extractionResult = await extractWithGoogleDocAI(imagePaths, request.language);
        } else {
          extractionResult = await extractWithClaudeVision(imagePaths, request.language);
        }

        // Validate fallback extraction
        const validation = validateExtractionQuality(extractionResult);
        if (!validation.valid) {
          throw new Error(`Fallback extraction quality validation failed: ${validation.issues.join(', ')}`);
        }
      } catch (fallbackError) {
        console.error(`Fallback provider (${fallbackProvider}) also failed:`, fallbackError.message);
        throw new Error(
          `Both extraction providers failed. Primary (${primaryProvider}): ${primaryError.message}. ` +
          `Fallback (${fallbackProvider}): ${fallbackError.message}`
        );
      }
    }

    if (!extractionResult) {
      throw new Error('Extraction failed: No result from any provider');
    }

    // Step 5: Transform to ExtractionResult format
    const result: ExtractionResult = {
      documentId: request.documentId,
      documentType: request.documentType,
      language: request.language,
      extractedAt: new Date().toISOString(),
      sections: extractionResult.sections.map(section => ({
        sectionName: section.sectionName,
        content: section.content,
        pageReferences: section.pageReferences.map(ref => ref.pageNumber),
        confidence: section.confidence
      })),
      metadata: {
        totalPages: pageCount,
        processingTimeMs: Date.now() - startTime,
        provider: usedProvider,
        costUsd: extractionResult.costUsd,
        averageConfidence: extractionResult.averageConfidence,
        fallbackUsed
      }
    };

    return result;
  } catch (error) {
    throw new Error(`Extraction routing failed: ${error.message}`);
  } finally {
    // Cleanup temporary files
    if (tempFiles.length > 0) {
      await cleanupTempFiles(tempFiles);
    }
  }
};