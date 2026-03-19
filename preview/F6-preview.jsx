export default function F6Preview() {
  const [activeView, setActiveView] = useState('workflow');
  const [workflowStep, setWorkflowStep] = useState('select');
  const [selectedDocs, setSelectedDocs] = useState({ innovator: null, regulatory: null });
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showSectionDetail, setShowSectionDetail] = useState(null);

  const products = [
    { id: 1, name: 'Oncology Drug A', code: 'ONC-001', market: 'Taiwan' },
    { id: 2, name: 'Generic Antibiotic B', code: 'GEN-002', market: 'Thailand' },
  ];

  const documents = {
    innovator: [
      { id: 1, name: 'Innovator-PIL-ONC-001-EN.pdf', pages: 24, language: 'English', uploadDate: '2024-01-15' },
      { id: 2, name: 'Innovator-PIL-GEN-002-EN.pdf', pages: 18, language: 'English', uploadDate: '2024-01-20' },
    ],
    regulatory: [
      { id: 3, name: 'TFDA-PIL-Format-2024.pdf', pages: 12, language: 'Traditional Chinese', market: 'Taiwan' },
      { id: 4, name: 'Thai-FDA-Requirements.pdf', pages: 15, language: 'Thai', market: 'Thailand' },
    ],
  };

  const mockResults = {
    alignment: {
      matchedPairs: 12,
      confidence: 0.87,
      orphanedSections: 2,
      unmatchedSections: 3,
      totalInnovatorSections: 14,
      totalRegulatorySections: 15,
    },
    gaps: {
      total: 5,
      critical: 1,
      major: 3,
      minor: 1,
    },
    outline: {
      totalSections: 15,
      specialAttentionCount: 3,
      estimatedTime: '2.5 days (20 hours)',
      sections: [
        {
          order: 1,
          name: 'Product Name',
          sourceContent: 'ONCOLOGY DRUG A - 50mg/vial for injection. Active ingredient: Compound X hydrochloride.',
          targetRequirements: 'Product name must include strength, dosage form, route in Traditional Chinese',
          translationNotes: ['Verify Chinese pharmaceutical naming conventions', 'Confirm dosage unit translation'],
          specialAttention: false,
          gaps: [],
        },
        {
          order: 4,
          name: 'Dosage and Administration',
          sourceContent: 'Adults: 10 mg/kg/day IV infusion over 30 min. Pediatric: 5 mg/kg/day. Max dose: 500mg/m².',
          targetRequirements: 'Dosage table required with weight-based calculations in metric units',
          translationNotes: ['Complex medical terminology - certified translator required', 'Verify all calculations'],
          specialAttention: true,
          attentionType: 'dosage_table',
          attentionDetails: 'Contains weight-based dosage with unit conversions (mg/kg, mg/m²)',
          gaps: [],
        },
        {
          order: 7,
          name: 'Adverse Reactions',
          sourceContent: 'Common (≥10%): Nausea, fatigue, neutropenia. Serious: Anaphylaxis, hepatotoxicity.',
          targetRequirements: 'Adverse reactions must be categorized by frequency and severity per TFDA guidelines',
          translationNotes: ['Medical terminology requires specialist translator', 'Verify frequency classifications'],
          specialAttention: false,
          gaps: [
            {
              severity: 'major',
              description: 'Missing local adverse event reporting contact information',
              action: 'Add Taiwan pharmacovigilance center contact details',
            },
          ],
        },
        {
          order: 15,
          name: 'Local Emergency Contacts',
          sourceContent: '[NO INNOVATOR CONTENT - REQUIRES LOCAL CONTENT]',
          targetRequirements: 'Must include Taiwan poison control center and TFDA emergency hotline',
          translationNotes: ['This section requires locally-sourced content'],
          specialAttention: true,
          attentionType: 'local_contacts',
          attentionDetails: 'Section not present in Innovator PIL - requires local regulatory information',
          gaps: [
            {
              severity: 'critical',
              description: 'Mandatory section missing from Innovator PIL',
              action: 'Add Taiwan poison control: 0800-024-024 and TFDA hotline: 02-2787-8200',
            },
          ],
        },
      ],
    },
  };

  const handleStartWorkflow = () => {
    if (!selectedDocs.innovator || !selectedDocs.regulatory) {
      alert('Please select both Innovator PIL and Regulatory Source documents');
      return;
    }
    setWorkflowStep('processing');
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setWorkflowStep('results'), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 400);
  };

  const getProgressStep = () => {
    if (processingProgress < 20) return 'Extracting Innovator PIL...';
    if (processingProgress < 40) return 'Extracting Regulatory Source...';
    if (processingProgress < 60) return 'Aligning sections semantically...';
    if (processingProgress < 80) return 'Analyzing content gaps...';
    if (processingProgress < 100) return 'Generating draft outline...';
    return 'Complete!';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      major: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      minor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return colors[severity] || colors.minor;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="sticky top-0 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">PIL Draft Creation - New Submission</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Align Innovator PIL with regulatory requirements to generate structured draft outline
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveView('workflow')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  activeView === 'workflow'
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                Workflow
              </button>
              <button
                onClick={() => setActiveView('history')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  activeView === 'history'
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                History
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'workflow' && (
          <>
            {/* Document Selection */}
            {workflowStep === 'select' && (
              <div className="space-y-6">
                {/* Product Selection */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">🎯</span> Select Product & Market
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition-all cursor-pointer"
                      >
                        <div className="font-semibold text-lg">{product.name}</div>
                        <div className="text-sm text-zinc-400 mt-1">Code: {product.code}</div>
                        <div className="text-xs text-zinc-500 mt-1">Target: {product.market}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Innovator PIL Selection */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">📄</span> Select Innovator PIL (English)
                  </h2>
                  <div className="space-y-3">
                    {documents.innovator.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocs({ ...selectedDocs, innovator: doc })}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedDocs.innovator?.id === doc.id
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{doc.name}</div>
                            <div className="text-sm text-zinc-400 mt-1">
                              {doc.pages} pages • {doc.language} • Uploaded {doc.uploadDate}
                            </div>
                          </div>
                          {selectedDocs.innovator?.id === doc.id && <span className="text-2xl">✅</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Regulatory Source Selection */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-2xl">📋</span> Select Regulatory Source Document
                  </h2>
                  <div className="space-y-3">
                    {documents.regulatory.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedDocs({ ...selectedDocs, regulatory: doc })}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                          selectedDocs.regulatory?.id === doc.id
                            ? 'border-amber-500 bg-amber-500/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{doc.name}</div>
                            <div className="text-sm text-zinc-400 mt-1">
                              {doc.pages} pages • {doc.language} • {doc.market}
                            </div>
                          </div>
                          {selectedDocs.regulatory?.id === doc.id && <span className="text-2xl">✅</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartWorkflow}
                  disabled={!selectedDocs.innovator || !selectedDocs.regulatory}
                  className="w-full py-4 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 font-semibold text-lg transition-all shadow-lg shadow-violet-500/20"
                >
                  🚀 Start Draft Creation Workflow
                </button>
              </div>
            )}

            {/* Processing */}
            {workflowStep === 'processing' && (
              <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06] shadow-lg shadow-black/20">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4 animate-pulse">⚙️</div>
                  <h2 className="text-2xl font-bold mb-2">{getProgressStep()}</h2>
                  <p className="text-zinc-400">Processing your PIL draft creation request...</p>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between text-sm text-zinc-400 mb-2">
                    <span>Progress</span>
                    <span>{processingProgress}%</span>
                  </div>
                  <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-500 transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { name: 'Extract Innovator PIL', threshold: 20 },
                    { name: 'Extract Regulatory Source', threshold: 40 },
                    { name: 'Align sections semantically', threshold: 60 },
                    { name: 'Analyze content gaps', threshold: 80 },
                    { name: 'Generate draft outline', threshold: 100 },
                  ].map((step) => (
                    <div
                      key={step.name}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        processingProgress >= step.threshold
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-white/5 text-zinc-500'
                      }`}
                    >
                      <span className="text-xl">{processingProgress >= step.threshold ? '✅' : '⏳'}</span>
                      <span className="font-medium">{step.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {workflowStep === 'results' && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
                    <div className="text-3xl mb-2">📋</div>
                    <div className="text-3xl font-bold">{mockResults.outline.totalSections}</div>
                    <div className="text-sm text-zinc-400 mt-1">Total Sections</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
                    <div className="text-3xl mb-2">⚠️</div>
                    <div className="text-3xl font-bold text-amber-400">{mockResults.outline.specialAttentionCount}</div>
                    <div className="text-sm text-zinc-400 mt-1">Special Attention</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
                    <div className="text-3xl mb-2">🔴</div>
                    <div className="text-3xl font-bold text-rose-400">{mockResults.gaps.critical}</div>
                    <div className="text-sm text-zinc-400 mt-1">Critical Gaps</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
                    <div className="text-3xl mb-2">⏱️</div>
                    <div className="text-xl font-bold text-cyan-400">{mockResults.outline.estimatedTime}</div>
                    <div className="text-sm text-zinc-400 mt-1">Est. Translation</div>
                  </div>
                </div>

                {/* Alignment Summary */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <h2 className="text-xl font-bold mb-4">Section Alignment Summary</h2>
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <div className="text-sm text-zinc-400 mb-1">Matched Pairs</div>
                      <div className="text-2xl font-bold text-emerald-400">{mockResults.alignment.matchedPairs}</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400 mb-1">Confidence</div>
                      <div className="text-2xl font-bold text-violet-400">
                        {(mockResults.alignment.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400 mb-1">Orphaned Sections</div>
                      <div className="text-2xl font-bold text-amber-400">{mockResults.alignment.orphanedSections}</div>
                    </div>
                    <div>
                      <div className="text-sm text-zinc-400 mb-1">Unmatched Sections</div>
                      <div className="text-2xl font-bold text-rose-400">{mockResults.alignment.unmatchedSections}</div>
                    </div>
                  </div>
                </div>

                {/* Draft Outline Sections */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                  <h2 className="text-xl font-bold mb-4">Draft Outline Sections</h2>
                  <div className="space-y-4">
                    {mockResults.outline.sections.map((section) => (
                      <div
                        key={section.order}
                        className={`p-5 rounded-xl border transition-all ${
                          section.specialAttention
                            ? 'border-amber-500/50 bg-amber-500/5'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="font-bold text-lg mb-2">
                              {section.order}. {section.name}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {section.specialAttention && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                                  ⚠️ {section.attentionType?.replace('_', ' ').toUpperCase()}
                                </span>
                              )}
                              {section.gaps.length > 0 && (
                                <span
                                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                                    section.gaps[0].severity
                                  )}`}
                                >
                                  {section.gaps[0].severity === 'critical' ? '🔴' : '⚠️'}{' '}
                                  {section.gaps[0].severity.toUpperCase()} GAP
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setShowSectionDetail(showSectionDetail === section.order ? null : section.order)
                            }
                            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-all"
                          >
                            {showSectionDetail === section.order ? '▲ Hide' : '▼ Details'}
                          </button>
                        </div>

                        {showSectionDetail === section.order && (
                          <div className="space-y-3 text-sm mt-4 pt-4 border-t border-white/10">
                            <div>
                              <div className="text-zinc-400 font-semibold mb-1">Source Content (English):</div>
                              <div className="text-zinc-300 bg-white/5 p-3 rounded-lg">{section.sourceContent}</div>
                            </div>

                            <div>
                              <div className="text-zinc-400 font-semibold mb-1">Target Requirements:</div>
                              <div className="text-zinc-300 bg-white/5 p-3 rounded-lg">{section.targetRequirements}</div>
                            </div>

                            {section.translationNotes.length > 0 && (
                              <div>
                                <div className="text-zinc-400 font-semibold mb-1">Translation Notes:</div>
                                <ul className="list-disc list-inside text-zinc-300 space-y-1 bg-white/5 p-3 rounded-lg">
                                  {section.translationNotes.map((note, i) => (
                                    <li key={i}>{note}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {section.gaps.length > 0 && (
                              <div className={`p-3 rounded-lg border ${getSeverityColor(section.gaps[0].severity)}`}>
                                <div className="font-semibold mb-1">Content Gap:</div>
                                <div className="text-xs mb-2">{section.gaps[0].description}</div>
                                <div className="text-xs">
                                  <strong>Suggested Action:</strong> {section.gaps[0].action}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <button className="flex-1 py-4 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold text-lg transition-all shadow-lg shadow-violet-500/20">
                    📥 Download Draft Outline (Word)
                  </button>
                  <button
                    onClick={() => {
                      setWorkflowStep('select');
                      setSelectedDocs({ innovator: null, regulatory: null });
                      setProcessingProgress(0);
                    }}
                    className="py-4 px-6 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-semibold text-lg transition-all"
                  >
                    🔄 Start New Workflow
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeView === 'history' && (
          <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
            <h2 className="text-xl font-bold mb-4">Recent Workflows</h2>
            <div className="space-y-3">
              {[
                {
                  id: 1,
                  product: 'Oncology Drug A',
                  market: 'Taiwan',
                  date: '2024-01-20',
                  status: 'Complete',
                  sections: 15,
                  gaps: 1,
                },
                {
                  id: 2,
                  product: 'Generic Antibiotic B',
                  market: 'Thailand',
                  date: '2024-01-18',
                  status: 'Complete',
                  sections: 14,
                  gaps: 3,
                },
              ].map((workflow) => (
                <div
                  key={workflow.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">
                        {workflow.product} → {workflow.market}
                      </div>
                      <div className="text-sm text-zinc-400 mt-1">
                        {workflow.sections} sections • {workflow.gaps} critical gaps • {workflow.date}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                      ✅ {workflow.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}