export interface ExtractedSection {
  sectionName: string;
  content: string;
  pageReferences: number[];
  confidence?: number;
  boundingBoxes?: any[];
  specialContent?: {
    type: 'table' | 'formula' | 'image';
    rows?: number;
    columns?: number;
    formula?: string;
  };
}

export interface ExtractionResult {
  documentId: number;
  documentType: string;
  language: string;
  extractedAt: string;
  sections: ExtractedSection[];
  metadata: {
    totalPages: number;
    processingTimeMs: number;
    provider: string;
    averageConfidence?: number;
  };
}