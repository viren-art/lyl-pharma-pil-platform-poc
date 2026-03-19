import { useState, useEffect } from 'react';

export default function AWReviewPage() {
  const [step, setStep] = useState('select'); // select, processing, results
  const [selectedAWDraft, setSelectedAWDraft] = useState(null);
  const [selectedApprovedPIL, setSelectedApprovedPIL] = useState(null);
  const [workflowId, setWorkflowId] = useState(null);
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [deviationReport, setDeviationReport] = useState(null);
  const [selectedDeviation, setSelectedDeviation] = useState(null);
  const [checklist, setChecklist] = useState({
    criticalReviewed: false,
    majorReviewed: false,
    minorReviewed: false,
    pharmaceuticalVerified: false,
    mandatorySectionsChecked: false,
    formattingVerified: false,
    regulatoryCompliance: false,
    managerSignoff: false
  });

  // Mock documents
  const awDrafts = [
    {
      id: 1,
      fileName: 'Paracetamol_500mg_AW_Draft_v2.pdf',
      productName: 'Paracetamol 500mg',
      market: 'Taiwan',
      uploadDate: '2024-01-15'
    },
    {
      id: 2,
      fileName: 'Ibuprofen_400mg_AW_Draft_v1.pdf',
      productName: 'Ibuprofen 400mg',
      market: 'Thailand',
      uploadDate: '2024-01-14'
    }
  ];

  const approvedPILs = [
    {
      id: 3,
      fileName: 'Paracetamol_500mg_Approved_PIL_2023.pdf',
      productName: 'Paracetamol 500mg',
      market: 'Taiwan',
      approvalDate: '2023-12-01'
    },
    {
      id: 4,
      fileName: 'Ibuprofen_400mg_Approved_PIL_2023.pdf',
      productName: 'Ibuprofen 400mg',
      market: 'Thailand',
      approvalDate: '2023-11-15'
    }
  ];

  const handleInitiateReview = async () => {
    if (!selectedAWDraft || !selectedApprovedPIL) {
      alert('Please select both AW Draft and Approved PIL');
      return;
    }

    setStep('processing');

    // Mock API call
    const mockWorkflowId = Math.floor(Math.random() * 1000);
    setWorkflowId(mockWorkflowId);

    // Simulate workflow progress
    setTimeout(() => {
      setWorkflowStatus({
        status: 'Extracting',
        progress: { currentStep: 'Extracting AW Draft', percentComplete: 33 }
      });
    }, 1000);

    setTimeout(() => {
      setWorkflowStatus({
        status: 'Comparing',
        progress: { currentStep: 'Detecting deviations', percentComplete: 66 }
      });
    }, 3000);

    setTimeout(() => {
      setWorkflowStatus({
        status: 'Complete',
        progress: { currentStep: 'Workflow complete', percentComplete: 100 }
      });

      // Mock deviation report
      setDeviationReport({
        deviations: [
          {
            id: 1,
            sectionName: 'Dosage and Administration',
            severity: 'Critical',
            description: 'Dosage mismatch: Approved PIL states "500mg every 6 hours" but AW Draft shows "500mg every 4 hours"',
            pageReference: 3,
            approvedText: 'Adults and children over 12 years: 500mg every 6 hours. Maximum daily dose: 4000mg.',
            awText: 'Adults and children over 12 years: 500mg every 4 hours. Maximum daily dose: 4000mg.',
            changeType: 'Modified'
          },
          {
            id: 2,
            sectionName: 'Contraindications',
            severity: 'Critical',
            description: 'Missing contraindication: "Severe hepatic impairment" not mentioned in AW Draft',
            pageReference: 4,
            approvedText: 'Contraindicated in patients with severe hepatic impairment, hypersensitivity to paracetamol.',
            awText: 'Contraindicated in patients with hypersensitivity to paracetamol.',
            changeType: 'Missing'
          },
          {
            id: 3,
            sectionName: 'Warnings and Precautions',
            severity: 'Major',
            description: 'Warning text modified: "Liver damage" changed to "Hepatic dysfunction"',
            pageReference: 5,
            approvedText: 'Prolonged use may cause liver damage. Monitor liver function in patients with hepatic impairment.',
            awText: 'Prolonged use may cause hepatic dysfunction. Monitor liver function in patients with hepatic impairment.',
            changeType: 'Modified'
          },
          {
            id: 4,
            sectionName: 'Storage',
            severity: 'Minor',
            description: 'Temperature range formatting: "25°C" vs "25 °C" (spacing difference)',
            pageReference: 8,
            approvedText: 'Store below 25°C in a dry place.',
            awText: 'Store below 25 °C in a dry place.',
            changeType: 'Modified'
          },
          {
            id: 5,
            sectionName: 'Adverse Reactions',
            severity: 'Major',
            description: 'Missing adverse reaction: "Thrombocytopenia" not listed in AW Draft',
            pageReference: 6,
            approvedText: 'Common: Nausea, vomiting. Rare: Thrombocytopenia, agranulocytosis, hepatotoxicity.',
            awText: 'Common: Nausea, vomiting. Rare: Agranulocytosis, hepatotoxicity.',
            changeType: 'Missing'
          }
        ],
        summary: {
          totalDeviations: 5,
          criticalCount: 2,
          majorCount: 2,
          minorCount: 1
        },
        downloadUrl: 'https://storage.googleapis.com/pil-lens/reports/deviation-report-123.pdf'
      });

      setStep('results');
    }, 5000);
  };

  const getSeverityColor = (severity) => {
    const colors = {
      Critical: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      Major: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      Minor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    };
    return colors[severity] || 'bg-zinc-700 text-zinc-300';
  };

  const getSeverityIcon = (severity) => {
    const icons = {
      Critical: '🚨',
      Major: '⚠️',
      Minor: 'ℹ️'
    };
    return icons[severity] || '•';
  };

  const handleChecklistToggle = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const checklistProgress = Object.values(checklist).filter(Boolean).length;
  const checklistTotal = Object.keys(checklist).length;
  const checklistPercent = Math.round((checklistProgress / checklistTotal) * 100);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">AW Review Workflow</h1>
              <p className="text-sm text-zinc-400 mt-1">
                Compare AW Draft against Approved PIL to detect deviations
              </p>
            </div>
            {workflowId && (
              <div className="text-right">
                <div className="text-xs text-zinc-500">Workflow ID</div>
                <div className="text-sm font-mono text-violet-400">#{workflowId}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          <div className={`flex items-center space-x-2 ${step === 'select' ? 'text-violet-400' : 'text-zinc-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'select' ? 'bg-violet-500/20 border-2 border-violet-500' : 'bg-zinc-800 border border-zinc-700'}`}>
              1
            </div>
            <span className="text-sm font-medium">Select Documents</span>
          </div>
          <div className="w-16 h-px bg-zinc-700"></div>
          <div className={`flex items-center space-x-2 ${step === 'processing' ? 'text-violet-400' : 'text-zinc-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'processing' ? 'bg-violet-500/20 border-2 border-violet-500' : 'bg-zinc-800 border border-zinc-700'}`}>
              2
            </div>
            <span className="text-sm font-medium">Processing</span>
          </div>
          <div className="w-16 h-px bg-zinc-700"></div>
          <div className={`flex items-center space-x-2 ${step === 'results' ? 'text-violet-400' : 'text-zinc-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'results' ? 'bg-violet-500/20 border-2 border-violet-500' : 'bg-zinc-800 border border-zinc-700'}`}>
              3
            </div>
            <span className="text-sm font-medium">Review Results</span>
          </div>
        </div>

        {/* Step 1: Document Selection */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* AW Draft Selection */}
              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                <h2 className="text-lg font-bold text-white mb-4">Select AW Draft</h2>
                <div className="space-y-3">
                  {awDrafts.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedAWDraft(doc)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedAWDraft?.id === doc.id
                          ? 'bg-violet-500/20 border-2 border-violet-500'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{doc.fileName}</div>
                          <div className="text-xs text-zinc-400 mt-1">{doc.productName}</div>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-xs text-zinc-500">📍 {doc.market}</span>
                            <span className="text-xs text-zinc-500">📅 {doc.uploadDate}</span>
                          </div>
                        </div>
                        {selectedAWDraft?.id === doc.id && (
                          <div className="text-violet-400">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved PIL Selection */}
              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                <h2 className="text-lg font-bold text-white mb-4">Select Approved PIL</h2>
                <div className="space-y-3">
                  {approvedPILs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedApprovedPIL(doc)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        selectedApprovedPIL?.id === doc.id
                          ? 'bg-emerald-500/20 border-2 border-emerald-500'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">{doc.fileName}</div>
                          <div className="text-xs text-zinc-400 mt-1">{doc.productName}</div>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-xs text-zinc-500">📍 {doc.market}</span>
                            <span className="text-xs text-zinc-500">✅ {doc.approvalDate}</span>
                          </div>
                        </div>
                        {selectedApprovedPIL?.id === doc.id && (
                          <div className="text-emerald-400">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={handleInitiateReview}
                disabled={!selectedAWDraft || !selectedApprovedPIL}
                className={`px-8 py-4 rounded-xl font-semibold text-white transition-all ${
                  selectedAWDraft && selectedApprovedPIL
                    ? 'bg-violet-500 hover:bg-violet-600 active:bg-violet-700 shadow-lg shadow-violet-500/20'
                    : 'bg-zinc-700 cursor-not-allowed opacity-50'
                }`}
              >
                Start AW Review
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Processing */}
        {step === 'processing' && workflowStatus && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-zinc-800/50 rounded-2xl p-8 border border-white/[0.06]">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/20 mb-4">
                  <div className="animate-spin text-3xl">⚙️</div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{workflowStatus.progress.currentStep}</h2>
                <p className="text-sm text-zinc-400">Please wait while we analyze the documents...</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-zinc-400 mb-2">
                  <span>Progress</span>
                  <span>{workflowStatus.progress.percentComplete}%</span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${workflowStatus.progress.percentComplete}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Steps */}
              <div className="space-y-3">
                <div className={`flex items-center space-x-3 ${workflowStatus.progress.percentComplete >= 33 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  <div className="text-xl">{workflowStatus.progress.percentComplete >= 33 ? '✓' : '○'}</div>
                  <span className="text-sm">Extracting AW Draft</span>
                </div>
                <div className={`flex items-center space-x-3 ${workflowStatus.progress.percentComplete >= 66 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  <div className="text-xl">{workflowStatus.progress.percentComplete >= 66 ? '✓' : '○'}</div>
                  <span className="text-sm">Extracting Approved PIL</span>
                </div>
                <div className={`flex items-center space-x-3 ${workflowStatus.progress.percentComplete >= 100 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                  <div className="text-xl">{workflowStatus.progress.percentComplete >= 100 ? '✓' : '○'}</div>
                  <span className="text-sm">Detecting Deviations</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && deviationReport && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
                <div className="text-xs text-zinc-400 mb-1">Total Deviations</div>
                <div className="text-3xl font-bold text-white">{deviationReport.summary.totalDeviations}</div>
              </div>
              <div className="bg-rose-500/10 rounded-2xl p-5 border border-rose-500/20">
                <div className="text-xs text-rose-400 mb-1">Critical</div>
                <div className="text-3xl font-bold text-rose-400">{deviationReport.summary.criticalCount}</div>
              </div>
              <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20">
                <div className="text-xs text-amber-400 mb-1">Major</div>
                <div className="text-3xl font-bold text-amber-400">{deviationReport.summary.majorCount}</div>
              </div>
              <div className="bg-cyan-500/10 rounded-2xl p-5 border border-cyan-500/20">
                <div className="text-xs text-cyan-400 mb-1">Minor</div>
                <div className="text-3xl font-bold text-cyan-400">{deviationReport.summary.minorCount}</div>
              </div>
            </div>

            {/* Review Checklist */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Review Checklist</h3>
                <div className="flex items-center space-x-2">
                  <div className="text-sm text-zinc-400">{checklistProgress}/{checklistTotal} completed</div>
                  <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${checklistPercent}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => handleChecklistToggle('criticalReviewed')}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    checklist.criticalReviewed ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      checklist.criticalReviewed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
                      {checklist.criticalReviewed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-white">All critical deviations reviewed</span>
                  </div>
                </div>
                <div
                  onClick={() => handleChecklistToggle('majorReviewed')}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    checklist.majorReviewed ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      checklist.majorReviewed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
                      {checklist.majorReviewed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-white">All major deviations reviewed</span>
                  </div>
                </div>
                <div
                  onClick={() => handleChecklistToggle('minorReviewed')}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    checklist.minorReviewed ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      checklist.minorReviewed ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
                      {checklist.minorReviewed && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-white">Minor deviations reviewed</span>
                  </div>
                </div>
                <div
                  onClick={() => handleChecklistToggle('pharmaceuticalVerified')}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    checklist.pharmaceuticalVerified ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      checklist.pharmaceuticalVerified ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
                      {checklist.pharmaceuticalVerified && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-white">Pharmaceutical content verified</span>
                  </div>
                </div>
                <div
                  onClick={() => handleChecklistToggle('mandatorySectionsChecked')}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    checklist.mandatorySectionsChecked ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      checklist.mandatorySectionsChecked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
                      {checklist.mandatorySectionsChecked && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-white">Mandatory sections present</span>
                  </div>
                </div>
                <div
                  onClick={() => handleChecklistToggle('formattingVerified')}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    checklist.formattingVerified ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      checklist.formattingVerified ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
                      {checklist.formattingVerified && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-white">Formatting consistency verified</span>
                  </div>
                </div>
                <div
                  onClick={() => handleChecklistToggle('regulatoryCompliance')}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    checklist.regulatoryCompliance ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      checklist.regulatoryCompliance ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
                      {checklist.regulatoryCompliance && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-white">Regulatory compliance confirmed</span>
                  </div>
                </div>
                <div
                  onClick={() => handleChecklistToggle('managerSignoff')}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    checklist.managerSignoff ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      checklist.managerSignoff ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-600'
                    }`}>
                      {checklist.managerSignoff && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className="text-sm text-white">RA Manager sign-off obtained</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <a
                href={deviationReport.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 rounded-xl font-semibold text-white transition-all shadow-lg shadow-violet-500/20"
              >
                <span>📄</span>
                <span>Export PDF Report</span>
              </a>
            </div>

            {/* Deviations List */}
            <div className="grid grid-cols-3 gap-6">
              {/* Deviation List */}
              <div className="col-span-1 space-y-3">
                <h3 className="text-sm font-bold text-white mb-3">Deviations ({deviationReport.deviations.length})</h3>
                {deviationReport.deviations.map((deviation) => (
                  <div
                    key={deviation.id}
                    onClick={() => setSelectedDeviation(deviation)}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      selectedDeviation?.id === deviation.id
                        ? 'bg-violet-500/20 border-2 border-violet-500'
                        : 'bg-zinc-800/50 border border-white/[0.06] hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(deviation.severity)}`}>
                        <span>{getSeverityIcon(deviation.severity)}</span>
                        <span>{deviation.severity}</span>
                      </span>
                      <span className="text-xs text-zinc-500">Page {deviation.pageReference}</span>
                    </div>
                    <div className="text-sm font-semibold text-white mb-1">{deviation.sectionName}</div>
                    <div className="text-xs text-zinc-400 line-clamp-2">{deviation.description}</div>
                  </div>
                ))}
              </div>

              {/* Deviation Detail */}
              <div className="col-span-2">
                {selectedDeviation ? (
                  <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06]">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">{selectedDeviation.sectionName}</h3>
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedDeviation.severity)}`}>
                          <span>{getSeverityIcon(selectedDeviation.severity)}</span>
                          <span>{selectedDeviation.severity}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-zinc-500">Page Reference</div>
                        <div className="text-sm font-mono text-violet-400">{selectedDeviation.pageReference}</div>
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

                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs text-zinc-500">Change Type: <span className="text-zinc-300 font-medium">{selectedDeviation.changeType}</span></div>
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