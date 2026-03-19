/**
 * Document Service
 * Mock implementation for document retrieval
 * In production, this would query the database
 */

const mockDocuments = [
  {
    id: 1,
    productId: 1,
    type: 'InnovatorPIL',
    marketId: null,
    language: 'en',
    filePath: '/documents/innovator-pil-1.pdf',
    fileName: 'Innovator-PIL-Product-A.pdf',
    fileSize: 1024000,
    uploadUserId: 1,
    uploadDate: '2024-01-15T10:00:00Z',
    status: 'Active',
  },
  {
    id: 2,
    productId: 1,
    type: 'RegulatorySource',
    marketId: 1,
    language: 'zh-TW',
    filePath: '/documents/regulatory-source-taiwan.pdf',
    fileName: 'TFDA-PIL-Format-2024.pdf',
    fileSize: 512000,
    uploadUserId: 1,
    uploadDate: '2024-01-15T10:30:00Z',
    status: 'Active',
  },
];

export const getDocumentById = async (documentId) => {
  const doc = mockDocuments.find((d) => d.id === documentId);
  if (!doc) {
    throw new Error(`Document not found: ${documentId}`);
  }
  return doc;
};

export const getDocumentsByProduct = async (productId) => {
  return mockDocuments.filter((d) => d.productId === productId);
};