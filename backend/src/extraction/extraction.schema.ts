/**
 * Unified extraction result schema
 * Normalizes responses from Google Document AI and Claude Vision
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageReference {
  pageNumber: number;
  boundingBox?: BoundingBox;
}

export interface SpecialContent {
  type: 'subscript' | 'superscript' | 'greek_letter' | 'chemical_formula' | 'table' | 'list';
  content: string;
  position: PageReference;
  confidence?: number;
}

export interface ExtractedSection {
  sectionName: string;
  content: string;
  pageReferences: PageReference[];
  confidence: number; // 0.0 - 1.0
  boundingBoxes: BoundingBox[];
  specialContent?: SpecialContent[];
  metadata?: {
    hasTable?: boolean;
    hasList?: boolean;
    hasFormula?: boolean;
    language?: string;
  };
}

export interface ExtractionResult {
  documentId: number;
  provider: 'GoogleDocAI' | 'ClaudeVision';
  sections: ExtractedSection[];
  pageImages: string[]; // Cloud Storage URLs
  extractionDate: string; // ISO 8601
  status: 'Success' | 'Failed' | 'PartialSuccess';
  errorMessage?: string;
  processingTimeMs: number;
  costUsd?: number;
  averageConfidence: number;
  metadata: {
    totalPages: number;
    language: string;
    documentType?: string;
    marketId?: number;
  };
}

export interface ExtractionRequest {
  documentId: number;
  filePath: string;
  marketId: number;
  language: string;
  documentType: string;
  preferredProvider?: 'GoogleDocAI' | 'ClaudeVision';
}

export interface ProviderConfig {
  provider: 'GoogleDocAI' | 'ClaudeVision';
  enabled: boolean;
  priority: number; // Lower = higher priority
  config: {
    apiKey?: string;
    projectId?: string;
    processorId?: string;
    location?: string;
    maxRetries?: number;
    timeoutMs?: number;
  };
}

export interface NormalizedResponse {
  sections: ExtractedSection[];
  pageImages: string[];
  processingTimeMs: number;
  costUsd?: number;
  averageConfidence: number;
  metadata: {
    totalPages: number;
    language: string;
  };
}

/**
 * Calculate average confidence across all sections
 */
export const calculateAverageConfidence = (sections: ExtractedSection[]): number => {
  if (sections.length === 0) return 0;
  const sum = sections.reduce((acc, section) => acc + section.confidence, 0);
  return sum / sections.length;
};

/**
 * Validate extraction result completeness
 */
export const validateExtractionResult = (result: ExtractionResult): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!result.documentId) {
    errors.push('Missing documentId');
  }

  if (!result.provider || !['GoogleDocAI', 'ClaudeVision'].includes(result.provider)) {
    errors.push('Invalid provider');
  }

  if (!result.sections || result.sections.length === 0) {
    errors.push('No sections extracted');
  }

  if (!result.pageImages || result.pageImages.length === 0) {
    errors.push('No page images provided');
  }

  if (result.averageConfidence < 0 || result.averageConfidence > 1) {
    errors.push('Invalid average confidence score');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Merge special content from multiple detection passes
 */
export const mergeSpecialContent = (
  existing: SpecialContent[],
  newContent: SpecialContent[]
): SpecialContent[] => {
  const merged = [...existing];
  
  for (const content of newContent) {
    const duplicate = merged.find(
      c => c.type === content.type && 
           c.content === content.content &&
           c.position.pageNumber === content.position.pageNumber
    );
    
    if (!duplicate) {
      merged.push(content);
    }
  }
  
  return merged;
};

/**
 * FIXED: Validate section structure completeness
 * Ensures all required fields are present with proper types
 */
export const validateSectionStructure = (section: ExtractedSection): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!section.sectionName || typeof section.sectionName !== 'string') {
    errors.push('Missing or invalid sectionName');
  }

  if (!section.content || typeof section.content !== 'string') {
    errors.push('Missing or invalid content');
  }

  if (!Array.isArray(section.pageReferences) || section.pageReferences.length === 0) {
    errors.push('Missing or invalid pageReferences array');
  }

  if (typeof section.confidence !== 'number' || section.confidence < 0 || section.confidence > 1) {
    errors.push('Missing or invalid confidence score');
  }

  if (!Array.isArray(section.boundingBoxes)) {
    errors.push('Missing or invalid boundingBoxes array');
  }

  // Validate page references structure
  for (const ref of section.pageReferences || []) {
    if (typeof ref.pageNumber !== 'number' || ref.pageNumber < 1) {
      errors.push(`Invalid pageNumber in pageReferences: ${ref.pageNumber}`);
    }
  }

  // Validate bounding boxes structure
  for (const box of section.boundingBoxes || []) {
    if (typeof box.x !== 'number' || typeof box.y !== 'number' ||
        typeof box.width !== 'number' || typeof box.height !== 'number') {
      errors.push('Invalid bounding box structure');
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};