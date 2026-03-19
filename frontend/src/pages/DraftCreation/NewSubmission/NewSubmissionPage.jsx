import { useState, useEffect } from 'react';

export default function NewSubmissionPage() {
  const [step, setStep] = useState('select'); // select, processing, results
  const [selectedInnovatorPil, setSelectedInnovatorPil] = useState(null);
  const [selectedRegulatorySource, setSelectedRegulatorySource] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [results, setResults] = useState(null);

  const products = [
    { id: 1, name: 'Product A - Oncology Drug', code: 'PA-001' },
    { id: 2, name: 'Product B - Generic Antibiotic', code: 'PB-002' },
  ];

  const markets = [
    { id: 1, name: 'Taiwan', authority: 'TFDA', language: 'Traditional Chinese' },
    { id: 2, name: 'Thailand', authority: 'Thai FDA', language: 'Thai' },
  ];

  const documents = [
    { id: 1, name: 'Innovator-PIL-Product-A.pdf', type: 'InnovatorPIL', productId: 1, language: 'English' },
    { id: 2, name: 'TFDA-PIL-Format-2024.pdf', type: 'RegulatorySource', marketId: 1, language: 'Traditional Chinese' },
    { id: 3, name: 'Thai-FDA-PIL-Requirements.pdf', type: 'RegulatorySource', marketId: 2, language: 'Thai' },
  ];

  const handleStartWorkflow = async () => {
    if (!selectedInnovatorPil || !selectedRegulatorySource || !selectedProduct || !selectedMarket) {
      alert('Please select all required documents and configurations');
      return;
    }

    setStep('processing');

    // Simulate API call
    const mockWorkflowId = Date.now();
    setWorkflowId(mockWorkflowId);

    // Simulate workflow progression
    const statuses = [
      { state: 'extracting_innovator', progress: { currentStep: 'Extracting Innovator PIL', percentComplete: 10 } },
      { state: 'extracting_regulatory', progress: { currentStep: 'Extracting Regulatory Source', percentComplete: 30 } },
      { state: 'aligning_sections', progress: { currentStep: 'Aligning sections', percentComplete: 50 } },
      { state: 'analyzing_gaps', progress: { currentStep: 'Analyzing content gaps', percentComplete: 70 } },
      { state: 'generating_outline', progress: { currentStep: 'Generating draft outline', percentComplete: 90 } },
      { state: 'complete', progress: { currentStep: 'Complete', percentComplete: 100 } },
    ];

    for (let i = 0; i < statuses.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setWorkflowStatus(statuses[i]);
    }

    // Set mock results
    setResults({
      draftOutline: {
        sections: [
          {
            order: 1,
            sectionName: 'Product Name',
            sourceContent: 'ONCOLOGY DRUG A - 50mg/vial for injection',
            targetRequirements: 'Product name must include strength, dosage form, and route of administration in Traditional Chinese',
            translationNotes: ['Verify Chinese pharmaceutical naming conventions', 'Confirm dosage unit translation (mg/vial)'],
            formattingRequirements: ['Bold product name', 'Include both English and Chinese names'],
            specialAttention: false,
          },
          {
            order: 4,
            sectionName: 'Dosage and Administration',
            sourceContent: 'Adults: 10 mg/kg/day IV infusion over 30 minutes. Pediatric: 5 mg/kg/day.',
            targetRequirements: 'Dosage table required with weight-based calculations in metric units',
            translationNotes: ['Complex medical terminology - certified translator required', 'Verify dosage calculations'],
            formattingRequirements: ['Create dosage table', 'Convert all units to metric', 'Preserve subscripts/superscripts'],
            specialAttention: true,
            specialAttentionDetails: {
              sectionName: 'Dosage and Administration',
              attentionType: 'dosage_table',
              description: 'Contains weight-based dosage calculations requiring unit conversion',
              requirements: ['Convert imperial units to metric', 'Verify all calculations', 'Preserve table formatting'],
            },
          },
          {
            order: 15,
            sectionName: 'Local Emergency Contacts',
            sourceContent: '[NO INNOVATOR CONTENT - REQUIRES LOCAL CONTENT]',
            targetRequirements: 'Must include Taiwan poison control center and TFDA emergency hotline',
            translationNotes: ['This section requires locally-sourced content'],
            formattingRequirements: [],
            specialAttention: true,
            specialAttentionDetails: {
              sectionName: 'Local Emergency Contacts',
              attentionType: 'local_contacts',
              description: 'Section not present in Innovator PIL',
              requirements: ['Must include Taiwan poison control center and TFDA emergency hotline'],
            },
            gaps: [
              {
                regulatorySectionName: 'Local Emergency Contacts',
                gapType: 'missing_section',
                severity: 'critical',
                description: 'Section required by TFDA but not present in Innovator PIL',
                regulatoryRequirement: 'Must include country-specific poison control center',
                suggestedAction: 'Add local emergency contact information from TFDA guidelines',
              },
            ],
          },
        ],
        metadata: {
          targetMarket: 'Taiwan',
          regulatoryAuthority: 'TFDA',
          language: 'zh-TW',
          generatedAt: new Date().toISOString(),
          totalSections: 15,
          estimatedTranslationTime: '2.5 days (20 hours)',
        },
      },
      summary: {
        totalSections: 15,
        specialAttentionCount: 3,
        criticalGapsCount: 1,
        estimatedTime: '2.5 days (20 hours)',
      },
      alignmentResult: {
        matchedPairs: 12,
        confidence: 0.87,
        orphanedSections: 2,
        unmatchedSections: 3,
      },
      gapAnalysisResult: {
        totalGaps: 5,
        criticalGaps: 1,
        specialAttentionSections: 3,
      },
    });

    setStep('results');
  };

  const handleDownload = () => {
    alert('Downloading draft outline as Word document...');
  };

  const handleReset = () => {
    setStep('select');
    setSelectedInnovatorPil(null);
    setSelectedRegulatorySource(null);
    setSelectedProduct(null);
    setSelectedMarket(null);
    setWorkflowId(null);
    setWorkflowStatus(null);
    setResults(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">PIL Draft Creation - New Submission</h1>
          <p className="text-zinc-400">
            Align Innovator PIL with target market regulatory requirements to generate structured draft outline
          </p>
        </div>

        {/* Document Selection */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Product Selection */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold mb-4">1. Select Product</h2>
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-sm text-zinc-400 mt-1">Code: {product.code}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Market Selection */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold mb-4">2. Select Target Market</h2>
              <div className="grid grid-cols-2 gap-4">
                {markets.map((market) => (
                  <button
                    key={market.id}
                    onClick={() => setSelectedMarket(market)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedMarket?.id === market.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="font-semibold">{market.name}</div>
                    <div className="text-sm text-zinc-400 mt-1">{market.authority}</div>
                    <div className="text-xs text-zinc-500 mt-1">Language: {market.language}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Innovator PIL Selection */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold mb-4">3. Select Innovator PIL (English)</h2>
              <div className="space-y-3">
                {documents
                  .filter((doc) => doc.type === 'InnovatorPIL' && doc.productId === selectedProduct?.id)
                  .map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedInnovatorPil(doc)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedInnovatorPil?.id === doc.id
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">📄 {doc.name}</div>
                          <div className="text-sm text-zinc-400 mt-1">Language: {doc.language}</div>
                        </div>
                        <div className="text-xs text-zinc-500">Innovator PIL</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Regulatory Source Selection */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold mb-4">4. Select Regulatory Source Document</h2>
              <div className="space-y-3">
                {documents
                  .filter((doc) => doc.type === 'RegulatorySource' && doc.marketId === selectedMarket?.id)
                  .map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedRegulatorySource(doc)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRegulatorySource?.id === doc.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">📋 {doc.name}</div>
                          <div className="text-sm text-zinc-400 mt-1">Language: {doc.language}</div>
                        </div>
                        <div className="text-xs text-zinc-500">Regulatory Source</div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartWorkflow}
              disabled={!selectedInnovatorPil || !selectedRegulatorySource || !selectedProduct || !selectedMarket}
              className="w-full py-4 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-zinc-700 disabled:text-zinc-500 font-semibold text-lg transition-all"
            >
              Start Draft Creation Workflow
            </button>
          </div>
        )}

        {/* Processing */}
        {step === 'processing' && workflowStatus && (
          <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06]">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">⚙️</div>
              <h2 className="text-2xl font-bold mb-2">{workflowStatus.progress.currentStep}</h2>
              <p className="text-zinc-400">Processing your PIL draft creation request...</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-zinc-400 mb-2">
                <span>Progress</span>
                <span>{workflowStatus.progress.percentComplete}%</span>
              </div>
              <div className="h-3 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${workflowStatus.progress.percentComplete}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {[
                { name: 'Extracting Innovator PIL', percent: 10 },
                { name: 'Extracting Regulatory Source', percent: 30 },
                { name: 'Aligning sections', percent: 50 },
                { name: 'Analyzing content gaps', percent: 70 },
                { name: 'Generating draft outline', percent: 90 },
              ].map((stepItem) => (
                <div
                  key={stepItem.name}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    workflowStatus.progress.percentComplete >= stepItem.percent
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-white/5 text-zinc-500'
                  }`}
                >
                  <div className="text-xl">
                    {workflowStatus.progress.percentComplete >= stepItem.percent ? '✅' : '⏳'}
                  </div>
                  <div className="font-medium">{stepItem.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && results && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-2xl font-bold">{results.summary.totalSections}</div>
                <div className="text-sm text-zinc-400">Total Sections</div>
              </div>
              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="text-3xl mb-2">⚠️</div>
                <div className="text-2xl font-bold text-amber-400">{results.summary.specialAttentionCount}</div>
                <div className="text-sm text-zinc-400">Special Attention</div>
              </div>
              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="text-3xl mb-2">🔴</div>
                <div className="text-2xl font-bold text-rose-400">{results.summary.criticalGapsCount}</div>
                <div className="text-sm text-zinc-400">Critical Gaps</div>
              </div>
              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="text-3xl mb-2">⏱️</div>
                <div className="text-2xl font-bold text-cyan-400">{results.summary.estimatedTime}</div>
                <div className="text-sm text-zinc-400">Est. Translation</div>
              </div>
            </div>

            {/* Alignment Summary */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold mb-4">Section Alignment Summary</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Matched Pairs</div>
                  <div className="text-2xl font-bold text-emerald-400">{results.alignmentResult.matchedPairs}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-violet-400">
                    {(results.alignmentResult.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-400 mb-1">Unmatched Sections</div>
                  <div className="text-2xl font-bold text-amber-400">{results.alignmentResult.unmatchedSections}</div>
                </div>
              </div>
            </div>

            {/* Draft Outline Sections */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold mb-4">Draft Outline Sections</h2>
              <div className="space-y-4">
                {results.draftOutline.sections.map((section) => (
                  <div
                    key={section.order}
                    className={`p-5 rounded-xl border ${
                      section.specialAttention
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-bold text-lg">
                          {section.order}. {section.sectionName}
                        </div>
                        {section.specialAttention && (
                          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                            ⚠️ {section.specialAttentionDetails?.attentionType.replace('_', ' ').toUpperCase()}
                          </div>
                        )}
                      </div>
                      {section.gaps && section.gaps.length > 0 && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-medium">
                          🔴 {section.gaps[0].severity.toUpperCase()} GAP
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="text-zinc-400 font-medium mb-1">Source Content (English):</div>
                        <div className="text-zinc-300">{section.sourceContent}</div>
                      </div>

                      <div>
                        <div className="text-zinc-400 font-medium mb-1">Target Requirements:</div>
                        <div className="text-zinc-300">{section.targetRequirements}</div>
                      </div>

                      {section.translationNotes.length > 0 && (
                        <div>
                          <div className="text-zinc-400 font-medium mb-1">Translation Notes:</div>
                          <ul className="list-disc list-inside text-zinc-300 space-y-1">
                            {section.translationNotes.map((note, i) => (
                              <li key={i}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {section.gaps && section.gaps.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                          <div className="text-rose-400 font-medium mb-1">Content Gap:</div>
                          <div className="text-rose-300 text-xs">{section.gaps[0].description}</div>
                          <div className="text-rose-300 text-xs mt-2">
                            <strong>Action:</strong> {section.gaps[0].suggestedAction}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleDownload}
                className="flex-1 py-4 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 font-semibold text-lg transition-all"
              >
                📥 Download Draft Outline (Word)
              </button>
              <button
                onClick={handleReset}
                className="py-4 px-6 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-semibold text-lg transition-all"
              >
                Start New Workflow
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}