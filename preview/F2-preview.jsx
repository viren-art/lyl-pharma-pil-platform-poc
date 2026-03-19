export default function F2Preview() {
  const [currentView, setCurrentView] = useState('upload');
  const [file, setFile] = useState(null);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('');
  const [marketId, setMarketId] = useState('');
  const [language, setLanguage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMarket, setFilterMarket] = useState('');

  const products = [
    { id: 1, name: 'Paracetamol 500mg', code: 'PAR-500' },
    { id: 2, name: 'Amoxicillin 250mg', code: 'AMX-250' },
    { id: 3, name: 'Ibuprofen 400mg', code: 'IBU-400' },
    { id: 4, name: 'Metformin 850mg', code: 'MET-850' },
    { id: 5, name: 'Atorvastatin 20mg', code: 'ATO-20' }
  ];

  const markets = [
    { id: 1, name: 'Taiwan', authority: 'TFDA' },
    { id: 2, name: 'Thailand', authority: 'Thai FDA' },
    { id: 3, name: 'Vietnam', authority: 'DAV' },
    { id: 4, name: 'Korea', authority: 'KFDA' }
  ];

  const documentTypes = [
    'InnovatorPIL',
    'RegulatorySource',
    'RegulatoryAnnouncement',
    'ApprovedPIL',
    'AWDraft',
    'CommercialAW'
  ];

  const [documents, setDocuments] = useState([
    {
      id: 1,
      fileName: 'Paracetamol_PIL_Taiwan_v2.3.pdf',
      type: 'ApprovedPIL',
      productName: 'Paracetamol 500mg',
      marketName: 'Taiwan',
      fileSize: 2457600,
      uploadDate: '2024-01-15T10:30:00Z',
      status: 'Active'
    },
    {
      id: 2,
      fileName: 'Amoxicillin_Innovator_EN.docx',
      type: 'InnovatorPIL',
      productName: 'Amoxicillin 250mg',
      marketName: null,
      fileSize: 1843200,
      uploadDate: '2024-01-14T14:20:00Z',
      status: 'Active'
    },
    {
      id: 3,
      fileName: 'Thailand_FDA_Requirements_2024.pdf',
      type: 'RegulatorySource',
      productName: 'Ibuprofen 400mg',
      marketName: 'Thailand',
      fileSize: 5242880,
      uploadDate: '2024-01-13T09:15:00Z',
      status: 'Active'
    },
    {
      id: 4,
      fileName: 'Metformin_AW_Draft_v1.pdf',
      type: 'AWDraft',
      productName: 'Metformin 850mg',
      marketName: 'Vietnam',
      fileSize: 3145728,
      uploadDate: '2024-01-12T16:45:00Z',
      status: 'Active'
    },
    {
      id: 5,
      fileName: 'Atorvastatin_Commercial_AW.pdf',
      type: 'CommercialAW',
      productName: 'Atorvastatin 20mg',
      marketName: 'Korea',
      fileSize: 4194304,
      uploadDate: '2024-01-11T11:00:00Z',
      status: 'Active'
    }
  ]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile({
        name: e.dataTransfer.files[0].name,
        size: e.dataTransfer.files[0].size
      });
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile({
        name: e.target.files[0].name,
        size: e.target.files[0].size
      });
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const newDoc = {
              id: documents.length + 1,
              fileName: file.name,
              type,
              productName: products.find(p => p.id === parseInt(productId))?.name || '',
              marketName: markets.find(m => m.id === parseInt(marketId))?.name || null,
              fileSize: file.size,
              uploadDate: new Date().toISOString(),
              status: 'Active'
            };
            setDocuments([newDoc, ...documents]);
            setUploading(false);
            setFile(null);
            setProductId('');
            setType('');
            setMarketId('');
            setLanguage('');
            setCurrentView('library');
          }, 500);
          return 100;
        }
        return prev + 20;
      });
    }, 200);
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

  const filteredDocuments = documents.filter(doc => {
    if (searchTerm && !doc.productName.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterType && doc.type !== filterType) return false;
    if (filterMarket && doc.marketName !== markets.find(m => m.id === parseInt(filterMarket))?.name) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">PIL Lens</h1>
              <p className="text-slate-400">Document Management System</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                  currentView === 'upload'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                📤 Upload
              </button>
              <button
                onClick={() => setCurrentView('library')}
                className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                  currentView === 'library'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                📚 Library
              </button>
            </div>
          </div>
        </div>

        {/* Upload View */}
        {currentView === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Upload Document</h2>
              
              <form onSubmit={handleUpload} className="space-y-6">
                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Document File *
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      dragActive
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      id="file-upload"
                    />
                    
                    {!file ? (
                      <div>
                        <div className="text-6xl mb-4">📄</div>
                        <p className="text-slate-300 mb-2">
                          Drag and drop your file here, or
                        </p>
                        <label
                          htmlFor="file-upload"
                          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold cursor-pointer transition-colors"
                        >
                          Browse Files
                        </label>
                        <p className="text-sm text-slate-500 mt-4">
                          Supported formats: PDF, Word (.docx, .doc) • Max size: 50MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">📄</div>
                          <div className="text-left">
                            <p className="text-white font-medium">{file.name}</p>
                            <p className="text-sm text-slate-400">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="text-red-400 hover:text-red-300 text-2xl"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Product *
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Document Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Document Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select document type</option>
                    {documentTypes.map(docType => (
                      <option key={docType} value={docType}>
                        {docType.replace(/([A-Z])/g, ' $1').trim()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Market Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Market (Optional)
                  </label>
                  <select
                    value={marketId}
                    onChange={(e) => setMarketId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select a market</option>
                    {markets.map(market => (
                      <option key={market.id} value={market.id}>
                        {market.name} ({market.authority})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Language Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Language *
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="e.g., en, zh-TW, th, vi, ko"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Common values: en (English), zh-TW (Traditional Chinese), th (Thai), vi (Vietnamese), ko (Korean)
                  </p>
                </div>

                {/* Upload Progress */}
                {uploading && (
                  <div>
                    <div className="flex justify-between text-sm text-slate-300 mb-2">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploading || !file || !productId || !type || !language}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="text-3xl mb-2">📋</div>
                <h3 className="text-white font-semibold mb-1">6 Document Types</h3>
                <p className="text-sm text-slate-400">
                  Innovator PIL, Regulatory Source, Approved PIL, AW Draft, and more
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="text-3xl mb-2">🔒</div>
                <h3 className="text-white font-semibold mb-1">AES-256 Encryption</h3>
                <p className="text-sm text-slate-400">
                  All documents encrypted at rest for pharmaceutical IP protection
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="text-3xl mb-2">✅</div>
                <h3 className="text-white font-semibold mb-1">Auto Validation</h3>
                <p className="text-sm text-slate-400">
                  Format validation, virus scanning, and duplicate detection
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Library View */}
        {currentView === 'library' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Product or filename..."
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

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

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterType('');
                      setFilterMarket('');
                    }}
                    className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  Document Library
                  <span className="text-slate-400 font-normal ml-3">
                    {filteredDocuments.length} documents
                  </span>
                </h2>
              </div>

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
                          <button className="text-purple-400 hover:text-purple-300 font-medium text-sm">
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}