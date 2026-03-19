import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function DocumentUpload() {
  const { token, user } = useAuth();
  const navigate = useNavigate();

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

  const [products, setProducts] = useState([]);
  const [markets, setMarkets] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);

  const fileInputRef = useRef(null);

  // Load metadata on mount
  useEffect(() => {
    loadMetadata();
  }, []);

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

    // Validate file size
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (selectedFile.size > maxSize) {
      setError(`File too large (max 50MB). File size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Validate file type
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

  const handleSubmit = async (e) => {
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

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);
      formData.append('type', type);
      formData.append('marketId', marketId);
      formData.append('language', language);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(`Document uploaded successfully: ${data.fileName}`);
      
      // Reset form
      setFile(null);
      setProductId('');
      setType('');
      setMarketId('');
      setLanguage('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Redirect to document library after 2 seconds
      setTimeout(() => {
        navigate('/documents');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-purple-400 hover:text-purple-300 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Upload Document</h1>
          <p className="text-slate-400">Upload pharmaceutical documents for processing</p>
        </div>

        {/* Upload Form */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInputChange}
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
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
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
                    {market.name} ({market.regulatoryAuthority})
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

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-400 text-sm">⚠️ {error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
                <p className="text-green-400 text-sm">✅ {success}</p>
                <p className="text-slate-400 text-xs mt-1">Redirecting to Document Library...</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading || !file}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/documents')}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl mb-2">📋</div>
            <h3 className="text-white font-semibold mb-1">Document Types</h3>
            <p className="text-sm text-slate-400">
              6 types supported: Innovator PIL, Regulatory Source, Approved PIL, AW Draft, and more
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="text-white font-semibold mb-1">Secure Storage</h3>
            <p className="text-sm text-slate-400">
              All documents encrypted at rest with AES-256 encryption
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="text-white font-semibold mb-1">Validation</h3>
            <p className="text-sm text-slate-400">
              Automatic format validation and virus scanning
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}