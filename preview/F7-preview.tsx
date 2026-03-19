export default function F7Preview() {
  const [activeTab, setActiveTab] = React.useState('workflow');
  const [workflowState, setWorkflowState] = React.useState('extractingApprovedPil');
  const [showClassification, setShowClassification] = React.useState(false);
  const [showDiff, setShowDiff] = React.useState(false);

  const workflowSteps = [
    { id: 'extractingApprovedPil', label: 'Extract Approved PIL', progress: 20, status: 'complete' },
    { id: 'extractingChangeTrigger', label: 'Extract Change Trigger', progress: 40, status: workflowState === 'extractingChangeTrigger' ? 'active' : workflowState === 'classifying' || workflowState === 'generatingDiff' || workflowState === 'complete' ? 'complete' : 'pending' },
    { id: 'classifying', label: 'Classify Variation Type', progress: 60, status: workflowState === 'classifying' ? 'active' : workflowState === 'generatingDiff' || workflowState === 'complete' ? 'complete' : 'pending' },
    { id: 'generatingDiff', label: 'Generate Analysis', progress: 80, status: workflowState === 'generatingDiff' ? 'active' : workflowState === 'complete' ? 'complete' : 'pending' },
    { id: 'complete', label: 'Complete', progress: 100, status: workflowState === 'complete' ? 'complete' : 'pending' },
  ];

  const currentStep = workflowSteps.find(s => s.id === workflowState) || workflowSteps[0];

  const classification = {
    type: 'complicated',
    confidence: 0.92,
    rationale: 'Safety-critical sections modified: Warnings and Precautions, Adverse Reactions. Multiple substantive content changes detected affecting patient safety information. Requires full regulatory review cycle.',
    sectionsAffected: ['Warnings and Precautions', 'Adverse Reactions', 'Drug Interactions'],
    changeTypes: {
      contentChanges: 12,
      formattingChanges: 3,
      safetyUpdates: 5,
      dosageChanges: 0,
      indicationChanges: 2,
    },
    regulatoryImpact: 'high',
  };

  const diffSections = [
    {
      sectionName: 'Warnings and Precautions',
      changes: [
        {
          type: 'modified',
          before: 'Patients with severe hepatic impairment should use with caution.',
          after: 'Patients with severe hepatic impairment (Child-Pugh Class C) are contraindicated. Use with extreme caution in moderate impairment (Child-Pugh Class B).',
          severity: 'high',
          category: 'safety',
        },
        {
          type: 'added',
          after: 'New warning: Risk of QT prolongation in patients with cardiac conditions. ECG monitoring recommended.',
          severity: 'high',
          category: 'safety',
        },
      ],
    },
    {
      sectionName: 'Adverse Reactions',
      changes: [
        {
          type: 'modified',
          before: 'Common (1-10%): Headache, nausea, dizziness',
          after: 'Common (1-10%): Headache, nausea, dizziness, fatigue\nUncommon (0.1-1%): Cardiac arrhythmias, QT prolongation',
          severity: 'high',
          category: 'safety',
        },
      ],
    },
    {
      sectionName: 'Drug Interactions',
      changes: [
        {
          type: 'added',
          after: 'Contraindicated with Class IA and III antiarrhythmics due to increased risk of QT prolongation.',
          severity: 'high',
          category: 'safety',
        },
      ],
    },
  ];

  const auditLogs = [
    { timestamp: '2024-01-15 14:32:15', action: 'Workflow Started', user: 'Dr. Somchai Prasert', details: 'PIL Variation WF-2024-0156' },
    { timestamp: '2024-01-15 14:32:18', action: 'Extraction Completed', user: 'System', details: 'Approved PIL - Claude Opus - 2.8s - 94% confidence' },
    { timestamp: '2024-01-15 14:32:22', action: 'Extraction Completed', user: 'System', details: 'Change Trigger - Claude Opus - 3.1s - 91% confidence' },
    { timestamp: '2024-01-15 14:32:28', action: 'Classification Completed', user: 'System', details: 'Type: Complicated - Confidence: 92% - 3 sections affected' },
    { timestamp: '2024-01-15 14:32:35', action: 'Diff Generation In Progress', user: 'System', details: 'Analyzing 3 sections with 5 changes' },
  ];

  React.useEffect(() => {
    if (workflowState === 'extractingApprovedPil') {
      const timer = setTimeout(() => setWorkflowState('extractingChangeTrigger'), 2000);
      return () => clearTimeout(timer);
    }
    if (workflowState === 'extractingChangeTrigger') {
      const timer = setTimeout(() => setWorkflowState('classifying'), 2000);
      return () => clearTimeout(timer);
    }
    if (workflowState === 'classifying') {
      const timer = setTimeout(() => {
        setWorkflowState('generatingDiff');
        setShowClassification(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (workflowState === 'generatingDiff') {
      const timer = setTimeout(() => {
        setWorkflowState('complete');
        setShowDiff(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [workflowState]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/20">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">PIL Variation Workflow</h1>
                <p className="text-sm text-zinc-400">WF-2024-0156 • Paracetamol 500mg • Thailand FDA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></div>
                <span className="text-sm font-medium text-violet-300">Processing</span>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Progress</div>
                <div className="text-lg font-bold text-white">{currentStep.progress}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-zinc-800/30 p-1.5 rounded-2xl border border-white/5">
          {['workflow', 'classification', 'diff', 'audit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab === 'workflow' && '🔄 Workflow'}
              {tab === 'classification' && '🎯 Classification'}
              {tab === 'diff' && '📊 Diff Analysis'}
              {tab === 'audit' && '📋 Audit Log'}
            </button>
          ))}
        </div>

        {/* Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-zinc-300">{currentStep.label}</span>
                  <span className="text-sm font-bold text-violet-400">{currentStep.progress}%</span>
                </div>
                <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500 rounded-full"
                    style={{ width: `${currentStep.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="grid gap-4">
              {workflowSteps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`bg-zinc-800/50 rounded-2xl p-5 border transition-all ${
                    step.status === 'complete'
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : step.status === 'active'
                      ? 'border-violet-500/30 bg-violet-500/5'
                      : 'border-white/[0.06]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
                        step.status === 'complete'
                          ? 'bg-emerald-500 text-white'
                          : step.status === 'active'
                          ? 'bg-violet-500 text-white animate-pulse'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {step.status === 'complete' ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-white">{step.label}</h3>
                        {step.status === 'complete' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Complete
                          </span>
                        )}
                        {step.status === 'active' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"></span>
                            Processing
                          </span>
                        )}
                      </div>
                      {step.status === 'active' && (
                        <div className="mt-3">
                          <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                          </div>
                        </div>
                      )}
                      {step.status === 'complete' && step.id === 'extractingApprovedPil' && (
                        <p className="text-sm text-zinc-400 mt-2">
                          ✓ Extracted 8 sections • Claude Opus • 2.8s • 94% confidence
                        </p>
                      )}
                      {step.status === 'complete' && step.id === 'extractingChangeTrigger' && (
                        <p className="text-sm text-zinc-400 mt-2">
                          ✓ Extracted 8 sections • Claude Opus • 3.1s • 91% confidence
                        </p>
                      )}
                      {step.status === 'complete' && step.id === 'classifying' && (
                        <p className="text-sm text-zinc-400 mt-2">
                          ✓ Classified as <span className="text-amber-400 font-semibold">Complicated</span> • 92% confidence • 3 sections affected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Document Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">
                    📄
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Approved PIL</h3>
                    <p className="text-xs text-zinc-500">DOC-2023-1245</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Product:</span>
                    <span className="text-white font-medium">Paracetamol 500mg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Version:</span>
                    <span className="text-white font-medium">v3.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Approved:</span>
                    <span className="text-white font-medium">2023-08-15</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 text-xl">
                    📋
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Change Trigger</h3>
                    <p className="text-xs text-zinc-500">DOC-2024-0089</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Type:</span>
                    <span className="text-white font-medium">Regulatory Announcement</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Source:</span>
                    <span className="text-white font-medium">Thailand FDA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Received:</span>
                    <span className="text-white font-medium">2024-01-10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Classification Tab */}
        {activeTab === 'classification' && (
          <div className="space-y-6">
            {showClassification ? (
              <>
                {/* Classification Result */}
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-6 border border-amber-500/20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-white text-3xl shadow-lg shadow-amber-500/20">
                      ⚠️
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-white">Complicated Variation</h2>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-sm font-medium">
                          High Impact
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">Confidence:</span>
                          <span className="font-bold text-amber-400">{(classification.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-400">Sections Affected:</span>
                          <span className="font-bold text-white">{classification.sectionsAffected.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                    <h3 className="text-sm font-semibold text-zinc-300 mb-2">Rationale</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{classification.rationale}</p>
                  </div>
                </div>

                {/* Change Types */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                  <h3 className="text-lg font-bold text-white mb-4">Change Analysis</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(classification.changeTypes).map(([key, value]) => (
                      <div key={key} className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                        <div className="text-3xl font-bold text-white mb-1">{value}</div>
                        <div className="text-xs text-zinc-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Affected Sections */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                  <h3 className="text-lg font-bold text-white mb-4">Affected Sections</h3>
                  <div className="space-y-2">
                    {classification.sectionsAffected.map((section, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-sm">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-white">{section}</span>
                        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-medium">
                          Safety Critical
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendation */}
                <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-2xl p-6 border border-violet-500/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500 flex items-center justify-center text-white text-2xl">
                      💡
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">Recommended Action</h3>
                      <p className="text-sm text-zinc-300 mb-3">
                        This variation requires a <span className="font-semibold text-violet-400">new Draft PIL</span> and full regulatory approval cycle due to safety-critical changes.
                      </p>
                      <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-xl bg-violet-500 text-white font-semibold text-sm hover:bg-violet-600 transition-colors">
                          Generate Section Diff
                        </button>
                        <button className="px-4 py-2 rounded-xl bg-white/5 text-white font-semibold text-sm hover:bg-white/10 transition-colors border border-white/10">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-zinc-800/50 rounded-2xl p-12 border border-white/[0.06] text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-700 mx-auto mb-4 flex items-center justify-center text-3xl animate-pulse">
                  🎯
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Classification Pending</h3>
                <p className="text-sm text-zinc-400">Waiting for extraction to complete...</p>
              </div>
            )}
          </div>
        )}

        {/* Diff Tab */}
        {activeTab === 'diff' && (
          <div className="space-y-6">
            {showDiff ? (
              <>
                {/* Summary */}
                <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                  <h3 className="text-lg font-bold text-white mb-4">Diff Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                      <div className="text-3xl font-bold text-white mb-1">3</div>
                      <div className="text-xs text-zinc-400">Sections Changed</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                      <div className="text-3xl font-bold text-amber-400 mb-1">5</div>
                      <div className="text-xs text-zinc-400">Total Changes</div>
                    </div>
                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                      <div className="text-3xl font-bold text-rose-400 mb-1">5</div>
                      <div className="text-xs text-zinc-400">Safety Updates</div>
                    </div>
                  </div>
                </div>

                {/* Section Diffs */}
                {diffSections.map((section, idx) => (
                  <div key={idx} className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">{section.sectionName}</h3>
                        <p className="text-xs text-zinc-500">{section.changes.length} changes detected</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-medium">
                        High Severity
                      </span>
                    </div>

                    <div className="space-y-4">
                      {section.changes.map((change, changeIdx) => (
                        <div key={changeIdx} className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                          <div className="flex items-center gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              change.type === 'added' ? 'bg-emerald-500/20 text-emerald-400' :
                              change.type === 'modified' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-rose-500/20 text-rose-400'
                            }`}>
                              {change.type === 'added' ? '+ Added' : change.type === 'modified' ? '~ Modified' : '- Deleted'}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-medium">
                              Safety Critical
                            </span>
                          </div>

                          {change.before && (
                            <div className="mb-3">
                              <div className="text-xs font-semibold text-zinc-500 mb-1">BEFORE:</div>
                              <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-3 text-sm text-zinc-300 leading-relaxed">
                                {change.before}
                              </div>
                            </div>
                          )}

                          {change.after && (
                            <div>
                              <div className="text-xs font-semibold text-zinc-500 mb-1">AFTER:</div>
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-sm text-zinc-300 leading-relaxed">
                                {change.after}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="bg-zinc-800/50 rounded-2xl p-12 border border-white/[0.06] text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-700 mx-auto mb-4 flex items-center justify-center text-3xl animate-pulse">
                  📊
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Diff Analysis Pending</h3>
                <p className="text-sm text-zinc-400">Waiting for classification to complete...</p>
              </div>
            )}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
              <h3 className="text-lg font-bold text-white mb-4">Workflow Audit Trail</h3>
              <div className="space-y-3">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 bg-zinc-900/50 rounded-xl border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold text-sm flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-white">{log.action}</span>
                        <span className="text-xs text-zinc-500">{log.timestamp}</span>
                      </div>
                      <div className="text-sm text-zinc-400 mb-1">{log.details}</div>
                      <div className="text-xs text-zinc-500">by {log.user}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}