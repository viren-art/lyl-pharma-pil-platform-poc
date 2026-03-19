export default function F4Preview() {
  const [activeTab, setActiveTab] = React.useState('pipeline');
  const [selectedDoc, setSelectedDoc] = React.useState(null);
  const [processingStatus, setProcessingStatus] = React.useState('idle');
  const [showDetails, setShowDetails] = React.useState(false);

  const mockDocuments = [
    {
      id: 1,
      name: 'Paracetamol_PIL_TH.pdf',
      status: 'Success',
      provider: 'GoogleDocAI',
      pages: 8,
      confidence: 0.94,
      processingTime: 12340,
      cost: 0.24,
      extractedSections: 12,
      language: 'th',
      uploadDate: '2024-01-15T10:30:00Z',
      sections: [
        { name: 'ชื่อยา', content: 'พาราเซตามอล 500 มก.', confidence: 0.98, pages: [1], hasSpecial: false },
        { name: 'ส่วนประกอบ', content: 'Paracetamol 500mg, Excipients q.s.', confidence: 0.96, pages: [1, 2], hasSpecial: true },
        { name: 'ข้อบ่งใช้', content: 'บรรเทาอาการปวดและลดไ้', confidence: 0.95, pages: [2, 3], hasSpecial: false },
        { name: 'ขนาดและวิธีใช้', content: 'ผู้ใหญ่: 1-2 เม็ด ทุก 4-6 ชั่วโมง', confidence: 0.97, pages: [3], hasSpecial: false },
        { name: 'ข้อห้ามใช้', content: 'ผู้ที่แพ้พาราเซตามอล', confidence: 0.93, pages: [4], hasSpecial: false },
        { name: 'คำเตือน', content: 'ไม่ควรใช้เกิน 4000mg/วัน', confidence: 0.94, pages: [4, 5], hasSpecial: true },
        { name: 'ผลข้างเคียง', content: 'คลื่นไส้ อาเจียน ผื่นแดง', confidence: 0.92, pages: [5, 6], hasSpecial: false },
        { name: 'การเก็บรักษา', content: 'เก็บในที่แห้ง อุณหภูมิไม่เกิน 30°C', confidence: 0.96, pages: [7], hasSpecial: true },
      ],
      specialContent: [
        { type: 'chemical_formula', content: 'C₈H₉NO₂', page: 2 },
        { type: 'superscript', content: 'mg/m²', page: 3 },
        { type: 'greek_letter', content: 'μg', page: 4 },
        { type: 'table', content: 'Dosage table', page: 3 },
      ]
    },
    {
      id: 2,
      name: 'Amoxicillin_PIL_EN.docx',
      status: 'Success',
      provider: 'ClaudeVision',
      pages: 6,
      confidence: 0.91,
      processingTime: 8920,
      cost: 0.18,
      extractedSections: 10,
      language: 'en',
      uploadDate: '2024-01-15T11:45:00Z',
      sections: [
        { name: 'Drug Name', content: 'Amoxicillin 500mg Capsules', confidence: 0.97, pages: [1], hasSpecial: false },
        { name: 'Composition', content: 'Amoxicillin trihydrate eq. to 500mg', confidence: 0.95, pages: [1], hasSpecial: true },
        { name: 'Indications', content: 'Treatment of bacterial infections', confidence: 0.93, pages: [2], hasSpecial: false },
        { name: 'Dosage', content: 'Adults: 500mg three times daily', confidence: 0.96, pages: [2, 3], hasSpecial: false },
      ],
      specialContent: [
        { type: 'chemical_formula', content: 'C₁₆H₁₉N₃O₅S', page: 1 },
        { type: 'table', content: 'Dosing schedule', page: 3 },
      ]
    },
    {
      id: 3,
      name: 'Ibuprofen_PIL_VI.pdf',
      status: 'PartialSuccess',
      provider: 'GoogleDocAI',
      pages: 5,
      confidence: 0.78,
      processingTime: 15670,
      cost: 0.15,
      extractedSections: 7,
      language: 'vi',
      uploadDate: '2024-01-15T14:20:00Z',
      sections: [
        { name: 'Tên thuốc', content: 'Ibuprofen 400mg', confidence: 0.89, pages: [1], hasSpecial: false },
        { name: 'Thành phần', content: 'Ibuprofen 400mg', confidence: 0.82, pages: [1], hasSpecial: false },
        { name: 'Chỉ định', content: 'Giảm đau, hạ sốt', confidence: 0.75, pages: [2], hasSpecial: false },
      ],
      specialContent: [
        { type: 'chemical_formula', content: 'C₁₃H₁₈O₂', page: 1 },
      ]
    },
    {
      id: 4,
      name: 'Metformin_PIL_KO.pdf',
      status: 'Failed',
      provider: 'ClaudeVision',
      pages: 0,
      confidence: 0,
      processingTime: 3200,
      cost: 0.05,
      extractedSections: 0,
      language: 'ko',
      uploadDate: '2024-01-15T15:10:00Z',
      errorMessage: 'Document quality too low for OCR processing',
      sections: [],
      specialContent: []
    }
  ];

  const handleProcess = () => {
    setProcessingStatus('processing');
    setTimeout(() => {
      setProcessingStatus('complete');
      setTimeout(() => setProcessingStatus('idle'), 2000);
    }, 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Success': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'PartialSuccess': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Failed': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getProviderColor = (provider) => {
    return provider === 'GoogleDocAI' 
      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      : 'bg-violet-500/20 text-violet-400 border-violet-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-slate-900 to-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl">
                📄
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Document Extraction Pipeline</h1>
                <p className="text-xs text-zinc-400">AI-powered pharmaceutical document processing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-zinc-500">Total Processed</div>
                <div className="text-lg font-bold text-white">1,247</div>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Avg Confidence</div>
                <div className="text-lg font-bold text-emerald-400">94.2%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div className="flex gap-2 border-b border-white/5">
          {['pipeline', 'results', 'analytics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-t-xl font-semibold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-white/5 text-white border-t border-x border-white/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              {tab === 'pipeline' && '🔄 Processing Pipeline'}
              {tab === 'results' && '📊 Extraction Results'}
              {tab === 'analytics' && '📈 Analytics'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📤</span> Document Upload & Configuration
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Document File</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Select PDF or DOCX file..."
                      className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-white placeholder-zinc-500 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
                      readOnly
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold rounded-lg transition-colors">
                      Browse
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Language</label>
                  <select className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-transparent">
                    <option>🇹🇭 Thai (th)</option>
                    <option>🇬🇧 English (en)</option>
                    <option>🇻🇳 Vietnamese (vi)</option>
                    <option>🇰🇷 Korean (ko)</option>
                    <option>🇨🇳 Chinese (zh-TW)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Preferred Provider</label>
                  <select className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-transparent">
                    <option>Google Document AI</option>
                    <option>Claude Vision</option>
                    <option>Auto (Best Available)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Document Type</label>
                  <select className="w-full rounded-xl bg-white/5 border border-white/10 py-3 px-4 text-white focus:ring-2 focus:ring-violet-500/50 focus:border-transparent">
                    <option>Package Insert (PIL)</option>
                    <option>Summary of Product Characteristics</option>
                    <option>Clinical Study Report</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleProcess}
                  disabled={processingStatus === 'processing'}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:from-zinc-700 disabled:to-zinc-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-500/20"
                >
                  {processingStatus === 'processing' ? '⏳ Processing...' : processingStatus === 'complete' ? '✅ Complete!' : '🚀 Start Extraction'}
                </button>
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-colors">
                  ⚙️ Advanced Settings
                </button>
              </div>
            </div>

            {/* Pipeline Stages */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4">Processing Stages</h2>
              <div className="space-y-3">
                {[
                  { stage: 'Document Conversion', status: 'complete', time: '1.2s', detail: 'DOCX → PDF → PNG (300 DPI)' },
                  { stage: 'Image Optimization', status: 'complete', time: '0.8s', detail: 'Resize, enhance, normalize' },
                  { stage: 'OCR Processing', status: processingStatus === 'processing' ? 'processing' : processingStatus === 'complete' ? 'complete' : 'pending', time: '8.4s', detail: 'Google Document AI extraction' },
                  { stage: 'Content Normalization', status: processingStatus === 'complete' ? 'complete' : 'pending', time: '0.5s', detail: 'Schema mapping, validation' },
                  { stage: 'Special Content Detection', status: processingStatus === 'complete' ? 'complete' : 'pending', time: '1.1s', detail: 'Formulas, tables, Greek letters' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-zinc-700 flex items-center justify-center text-lg">
                      {item.status === 'complete' ? '✅' : item.status === 'processing' ? '⏳' : '⏸️'}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{item.stage}</div>
                      <div className="text-xs text-zinc-400">{item.detail}</div>
                    </div>
                    <div className="text-sm font-mono text-zinc-400">{item.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            {/* Documents Grid */}
            <div className="grid grid-cols-1 gap-4">
              {mockDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20 hover:bg-zinc-800/70 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setShowDetails(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center text-2xl">
                        📄
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-white mb-1">{doc.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span>🕐 {new Date(doc.uploadDate).toLocaleString('th-TH')}</span>
                          <span>•</span>
                          <span>📄 {doc.pages} pages</span>
                          <span>•</span>
                          <span>🌐 {doc.language.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getProviderColor(doc.provider)}`}>
                        {doc.provider}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">Confidence</div>
                      <div className="text-lg font-bold text-emerald-400">{(doc.confidence * 100).toFixed(1)}%</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">Sections</div>
                      <div className="text-lg font-bold text-white">{doc.extractedSections}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">Processing</div>
                      <div className="text-lg font-bold text-cyan-400">{(doc.processingTime / 1000).toFixed(1)}s</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">Cost</div>
                      <div className="text-lg font-bold text-amber-400">${doc.cost?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                      <div className="text-xs text-zinc-500 mb-1">Special</div>
                      <div className="text-lg font-bold text-violet-400">{doc.specialContent?.length || 0}</div>
                    </div>
                  </div>

                  {doc.errorMessage && (
                    <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                      <div className="text-sm text-rose-400">⚠️ {doc.errorMessage}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Stats Cards */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="text-sm text-zinc-400 mb-2">Total Documents</div>
              <div className="text-3xl font-bold text-white mb-4">1,247</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400">↑ 12.5%</span>
                <span className="text-zinc-500">vs last month</span>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="text-sm text-zinc-400 mb-2">Success Rate</div>
              <div className="text-3xl font-bold text-emerald-400 mb-4">96.8%</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-emerald-400">↑ 2.3%</span>
                <span className="text-zinc-500">improvement</span>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="text-sm text-zinc-400 mb-2">Avg Processing Time</div>
              <div className="text-3xl font-bold text-cyan-400 mb-4">9.2s</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-rose-400">↓ 1.8s</span>
                <span className="text-zinc-500">faster</span>
              </div>
            </div>

            {/* Provider Comparison */}
            <div className="col-span-2 bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h3 className="text-lg font-bold text-white mb-4">Provider Performance</h3>
              <div className="space-y-4">
                {[
                  { provider: 'Google Document AI', docs: 847, confidence: 0.94, cost: 203.28, color: 'blue' },
                  { provider: 'Claude Vision', docs: 400, confidence: 0.91, cost: 96.00, color: 'violet' },
                ].map((p, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{p.provider}</span>
                      <span className="text-sm text-zinc-400">{p.docs} documents</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                        <div className="text-xs text-zinc-500">Confidence</div>
                        <div className="text-sm font-bold text-emerald-400">{(p.confidence * 100).toFixed(1)}%</div>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                        <div className="text-xs text-zinc-500">Total Cost</div>
                        <div className="text-sm font-bold text-amber-400">${p.cost.toFixed(2)}</div>
                      </div>
                      <div className="bg-white/[0.02] rounded-lg p-2 border border-white/5">
                        <div className="text-xs text-zinc-500">Avg Cost</div>
                        <div className="text-sm font-bold text-cyan-400">${(p.cost / p.docs).toFixed(3)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Distribution */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h3 className="text-lg font-bold text-white mb-4">Languages</h3>
              <div className="space-y-3">
                {[
                  { lang: '🇹🇭 Thai', count: 542, pct: 43 },
                  { lang: '🇬🇧 English', count: 389, pct: 31 },
                  { lang: '🇻🇳 Vietnamese', count: 186, pct: 15 },
                  { lang: '🇰🇷 Korean', count: 130, pct: 11 },
                ].map((l, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-white">{l.lang}</span>
                      <span className="text-zinc-400">{l.count}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full" style={{ width: `${l.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={() => setShowDetails(false)}>
          <div className="bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{selectedDoc.name}</h2>
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getProviderColor(selectedDoc.provider)}`}>
                      {selectedDoc.provider}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(selectedDoc.status)}`}>
                      {selectedDoc.status}
                    </span>
                    <span>📄 {selectedDoc.pages} pages</span>
                    <span>⏱️ {(selectedDoc.processingTime / 1000).toFixed(1)}s</span>
                  </div>
                </div>
                <button onClick={() => setShowDetails(false)} className="text-zinc-400 hover:text-white text-2xl">×</button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Extracted Sections */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Extracted Sections ({selectedDoc.sections.length})</h3>
                  <div className="space-y-3">
                    {selectedDoc.sections.map((section, idx) => (
                      <div key={idx} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-semibold text-white">{section.name}</div>
                          <div className="flex items-center gap-2">
                            {section.hasSpecial && <span className="text-xs px-2 py-1 bg-violet-500/20 text-violet-400 rounded-lg border border-violet-500/30">Special Content</span>}
                            <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                              {(section.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="text-sm text-zinc-300 mb-2 line-clamp-2">{section.content}</div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span>📄 Pages: {section.pages.join(', ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Content */}
                {selectedDoc.specialContent && selectedDoc.specialContent.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Special Content Detected ({selectedDoc.specialContent.length})</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedDoc.specialContent.map((special, idx) => (
                        <div key={idx} className="bg-violet-500/10 rounded-xl p-3 border border-violet-500/30">
                          <div className="text-xs text-violet-400 font-medium mb-1">{special.type.replace('_', ' ').toUpperCase()}</div>
                          <div className="font-mono text-white">{special.content}</div>
                          <div className="text-xs text-zinc-500 mt-1">Page {special.page}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}