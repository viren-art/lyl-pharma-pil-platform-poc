// LYL_DEP: @anthropic-ai/sdk@^0.20.0
// LYL_DEP: pdf-poppler@^0.2.1
// LYL_DEP: sharp@^0.33.0

import Anthropic from '@anthropic-ai/sdk';
import { convert } from 'pdf-poppler';
import sharp from 'sharp';
import type { ExtractionResult, ExtractedSection } from './extraction.schema';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const MODEL = 'claude-3-opus-20240229';
const MAX_TOKENS = 4096;

/**
 * Convert PDF to images for Claude Vision
 */
const convertPdfToImages = async (pdfPath: string): Promise<string[]> => {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');

  // Create temp directory for images
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-images-'));

  try {
    // Convert PDF to PNG images
    const opts = {
      format: 'png',
      out_dir: tempDir,
      out_prefix: 'page',
      page: null // Convert all pages
    };

    await convert(pdfPath, opts);

    // Read all generated images
    const files = await fs.readdir(tempDir);
    const imageFiles = files.filter(f => f.endsWith('.png')).sort();

    // Convert images to base64
    const base64Images: string[] = [];
    for (const file of imageFiles) {
      const imagePath = path.join(tempDir, file);
      const imageBuffer = await fs.readFile(imagePath);
      
      // Optimize image with sharp (resize if too large)
      const optimizedBuffer = await sharp(imageBuffer)
        .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
        .png({ quality: 90 })
        .toBuffer();

      base64Images.push(optimizedBuffer.toString('base64'));
    }

    return base64Images;
  } finally {
    // Cleanup temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  }
};

/**
 * Generate extraction prompt for Claude Vision
 */
const generateExtractionPrompt = (language: string, documentType: string): string => {
  return `You are a pharmaceutical document extraction expert. Analyze this ${documentType} document and extract ALL sections with PHARMACEUTICAL PRECISION.

LANGUAGE: ${language}

EXTRACTION REQUIREMENTS:
1. Identify ALL section headers and their content
2. Preserve pharmaceutical formatting:
   - Subscripts (H₂O, CO₂)
   - Superscripts (mg/m², 10³)
   - Greek letters (μg, β-blocker)
   - Chemical formulas
   - Dosages with units (mg, ml, g, mcg, IU)
3. Extract tables as structured content
4. Maintain section hierarchy and ordering
5. Include page numbers for each section

PHARMACEUTICAL SECTIONS TO IDENTIFY:
- Product Name / Trade Name
- Composition / Active Ingredients
- Indications / Therapeutic Uses
- Dosage and Administration
- Contraindications
- Warnings and Precautions
- Adverse Reactions / Side Effects
- Drug Interactions
- Special Populations (Pregnancy, Lactation, Pediatric, Geriatric)
- Overdose
- Storage Conditions
- Manufacturer Information

OUTPUT FORMAT (JSON):
{
  "sections": [
    {
      "sectionName": "Exact section header",
      "content": "Full section content with preserved formatting",
      "pageNumber": 1,
      "confidence": 0.95
    }
  ]
}

CONFIDENCE SCORE GUIDELINES:
- 1.0: Clear section header and content
- 0.9-0.99: High confidence
- 0.8-0.89: Medium confidence (possible ambiguity)
- 0.7-0.79: Low confidence
- <0.7: Very uncertain

Analyze the document carefully and return ONLY the JSON object with ALL extracted sections.`;
};

/**
 * Extract sections from document using Claude Vision
 */
export const extractWithClaudeVision = async (
  filePath: string,
  language: string,
  documentType: string,
  documentId: number
): Promise<ExtractionResult> => {
  const startTime = Date.now();

  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey: CLAUDE_API_KEY });

  try {
    // Convert PDF to images
    const base64Images = await convertPdfToImages(filePath);

    if (base64Images.length === 0) {
      throw new Error('No images generated from PDF');
    }

    // Process each page with Claude Vision
    const allSections: ExtractedSection[] = [];
    const prompt = generateExtractionPrompt(language, documentType);

    for (let i = 0; i < base64Images.length; i++) {
      const pageNumber = i + 1;
      const base64Image = base64Images[i];

      const response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      });

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        console.warn(`No text response from Claude Vision for page ${pageNumber}`);
        continue;
      }

      try {
        const parsed = JSON.parse(textContent.text);
        const pageSections: ExtractedSection[] = parsed.sections.map((s: any) => ({
          sectionName: s.sectionName,
          content: s.content,
          pageReferences: [pageNumber],
          confidence: s.confidence || 0.85,
          boundingBoxes: []
        }));

        allSections.push(...pageSections);
      } catch (parseError) {
        console.error(`Failed to parse Claude Vision response for page ${pageNumber}:`, parseError);
      }
    }

    // Merge sections with same name across pages
    const mergedSections: ExtractedSection[] = [];
    const sectionMap = new Map<string, ExtractedSection>();

    for (const section of allSections) {
      const existing = sectionMap.get(section.sectionName);
      if (existing) {
        existing.content += '\n' + section.content;
        existing.pageReferences.push(...section.pageReferences);
        existing.confidence = (existing.confidence! + section.confidence!) / 2;
      } else {
        sectionMap.set(section.sectionName, { ...section });
      }
    }

    mergedSections.push(...sectionMap.values());

    const processingTimeMs = Date.now() - startTime;

    return {
      documentId,
      documentType,
      language,
      extractedAt: new Date().toISOString(),
      sections: mergedSections,
      metadata: {
        totalPages: base64Images.length,
        processingTimeMs,
        provider: 'ClaudeVision',
        averageConfidence: mergedSections.reduce((sum, s) => sum + (s.confidence || 0), 0) / mergedSections.length
      }
    };
  } catch (error) {
    console.error('Claude Vision extraction error:', error);
    throw new Error(`Claude Vision extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};