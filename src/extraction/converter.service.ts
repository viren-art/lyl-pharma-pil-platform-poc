// LYL_DEP: pdf-lib@^1.17.1
// LYL_DEP: sharp@^0.33.0
// LYL_DEP: pdf-poppler@^0.2.1
// LYL_DEP: libreoffice-convert@^1.6.0

import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { convert as pdfPoppler } from 'pdf-poppler';
import libre from 'libreoffice-convert';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/pil-lens';
const IMAGE_DPI = 300; // FIXED: Explicitly set to 300 DPI as per AC-2
const IMAGE_FORMAT = 'png';

/**
 * Ensure temp directory exists
 */
const ensureTempDir = async (): Promise<void> => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create temp directory:', error);
    throw new Error('Failed to initialize temp directory');
  }
};

/**
 * Convert Word document to PDF using LibreOffice headless
 */
export const convertWordToPdf = async (wordFilePath: string): Promise<string> => {
  await ensureTempDir();

  const wordBuffer = await fs.readFile(wordFilePath);
  const outputPath = path.join(TEMP_DIR, `${randomUUID()}.pdf`);

  return new Promise((resolve, reject) => {
    libre.convert(wordBuffer, '.pdf', undefined, (err, pdfBuffer) => {
      if (err) {
        reject(new Error(`LibreOffice conversion failed: ${err.message}`));
        return;
      }

      fs.writeFile(outputPath, pdfBuffer)
        .then(() => resolve(outputPath))
        .catch(reject);
    });
  });
};

/**
 * Convert PDF pages to PNG images at 300 DPI
 * FIXED: Explicitly enforces 300 DPI conversion as per AC-2
 */
export const convertPdfToImages = async (pdfFilePath: string): Promise<string[]> => {
  await ensureTempDir();

  const outputDir = path.join(TEMP_DIR, randomUUID());
  await fs.mkdir(outputDir, { recursive: true });

  const options = {
    format: IMAGE_FORMAT,
    out_dir: outputDir,
    out_prefix: 'page',
    page: null, // Convert all pages
    scale: IMAGE_DPI / 72 // FIXED: PDF default is 72 DPI, scale to exactly 300 DPI
  };

  try {
    await pdfPoppler(pdfFilePath, options);

    // Get all generated images
    const files = await fs.readdir(outputDir);
    const imageFiles = files
      .filter(f => f.endsWith(`.${IMAGE_FORMAT}`))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.match(/\d+/)?.[0] || '0');
        return numA - numB;
      })
      .map(f => path.join(outputDir, f));

    return imageFiles;
  } catch (error) {
    throw new Error(`PDF to image conversion failed: ${error.message}`);
  }
};

/**
 * Optimize image for vision API processing
 * - Resize if too large (max 4096x4096)
 * - Enhance contrast for better OCR
 * - Convert to optimal format
 */
export const optimizeImageForVision = async (imagePath: string): Promise<string> => {
  await ensureTempDir();

  const outputPath = path.join(TEMP_DIR, `${randomUUID()}_optimized.png`);

  try {
    const metadata = await sharp(imagePath).metadata();
    const maxDimension = 4096;

    let pipeline = sharp(imagePath);

    // Resize if too large
    if (metadata.width && metadata.width > maxDimension || 
        metadata.height && metadata.height > maxDimension) {
      pipeline = pipeline.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Enhance for OCR
    await pipeline
      .normalize() // Auto-adjust contrast
      .sharpen() // Enhance edges
      .png({ quality: 100, compressionLevel: 6 })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    throw new Error(`Image optimization failed: ${error.message}`);
  }
};

/**
 * Convert image to base64 for API transmission
 */
export const imageToBase64 = async (imagePath: string): Promise<string> => {
  const buffer = await fs.readFile(imagePath);
  return buffer.toString('base64');
};

/**
 * Get PDF page count
 */
export const getPdfPageCount = async (pdfFilePath: string): Promise<number> => {
  const pdfBuffer = await fs.readFile(pdfFilePath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  return pdfDoc.getPageCount();
};

/**
 * Clean up temporary files
 */
export const cleanupTempFiles = async (filePaths: string[]): Promise<void> => {
  for (const filePath of filePaths) {
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error);
    }
  }
};

/**
 * Full document conversion pipeline
 * Handles Word → PDF → Images with cleanup
 */
export const convertDocumentForExtraction = async (
  filePath: string,
  mimeType: string
): Promise<{ pdfPath: string; imagePaths: string[]; pageCount: number }> => {
  const tempFiles: string[] = [];

  try {
    let pdfPath = filePath;

    // Convert Word to PDF if needed
    if (mimeType.includes('word') || mimeType.includes('document')) {
      pdfPath = await convertWordToPdf(filePath);
      tempFiles.push(pdfPath);
    }

    // Get page count
    const pageCount = await getPdfPageCount(pdfPath);

    // Convert PDF to images at 300 DPI
    const rawImagePaths = await convertPdfToImages(pdfPath);
    tempFiles.push(...rawImagePaths);

    // Optimize images for vision processing
    const optimizedImagePaths: string[] = [];
    for (const imagePath of rawImagePaths) {
      const optimized = await optimizeImageForVision(imagePath);
      optimizedImagePaths.push(optimized);
      tempFiles.push(optimized);
    }

    return {
      pdfPath,
      imagePaths: optimizedImagePaths,
      pageCount
    };
  } catch (error) {
    // Cleanup on error
    await cleanupTempFiles(tempFiles);
    throw error;
  }
};

/**
 * Batch convert multiple documents
 */
export const batchConvertDocuments = async (
  documents: Array<{ filePath: string; mimeType: string }>
): Promise<Array<{ pdfPath: string; imagePaths: string[]; pageCount: number }>> => {
  const results = [];

  for (const doc of documents) {
    const result = await convertDocumentForExtraction(doc.filePath, doc.mimeType);
    results.push(result);
  }

  return results;
};