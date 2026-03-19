// LYL_DEP: @google-cloud/documentai@^8.0.0

import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import type {
  ExtractedSection,
  NormalizedResponse,
  PageReference,
  SpecialContent,
  BoundingBox
} from '../extraction.schema';

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = process.env.GCP_DOCAI_LOCATION || 'us';
const TIMEOUT_MS = 30000; // 30 seconds timeout

interface ProcessorConfig {
  processorId: string;
  language: string;
}

// Processor IDs per language (configured in GCP)
const PROCESSOR_MAP: Record<string, string> = {
  'zh-TW': process.env.GCP_DOCAI_PROCESSOR_ZH_TW || '',
  'th': process.env.GCP_DOCAI_PROCESSOR_TH || '',
  'vi': process.env.GCP_DOCAI_PROCESSOR_VI || '',
  'ko': process.env.GCP_DOCAI_PROCESSOR_KO || '',
  'en': process.env.GCP_DOCAI_PROCESSOR_EN || ''
};

/**
 * Initialize Document AI client
 */
const getClient = (): DocumentProcessorServiceClient => {
  return new DocumentProcessorServiceClient({
    apiEndpoint: `${LOCATION}-documentai.googleapis.com`
  });
};

/**
 * Get processor configuration for language
 */
const getProcessorConfig = (language: string): ProcessorConfig => {
  const processorId = PROCESSOR_MAP[language];
  
  if (!processorId) {
    throw new Error(`No Document AI processor configured for language: ${language}`);
  }

  return { processorId, language };
};

/**
 * Extract pharmaceutical content patterns
 */
const extractPharmaceuticalContent = (text: string, pageNumber: number): SpecialContent[] => {
  const specialContent: SpecialContent[] = [];

  // Subscript patterns (H₂O, CO₂)
  const subscriptRegex = /([A-Z][a-z]?)([₀₁₂₃₄₅₆₇₈₉]+)/g;
  let match;
  while ((match = subscriptRegex.exec(text)) !== null) {
    specialContent.push({
      type: 'subscript',
      content: match[0],
      position: { pageNumber },
      confidence: 0.95
    });
  }

  // Superscript patterns (mg/m², 10³)
  const superscriptRegex = /([a-zA-Z0-9]+)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g;
  while ((match = superscriptRegex.exec(text)) !== null) {
    specialContent.push({
      type: 'superscript',
      content: match[0],
      position: { pageNumber },
      confidence: 0.95
    });
  }

  // Greek letters (μg, β-blocker, α, γ)
  const greekRegex = /[αβγδεζηθικλμνξοπρστυφχψω]/gi;
  while ((match = greekRegex.exec(text)) !== null) {
    specialContent.push({
      type: 'greek_letter',
      content: match[0],
      position: { pageNumber },
      confidence: 0.98
    });
  }

  // Chemical formulas (complex patterns)
  const formulaRegex = /\b[A-Z][a-z]?(\d+|[₀₁₂₃₄₅₆₇₈₉]+)([A-Z][a-z]?(\d+|[₀₁₂₃₄₅₆₇₈₉]+))*\b/g;
  while ((match = formulaRegex.exec(text)) !== null) {
    if (match[0].length > 2) { // Avoid false positives
      specialContent.push({
        type: 'chemical_formula',
        content: match[0],
        position: { pageNumber },
        confidence: 0.90
      });
    }
  }

  return specialContent;
};

/**
 * Convert Document AI bounding box to normalized format
 */
