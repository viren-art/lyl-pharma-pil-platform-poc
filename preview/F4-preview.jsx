export default function F4Preview() {
  const [activeTab, setActiveTab] = useState('extraction');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [extractionStatus, setExtractionStatus] = useState('idle');
  const [extractionResult, setExtractionResult] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [showSectionDetail, setShowSectionDetail] = useState(null);

  const documents = [
    {
      id: 1,
      name: 'Paracetamol_PIL_Taiwan_v2.3.pdf',
      type: 'InnovatorPIL',
      market: 'Taiwan (TFDA)',
      language: 'zh-TW',
      pages: 12,
      uploadDate: '2024-03-15T10:30:00Z',
      status: 'Ready'
    },
    {
      id: 2,
      name: 'Ibuprofen_Regulatory_Thailand.pdf',
      type: 'RegulatorySource',
      market: 'Thailand (Thai FDA)',
      language: 'th',
      pages: 8,
      uploadDate: '2024-03-14T14:20:00Z',
      status: 'Ready'
    },
    {
      id: 3,
      name: 'Amoxicillin_PIL_Vietnam.docx',
      type: 'ApprovedPIL',
      market: 'Vietnam (DAV)',
      language: 'vi',
      pages: 15,
      uploadDate: '2024-03-13T09:15:00Z',
      status: 'Ready'
    }
  ];

  const mockExtractionResult = {
    documentId: 1,
    provider: 'GoogleDocAI',
    status: 'Success',
    processingTimeMs: 24500,
    averageConfidence: 0.96,
    costUsd: 0.42,
    sections: [
      {
        sectionName: '產品名稱 (Product Name)',
        content: 'Paracetamol 500mg 錠劑\n普拿疼止痛錠',
        pageReferences: [{ pageNumber: 1 }],
        confidence: 0.98,
        specialContent: []
      },
      {
        sectionName: '適應症 (Indications)',
        content: '用於緩解輕度至中度疼痛，包括頭痛、牙痛、肌肉痛、經痛及發燒。',
        pageReferences: [{ pageNumber: 1 }],
        confidence: 0.97,
        specialContent: []
      },
      {
        sectionName: '用法用量 (Dosage)',
        content: '成人及12歲以上兒童：每次1-2錠，每4-6小時服用一次。\n24小時內不得超過8錠。\n\n兒童6-12歲：每次½-1錠，每4-6小時服用一次。',
        pageReferences: [{ pageNumber: 2 }],
        confidence: 0.95,
        specialContent: [
          { type: 'subscript', content: 'H₂O', position: { pageNumber: 2 } }
        ]
      },
      {
        sectionName: '成分 (Composition)',
        content: '每錠含：\nParacetamol 500mg\n賦形劑：澱粉、聚維酮K30、硬脂酸鎂',
        pageReferences: [{ pageNumber: 2 }],
        confidence: 0.96,
        specialContent: [
          { type: 'chemical_formula', content: 'C₈H₉NO₂', position: { pageNumber: 2 } }
        ]
      },
      {
        sectionName: '警語及注意事項 (Warnings)',
        content: '• 肝功能不全患者應謹慎使用\n• 每日劑量不得超過4000mg\n• 避免與含酒精飲料併用\n• 長期使用可能導致肝損傷',
        pageReferences: [{ pageNumber: 3 }],
        confidence: 0.94,
        specialContent: []
      },
      {
        sectionName: '副作用 (Side Effects)',
        content: '常見副作用：\n• 噁心、嘔吐\n• 皮疹\n• 過敏反應（罕見）\n\n嚴重副作用（立即就醫）：\n• 肝功能異常\n• 嚴重皮膚反應',
        pageReferences: [{ pageNumber: 4 }],
        confidence: 0.93,
        specialContent: []
      }
    ],
    metadata: {
      totalPages: 12,
      language: 'zh-TW',
      documentType: 'InnovatorPIL',
      marketId: 1
    }
  };

  const handleExtract = () => {
    if (!selectedDocument) return;

    setExtractionStatus('converting');
    
    setTimeout(() => {
      setExtractionStatus('extracting');
      
      setTimeout(() => {
        setExtractionStatus('complete');
        setExtractionResult(mockExtractionResult);
      }, 3000);
    }, 2000);
  };

  const formatConfidence = (confidence) => {
    return (confidence * 100).toFixed(1) + '%';
  };

  const formatTime = (ms) => {
    return (ms / 1000).toFixed(1) + 's';
  };

  const formatCost = (usd) => {
    return '$' + usd.toFixed(2);
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.95) return 'text-emerald-400';
    if (confidence >= 0.90) return 'text-cyan-400';
    if (confidence >= 0.80) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getStatusColor = (status) => {
    const colors = {
      'idle': 'bg-zinc-700 text-zinc-300',
      'converting': 'bg-violet-500/20 text-violet-300',
      'extracting': 'bg-cyan-500/20 text-cyan-300',
      'complete': 'bg-emerald-500/20 text-emerald-300',
      'error': 'bg-rose-500/20 text-rose-300'
    };
    return colors[status] || colors.idle;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Document Extraction Pipeline</h1>
                <p className="text-xs text-zinc-400">AI-powered pharmaceutical content extraction</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-xs font-medium text-emerald-400">✓ Multi-Provider</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <span className="text-xs font-medium text-violet-400">⚡ CJK Optimized</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('extraction')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'extraction'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            📸 Extraction
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'results'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            📋 Results
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              activeTab === 'statistics'
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            📊 Statistics
          </button>
        </div>

        {/* Extraction Tab */}
        {activeTab === 'extraction' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document Selection */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4">Select Document</h2>
              
              <div className="space-y-3">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedDocument?.id === doc.id
                        ? 'bg-violet-500/10 border-violet-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-white text-sm mb-1">{doc.name}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300">
                            {doc.type}
                          </span>
                          <span className="text-xs text-zinc-400">{doc.market}</span>
                        </div>
                      </div>
                      {selectedDocument?.id === doc.id && (
                        <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>📄 {doc.pages} pages</span>
                      <span>🌐 {doc.language}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extraction Configuration */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4">Extraction Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Provider Selection
                  </label>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 outline-none"
                  >
                    <option value="auto">Auto (Market Preference)</option>
                    <option value="GoogleDocAI">Google Document AI</option>
                    <option value="ClaudeVision">Claude Vision</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <div className="text-sm font-medium text-violet-300 mb-2">Provider Info</div>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <div>• Google Document AI: Optimized for CJK scripts</div>
                    <div>• Claude Vision: Better for complex layouts</div>
                    <div>• Auto:
                    <div>• Auto: Uses market configuration preference</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-sm font-medium text-amber-300 mb-2">⚡ Performance Target</div>
                  <div className="text-xs text-zinc-400 space-y-1">
                    <div>• Processing: &lt;30s for 10-20 pages</div>
                    <div>• Accuracy: ≥98% for pharmaceutical content</div>
                    <div>• Cost: &lt;$0.50 per document</div>
                  </div>
                </div>

                <button
                  onClick={handleExtract}
                  disabled={!selectedDocument || extractionStatus !== 'idle'}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                    !selectedDocument || extractionStatus !== 'idle'
                      ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25'
                  }`}
                >
                  {extractionStatus === 'idle' && '🚀 Start Extraction'}
                  {extractionStatus === 'converting' && '⏳ Converting Document...'}
                  {extractionStatus === 'extracting' && '🔍 Extracting Content...'}
                  {extractionStatus === 'complete' && '✅ Extraction Complete'}
                </button>

                {extractionStatus !== 'idle' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Progress</span>
                      <span className={`font-medium ${getStatusColor(extractionStatus)}`}>
                        {extractionStatus === 'converting' && '25%'}
                        {extractionStatus === 'extracting' && '75%'}
                        {extractionStatus === 'complete' && '100%'}
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          extractionStatus === 'complete' ? 'bg-emerald-500' : 'bg-violet-500'
                        }`}
                        style={{
                          width: extractionStatus === 'converting' ? '25%' :
                                 extractionStatus === 'extracting' ? '75%' : '100%'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && extractionResult && (
          <div className="space-y-6">
            {/* Extraction Summary */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4">Extraction Summary</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-zinc-400 mb-1">Provider</div>
                  <div className="text-lg font-bold text-white">{extractionResult.provider}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-zinc-400 mb-1">Confidence</div>
                  <div className={`text-lg font-bold ${getConfidenceColor(extractionResult.averageConfidence)}`}>
                    {formatConfidence(extractionResult.averageConfidence)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-zinc-400 mb-1">Processing Time</div>
                  <div className="text-lg font-bold text-white">{formatTime(extractionResult.processingTimeMs)}</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="text-xs text-zinc-400 mb-1">Cost</div>
                  <div className="text-lg font-bold text-emerald-400">{formatCost(extractionResult.costUsd)}</div>
                </div>
              </div>
            </div>

            {/* Extracted Sections */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Extracted Sections ({extractionResult.sections.length})</h2>
                <button className="px-3 py-1.5 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600">
                  📥 Export JSON
                </button>
              </div>

              <div className="space-y-3">
                {extractionResult.sections.map((section, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                    onClick={() => setShowSectionDetail(showSectionDetail === idx ? null : idx)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-1">{section.sectionName}</div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                          <span>📄 Page {section.pageReferences[0].pageNumber}</span>
                          <span className={getConfidenceColor(section.confidence)}>
                            {formatConfidence(section.confidence)} confidence
                          </span>
                          {section.specialContent && section.specialContent.length > 0 && (
                            <span className="text-amber-400">⚗️ {section.specialContent.length} special</span>
                          )}
                        </div>
                      </div>
                      <span className="text-zinc-500">{showSectionDetail === idx ? '▼' : '▶'}</span>
                    </div>

                    {showSectionDetail === idx && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="text-sm text-zinc-300 whitespace-pre-wrap mb-3">
                          {section.content}
                        </div>

                        {section.specialContent && section.specialContent.length > 0 && (
                          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <div className="text-xs font-medium text-amber-300 mb-2">
                              Special Content Detected
                            </div>
                            <div className="space-y-1">
                              {section.specialContent.map((sc, scIdx) => (
                                <div key={scIdx} className="text-xs text-zinc-400">
                                  <span className="text-amber-400">{sc.type}:</span> {sc.content}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Provider Performance */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4">Provider Performance</h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-white">Google Document AI</div>
                    <span className="text-xs text-emerald-400">Primary</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Avg Confidence</span>
                      <span className="text-emerald-400 font-semibold">96.2%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Avg Time</span>
                      <span className="text-white font-semibold">24.5s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Avg Cost</span>
                      <span className="text-white font-semibold">$0.42</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Success Rate</span>
                      <span className="text-emerald-400 font-semibold">98.5%</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-white">Claude Vision</div>
                    <span className="text-xs text-cyan-400">Fallback</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Avg Confidence</span>
                      <span className="text-cyan-400 font-semibold">92.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Avg Time</span>
                      <span className="text-white font-semibold">18.2s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Avg Cost</span>
                      <span className="text-white font-semibold">$0.30</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Success Rate</span>
                      <span className="text-cyan-400 font-semibold">95.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accuracy Metrics */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4">Accuracy Metrics</h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-sm font-medium text-emerald-300 mb-2">CJK Script Accuracy</div>
                  <div className="text-2xl font-bold text-emerald-400 mb-1">98.7%</div>
                  <div className="text-xs text-zinc-400">Traditional Chinese, Thai, Vietnamese, Korean</div>
                </div>

                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <div className="text-sm font-medium text-violet-300 mb-2">Formatting Preservation</div>
                  <div className="text-2xl font-bold text-violet-400 mb-1">99.5%</div>
                  <div className="text-xs text-zinc-400">Subscripts, superscripts, Greek letters, formulas</div>
                </div>

                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="text-sm font-medium text-cyan-300 mb-2">Table Extraction</div>
                  <div className="text-2xl font-bold text-cyan-400 mb-1">96.3%</div>
                  <div className="text-xs text-zinc-400">Structure and content accuracy</div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-sm font-medium text-amber-300 mb-2">Special Content Detection</div>
                  <div className="text-2xl font-bold text-amber-400 mb-1">94.8%</div>
                  <div className="text-xs text-zinc-400">Chemical formulas, dosage notations</div>
                </div>
              </div>
            </div>

            {/* Recent Extractions */}
            <div className="lg:col-span-2 bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4">Recent Extractions</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Document</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Provider</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Confidence</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Time</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Cost</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-zinc-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { doc: 'Paracetamol_PIL_Taiwan.pdf', provider: 'GoogleDocAI', confidence: 0.96, time: 24500, cost: 0.42, status: 'Success' },
                      { doc: 'Ibuprofen_Regulatory_TH.pdf', provider: 'GoogleDocAI', confidence: 0.94, time: 22100, cost: 0.38, status: 'Success' },
                      { doc: 'Amoxicillin_PIL_Vietnam.docx', provider: 'ClaudeVision', confidence: 0.92, time: 18200, cost: 0.30, status: 'Success' },
                      { doc: 'Aspirin_AW_Korea.pdf', provider: 'GoogleDocAI', confidence: 0.95, time: 26800, cost: 0.45, status: 'Success' },
                      { doc: 'Metformin_PIL_Taiwan.pdf', provider: 'ClaudeVision', confidence: 0.91, time: 19500, cost: 0.32, status: 'PartialSuccess' }
                    ].map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4 text-sm text-white">{item.doc}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.provider === 'GoogleDocAI' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                          }`}>
                            {item.provider}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-sm font-semibold ${getConfidenceColor(item.confidence)}`}>
                          {formatConfidence(item.confidence)}
                        </td>
                        <td className="py-3 px-4 text-sm text-zinc-400">{formatTime(item.time)}</td>
                        <td className="py-3 px-4 text-sm text-emerald-400">{formatCost(item.cost)}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'Success' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State for Results */}
        {activeTab === 'results' && !extractionResult && (
          <div className="bg-zinc-800/50 rounded-2xl p-12 border border-white/[0.06] shadow-lg shadow-black/20 text-center">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-xl font-bold text-white mb-2">No Extraction Results</h3>
            <p className="text-zinc-400 mb-6">Start an extraction to see results here</p>
            <button
              onClick={() => setActiveTab('extraction')}
              className="px-6 py-3 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-600"
            >
              Go to Extraction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}