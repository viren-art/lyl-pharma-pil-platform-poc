import { useState } from 'react';

export default function F7Preview() {
  const [activeView, setActiveView] = useState('workflow'); // workflow, classification, diff
  const [workflowStep, setWorkflowStep] = useState('select'); // select, processing, results
  const [selectedApprovedPil, setSelectedApprovedPil] = useState(null);
  const [selectedChangeTrigger, setSelectedChangeTrigger] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  const approvedPils = [
    { id: 1, name: 'Paracetamol 500mg PIL - Taiwan TFDA', market: 'Taiwan', approved: '2024-01-15', version: 'v2.1' },
    { id: 2, name: 'Ibuprofen 400mg PIL - Thailand FDA', market: 'Thailand', approved: '2023-12-20', version: 'v1.8' },
    { id: 3, name: 'Amoxicillin 250mg PIL - Vietnam DAV', market: 'Vietnam', approved: '2024-02-10', version: 'v3.0' },
  ];

  const changeTriggers = [
    { id: 101, name: 'TFDA Regulatory Announcement - Paracetamol Dosage Update', type: 'Regulatory', date: '2024-03-01', impact: 'High' },
    { id: 102, name: 'Updated Innovator PIL - Paracetamol (US FDA)', type: 'Innovator', date: '2024-02-28', impact: 'Medium' },
    { id: 103, name: 'Commercial AW - Paracetamol Revision Comments', type: 'Commercial AW', date: '2024-03-05', impact: 'Low' },
  ];

  const classificationResult = {
    type: 'complicated',
    confidence: 0.92,
    rationale: 'Multiple sections affected with safety-critical dosage changes. TFDA regulatory announcement requires updates to Dosage and Administration, Warnings and Precautions, and Adverse Reactions sections. Changes affect patient safety information and require full regulatory review cycle.',
    sectionsAffected: ['Dosage and Administration', 'Warnings and Precautions', 'Adverse Reactions'],
    regulatoryImpact: 'high',
    changeTypes: {
      contentChanges: 5,
      formattingChanges: 1,
      safetyUpdates: 3,
      dosageChanges: 2,
      indicationChanges: 0,
    },
  };

  const diffSections = [
    {
      sectionName: 'Dosage and Administration',
      changeType: 'Modified',
      oldContent: 'Adults and children over 12 years: 500-1000mg every 4-6 hours as needed. Maximum daily dose: 4000mg. Do not exceed 8 tablets in 24 hours.',
      newContent: 'Adults and children over 12 years: 500-1000mg every 4-6 hours as needed. Maximum daily dose: 3000mg (reduced from 4000mg). Do not exceed 6 tablets in 24 hours.',
      regulatoryImpact: 'CRITICAL: Maximum daily dose reduced from 4000mg to 3000mg per TFDA safety update. This is a safety-critical change requiring regulatory approval and prominent display in PIL.',
      changesCount: 3,
      severity: 'critical',
    },
    {
      sectionName: 'Warnings and Precautions',
      changeType: 'Modified',
      oldContent: 'Do not exceed recommended dose. Prolonged use may cause liver damage. Consult doctor if symptoms persist.',
      newContent: 'Do not exceed recommended dose. NEW WARNING: Risk of severe liver damage at doses above 3000mg/day. Patients with liver disease should not exceed 2000mg/day. Consult doctor if symptoms persist.',
      regulatoryImpact: 'MAJOR: New safety warning added per regulatory requirement. Requires prominent display and patient counseling emphasis.',
      changesCount: 2,
      severity: 'major',
    },
    {
      sectionName: 'Adverse Reactions',
      changeType: 'Modified',
      oldContent: 'Common (1-10%): nausea, stomach pain, headache. Rare (<1%): allergic reactions, skin rash.',
      newContent: 'Common (1-10%): nausea, stomach pain, headache. Rare (<1%): allergic reactions, skin rash, severe liver damage (at high doses).',
      regulatoryImpact: 'MAJOR: Updated adverse reaction profile to include liver damage risk at high doses.',
      changesCount: 1,
      severity: 'major',
    },
  ];

  const handleStartProcessing = () => {
    if (!selectedApprovedPil || !selectedChangeTrigger) return;
    setWorkflowStep('processing');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      setProcessingProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setWorkflowStep('results');
          setActiveView('classification');
        }, 500);
      }
    }, 800);
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
      Modified: 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
      Added: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      Deleted: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    };
    return colors[type] || colors.Modified;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                <span className="text-2xl">🔄</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">PIL Variation Workflow</h1>
                <p className="text-sm text-zinc-400 mt-1">Automated variation classification and diff generation</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('workflow')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeView === 'workflow'
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                Workflow
              </button>
              <button
                onClick={() => setActiveView('classification')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeView === 'classification'
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                Classification
              </button>
              <button
                onClick={() => setActiveView('diff')}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  activeView === 'diff'
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10'
                }`}
              >
                Diff View
              </button>
            </div>
          </div>
        </div>

        {/* Workflow View */}
        {activeView === 'workflow' && (
          <div className="space-y-6">
            {/* Progress Steps */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-3 ${workflowStep === 'select' ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${workflowStep === 'select' ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'}`}>1</div>
                  <span className="text-sm font-medium text-white">Select Documents</span>
                </div>
                <div className="flex-1 h-0.5 bg-white/10 mx-4"></div>
                <div className={`flex items-center gap-3 ${workflowStep === 'processing' ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${workflowStep === 'processing' ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'}`}>2</div>
                  <span className="text-sm font-medium text-white">Processing</span>
                </div>
                <div className="flex-1 h-0.5 bg-white/10 mx-4"></div>
                <div className={`flex items-center gap-3 ${workflowStep === 'results' ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${workflowStep === 'results' ? 'bg-violet-500 text-white' : 'bg-white/10 text-zinc-400'}`}>3</div>
                  <span className="text-sm font-medium text-white">Results</span>
                </div>
              </div>
            </div>

            {workflowStep === 'select' && (
              <>
                {/* Approved PIL Selection */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h2 className="text-xl font-bold text-white mb-4">Select Approved PIL</h2>
                  <div className="space-y-3">
                    {approvedPils.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedApprovedPil(doc)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedApprovedPil?.id === doc.id
                            ? 'bg-violet-500/20 border-violet-500/50 shadow-lg shadow-violet-500/10'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{doc.name}</div>
                            <div className="text-sm text-zinc-400 mt-1">
                              {doc.market} • Approved {doc.approved} • {doc.version}
                            </div>
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
                  <h2 className="text-xl font-bold text-white mb-4">Select Change Trigger</h2>
                  <div className="space-y-3">
                    {changeTriggers.map(doc => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedChangeTrigger(doc)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedChangeTrigger?.id === doc.id
                            ? 'bg-violet-500/20 border-violet-500/50 shadow-lg shadow-violet-500/10'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-white">{doc.name}</div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-zinc-400">{doc.type}</span>
                              <span className="text-xs text-zinc-500">{doc.date}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                doc.impact === 'High' ? 'bg-rose-500/20 text-rose-400' :
                                doc.impact === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-cyan-500/20 text-cyan-400'
                              }`}>
                                {doc.impact} Impact
                              </span>
                            </div>
                          </div>
                          {selectedChangeTrigger?.id === doc.id && (
                            <div className="text-2xl">✅</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartProcessing}
                  disabled={!selectedApprovedPil || !selectedChangeTrigger}
                  className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25"
                >
                  Start Variation Analysis
                </button>
              </>
            )}

            {workflowStep === 'processing' && (
              <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-500/20 mb-4 animate-pulse">
                    <span className="text-4xl">⚙️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Analyzing Variation</h2>
                  <p className="text-zinc-400">Extracting documents and classifying changes...</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-400">Progress</span>
                    <span className="text-sm font-bold text-violet-400">{processingProgress}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-purple-600 transition-all duration-500"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-zinc-400">
                  <div className={processingProgress >= 20 ? 'text-emerald-400' : ''}>✓ Extracting Approved PIL</div>
                  <div className={processingProgress >= 40 ? 'text-emerald-400' : ''}>✓ Extracting Change Trigger</div>
                  <div className={processingProgress >= 60 ? 'text-emerald-400' : ''}>✓ Classifying Variation Type</div>
                  <div className={processingProgress >= 80 ? 'text-emerald-400' : ''}>✓ Generating Section Diff</div>
                  <div className={processingProgress >= 100 ? 'text-emerald-400' : ''}>✓ Complete</div>
                </div>
              </div>
            )}

            {workflowStep === 'results' && (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">✅</span>
                  <div>
                    <h2 className="text-xl font-bold text-emerald-400">Variation Analysis Complete</h2>
                    <p className="text-sm text-emerald-400/80 mt-1">Classification and diff generation successful</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveView('classification')}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-violet-500 hover:bg-violet-600 transition-all"
                  >
                    View Classification
                  </button>
                  <button
                    onClick={() => setActiveView('diff')}
                    className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-purple-500 hover:bg-purple-600 transition-all"
                  >
                    View Diff
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Classification View */}
        {activeView === 'classification' && (
          <div className="space-y-6">
            {/* Classification Result */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Classification Result</h2>
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${
                  classificationResult.type === 'complicated'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {classificationResult.type === 'complicated' ? '🔴' : '🟢'}
                  <span className="uppercase">{classificationResult.type}</span>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="text-sm text-zinc-400 mb-2">Confidence Score</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-600"
                        style={{ width: `${classificationResult.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-white font-bold text-lg">{(classificationResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-zinc-400 mb-2">Rationale</div>
                  <div className="text-white bg-white/5 rounded-xl p-4 border border-white/10 leading-relaxed">
                    {classificationResult.rationale}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-zinc-400 mb-2">Sections Affected ({classificationResult.sectionsAffected.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {classificationResult.sectionsAffected.map((section, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-400 text-sm font-medium border border-violet-500/30">
                        {section}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-zinc-400 mb-2">Regulatory Impact</div>
                    <div className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${getSeverityColor(classificationResult.regulatoryImpact)}`}>
                      {classificationResult.regulatoryImpact.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400 mb-2">Change Types</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-full bg-white/10 text-zinc-400 text-xs">
                        {classificationResult.changeTypes.safetyUpdates} Safety
                      </span>
                      <span className="px-2 py-1 rounded-full bg-white/10 text-zinc-400 text-xs">
                        {classificationResult.changeTypes.dosageChanges} Dosage
                      </span>
                      <span className="px-2 py-1 rounded-full bg-white/10 text-zinc-400 text-xs">
                        {classificationResult.changeTypes.contentChanges} Content
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Recommended Actions</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-white">
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-rose-400">1</span>
                  </div>
                  <span>Priority review required for critical safety changes</span>
                </div>
                <div className="flex items-start gap-3 text-white">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-violet-400">2</span>
                  </div>
                  <span>Create new Draft PIL incorporating all changes</span>
                </div>
                <div className="flex items-start gap-3 text-white">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-violet-400">3</span>
                  </div>
                  <span>Submit to regulatory authority for approval</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Diff View */}
        {activeView === 'diff' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-2xl font-bold text-white mb-1">{diffSections.length}</div>
                <div className="text-sm text-zinc-400">Sections Changed</div>
              </div>
              <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/30">
                <div className="text-2xl font-bold text-rose-400 mb-1">
                  {diffSections.filter(s => s.severity === 'critical').length}
                </div>
                <div className="text-sm text-rose-400">Critical Changes</div>
              </div>
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
                <div className="text-2xl font-bold text-amber-400 mb-1">
                  {diffSections.filter(s => s.severity === 'major').length}
                </div>
                <div className="text-sm text-amber-400">Major Changes</div>
              </div>
              <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30">
                <div className="text-2xl font-bold text-cyan-400 mb-1">
                  {diffSections.reduce((sum, s) => sum + s.changesCount, 0)}
                </div>
                <div className="text-sm text-cyan-400">Total Edits</div>
              </div>
            </div>

            {/* Section Diffs */}
            <div className="space-y-4">
              {diffSections.map((section, i) => (
                <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold text-white">{section.sectionName}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getChangeTypeColor(section.changeType)}`}>
                        {section.changeType}
                      </span>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${getSeverityColor(section.severity)}`}>
                        {section.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-rose-400">OLD CONTENT</span>
                        <div className="flex-1 h-px bg-rose-500/20"></div>
                      </div>
                      <div className="text-sm text-rose-400 bg-rose-500/10 rounded-xl p-4 border border-rose-500/20 font-mono leading-relaxed">
                        {section.oldContent}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-emerald-400">NEW CONTENT</span>
                        <div className="flex-1 h-px bg-emerald-500/20"></div>
                      </div>
                      <div className="text-sm text-emerald-400 bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 font-mono leading-relaxed">
                        {section.newContent}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-violet-400">REGULATORY IMPACT</span>
                        <div className="flex-1 h-px bg-violet-500/20"></div>
                      </div>
                      <div className="text-sm text-white bg-violet-500/10 rounded-xl p-4 border border-violet-500/20 leading-relaxed">
                        {section.regulatoryImpact}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400 pt-2">
                      <span>📊 {section.changesCount} changes detected</span>
                      <span>Requires regulatory approval</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Download Button */}
            <button className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25">
              📥 Download Complete Diff Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}