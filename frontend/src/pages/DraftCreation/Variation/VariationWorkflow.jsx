import { useState, useEffect } from 'react';

export default function VariationWorkflow() {
  const [step, setStep] = useState('select'); // select, processing, results
  const [selectedApprovedPil, setSelectedApprovedPil] = useState(null);
  const [selectedChangeTrigger, setSelectedChangeTrigger] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Mock documents
  const approvedPils = [
    { id: 1, name: 'Paracetamol 500mg PIL - Taiwan (Approved 2024-01-15)', market: 'Taiwan', date: '2024-01-15' },
    { id: 2, name: 'Ibuprofen 400mg PIL - Thailand (Approved 2023-12-20)', market: 'Thailand', date: '2023-12-20' },
    { id: 3, name: 'Amoxicillin 250mg PIL - Vietnam (Approved 2024-02-10)', market: 'Vietnam', date: '2024-02-10' },
  ];

  const changeTriggers = [
    { id: 101, name: 'TFDA Regulatory Announcement - Paracetamol Dosage Update', type: 'RegulatoryAnnouncement', date: '2024-03-01' },
    { id: 102, name: 'Updated Innovator PIL - Paracetamol (US FDA)', type: 'InnovatorPIL', date: '2024-02-28' },
    { id: 103, name: 'Commercial AW - Paracetamol with Revision Comments', type: 'CommercialAW', date: '2024-03-05' },
  ];

  const handleInitiateWorkflow = async () => {
    if (!selectedApprovedPil || !selectedChangeTrigger) {
      setError('Please select both Approved PIL and change trigger document');
      return;
    }

    setStep('processing');
    setError(null);

    // Simulate API call
    setTimeout(() => {
      const mockWorkflowId = Date.now();
      setWorkflowId(mockWorkflowId);
      
      // Simulate workflow progress
      simulateWorkflowProgress(mockWorkflowId);
    }, 500);
  };

  const simulateWorkflowProgress = (wfId) => {
    const steps = [
      { status: 'Extracting', currentStep: 'Extracting Approved PIL', percentComplete: 20 },
      { status: 'Extracting', currentStep: 'Extracting change trigger document', percentComplete: 40 },
      { status: 'Comparing', currentStep: 'Classifying variation type', percentComplete: 60 },
      { status: 'Comparing', currentStep: 'Generating section-by-section diff', percentComplete: 80 },
      { status: 'Complete', currentStep: 'Workflow complete', percentComplete: 100 },
    ];

    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < steps.length) {
        setWorkflowStatus({
          workflowId: wfId,
          type: 'Variation',
          ...steps[currentIndex],
          createdAt: new Date().toISOString(),
        });
        currentIndex++;
      } else {
        clearInterval(interval);
        loadResults(wfId);
      }
    }, 2000);
  };

  const loadResults = (wfId) => {
    // Mock results - complicated variation
    const mockResults = {
      classification: 'complicated',
      classificationRationale: 'Multiple sections affected with safety-critical dosage changes. TFDA regulatory announcement requires updates to Dosage and Administration, Warnings and Precautions, and Adverse Reactions sections. Changes affect patient safety information and require full regulatory review cycle.',
      confidence: 0.92,
      sectionsAffected: ['Dosage and Administration', 'Warnings and Precautions', 'Adverse Reactions'],
      regulatoryImpact: 'high',
      diff: {
        sections: [
          {
            sectionName: 'Dosage and Administration',
            changeType: 'Modified',
            oldContent: 'Adults and children over 12 years: 500-1000mg every 4-6 hours as needed. Maximum daily dose: 4000mg...',
            newContent: 'Adults and children over 12 years: 500-1000mg every 4-6 hours as needed. Maximum daily dose: 3000mg (reduced from 4000mg)...',
            regulatoryImpact: 'Critical dosage change requires regulatory approval. Maximum daily dose reduced from 4000mg to 3000mg per TFDA safety update.',
            changesCount: 3,
          },
          {
            sectionName: 'Warnings and Precautions',
            changeType: 'Modified',
            oldContent: 'Do not exceed recommended dose. Prolonged use may cause liver damage...',
            newContent: 'Do not exceed recommended dose. NEW WARNING: Risk of severe liver damage at doses above 3000mg/day. Patients with liver disease should not exceed 2000mg/day...',
            regulatoryImpact: 'New safety warning added per regulatory requirement. Requires prominent display in PIL.',
            changesCount: 2,
          },
          {
            sectionName: 'Adverse Reactions',
            changeType: 'Modified',
            oldContent: 'Common: nausea, stomach pain. Rare: allergic reactions...',
            newContent: 'Common: nausea, stomach pain. Rare: allergic reactions, severe liver damage (at high doses)...',
            regulatoryImpact: 'Updated adverse reaction profile to include liver damage risk.',
            changesCount: 1,
          },
        ],
        summary: {
          totalSections: 3,
          sectionsAdded: 0,
          sectionsModified: 3,
          sectionsDeleted: 0,
          criticalChanges: 2,
          majorChanges: 3,
          minorChanges: 1,
        },
        overallImpact: '3 sections affected: 0 added, 3 modified, 0 deleted. 2 critical changes, 3 major changes, 1 minor changes.',
        recommendedActions: [
          'Priority review required for critical safety changes',
          'Create new Draft PIL incorporating all changes',
          'Submit to regulatory authority for approval',
          'Update internal documentation',
        ],
      },
    };

    setResults(mockResults);
    setStep('results');
  };

  const handleReset = () => {
    setStep('select');
    setSelectedApprovedPil(null);
    setSelectedChangeTrigger(null);
    setWorkflowId(null);
    setWorkflowStatus(null);
    setResults(null);
    setError(null);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      major: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      minor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    };
    return colors[severity] || colors.minor;
  };

  const getChangeTypeColor = (type) => {
    const colors = {
      Added: 'bg-emerald-500/20 text-emerald-400',
      Modified: 'bg-violet-500/20 text-violet-400',
      Deleted: 'bg-rose-500/20 text-rose-400',
    };
    return colors[type] || colors.Modified;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <span className="text-xl">🔄</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">PIL Variation Workflow</h1>
              <p className="text-sm text-zinc-400 mt-1">Classify and process PIL variations automatically</p>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${step === 'select' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'select' ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'}`}>1</div>
              <span className="text-sm font-medium text-white">Select Documents</span>
            </div>
            <div className="flex-1 h-0.5 bg-white/10 mx-4"></div>
            <div className={`flex items-center gap-3 ${step === 'processing' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'processing' ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'}`}>2</div>
              <span className="text-sm font-medium text-white">Processing</span>
            </div>
            <div className="flex-1 h-0.5 bg-white/10 mx-4"></div>
            <div className={`flex items-center gap-3 ${step === 'results' ? 'opacity-100' : 'opacity-50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step === 'results' ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'}`}>3</div>
              <span className="text-sm font-medium text-white">Results</span>
            </div>
          </div>
        </div>

        {/* Document Selection */}
        {step === 'select' && (
          <div className="space-y-6">
            {/* Approved PIL Selection */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">1. Select Approved PIL</h2>
              <div className="space-y-3">
                {approvedPils.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedApprovedPil(doc)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedApprovedPil?.id === doc.id
                        ? 'bg-violet-500/20 border-violet-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{doc.name}</div>
                        <div className="text-sm text-zinc-400 mt-1">Market: {doc.market} • Approved: {doc.date}</div>
                      </div>
                      {selectedApprovedPil?.id === doc.id && (
                        <div className="text-2xl">✅</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Trigger Selection */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">2. Select Change Trigger</h2>
              <div className="space-y-3">
                {changeTriggers.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedChangeTrigger(doc)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedChangeTrigger?.id === doc.id
                        ? 'bg-violet-500/20 border-violet-500/50'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{doc.name}</div>
                        <div className="text-sm text-zinc-400 mt-1">Type: {doc.type} • Date: {doc.date}</div>
                      </div>
                      {selectedChangeTrigger?.id === doc.id && (
                        <div className="text-2xl">✅</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <span className="text-rose-400 font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* Initiate Button */}
            <button
              onClick={handleInitiateWorkflow}
              disabled={!selectedApprovedPil || !selectedChangeTrigger}
              className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
            >
              Initiate Variation Workflow
            </button>
          </div>
        )}

        {/* Processing Status */}
        {step === 'processing' && workflowStatus && (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-500/20 mb-4 animate-pulse">
                  <span className="text-4xl">⚙️</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Processing Variation</h2>
                <p className="text-zinc-400">{workflowStatus.currentStep}</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-400">Progress</span>
                  <span className="text-sm font-bold text-violet-400">{workflowStatus.percentComplete}%</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${workflowStatus.percentComplete}%` }}
                  ></div>
                </div>
              </div>

              {/* Workflow Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-zinc-500 mb-1">Workflow ID</div>
                  <div className="text-white font-mono">{workflowStatus.workflowId}</div>
                </div>
                <div>
                  <div className="text-zinc-500 mb-1">Status</div>
                  <div className="text-white font-medium">{workflowStatus.status}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {step === 'results' && results && (
          <div className="space-y-6">
            {/* Classification Result */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Classification Result</h2>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                  results.classification === 'complicated'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {results.classification === 'complicated' ? '🔴' : '🟢'}
                  <span className="uppercase">{results.classification}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-zinc-400 mb-2">Confidence Score</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                        style={{ width: `${results.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-bold">{(results.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-zinc-400 mb-2">Rationale</div>
                  <div className="text-white bg-white/5 rounded-xl p-4 border border-white/10">
                    {results.classificationRationale}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-zinc-400 mb-2">Sections Affected</div>
                  <div className="flex flex-wrap gap-2">
                    {results.sectionsAffected.map((section, i) => (
                      <span key={i} className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm font-medium border border-violet-500/30">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-zinc-400 mb-2">Regulatory Impact</div>
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(results.regulatoryImpact)}`}>
                    {results.regulatoryImpact.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Complicated Variation Diff */}
            {results.classification === 'complicated' && results.diff && (
              <>
                {/* Summary */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-4">Change Summary</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="text-2xl font-bold text-white mb-1">{results.diff.summary.totalSections}</div>
                      <div className="text-sm text-zinc-400">Total Sections</div>
                    </div>
                    <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/30">
                      <div className="text-2xl font-bold text-rose-400 mb-1">{results.diff.summary.criticalChanges}</div>
                      <div className="text-sm text-rose-400">Critical Changes</div>
                    </div>
                    <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                      <div className="text-2xl font-bold text-amber-400 mb-1">{results.diff.summary.majorChanges}</div>
                      <div className="text-sm text-amber-400">Major Changes</div>
                    </div>
                  </div>
                </div>

                {/* Section-by-Section Diff */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-4">Section-by-Section Diff</h2>
                  <div className="space-y-4">
                    {results.diff.sections.map((section, i) => (
                      <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-bold text-white">{section.sectionName}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(section.changeType)}`}>
                            {section.changeType}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {section.oldContent && (
                            <div>
                              <div className="text-xs text-zinc-500 mb-1">OLD CONTENT</div>
                              <div className="text-sm text-rose-400 bg-rose-500/10 rounded-lg p-3 border border-rose-500/20 font-mono">
                                {section.oldContent}
                              </div>
                            </div>
                          )}

                          {section.newContent && (
                            <div>
                              <div className="text-xs text-zinc-500 mb-1">NEW CONTENT</div>
                              <div className="text-sm text-emerald-400 bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/20 font-mono">
                                {section.newContent}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-xs text-zinc-500 mb-1">REGULATORY IMPACT</div>
                            <div className="text-sm text-white bg-white/5 rounded-lg p-3 border border-white/10">
                              {section.regulatoryImpact}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span>📊 {section.changesCount} changes detected</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-4">Recommended Actions</h2>
                  <div className="space-y-3">
                    {results.diff.recommendedActions.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 text-white">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-violet-400">{i + 1}</span>
                        </div>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 py-4 px-6 rounded-xl font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
              >
                Start New Variation
              </button>
              <button
                className="flex-1 py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25"
              >
                Download {results.classification === 'complicated' ? 'Diff Report' : 'Revision Comments'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}