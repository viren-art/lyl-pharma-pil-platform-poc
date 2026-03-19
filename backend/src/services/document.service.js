/**
 * Document Service
 * Handles document CRUD operations with comprehensive filtering
 */

// Mock data store (in production, this would be database queries)
const mockDocuments = [
  {
    id: 1,
    productId: 1,
    productName: 'Aspirin 100mg',
    type: 'ApprovedPIL',
    marketId: 1,
    marketName: 'Taiwan',
    language: 'zh-TW',
    fileName: 'Aspirin_PIL_Taiwan_v2.3.pdf',
    filePath: 'documents/1/aspirin_pil_taiwan_v2.3.pdf',
    fileSize: 2457600,
    mimeType: 'application/pdf',
    uploadUserId: 1,
    uploadedBy: 'admin@lotus.com',
    uploadDate: '2024-01-15T08:30:00Z',
    status: 'Active',
    metadata: { pageCount: 12, version: '2.3' }
  },
  {
    id: 2,
    productId: 2,
    productName: 'Metformin 500mg',
    type: 'InnovatorPIL',
    marketId: null,
    marketName: null,
    language: 'en',
    fileName: 'Metformin_Innovator_EN.pdf',
    filePath: 'documents/2/metformin_innovator_en.pdf',
    fileSize: 1843200,
    mimeType: 'application/pdf',
    uploadUserId: 2,
    uploadedBy: 'ra.specialist@lotus.com',
    uploadDate: '2024-01-14T14:20:00Z',
    status: 'Active',
    metadata: { pageCount: 8 }
  },
  {
    id: 3,
    productId: 3,
    productName: 'Generic Guidelines',
    type: 'RegulatorySource',
    marketId: 2,
    marketName: 'Thailand',
    language: 'th',
    fileName: 'Thai_FDA_Guidelines_2024.pdf',
    filePath: 'documents/3/thai_fda_guidelines_2024.pdf',
    fileSize: 5242880,
    mimeType: 'application/pdf',
    uploadUserId: 1,
    uploadedBy: 'admin@lotus.com',
    uploadDate: '2024-01-13T10:15:00Z',
    status: 'Active',
    metadata: { pageCount: 45 }
  },
  {
    id: 4,
    productId: 4,
    productName: 'Ibuprofen 400mg',
    type: 'AWDraft',
    marketId: 3,
    marketName: 'Vietnam',
    language: 'vi',
    fileName: 'Ibuprofen_AW_Draft_v1.pdf',
    filePath: 'documents/4/ibuprofen_aw_draft_v1.pdf',
    fileSize: 3145728,
    mimeType: 'application/pdf',
    uploadUserId: 3,
    uploadedBy: 'aw.technician@lotus.com',
    uploadDate: '2024-01-12T16:45:00Z',
    status: 'Active',
    metadata: { pageCount: 15 }
  },
  {
    id: 5,
    productId: 5,
    productName: 'Paracetamol 500mg',
    type: 'CommercialAW',
    marketId: 4,
    marketName: 'Korea',
    language: 'ko',
    fileName: 'Paracetamol_Commercial_AW.pdf',
    filePath: 'documents/5/paracetamol_commercial_aw.pdf',
    fileSize: 4194304,
    mimeType: 'application/pdf',
    uploadUserId: 3,
    uploadedBy: 'aw.technician@lotus.com',
    uploadDate: '2024-01-11T09:30:00Z',
    status: 'Active',
    metadata: { pageCount: 20 }
  }
];

const mockProducts = [
  { id: 1, name: 'Aspirin 100mg', code: 'ASP-100' },
  { id: 2, name: 'Metformin 500mg', code: 'MET-500' },
  { id: 3, name: 'Generic Guidelines', code: 'GEN-GUIDE' },
  { id: 4, name: 'Ibuprofen 400mg', code: 'IBU-400' },
  { id: 5, name: 'Paracetamol 500mg', code: 'PAR-500' }
];

const mockMarkets = [
  { id: 1, name: 'Taiwan' },
  { id: 2, name: 'Thailand' },
  { id: 3, name: 'Vietnam' },
  { id: 4, name: 'Korea' }
];

const documentTypes = [
  'InnovatorPIL',
  'RegulatorySource',
  'RegulatoryAnnouncement',
  'ApprovedPIL',
  'AWDraft',
  'CommercialAW'
];

/**
 * List documents with comprehensive filtering and pagination
 * Supports all filter combinations needed by library.service.js
 */
export const listDocuments = (filters = {}) => {
  const {
    productId,
    type,
    types = [], // Array of types for multi-select
    marketId,
    markets = [], // Array of market IDs for multi-select
    language,
    languages = [], // Array of language codes for multi-select
    uploadDateFrom,
    uploadDateTo,
    uploadedBy,
    searchTerm,
    status = 'Active',
    page = 1,
    limit = 50
  } = filters;

  let filtered = [...mockDocuments];

  // Apply single-value filters (backward compatibility)
  if (productId) {
    filtered = filtered.filter(d => d.productId === parseInt(productId));
  }
  if (type) {
    filtered = filtered.filter(d => d.type === type);
  }
  if (marketId) {
    filtered = filtered.filter(d => d.marketId === parseInt(marketId));
  }
  if (language) {
    filtered = filtered.filter(d => d.language === language);
  }

  // Apply multi-select filters
  if (types.length > 0) {
    filtered = filtered.filter(d => types.includes(d.type));
  }
  if (markets.length > 0) {
    filtered = filtered.filter(d => 
      d.marketId && markets.map(m => parseInt(m)).includes(d.marketId)
    );
  }
  if (languages.length > 0) {
    filtered = filtered.filter(d => languages.includes(d.language));
  }

  // Apply date range filters
  if (uploadDateFrom) {
    const fromDate = new Date(uploadDateFrom);
    filtered = filtered.filter(d => new Date(d.uploadDate) >= fromDate);
  }
  if (uploadDateTo) {
    const toDate = new Date(uploadDateTo);
    filtered = filtered.filter(d => new Date(d.uploadDate) <= toDate);
  }

  // Apply uploader filter
  if (uploadedBy) {
    filtered = filtered.filter(d => 
      d.uploadedBy.toLowerCase().includes(uploadedBy.toLowerCase())
    );
  }

  // Apply search term (product name or file name)
  if (searchTerm && searchTerm.trim() !== '') {
    const searchLower = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(d => 
      d.productName.toLowerCase().includes(searchLower) ||
      d.fileName.toLowerCase().includes(searchLower)
    );
  }

  // Apply status filter
  if (status) {
    filtered = filtered.filter(d => d.status === status);
  }

  // Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedDocuments = filtered.slice(start, end);

  return {
    documents: paginatedDocuments,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages
    }
  };
};

/**
 * Get document metadata for filters
 */
export const getDocumentMetadata = () => {
  return {
    products: mockProducts,
    markets: mockMarkets,
    types: documentTypes
  };
};

/**
 * Get document by ID
 */
export const getDocumentById = (documentId) => {
  const document = mockDocuments.find(d => d.id === parseInt(documentId));
  if (!document) {
    throw new Error('Document not found');
  }
  return document;
};

/**
 * Get all unique languages from documents
 */
export const getAvailableLanguages = () => {
  const languages = new Set(mockDocuments.map(d => d.language));
  return Array.from(languages).sort();
};

/**
 * Get all unique uploaders from documents
 */
export const getAvailableUploaders = () => {
  const uploaders = new Set(mockDocuments.map(d => d.uploadedBy));
  return Array.from(uploaders).sort();
};