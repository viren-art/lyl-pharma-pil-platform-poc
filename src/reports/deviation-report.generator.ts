// LYL_DEP: pdfkit@^0.13.0
// LYL_DEP: @google-cloud/storage@^7.0.0

import PDFDocument from 'pdfkit';
import { Storage } from '@google-cloud/storage';
import { createWriteStream } from 'fs';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { DeviationReport } from '../comparison/deviation-detector.service';
import type { ExtractionResult } from '../extraction/extraction.schema';

const TEMP_DIR = process.env.TEMP_DIR || '/tmp/pil-lens';
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;
const GCP_STORAGE_BUCKET = process.env.GCP_STORAGE_BUCKET;

interface GenerateReportRequest {
  workflowId: number;
  deviationReport: DeviationReport;
  awDraftExtraction: ExtractionResult;
  approvedPilExtraction: ExtractionResult;
}

/**
 * Initialize GCP Storage client
 */
const getStorageClient = (): Storage => {
  return new Storage({ projectId: GCP_PROJECT_ID });
};

/**
 * Ensure temp directory exists
 */
const ensureTempDir = async (): Promise<void> => {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
};

/**
 * Generate PDF header
 */
const generateHeader = (doc: PDFKit.PDFDocument, workflowId: number): void => {
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('AW Review Deviation Report', 50, 50);

  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`Workflow ID: ${workflowId}`, 50, 85)
    .text(`Generated: ${new Date().toLocaleString()}`, 50, 100);

  doc.moveTo(50, 120).lineTo(550, 120).stroke();
};

/**
 * Generate summary section
 */
const generateSummary = (doc: PDFKit.PDFDocument, report: DeviationReport): void => {
  doc.fontSize(16).font('Helvetica-Bold').text('Summary', 50, 140);

  const summaryY = 165;
  doc.fontSize(10).font('Helvetica');

  doc.text(`Total Deviations: ${report.summary.totalDeviations}`, 50, summaryY);
  doc
    .fillColor('#dc2626')
    .text(`Critical: ${report.summary.criticalCount}`, 200, summaryY)
    .fillColor('#000000');
  doc
    .fillColor('#f59e0b')
    .text(`Major: ${report.summary.majorCount}`, 300, summaryY)
    .fillColor('#000000');
  doc
    .fillColor('#3b82f6')
    .text(`Minor: ${report.summary.minorCount}`, 400, summaryY)
    .fillColor('#000000');

  doc.moveTo(50, summaryY + 25).lineTo(550, summaryY + 25).stroke();
};

/**
 * Generate review checklist section
 */
const generateReviewChecklist = (doc: PDFKit.PDFDocument, report: DeviationReport): void => {
  let currentY = 220;

  doc.fontSize(16).font('Helvetica-Bold').text('Review Checklist', 50, currentY);
  currentY += 25;

  doc.fontSize(10).font('Helvetica').fillColor('#666666');
  doc.text('Complete this checklist to ensure systematic review and reduce review rounds:', 50, currentY, { width: 500 });
  currentY += 30;

  // Critical Deviations Checklist
  const criticalDeviations = report.deviations.filter(d => d.severity === 'Critical');
  if (criticalDeviations.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text(`□ Critical Deviations (${criticalDeviations.length})`, 50, currentY);
    currentY += 20;

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    criticalDeviations.forEach((dev, idx) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      doc.text(`   □ ${dev.sectionName}: ${dev.description.substring(0, 80)}...`, 60, currentY, { width: 480 });
      currentY += 15;
    });
    currentY += 10;
  }

  // Major Deviations Checklist
  const majorDeviations = report.deviations.filter(d => d.severity === 'Major');
  if (majorDeviations.length > 0) {
    if (currentY > 650) {
      doc.addPage();
      currentY = 50;
    }
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#f59e0b');
    doc.text(`□ Major Deviations (${majorDeviations.length})`, 50, currentY);
    currentY += 20;

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    majorDeviations.forEach((dev, idx) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      doc.text(`   □ ${dev.sectionName}: ${dev.description.substring(0, 80)}...`, 60, currentY, { width: 480 });
      currentY += 15;
    });
    currentY += 10;
  }

  // Minor Deviations Checklist
  const minorDeviations = report.deviations.filter(d => d.severity === 'Minor');
  if (minorDeviations.length > 0) {
    if (currentY > 650) {
      doc.addPage();
      currentY = 50;
    }
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#3b82f6');
    doc.text(`□ Minor Deviations (${minorDeviations.length})`, 50, currentY);
    currentY += 20;

    doc.fontSize(9).font('Helvetica').fillColor('#000000');
    minorDeviations.forEach((dev, idx) => {
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
      doc.text(`   □ ${dev.sectionName}: ${dev.description.substring(0, 80)}...`, 60, currentY, { width: 480 });
      currentY += 15;
    });
    currentY += 10;
  }

  // Final Review Steps
  if (currentY > 600) {
    doc.addPage();
    currentY = 50;
  }
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
  doc.text('□ Final Review Steps', 50, currentY);
  currentY += 20;

  doc.fontSize(9).font('Helvetica');
  const finalSteps = [
    'All critical deviations resolved or documented',
    'All major deviations reviewed and approved/rejected',
    'Minor deviations reviewed for batch correction',
    'Pharmaceutical content accuracy verified (dosages, warnings, contraindications)',
    'Mandatory sections present and complete',
    'Formatting consistency verified',
    'Regulatory compliance confirmed',
    'Sign-off obtained from RA Manager'
  ];

  finalSteps.forEach(step => {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }
    doc.text(`   □ ${step}`, 60, currentY, { width: 480 });
    currentY += 15;
  });

  currentY += 20;
  doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
  currentY += 15;

  // Signature section
  doc.fontSize(10).font('Helvetica-Bold');
  doc.text('Reviewed by: _________________________', 50, currentY);
  currentY += 20;
  doc.text('Date: _________________________', 50, currentY);
  currentY += 20;
  doc.text('RA Manager Approval: _________________________', 50, currentY);

  doc.addPage();
};