const normalizeBoundingBox = (vertices: any[]): BoundingBox => {
  if (!vertices || vertices.length < 4) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = vertices.map(v => v.x || 0);
  const ys = vertices.map(v => v.y || 0);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Extract text from layout element
 */
const extractTextFromLayout = (layout: any, fullText: string): string => {
  if (!layout?.textAnchor?.textSegments) {
    return '';
  }

  let text = '';
  for (const segment of layout.textAnchor.textSegments) {
    const startIndex = parseInt(segment.startIndex || '0');
    const endIndex = parseInt(segment.endIndex || '0');
    text += fullText.substring(startIndex, endIndex);
  }

  return text;
};

/**
 * Extract table text with structure preservation
 */
const extractTableText = (table: any, fullText: string): string => {
  if (!table.bodyRows) {
    return '';
  }

  const rows: string[] = [];

  for (const row of table.bodyRows) {
    const cells: string[] = [];
    for (const cell of row.cells) {
      const cellText = extractTextFromLayout(cell.layout, fullText);
      cells.push(cellText.trim());
    }
    rows.push(cells.join(' | '));
  }

  return rows.join('\n');
};

/**
 * FIXED: Extract sections from Document AI response with complete structure
 * Ensures all sections have sectionName, content, pageReferences, confidence, boundingBoxes
 */
const extractSections = (document: any): ExtractedSection[] => {
  const sections: ExtractedSection[] = [];

  if (!document.pages) {
    return sections;
  }

  let currentSection: ExtractedSection | null = null;

  // Group text by page and blocks
  for (let pageIndex = 0; pageIndex < document.pages.length; pageIndex++) {
    const page = document.pages[pageIndex];
    const pageNumber = pageIndex + 1;

    // Extract blocks (paragraphs)
    if (page.blocks) {
      for (const block of page.blocks) {
        const text = extractTextFromLayout(block.layout, document.text);
        const boundingBox = normalizeBoundingBox(block.layout?.boundingPoly?.vertices || []);
        const confidence = block.layout?.confidence || 0.5;

        // Detect section headers (heuristic: short text, higher confidence, larger font)
        const isHeader = text.length < 100 && confidence > 0.9;

        if (isHeader) {
          // Save previous section if exists
          if (currentSection) {
            sections.push(currentSection);
          }

          // Start new section with complete structure
          currentSection = {
            sectionName: text.trim(),
            content: '',
            pageReferences: [{ pageNumber, boundingBox }],
            confidence,
            boundingBoxes: [boundingBox],
            specialContent: [],
            metadata: { language: page.detectedLanguages?.[0]?.languageCode || 'unknown' }
          };
        } else if (currentSection) {
          // Add to current section
          currentSection.content += (currentSection.content ? '\n' : '') + text;
          currentSection.pageReferences.push({ pageNumber, boundingBox });
          currentSection.boundingBoxes.push(boundingBox);
          currentSection.confidence = (currentSection.confidence + confidence) / 2;

          // Extract pharmaceutical content
          const pharmaContent = extractPharmaceuticalContent(text, pageNumber);
          currentSection.specialContent = [
            ...(currentSection.specialContent || []),
            ...pharmaContent
          ];
        } else {
          // No section started yet, create default section
          currentSection = {
            sectionName: 'Document Content',
            content: text,
            pageReferences: [{ pageNumber, boundingBox }],
            confidence,
            boundingBoxes: [boundingBox],
            specialContent: extractPharmaceuticalContent(text, pageNumber),
            metadata: { language: page.detectedLanguages?.[0]?.languageCode || 'unknown' }
          };
        }
      }
    }

    // Extract tables
    if (page.tables) {
      for (const table of page.tables) {
        const tableText = extractTableText(table, document.text);
        const boundingBox = normalizeBoundingBox(table.layout?.boundingPoly?.vertices || []);

        // Save previous section before adding table
        if (currentSection) {
          sections.push(currentSection);
          currentSection = null;
        }

        sections.push({
          sectionName: 'Table',
          content: tableText,
          pageReferences: [{ pageNumber, boundingBox }],
          confidence: table.layout?.confidence || 0.8,
          boundingBoxes: [boundingBox],
          specialContent: [{
            type: 'table',
            content: tableText,
            position: { pageNumber, boundingBox }
          }],
          metadata: { hasTable: true }
        });
      }
    }
  }

  // Add final section if exists
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
};

/**
 * FIXED: Process document with Google Document AI using batch processing
 * Processes all pages in a single API call to meet <30s requirement
 */
export const extractWithGoogleDocAI = async (
  imagePaths: string[],
  language: string
): Promise<NormalizedResponse> => {
  const startTime = Date.now();
  const client = getClient();
  const config = getProcessorConfig(language);

  const name = `projects/${PROJECT_ID}/locations/${LOCATION}/processors/${config.processorId}`;

  try {
    // FIXED: Batch process all pages in single request for speed
    // Read all images into memory
    const fs = await import('fs').then(m => m.promises);
    const imageBuffers = await Promise.all(
      imagePaths.map(path => fs.readFile(path))
    );

    // Combine all images into single PDF for batch processing
    const PDFDocument = (await import('pdf-lib')).PDFDocument;
    const pdfDoc = await PDFDocument.create();

    for (const imageBuffer of imageBuffers) {
      const image = await pdfDoc.embedPng(imageBuffer);
      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height
      });
    }

    const pdfBytes = await pdfDoc.save();

    // Single API call with timeout
    const request = {
      name,
      rawDocument: {
        content: Buffer.from(pdfBytes).toString('base64'),
        mimeType: 'application/pdf'
      }
    };

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Extraction timeout exceeded 30 seconds')), TIMEOUT_MS);
    });

    const [result] = await Promise.race([
      client.processDocument(request),
      timeoutPromise
    ]) as any[];

    const document = result.document;
    if (!document) {
      throw new Error('No document in response');
    }

    // Extract sections with complete structure
    const sections = extractSections(document);

    // Calculate metrics
    const processingTimeMs = Date.now() - startTime;
    const totalPages = imagePaths.length;
    const costUsd = (totalPages / 1000) * 1.50; // $1.50 per 1000 pages

    const averageConfidence = sections.length > 0
      ? sections.reduce((sum, s) => sum + s.confidence, 0) / sections.length
      : 0;

    return {
      sections,
      pageImages: imagePaths,
      processingTimeMs,
      costUsd,
      averageConfidence,
      metadata: {
        totalPages,
        language
      }
    };
  } catch (error) {
    if (error.message.includes('timeout')) {
      throw new Error(`Google Document AI extraction timeout: ${error.message}`);
    }
    throw new Error(`Google Document AI extraction failed: ${error.message}`);
  }
};

/**
 * Batch process multiple documents
 */
export const batchExtractWithGoogleDocAI = async (
  documents: Array<{ imagePaths: string[]; language: string }>
): Promise<NormalizedResponse[]> => {
  const results: NormalizedResponse[] = [];

  for (const doc of documents) {
    const result = await extractWithGoogleDocAI(doc.imagePaths, doc.language);
    results.push(result);
  }

  return results;
};