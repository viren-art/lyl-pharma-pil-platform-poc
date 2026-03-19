import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DocumentLibrary() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMarket, setFilterMarket] = useState('');
  const [filterStatus, setFilterStatus] = useState('Active');

  const [products, setProducts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [filterType, filterMarket, filterStatus, pagination.page]);

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

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }

      if (marketsRes.ok) {
        const marketsData = await marketsRes.json();
        setMarkets(marketsData);
      }

      if (typesRes.ok) {
        const typesData = await typesRes.json();
        setDocumentTypes(typesData);
      }
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        status: filterStatus,
        page: pagination.page,
        limit: pagination.limit
      });

      if (filterType) params.append('type', filterType);
      if (filterMarket) params.append('marketId', filterMarket);

      const response = await fetch(`/api/documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load documents');
      }

      const data = await response.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      doc.productName.toLowerCase().includes(search) ||
      doc.fileName.toLowerCase().includes(search)
    );
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterMarket('');
    setFilterStatus('Active');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
      InnovatorPIL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      RegulatorySource: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      RegulatoryAnnouncement: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      ApprovedPIL: 'bg-green-500/20 text-green-400 border-green-500/30',
      AWDraft: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      CommercialAW: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    };
    return colors[type] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Document Library</h1>
              <p className="text-slate-400">
                {pagination.total} documents • {filteredDocuments.length} shown
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
            >
              + Upload Document
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Product name or filename..."
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Document Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Document Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Types</option>
                {documentTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/([A-Z])/g, ' $1').trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* Market Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Market
              </label>
              <select
                value={filterMarket}
                onChange={(e) => setFilterMarket(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Markets</option>
                {markets.map(market => (
                  <option key={market.id} value={market.id}>
                    {market.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-slate-400">Loading documents...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <p className="text-red-400">{error}</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-slate-400">No documents found</p>
              <button
                onClick={() => navigate('/upload')}
                className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
              >
                Upload First Document
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Market
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">📄</div>
                          <div>
                            <p className="text-white font-medium">{doc.fileName}</p>
                            <p className="text-xs text-slate-500">ID: {doc.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(doc.type)}`}>
                          {doc.type.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-white">{doc.productName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300">{doc.marketName || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300">{formatFileSize(doc.fileSize)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300 text-sm">{formatDate(doc.uploadDate)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => window.open(`/api/documents/download/${doc.filePath}`, '_blank')}
                          className="text-purple-400 hover:text-purple-300 font-medium text-sm"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="border-t border-white/10 px-6 py-4 flex justify-between items-center">
              <p className="text-sm text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}