/**
 * Generate deviation details
 */
const generateDeviations = (doc: PDFKit.PDFDocument, report: DeviationReport): void => {
  let currentY = 50;

  doc.fontSize(16).font('Helvetica-Bold').text('Detailed Deviations', 50, currentY);
  currentY += 30;

  // Sort by severity (Critical first)
  const sortedDeviations = [...report.deviations].sort((a, b) => {
    const severityOrder = { Critical: 0, Major: 1, Minor: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  sortedDeviations.forEach((deviation, index) => {
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
    }

    // Severity badge
    const severityColors = {
      Critical: '#dc2626',
      Major: '#f59e0b',
      Minor: '#3b82f6'
    };

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(severityColors[deviation.severity])
      .text(`${index + 1}. ${deviation.severity}`, 50, currentY);

    doc.fillColor('#000000').font('Helvetica').fontSize(10);

    currentY += 20;

    // Section name
    doc.text(`Section: ${deviation.sectionName}`, 60, currentY);
    currentY += 15;

    // Description
    doc.text(`Description: ${deviation.description}`, 60, currentY, { width: 480 });
    currentY += Math.ceil(deviation.description.length / 80) * 15 + 5;

    // Page reference
    doc.text(`Page: ${deviation.pageReference}`, 60, currentY);
    currentY += 15;

    // Change type
    doc.text(`Change Type: ${deviation.changeType}`, 60, currentY);
    currentY += 20;

    // Side-by-side comparison
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Approved PIL:', 60, currentY);
    doc.text('AW Draft:', 310, currentY);
    currentY += 15;

    doc.font('Helvetica').fontSize(8);

    // Approved text (left column)
    const approvedText = deviation.approvedText.substring(0, 200);
    doc.text(approvedText, 60, currentY, { width: 230, height: 60 });

    // AW text (right column)
    const awText = deviation.awText.substring(0, 200);
    doc.text(awText, 310, currentY, { width: 230, height: 60 });

    currentY += 70;

    // Separator
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 15;
  });
};

/**
 * Generate footer
 */
const generateFooter = (doc: PDFKit.PDFDocument): void => {
  const pageCount = doc.bufferedPageRange().count;

  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(`Page ${i + 1} of ${pageCount}`, 50, 770, { align: 'center', width: 500 });
  }
};

/**
 * Generate deviation report PDF with review checklist
 */
export const generateDeviationReport = async (
  request: GenerateReportRequest
): Promise<string> => {
  await ensureTempDir();

  const reportId = randomUUID();
  const fileName = `deviation-report-${request.workflowId}-${reportId}.pdf`;
  const tempPath = path.join(TEMP_DIR, fileName);

  // Create PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  // Pipe to file
  const writeStream = createWriteStream(tempPath);
  doc.pipe(writeStream);

  // Generate content
  generateHeader(doc, request.workflowId);
  generateSummary(doc, request.deviationReport);
  generateReviewChecklist(doc, request.deviationReport);
  generateDeviations(doc, request.deviationReport);
  generateFooter(doc);

  // Finalize PDF
  doc.end();

  // Wait for write to complete
  await new Promise<void>((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  // Upload to GCP Cloud Storage
  const storage = getStorageClient();
  const bucket = storage.bucket(GCP_STORAGE_BUCKET!);
  const destination = `reports/${fileName}`;

  await bucket.upload(tempPath, {
    destination,
    metadata: {
      contentType: 'application/pdf',
      metadata: {
        workflowId: request.workflowId.toString(),
        reportType: 'deviation',
        generatedAt: new Date().toISOString()
      }
    }
  });

  // Generate signed URL (valid for 7 days)
  const [url] = await bucket.file(destination).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000
  });

  // Cleanup temp file
  await fs.unlink(tempPath);

  return url;
};

/**
 * Generate deviation report with visual highlighting
 */
export const generateDeviationReportWithHighlighting = async (
  request: GenerateReportRequest
): Promise<string> => {
  // For MVP, use basic PDF generation
  // In production, would add visual highlighting using page images
  return generateDeviationReport(request);
};

/**
 * Batch generate reports
 */
export const batchGenerateReports = async (
  requests: GenerateReportRequest[]
): Promise<string[]> => {
  const urls: string[] = [];

  for (const request of requests) {
    const url = await generateDeviationReport(request);
    urls.push(url);
  }

  return urls;
};