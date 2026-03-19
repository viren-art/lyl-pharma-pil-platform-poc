// LYL_DEP: @google-cloud/documentai@^8.0.0

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import type { ExtractionResult, ExtractedSection } from './extraction.schema';

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_DOCUMENT_AI_LOCATION || 'us';
const PROCESSOR_ID_MAP: Record<string, string> = {
  'zh-TW': process.env.GCP_DOCUMENT_AI_PROCESSOR_ZH_TW || '',
  'th': process.env.GCP_DOCUMENT_AI_PROCESSOR_TH || '',
  'vi': process.env.GCP_DOCUMENT_AI_PROCESSOR_VI || '',
  'ko': process.env.GCP_DOCUMENT_AI_PROCESSOR_KO || '',
  'en': process.env.GCP_DOCUMENT_AI_PROCESSOR_EN || ''
};

interface GoogleDocumentAIConfig {
  projectId: string;
  location: string;
  processorId: string;
}

/**
 * Initialize Google Document AI client
 */
const getClient = (): DocumentProcessorServiceClient => {
  return new DocumentProcessorServiceClient();
};

/**
 * Extract sections from document using Google Document AI
 */
export const extractWithGoogleDocumentAI = async (
  filePath: string,
  language: string,
  documentType: string,
  documentId: number
): Promise<ExtractionResult> => {
  const startTime = Date.now();

  if (!PROJECT_ID) {
    throw new Error('GCP_PROJECT_ID not configured');
  }

  const processorId = PROCESSOR_ID_MAP[language];
  if (!processorId) {
    throw new Error(`No Document AI processor configured for language: ${language}`);
  }

  const client = getClient();
  const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${processorId}`;

  try {
    // Read document file (in production, this would read from Cloud Storage)
    const fs = await import('fs/promises');
    const documentBuffer = await fs.readFile(filePath);

    // Process document
    const [result] = await client.processDocument({
      name,
      rawDocument: {
        content: documentBuffer.toString('base64'),
        mimeType: 'application/pdf'
      }
    });

    if (!result.document) {
      throw new Error('No document returned from Document AI');
    }

    // Extract sections from Document AI response
    const sections: ExtractedSection[] = [];
    const document = result.document;

    // Parse pages and text
    const pages = document.pages || [];
    const text = document.text || '';

    // Extract sections based on layout detection
    // Document AI provides paragraphs, tables, and form fields
    let currentSection: ExtractedSection | null = null;
    let sectionCounter = 0;

    for (const page of pages) {
      const pageNumber = page.pageNumber || 0;
      const paragraphs = page.paragraphs || [];

      for (const paragraph of paragraphs) {
        const layout = paragraph.layout;
        if (!layout || !layout.textAnchor) continue;

        const textSegments = layout.textAnchor.textSegments || [];
        let paragraphText = '';

        for (const segment of textSegments) {
          const startIndex = parseInt(segment.startIndex || '0');
          const endIndex = parseInt(segment.endIndex || '0');
          paragraphText += text.substring(startIndex, endIndex);
        }

        // Detect section headers (heuristic: short paragraphs with high confidence)
        const confidence = layout.confidence || 0;
        const isLikelyHeader = paragraphText.length < 100 && confidence > 0.9;

        if (isLikelyHeader) {
          // Save previous section
          if (currentSection) {
            sections.push(currentSection);
          }

          // Start new section
          currentSection = {
            sectionName: paragraphText.trim(),
            content: '',
            pageReferences: [pageNumber],
            confidence: confidence,
            boundingBoxes: layout.boundingPoly ? [layout.boundingPoly] : []
          };
          sectionCounter++;
        } else if (currentSection) {
          // Add content to current section
          currentSection.content += paragraphText + '\n';
          if (!currentSection.pageReferences.includes(pageNumber)) {
            currentSection.pageReferences.push(pageNumber);
          }
        } else {
          // No section yet, create default section
          currentSection = {
            sectionName: `Section ${sectionCounter + 1}`,
            content: paragraphText + '\n',
            pageReferences: [pageNumber],
            confidence: confidence,
            boundingBoxes: layout.boundingPoly ? [layout.boundingPoly] : []
          };
          sectionCounter++;
        }
      }
    }

    // Add final section
    if (currentSection) {
      sections.push(currentSection);
    }

    // Extract tables as special sections
    for (const page of pages) {
      const tables = page.tables || [];
      for (const table of tables) {
        const tableLayout = table.layout;
        if (!tableLayout || !tableLayout.textAnchor) continue;

        const textSegments = tableLayout.textAnchor.textSegments || [];
        let tableText = '';

        for (const segment of textSegments) {
          const startIndex = parseInt(segment.startIndex || '0');
          const endIndex = parseInt(segment.endIndex || '0');
          tableText += text.substring(startIndex, endIndex);
        }

        sections.push({
          sectionName: 'Table',
          content: tableText,
          pageReferences: [page.pageNumber || 0],
          confidence: tableLayout.confidence || 0.85,
          boundingBoxes: tableLayout.boundingPoly ? [tableLayout.boundingPoly] : [],
          specialContent: {
            type: 'table',
            rows: table.bodyRows?.length || 0,
            columns: table.headerRows?.[0]?.cells?.length || 0
          }
        });
      }
    }

    const processingTimeMs = Date.now() - startTime;

    return {
      documentId,
      documentType,
      language,
      extractedAt: new Date().toISOString(),
      sections,
      metadata: {
        totalPages: pages.length,
        processingTimeMs,
        provider: 'GoogleDocumentAI',
        averageConfidence: sections.reduce((sum, s) => sum + (s.confidence || 0), 0) / sections.length
      }
    };
  } catch (error) {
    console.error('Google Document AI extraction error:', error);
    throw new Error(`Document AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};