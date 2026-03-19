import { useState } from 'react';

export default function DocumentUploadPreview() {
  const [file, setFile] = useState(null);
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('');
  const [marketId, setMarketId] = useState('');
  const [language, setLanguage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);

  const products = [
    { id: 1, name: 'Paracetamol 500mg', code: 'PARA-500' },
    { id: 2, name: 'Amoxicillin 250mg', code: 'AMOX-250' },
    { id: 3, name: 'Ibuprofen 400mg', code: 'IBU-400' },
  ];

  const markets = [
    { id: 1, name: 'Thailand', code: 'TH' },
    { id: 2, name: 'Taiwan', code: 'TW' },
    { id: 3, name: 'Singapore', code: 'SG' },
  ];

  const documentTypes = [
    { value: 'InnovatorPIL', label: 'Innovator PIL' },
    { value: 'RegulatorySource', label: 'Regulatory Source' },
    { value: 'GenericPIL', label: 'Generic PIL' },
    { value: 'Translation', label: 'Translation' },
  ];

  const mockDocuments = [
    {
      id: 1,
      fileName: 'Innovator-PIL-Paracetamol-EN.pdf',
      type: 'InnovatorPIL',
      product: 'Paracetamol 500mg',
      market: 'Thailand',
      language: 'en',
      fileSize: 1024000,
      uploadDate: '2024-01-15T10:00:00Z',
      uploadedBy: 'สมชาย วงศ์ใหญ่',
      status: 'Active',
    },
    {
      id: 2,
      fileName: 'TFDA-PIL-Format-2024.pdf',
      type: 'RegulatorySource',
      product: 'Paracetamol 500mg',
      market: 'Taiwan',
      language: 'zh-TW',
      fileSize: 512000,
      uploadDate: '2024-01-15T10:30:00Z',
      uploadedBy: 'สุภาพ ดีมาก',
      status: 'Active',
    },
    {
      id: 3,
      fileName: 'Generic-PIL-Amoxicillin-TH.pdf',
      type: 'GenericPIL',
      product: 'Amoxicillin 250mg',
      market: 'Thailand',
      language: 'th',
      fileSize: 2048000,
      uploadDate: '2024-01-16T14:20:00Z',
      uploadedBy: 'วิชัย สุขสันต์',
      status: 'Active',
    },
  ];

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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    setError('');
    setSuccess('');

    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(`File too large (max 50MB). File size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file format. Allowed formats: PDF, Word (.docx, .doc)');
      return;
    }

    setFile(selectedFile);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!productId || !type || !language) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          setSuccess(`Document uploaded successfully: ${file.name}`);
          setTimeout(() => {
            setFile(null);
            setProductId('');
            setType('');
            setMarketId('');
            setLanguage('');
            setUploadProgress(0);
            setShowDocuments(true);
          }, 1500);
          return 100;
        }
        return prev + 20;
      });
    }, 300);
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
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'Processing':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'Archived':
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'InnovatorPIL':
        return 'bg-violet-500/20 text-violet-400';
      case 'RegulatorySource':
        return 'bg-cyan-500/20 text-cyan-400';
      case 'GenericPIL':
        return 'bg-rose-500/20 text-rose-400';
      case 'Translation':
        return 'bg-amber-500/20 text-amber-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Document Management</h1>
                <p className="text-xs text-slate-400">Upload & classify pharmaceutical documents</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDocuments(!showDocuments)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  showDocuments
                    ? 'bg-violet-500 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {showDocuments ? '📤 Upload' : '📋 Library'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {!showDocuments ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Document File *
                  </label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      dragActive
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      onChange={handleFileInputChange}
                      accept=".pdf,.doc,.docx"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {!file ? (
                      <div className="space-y-3">
                        <div className="text-5xl">📁</div>
                        <div>
                          <p className="text-slate-300 font-medium">
                            Drop your file here or click to browse
                          </p>
                          <p className="text-sm text-slate-500 mt-1">
                            PDF, Word (.docx, .doc) • Max 50MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-5xl">📄</div>
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-sm text-slate-400 mt-1">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="text-sm text-rose-400 hover:text-rose-300"
                        >
                          Remove file
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Product *
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white py-3 px-4 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none"
                  >
                    <option value="" className="bg-slate-800">Select a product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id} className="bg-slate-800">
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Document Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white py-3 px-4 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none"
                  >
                    <option value="" className="bg-slate-800">Select document type</option>
                    {documentTypes.map(docType => (
                      <option key={docType.value} value={docType.value} className="bg-slate-800">
                        {docType.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Target Market
                  </label>
                  <select
                    value={marketId}
                    onChange={(e) => setMarketId(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white py-3 px-4 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none"
                  >
                    <option value="" className="bg-slate-800">Select market (optional)</option>
                    {markets.map(market => (
                      <option key={market.id} value={market.id} className="bg-slate-800">
                        {market.name} ({market.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Language *
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 text-white py-3 px-4 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none"
                  >
                    <option value="" className="bg-slate-800">Select language</option>
                    <option value="en" className="bg-slate-800">English</option>
                    <option value="th" className="bg-slate-800">ไทย (Thai)</option>
                    <option value="zh-TW" className="bg-slate-800">繁體中文 (Traditional Chinese)</option>
                    <option value="zh-CN" className="bg-slate-800">简体中文 (Simplified Chinese)</option>
                  </select>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">Uploading...</span>
                      <span className="text-violet-400 font-medium">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="text-rose-400 font-medium">Upload Error</p>
                        <p className="text-sm text-rose-300 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">✅</span>
                      <div>
                        <p className="text-emerald-400 font-medium">Upload Successful</p>
                        <p className="text-sm text-emerald-300 mt-1">{success}</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <span className="text-xl">🔒</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Security</p>
                    <p className="text-sm font-semibold text-white">AES-256 Encrypted</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Virus Scan</p>
                    <p className="text-sm font-semibold text-white">Automatic Check</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-xl">📊</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Audit Trail</p>
                    <p className="text-sm font-semibold text-white">Full Tracking</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Total Documents</p>
                    <p className="text-2xl font-bold text-white mt-1">{mockDocuments.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Active</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">3</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Total Size</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">3.5 MB</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <span className="text-2xl">💾</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">This Month</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">3</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Document Library</h2>
                <p className="text-sm text-slate-400 mt-1">All uploaded pharmaceutical documents</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-400 px-6 py-4">Document</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-6 py-4">Type</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-6 py-4">Product</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-6 py-4">Market</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-6 py-4">Uploaded</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-6 py-4">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-400 px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {mockDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-lg">📄</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-white truncate">{doc.fileName}</p>
                              <p className="text-xs text-slate-400">{formatFileSize(doc.fileSize)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(doc.type)}`}>
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-white">{doc.product}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-300">{doc.market}</p>
                          <p className="text-xs text-slate-500">{doc.language}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-slate-300">{formatDate(doc.uploadDate)}</p>
                          <p className="text-xs text-slate-500">{doc.uploadedBy}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
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