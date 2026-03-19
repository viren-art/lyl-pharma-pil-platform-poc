export default function F3Preview() {
  const [currentView, setCurrentView] = useState('library');
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showMarketForm, setShowMarketForm] = useState(false);

  const markets = [
    {
      id: 1,
      name: 'Taiwan',
      authority: 'TFDA',
      language: 'zh-TW',
      script: 'Traditional Chinese',
      provider: 'GoogleDocAI',
      sections: 17,
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: 'Thailand',
      authority: 'Thai FDA',
      language: 'th',
      script: 'Thai',
      provider: 'GoogleDocAI',
      sections: 19,
      updatedAt: '2024-01-14T14:20:00Z'
    },
    {
      id: 3,
      name: 'Vietnam',
      authority: 'DAV',
      language: 'vi',
      script: 'Vietnamese',
      provider: 'ClaudeVision',
      sections: 20,
      updatedAt: '2024-01-13T09:15:00Z'
    },
    {
      id: 4,
      name: 'Korea',
      authority: 'KFDA',
      language: 'ko',
      script: 'Korean',
      provider: 'GoogleDocAI',
      sections: 19,
      updatedAt: '2024-01-12T16:45:00Z'
    }
  ];

  const documents = [
    {
      id: 1,
      fileName: 'Aspirin_PIL_Taiwan_v2.3.pdf',
      type: 'ApprovedPIL',
      product: 'Aspirin 100mg',
      market: 'Taiwan',
      size: 2457600,
      uploadDate: '2024-01-15T08:30:00Z',
      uploadedBy: 'สมชาย วงศ์ไทย',
      versions: 3
    },
    {
      id: 2,
      fileName: 'Metformin_Innovator_EN.pdf',
      type: 'InnovatorPIL',
      product: 'Metformin 500mg',
      market: null,
      size: 1843200,
      uploadDate: '2024-01-14T14:20:00Z',
      uploadedBy: 'สุภาพ ชัยวงศ์',
      versions: 1
    },
    {
      id: 3,
      fileName: 'Thai_FDA_Guidelines_2024.pdf',
      type: 'RegulatorySource',
      product: 'Generic Guidelines',
      market: 'Thailand',
      size: 5242880,
      uploadDate: '2024-01-13T10:15:00Z',
      uploadedBy: 'วิชัย สุขสันต์',
      versions: 2
    },
    {
      id: 4,
      fileName: 'Ibuprofen_AW_Draft_v1.pdf',
      type: 'AWDraft',
      product: 'Ibuprofen 400mg',
      market: 'Vietnam',
      size: 3145728,
      uploadDate: '2024-01-12T16:45:00Z',
      uploadedBy: 'นภา ศรีสุข',
      versions: 1
    },
    {
      id: 5,
      fileName: 'Paracetamol_Commercial_AW.pdf',
      type: 'CommercialAW',
      product: 'Paracetamol 500mg',
      market: 'Korea',
      size: 4194304,
      uploadDate: '2024-01-11T09:30:00Z',
      uploadedBy: 'ประวิทย์ มั่นคง',
      versions: 4
    }
  ];

  const versionHistoryData = {
    product: 'Aspirin 100mg',
    type: 'ApprovedPIL',
    market: 'Taiwan',
    versions: [
      {
        version: 3,
        fileName: 'Aspirin_PIL_Taiwan_v2.3.pdf',
        size: 2457600,
        uploadDate: '2024-01-15T08:30:00Z',
        uploadedBy: 'สมชาย วงศ์ไทย',
        isCurrent: true
      },
      {
        version: 2,
        fileName: 'Aspirin_PIL_Taiwan_v2.2.pdf',
        size: 2398720,
        uploadDate: '2024-01-05T14:20:00Z',
        uploadedBy: 'สุภาพ ชัยวงศ์',
        isCurrent: false
      },
      {
        version: 1,
        fileName: 'Aspirin_PIL_Taiwan_v2.1.pdf',
        size: 2301952,
        uploadDate: '2023-12-20T10:15:00Z',
        uploadedBy: 'วิชัย สุขสันต์',
        isCurrent: false
      }
    ]
  };

  const marketSections = [
    { name: 'Product Name', order: 1 },
    { name: 'Composition', order: 2 },
    { name: 'Indications', order: 3 },
    { name: 'Dosage and Administration', order: 4 },
    { name: 'Contraindications', order: 5 },
    { name: 'Warnings and Precautions', order: 6 },
    { name: 'Adverse Reactions', order: 7 },
    { name: 'Drug Interactions', order: 8 }
  ];

  const documentTypes = ['InnovatorPIL', 'RegulatorySource', 'ApprovedPIL', 'AWDraft', 'CommercialAW'];

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
      'InnovatorPIL': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      'RegulatorySource': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'RegulatoryAnnouncement': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'ApprovedPIL': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'AWDraft': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'CommercialAW': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    };
    return colors[type] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || doc.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(doc.type);
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">PIL Lens</h1>
              <p className="text-sm text-zinc-400 mt-1">Market Configuration & Document Library</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentView('library')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  currentView === 'library'
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                📚 Library
              </button>
              <button
                onClick={() => setCurrentView('markets')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  currentView === 'markets'
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                🌏 Markets
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Library View */}
      {currentView === 'library' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06]">
              <div className="text-sm text-zinc-400">Total Documents</div>
              <div className="text-3xl font-bold text-white mt-2">{documents.length}</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06]">
              <div className="text-sm text-zinc-400">Document Types</div>
              <div className="text-3xl font-bold text-white mt-2">5</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06]">
              <div className="text-sm text-zinc-400">Markets</div>
              <div className="text-3xl font-bold text-white mt-2">4</div>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06]">
              <div className="text-sm text-zinc-400">Active Documents</div>
              <div className="text-3xl font-bold text-emerald-400 mt-2">{documents.length}</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {/* Filters */}
            <div className="col-span-1">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/[0.06] sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white">Filters</h2>
                  {(searchTerm || selectedTypes.length > 0) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedTypes([]);
                      }}
                      className="text-sm text-violet-400 hover:text-violet-300"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-2">
                      Search Product
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Product name..."
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-300 mb-3">
                      Document Type
                    </label>
                    <div className="space-y-2">
                      {documentTypes.map(type => (
                        <label key={type} className="flex items-center group cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type)}
                            onChange={() => {
                              setSelectedTypes(prev =>
                                prev.includes(type)
                                  ? prev.filter(t => t !== type)
                                  : [...prev, type]
                              );
                            }}
                            className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500/50"
                          />
                          <span className="ml-3 text-sm text-zinc-400 group-hover:text-zinc-300">
                            {type}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Table */}
            <div className="col-span-3">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/[0.06] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                          Document
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                          Product
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                          Market
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
                          Upload Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase">
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
                                <div className="text-sm font-semibold text-white">
                                  {doc.fileName}
                                </div>
                                <div className="text-xs text-zinc-500">
                                  {formatFileSize(doc.size)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(doc.type)}`}>
                              {doc.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-300">
                            {doc.product}
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-300">
                            {doc.market || '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-zinc-300">
                              {formatDate(doc.uploadDate)}
                            </div>
                            <div className="text-xs text-zinc-500">
                              by {doc.uploadedBy}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowVersionHistory(true)}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                title="Version history"
                              >
                                📋
                              </button>
                              <button
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                title="Download"
                              >
                                ⬇️
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
          </div>
        </div>
      )}

      {/* Markets View */}
      {currentView === 'markets' && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Market Configurations</h2>
              <p className="text-sm text-zinc-400 mt-1">Manage regulatory requirements per market</p>
            </div>
            <button
              onClick={() => setShowMarketForm(true)}
              className="px-4 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600 transition-colors shadow-lg shadow-violet-500/20"
            >
              + Create Market
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Market List */}
            <div className="col-span-1">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/[0.06] overflow-hidden">
                {markets.map(market => (
                  <div
                    key={market.id}
                    onClick={() => setSelectedMarket(market)}
                    className={`p-5 border-b border-white/5 cursor-pointer transition-all ${
                      selectedMarket?.id === market.id
                        ? 'bg-violet-500/10 border-l-4 border-l-violet-500'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">{market.name}</h3>
                        <p className="text-sm text-zinc-400">{market.authority}</p>
                      </div>
                      <button className="text-zinc-500 hover:text-zinc-300">📋</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-white/5 text-zinc-300 border border-white/10">
                        {market.language}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        market.provider === 'GoogleDocAI'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {market.provider}