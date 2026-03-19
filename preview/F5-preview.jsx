export default function F5Preview() {
  const [activeView, setActiveView] = useState('workflow');
  const [workflowStep, setWorkflowStep] = useState('select');
  const [selectedAW, setSelectedAW] = useState(null);
  const [selectedPIL, setSelectedPIL] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedDeviation, setSelectedDeviation] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');

  const mockDocuments = {
    awDrafts: [
      { id: 1, name: 'Paracetamol_500mg_AW_v2.pdf', product: 'Paracetamol 500mg', market: 'Taiwan', date: '2024-01-15' },
      { id: 2, name: 'Ibuprofen_400mg_AW_v1.pdf', product: 'Ibuprofen 400mg', market: 'Thailand', date: '2024-01-14' }
    ],
    approvedPILs: [
      { id: 3, name: 'Paracetamol_500mg_PIL_2023.pdf', product: 'Paracetamol 500mg', market: 'Taiwan', approved: '2023-12-01' },
      { id: 4, name: 'Ibuprofen_400mg_PIL_2023.pdf', product: 'Ibuprofen 400mg', market: 'Thailand', approved: '2023-11-15' }
    ]
  };

  const mockDeviations = [
    {
      id: 1,
      section: 'Dosage and Administration',
      severity: 'Critical',
      description: 'Dosage mismatch: Approved PIL states "500mg every 6 hours" but AW shows "500mg every 4 hours"',
      page: 3,
      approvedText: 'Adults and children over 12 years: 500mg every 6 hours. Maximum daily dose: 4000mg. Do not exceed recommended dose.',
      awText: 'Adults and children over 12 years: 500mg every 4 hours. Maximum daily dose: 4000mg. Do not exceed recommended dose.',
      type: 'Modified'
    },
    {
      id: 2,
      section: 'Contraindications',
      severity: 'Critical',
      description: 'Missing contraindication: "Severe hepatic impairment" not mentioned in AW Draft',
      page: 4,
      approvedText: 'Contraindicated in patients with severe hepatic impairment, hypersensitivity to paracetamol or any excipients.',
      awText: 'Contraindicated in patients with hypersensitivity to paracetamol or any excipients.',
      type: 'Missing'
    },
    {
      id: 3,
      section: 'Warnings and Precautions',
      severity: 'Major',
      description: 'Warning text modified: "Liver damage" changed to "Hepatic dysfunction"',
      page: 5,
      approvedText: 'Prolonged use may cause liver damage. Monitor liver function in patients with hepatic impairment or chronic alcohol use.',
      awText: 'Prolonged use may cause hepatic dysfunction. Monitor liver function in patients with hepatic impairment or chronic alcohol use.',
      type: 'Modified'
    },
    {
      id: 4,
      section: 'Adverse Reactions',
      severity: 'Major',
      description: 'Missing adverse reaction: "Thrombocytopenia" not listed in AW Draft',
      page: 6,
      approvedText: 'Common: Nausea, vomiting. Rare: Thrombocytopenia, agranulocytosis, hepatotoxicity, hypersensitivity reactions.',
      awText: 'Common: Nausea, vomiting. Rare: Agranulocytosis, hepatotoxicity, hypersensitivity reactions.',
      type: 'Missing'
    },
    {
      id: 5,
      section: 'Storage',
      severity: 'Minor',
      description: 'Temperature formatting: "25°C" vs "25 °C" (spacing difference)',
      page: 8,
      approvedText: 'Store below 25°C in a dry place. Keep out of reach of children.',
      awText: 'Store below 25 °C in a dry place. Keep out of reach of children.',
      type: 'Modified'
    }
  ];

  const summary = {
    total: mockDeviations.length,
    critical: mockDeviations.filter(d => d.severity === 'Critical').length,
    major: mockDeviations.filter(d => d.severity === 'Major').length,
    minor: mockDeviations.filter(d => d.severity === 'Minor').length
  };

  const handleStartReview = () => {
    if (!selectedAW || !selectedPIL) return;
    setWorkflowStep('processing');
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setWorkflowStep('results'), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      Major: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Minor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    };
    return colors[severity];
  };

  const getSeverityIcon = (severity) => {
    return { Critical: '🚨', Major: '⚠️', Minor: 'ℹ️' }[severity];
  };

  const filteredDeviations = filterSeverity === 'all' 
    ? mockDeviations 
    : mockDeviations.filter(d => d.severity === filterSeverity);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">AW Review Workflow</h1>
              <p className="text-sm text-zinc-400 mt-1">Detect deviations between AW Draft and Approved PIL</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium text-white border border-white/10 transition-all">
                📋 History
              </button>
              <button className="px-4 py-2 bg-violet-500 hover:bg-violet-600 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-violet-500/20">
                ➕ New Review
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          {['Select Documents', 'Processing', 'Review Results'].map((label, idx) => (
            <div key={idx} className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${
                (idx === 0 && workflowStep === 'select') ||
                (idx === 1 && workflowStep === 'processing') ||
                (idx === 2 && workflowStep === 'results')
                  ? 'text-violet-400' : 'text-zinc-600'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  (idx === 0 && workflowStep === 'select') ||
                  (idx === 1 && workflowStep === 'processing') ||
                  (idx === 2 && workflowStep === 'results')
                    ? 'bg-violet-500/20 border-2 border-violet-500' : 'bg-zinc-800 border border-zinc-700'
                }`}>
                  {idx + 1}
                </div>
                <span className="text-sm font-medium">{label}</span>
              </div>
              {idx < 2 && <div className="w-16 h-px bg-zinc-700"></div>}
            </div>
          ))}
        </div>

        {/* Step 1: Document Selection */}
        {workflowStep === 'select' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                <h2 className="text-lg font-bold text-white mb-4">📄 Select AW Draft</h2>
                <div className="space-y-3">
                  {mockDocuments.awDrafts.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedAW(doc)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedAW?.id === doc.id
                          ? 'bg-violet-500/20 border-2 border-violet-500'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{doc.name}</div>
                          <div className="text-xs text-zinc-400 mt-1">{doc.product}</div>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-xs text-zinc-500">📍 {doc.market}</span>
                            <span className="text-xs text-zinc-500">📅 {doc.date}</span>
                          </div>
                        </div>
                        {selectedAW?.id === doc.id && <div className="text-violet-400 text-xl">✓</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                <h2 className="text-lg font-bold text-white mb-4">✅ Select Approved PIL</h2>
                <div className="space-y-3">
                  {mockDocuments.approvedPILs.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedPIL(doc)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedPIL?.id === doc.id
                          ? 'bg-emerald-500/20 border-2 border-emerald-500'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{doc.name}</div>
                          <div className="text-xs text-zinc-400 mt-1">{doc.product}</div>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-xs text-zinc-500">📍 {doc.market}</span>
                            <span className="text-xs text-zinc-500">✅ {doc.approved}</span>
                          </div>
                        </div>
                        {selectedPIL?.id === doc.id && <div className="text-emerald-400 text-xl">✓</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleStartReview}
                disabled={!selectedAW || !selectedPIL}
                className={`px-8 py-4 rounded-xl font-semibold text-white transition-all ${
                  selectedAW && selectedPIL
                    ? 'bg-violet-500 hover:bg-violet-600 active:bg-violet-700 shadow-lg shadow-violet-500/20'
                    : 'bg-zinc-700 cursor-not-allowed opacity-50'
                }`}
              >
                🚀 Start AW Review
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Processing */}
        {workflowStep === 'processing' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06]">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/20 mb-4">
                  <div className="animate-spin text-3xl">⚙️</div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {processingProgress < 40 ? 'Extracting Documents' : processingProgress < 80 ? 'Comparing Content' : 'Generating Report'}
                </h2>
                <p className="text-sm text-zinc-400">Analyzing pharmaceutical content with AI...</p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>Progress</span>
                  <span>{processingProgress}%</span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`flex items-center space-x-3 ${processingProgress >= 33 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  <div className="text-xl">{processingProgress >= 33 ? '✓' : '○'}</div>
                  <span className="text-sm">Extract AW Draft (Google Document AI)</span>
                </div>
                <div className={`flex items-center space-x-3 ${processingProgress >= 66 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  <div className="text-xl">{processingProgress >= 66 ? '✓' : '○'}</div>
                  <span className="text-sm">Extract Approved PIL</span>
                </div>
                <div className={`flex items-center space-x-3 ${processingProgress >= 100 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  <div className="text-xl">{processingProgress >= 100 ? '✓' : '○'}</div>
                  <span className="text-sm">Detect Deviations (Claude AI)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {workflowStep === 'results' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="text-xs text-zinc-400 mb-1">Total Deviations</div>
                <div className="text-3xl font-bold text-white">{summary.total}</div>
              </div>
              <div className="bg-rose-500/10 rounded-2xl p-5 border border-rose-500/20">
                <div className="text-xs text-rose-400 mb-1 flex items-center space-x-1">
                  <span>🚨</span>
                  <span>Critical</span>
                </div>
                <div className="text-3xl font-bold text-rose-400">{summary.critical}</div>
              </div>
              <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20">
                <div className="text-xs text-amber-400 mb-1 flex items-center space-x-1">
                  <span>⚠️</span>
                  <span>Major</span>
                </div>
                <div className="text-3xl font-bold text-amber-400">{summary.major}</div>
              </div>
              <div className="bg-cyan-500/10 rounded-2xl p-5 border border-cyan-500/20">
                <div className="text-xs text-cyan-400 mb-1 flex items-center space-x-1">
                  <span>ℹ️</span>
                  <span>Minor</span>
                </div>
                <div className="text-3xl font-bold text-cyan-400">{summary.minor}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilterSeverity('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterSeverity === 'all' ? 'bg-violet-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterSeverity('Critical')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterSeverity === 'Critical' ? 'bg-rose-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  Critical
                </button>
                <button
                  onClick={() => setFilterSeverity('Major')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterSeverity === 'Major' ? 'bg-amber-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  Major
                </button>
                <button
                  onClick={() => setFilterSeverity('Minor')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterSeverity === 'Minor' ? 'bg-cyan-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  Minor
                </button>
              </div>
              <button className="px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-xl font-semibold text-white transition-all shadow-lg shadow-violet-500/20">
                📄 Export PDF Report
              </button>
            </div>

            {/* Deviations Grid */}
            <div className="grid grid-cols-3 gap-6">
              {/* List */}
              <div className="col-span-1 space-y-3">
                <h3 className="text-sm font-bold text-white">Deviations ({filteredDeviations.length})</h3>
                {filteredDeviations.map(dev => (
                  <div
                    key={dev.id}
                    onClick={() => setSelectedDeviation(dev)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedDeviation?.id === dev.id
                        ? 'bg-violet-500/20 border-2 border-violet-500'
                        : 'bg-zinc-800/50 border border-white/[0.06] hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(dev.severity)}`}>
                        <span>{getSeverityIcon(dev.severity)}</span>
                        <span>{dev.severity}</span>
                      </span>
                      <span className="text-xs text-zinc-500">P.{dev.page}</span>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{dev.section}</div>
                    <div className="text-xs text-zinc-400 line-clamp-2">{dev.description}</div>
                  </div>
                ))}
              </div>

              {/* Detail */}
              <div className="col-span-2">
                {selectedDeviation ? (
                  <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{selectedDeviation.section}</h3>
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedDeviation.severity)}`}>
                          <span>{getSeverityIcon(selectedDeviation.severity)}</span>
                          <span>{selectedDeviation.severity}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-500">Page</div>
                        <div className="text-sm font-mono text-violet-400">{selectedDeviation.page}</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-sm font-semibold text-white mb-2">Description</div>
                      <div className="text-sm text-zinc-300 bg-white/5 rounded-xl p-4 border border-white/10">
                        {selectedDeviation.description}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-emerald-400 mb-2">✓ Approved PIL</div>
                        <div className="text-xs text-zinc-300 bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20 h-32 overflow-y-auto">
                          {selectedDeviation.approvedText}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-rose-400 mb-2">✗ AW Draft</div>
                        <div className="text-xs text-zinc-300 bg-rose-500/5 rounded-xl p-4 border border-rose-500/20 h-32 overflow-y-auto">
                          {selectedDeviation.awText || '(Missing in AW Draft)'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                      <div className="text-xs text-zinc-500">
                        Change Type: <span className="text-zinc-300 font-medium">{selectedDeviation.type}</span>
                      </div>
                      <button className="px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 rounded-xl text-xs font-semibold text-violet-400 border border-violet-500/20 transition-all">
                        Mark as Reviewed
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-800/50 rounded-2xl p-12 border border-white/[0.06] text-center">
                    <div className="text-4xl mb-4">👈</div>
                    <div className="text-sm text-zinc-400">Select a deviation to view details</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}