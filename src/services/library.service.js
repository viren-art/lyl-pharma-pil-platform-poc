import { listDocuments } from './document.service.js';

/**
 * Search documents by product name with partial match
 */
export const searchDocuments = async ({ searchTerm, ...filters }) => {
  // Get all documents with filters
  const result = listDocuments(filters);

  if (!searchTerm || searchTerm.trim() === '') {
    return result;
  }

  // Filter by product name (case-insensitive partial match)
  const searchLower = searchTerm.toLowerCase().trim();
  const filteredDocuments = result.documents.filter(doc => 
    doc.productName.toLowerCase().includes(searchLower)
  );

  return {
    documents: filteredDocuments,
    pagination: {
      ...result.pagination,
      total: filteredDocuments.length,
      totalPages: Math.ceil(filteredDocuments.length / result.pagination.limit)
    }
  };
};

/**
 * Get document version history for a product and market
 */
export const getDocumentVersionHistory = async ({ productId, marketId, type }) => {
  // Get all documents for product/market/type
  const result = listDocuments({
    productId,
    marketId,
    type,
    status: 'Active', // Include all statuses for version history
    page: 1,
    limit: 1000 // Get all versions
  });

  // Sort by upload date descending (newest first)
  const sortedDocuments = result.documents.sort((a, b) => 
    new Date(b.uploadDate) - new Date(a.uploadDate)
  );

  // Group by version (based on upload date)
  const versions = sortedDocuments.map((doc, index) => ({
    version: sortedDocuments.length - index, // Version 1 is oldest
    documentId: doc.id,
    fileName: doc.fileName,
    fileSize: doc.fileSize,
    uploadDate: doc.uploadDate,
    uploadedBy: doc.uploadedBy,
    status: doc.status,
    isCurrent: index === 0 // First document is current version
  }));

  return {
    productId: parseInt(productId),
    productName: sortedDocuments[0]?.productName || 'Unknown',
    marketId: marketId ? parseInt(marketId) : null,
    marketName: sortedDocuments[0]?.marketName || null,
    type,
    totalVersions: versions.length,
    versions
  };
};

/**
 * Get document statistics for library dashboard
 */
export const getLibraryStatistics = async () => {
  const allDocuments = listDocuments({ page: 1, limit: 10000 }).documents;

  const stats = {
    totalDocuments: allDocuments.length,
    documentsByType: {},
    documentsByMarket: {},
    documentsByStatus: {},
    recentUploads: allDocuments
      .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
      .slice(0, 10)
      .map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        type: doc.type,
        productName: doc.productName,
        uploadDate: doc.uploadDate,
        uploadedBy: doc.uploadedBy
      }))
  };

  // Count by type
  allDocuments.forEach(doc => {
    stats.documentsByType[doc.type] = (stats.documentsByType[doc.type] || 0) + 1;
    stats.documentsByStatus[doc.status] = (stats.documentsByStatus[doc.status] || 0) + 1;
    
    if (doc.marketName) {
      stats.documentsByMarket[doc.marketName] = (stats.documentsByMarket[doc.marketName] || 0) + 1;
    }
  });

  return stats;
};

/**
 * Advanced filter with multiple criteria
 */
export const advancedFilter = async (filters) => {
  const {
    searchTerm,
    types = [], // Array of document types
    markets = [], // Array of market IDs
    languages = [], // Array of language codes
    uploadDateFrom,
    uploadDateTo,
    uploadedBy,
    status = 'Active',
    page = 1,
    limit = 50
  } = filters;

  // Start with all documents
  let result = listDocuments({ status, page: 1, limit: 10000 });
  let filtered = result.documents;

  // Apply search term
  if (searchTerm && searchTerm.trim() !== '') {
    const searchLower = searchTerm.toLowerCase().trim();
    filtered = filtered.filter(doc => 
      doc.productName.toLowerCase().includes(searchLower) ||
      doc.fileName.toLowerCase().includes(searchLower)
    );
  }

  // Apply type filter (multi-select)
  if (types.length > 0) {
    filtered = filtered.filter(doc => types.includes(doc.type));
  }

  // Apply market filter (multi-select)
  if (markets.length > 0) {
    filtered = filtered.filter(doc => 
      doc.marketId && markets.includes(doc.marketId.toString())
    );
  }

  // Apply language filter
  if (languages.length > 0) {
    filtered = filtered.filter(doc => languages.includes(doc.language));
  }

  // Apply date range filter
  if (uploadDateFrom) {
    const fromDate = new Date(uploadDateFrom);
    filtered = filtered.filter(doc => new Date(doc.uploadDate) >= fromDate);
  }
  if (uploadDateTo) {
    const toDate = new Date(uploadDateTo);
    filtered = filtered.filter(doc => new Date(doc.uploadDate) <= toDate);
  }

  // Apply uploader filter
  if (uploadedBy) {
    filtered = filtered.filter(doc => 
      doc.uploadedBy.toLowerCase().includes(uploadedBy.toLowerCase())
    );
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
    },
    appliedFilters: {
      searchTerm,
      types,
      markets,
      languages,
      uploadDateFrom,
      uploadDateTo,
      uploadedBy,
      status
    }
  };
};

/**
 * Get document comparison candidates
 * Returns documents that can be compared (same product, different versions or types)
 */
export const getComparisonCandidates = async (documentId) => {
  const allDocuments = listDocuments({ page: 1, limit: 10000 }).documents;
  const sourceDocument = allDocuments.find(d => d.id === parseInt(documentId));

  if (!sourceDocument) {
    throw new Error('Source document not found');
  }

  // Find documents with same product
  const candidates = allDocuments.filter(doc => 
    doc.id !== parseInt(documentId) &&
    doc.productId === sourceDocument.productId &&
    doc.status === 'Active'
  );

  // Group by type
  const groupedCandidates = {
    sameType: candidates.filter(d => d.type === sourceDocument.type),
    differentType: candidates.filter(d => d.type !== sourceDocument.type)
  };

  return {
    sourceDocument: {
      id: sourceDocument.id,
      fileName: sourceDocument.fileName,
      type: sourceDocument.type,
      productName: sourceDocument.productName,
      marketName: sourceDocument.marketName
    },
    candidates: groupedCandidates,
    totalCandidates: candidates.length
  };
};