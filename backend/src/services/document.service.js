/**
 * Get document by ID
 * @param {number} documentId - Document ID
 * @returns {Promise<Object|null>} Document object or null if not found
 */
export const getDocumentById = async (documentId) => {
  // Mock implementation - in production, query database
  const mockDocuments = {
    1: { id: 1, type: 'ApprovedPIL', productId: 1, marketId: 1, fileName: 'Paracetamol_PIL_TW.pdf' },
    101: { id: 101, type: 'RegulatoryAnnouncement', productId: 1, marketId: 1, fileName: 'TFDA_Announcement.pdf' },
    102: { id: 102, type: 'InnovatorPIL', productId: 1, marketId: 1, fileName: 'Innovator_PIL_US.pdf' },
    103: { id: 103, type: 'CommercialAW', productId: 1, marketId: 1, fileName: 'Commercial_AW.pdf' },
  };

  return mockDocuments[documentId] || null;
};