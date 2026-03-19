import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DocumentLibraryEnhanced() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedMarkets, setSelectedMarkets] = useState([]);
  const [filterStatus, setFilterStatus] = useState('Active');

  const [products, setProducts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [statistics, setStatistics] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [versionHistory, setVersionHistory] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    loadMetadata();
    loadStatistics();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [searchTerm, selectedTypes, selectedMarkets, filterStatus, pagination.page]);

  const loadMetadata = async () => {
    try {
      const [productsRes, marketsRes, typesRes] = await Promise.all([
        fetch('/api/documents/metadata/products', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/documents/metadata/markets', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/documents/metadata/types', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const productsData = await productsRes.json();
      const marketsData = await marketsRes.json();
      const typesData = await typesRes.json();

      setProducts(productsData.products);
      setMarkets(marketsData.markets);
      setDocumentTypes(typesData.types);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('/api/library/statistics', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/library/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          searchTerm,
          types: selectedTypes,
          markets: selectedMarkets,
          status: filterStatus,
          page: pagination.page,
          limit: pagination.limit
        })
      });

      if (!response.ok) throw new Error('Failed to load documents');

      const data = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVersionHistory = async (productId, marketId, type) => {
    try {
      const params = new URLSearchParams({
        productId,
        type
      });
      if (marketId) params.append('marketId', marketId);

      const response = await fetch(`/api/library/version-history?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to load version history');

      const data = await response.json();
      setVersionHistory(data);
      setShowVersionHistory(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
    setPagination({ ...pagination, page: 1 });
  };

  const toggleMarketFilter = (marketId) => {
    setSelectedMarkets(prev =>
      prev.includes(marketId.toString())
        ? prev.filter(m => m !== marketId.toString())
        : [...prev, marketId.toString()]
    );
    setPagination({ ...pagination, page: 1 });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedMarkets([]);
    setFilterStatus('Active');
    setPagination({ ...pagination, page: 1 });
  };

  const formatFileSize = (bytes) => {
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type) => {
    const colors = {
      'InnovatorPIL': 'bg-blue-100 text-blue-800',
      'RegulatorySource': 'bg-purple-100 text-purple-800',
      'RegulatoryAnnouncement': 'bg-yellow-100 text-yellow-800',
      'ApprovedPIL': 'bg-green-100 text-green-800',
      'AWDraft': 'bg-orange-100 text-orange-800',
      'CommercialAW': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Library</h1>
              <p className="mt-1 text-sm text-gray-500">
                Search, filter, and manage all pharmaceutical documents
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Documents</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.totalDocuments}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Document Types</div>
              <div className="text-2xl font-bold text-gray-900">
                {Object.keys(statistics.documentsByType).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Markets</div>
              <div className="text-2xl font-bold text-gray-900">
                {Object.keys(statistics.documentsByMarket).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Active Documents</div>
              <div className="text-2xl font-bold text-gray-900">
                {statistics.documentsByStatus.Active || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                {(searchTerm || selectedTypes.length > 0 || selectedMarkets.length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Product
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  placeholder="Product name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Document Type Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type
                </label>
                <div className="space-y-2">
                  {documentTypes.map(type => (
                    <label key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => toggleTypeFilter(type)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Market Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market
                </label>
                <div className="space-y-2">
                  {markets.map(market => (
                    <label key={market.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMarkets.includes(market.id.toString())}
                        onChange={() => toggleMarketFilter(market.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{market.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Active">Active</option>
                  <option value="Superseded">Superseded</option>
                  <option value="Deleted">Deleted</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-gray-400 text-6xl mb-4">📄</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedTypes.length > 0 || selectedMarkets.length > 0
                      ? 'Try adjusting your filters'
                      : 'Upload your first document to get started'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Document
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Market
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Upload Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {documents.map(doc => (
                          <tr key={doc.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="text-2xl mr-3">📄</div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {doc.fileName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatFileSize(doc.fileSize)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
                                {doc.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {doc.productName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {doc.marketName || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(doc.uploadDate)}
                              </div>
                              <div className="text-sm text-gray-500">
                                by {doc.uploadedBy}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => loadVersionHistory(doc.productId, doc.marketId, doc.type)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                                title="View version history"
                              >
                                📋
                              </button>
                              <a
                                href={`/api/documents/download/${doc.filePath}`}
                                className="text-blue-600 hover:text-blue-900"
                                title="Download"
                              >
                                ⬇️
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                        {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                        {pagination.total} documents
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                          disabled={pagination.page === 1}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <span className="px-3 py-1 text-sm text-gray-700">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <button
                          onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                          disabled={pagination.page === pagination.totalPages}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Version History Modal */}
      {showVersionHistory && versionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Version History: {versionHistory.productName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {versionHistory.type} • {versionHistory.marketName || 'All Markets'}
              </p>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4">
                {versionHistory.versions.map((version) => (
                  <div
                    key={version.version}
                    className={`border rounded-lg p-4 ${
                      version.isCurrent ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          Version {version.version}
                        </span>
                        {version.isCurrent && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(version.uploadDate)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 mb-1">
                      <strong>File:</strong> {version.fileName}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <strong>Size:</strong> {formatFileSize(version.fileSize)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Uploaded by:</strong> {version.uploadedBy}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowVersionHistory(false);
                  setVersionHistory(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}