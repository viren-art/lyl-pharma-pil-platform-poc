export default function F6Preview() {
  const [activeTab, setActiveTab] = React.useState('workflow');
  const [workflowState, setWorkflowState] = React.useState('aligning_sections');
  const [showOutline, setShowOutline] = React.useState(false);
  const [selectedSection, setSelectedSection] = React.useState(null);
  const [expandedGaps, setExpandedGaps] = React.useState({});

  const workflowSteps = [
    { id: 'extracting_innovator', label: 'Extract Innovator PIL', percent: 10, status: 'complete' },
    { id: 'extracting_regulatory', label: 'Extract Regulatory Source', percent: 30, status: 'complete' },
    { id: 'aligning_sections', label: 'Align Sections', percent: 50, status: 'active' },
    { id: 'analyzing_gaps', label: 'Analyze Gaps', percent: 70, status: 'pending' },
    { id: 'generating_outline', label: 'Generate Outline', percent: 90, status: 'pending' },
    { id: 'complete', label: 'Complete', percent: 100, status: 'pending' }
  ];

  const alignments = [
    {
      innovatorSection: 'Product Name and Strength',
      regulatorySection: 'ชื่อยาและความแรง',
      confidence: 0.98,
      type: 'exact',
      notes: ['Direct match - same section purpose'],
      innovatorContent: 'PARACETAMOL 500mg Tablets\nEach tablet contains 500mg paracetamol...',
      regulatoryReq: 'Must include Thai product name, active ingredient, and strength in metric units'
    },
    {
      innovatorSection: 'What this medicine is used for',
      regulatorySection: 'ข้อบ่งใช้',
      confidence: 0.95,
      type: 'semantic',
      notes: ['Semantic match - indications section', 'Thai format requires bullet points'],
      innovatorContent: 'This medicine is used to relieve mild to moderate pain including headache...',
      regulatoryReq: 'List all approved indications in Thai language with clear formatting'
    },
    {
      innovatorSection: 'Before you take this medicine',
      regulatorySection: 'ข้อห้ามใช้และข้อควรระวัง',
      confidence: 0.87,
      type: 'partial',
      notes: ['Partial match - combines contraindications and warnings', 'May need to split into two sections'],
      innovatorContent: 'Do not take if allergic to paracetamol. Consult doctor if pregnant...',
      regulatoryReq: 'Separate contraindications and precautions with clear headers'
    },
    {
      innovatorSection: 'How to take this medicine',
      regulatorySection: 'วิธีใช้และขนาดยา',
      confidence: 0.92,
      type: 'exact',
      notes: ['Direct match', 'Dosage table format required for Thai market'],
      innovatorContent: 'Adults: 1-2 tablets every 4-6 hours. Maximum 8 tablets in 24 hours...',
      regulatoryReq: 'Include dosage table with age groups, weight ranges, and frequency'
    }
  ];

  const orphanedSections = [
    {
      name: 'Patient Counseling Information',
      content: 'Advise patients to contact healthcare provider if symptoms persist...',
      reason: 'US-specific section not required in Thai PIL format',
      disposition: 'Omit - regulatory requirement specific to FDA format'
    },
    {
      name: 'Clinical Pharmacology',
      content: 'Mechanism of action: Paracetamol inhibits prostaglandin synthesis...',
      reason: 'Technical content not required in patient-facing PIL',
      disposition: 'Move to Summary of Product Characteristics (SmPC) document'
    }
  ];

  const unmatchedSections = [
    {
      name: 'ศูนย์พิษวิทยา',
      requirements: 'Must include Ramathibodi Poison Center contact: 02-201-1181',
      order: 14,
      mandatory: true,
      reason: 'Thailand-specific requirement not in Innovator PIL'
    },
    {
      name: 'เลขทะเบียนตำรับยา',
      requirements: 'Thai FDA registration number in format: 1A XXX/XXXX',
      order: 1,
      mandatory: true,
      reason: 'Local regulatory requirement - to be assigned upon approval'
    }
  ];

  const gaps = [
    {
      section: 'ศูนย์พิษวิทยา',
      type: 'missing_section',
      severity: 'critical',
      description: 'Poison control center contact information not present',
      requirement: 'Thai FDA requires emergency contact information',
      action: 'Add section with Ramathibodi Poison Center: 02-201-1181'
    },
    {
      section: 'วิธีใช้และขนาดยา',
      type: 'insufficient_detail',
      severity: 'major',
      description: 'Dosage information lacks pediatric weight-based dosing table',
      requirement: 'Must include detailed table with weight ranges for children',
      action: 'Create dosage table: <15kg, 15-23kg, 24-32kg, >32kg with corresponding doses'
    },
    {
      section: 'ข้อควรระวัง',
      type: 'missing_content',
      severity: 'major',
      description: 'No mention of hepatotoxicity risk with alcohol consumption',
      requirement: 'Thai FDA requires explicit alcohol warning for paracetamol',
      action: 'Add warning: "ห้ามดื่มแอลกอฮอล์ขณะใช้ยานี้ เสี่ยงต่อตับวาย"'
    },
    {
      section: 'การเก็บรักษา',
      type: 'local_requirement',
      severity: 'minor',
      description: 'Storage temperature in Fahrenheit, needs Celsius conversion',
      requirement: 'Thai market uses Celsius for temperature',
      action: 'Convert "Store below 77°F" to "เก็บที่อุณหภูมิไม่เกิน 25°C"'
    }
  ];

  const draftOutline = [
    {
      order: 1,
      name: 'ชื่อยาและความแรง',
      sourceContent: 'PARACETAMOL 500mg Tablets',
      targetReq: 'Thai product name with registration number',
      translationNotes: ['Translate product name', 'Add Thai FDA registration number placeholder'],
      specialAttention: true,
      attentionType: 'regulatory_reference',
      gaps: []
    },
    {
      order: 2,
      name: 'ข้อบ่งใช้',
      sourceContent: 'Relief of mild to moderate pain, fever reduction',
      targetReq: 'Bullet point format with all approved indications',
      translationNotes: ['Medical terminology translation', 'Use approved Thai medical terms'],
      specialAttention: false,
      gaps: []
    },
    {
      order: 3,
      name: 'วิธีใช้และขนาดยา',
      sourceContent: 'Adults: 1-2 tablets every 4-6 hours...',
      targetReq: 'Dosage table with age/weight groups',
      translationNotes: ['Create formatted dosage table', 'Include pediatric weight-based dosing'],
      specialAttention: true,
      attentionType: 'dosage_table',
      gaps: [gaps[1]]
    },
    {
      order: 4,
      name: 'ข้อห้ามใช้',
      sourceContent: 'Hypersensitivity to paracetamol, severe hepatic impairment',
      targetReq: 'Clear list format with medical justification',
      translationNotes: ['Medical terminology precision required'],
      specialAttention: false,
      gaps: []
    },
    {
      order: 5,
      name: 'ข้อควรระวัง',
      sourceContent: 'Consult doctor if pregnant, liver disease...',
      targetReq: 'Include alcohol warning, hepatotoxicity risk',
      translationNotes: ['Add Thailand-specific warnings', 'Emphasize alcohol interaction'],
      specialAttention: true,
      attentionType: 'local_contacts',
      gaps: [gaps[2]]
    }
  ];

  const simulateWorkflow = () => {
    const states = ['aligning_sections', 'analyzing_gaps', 'generating_outline', 'complete'];
    const currentIndex = states.indexOf(workflowState);
    if (currentIndex < states.length - 1) {
      setTimeout(() => setWorkflowState(states[currentIndex + 1]), 2000);
    }
  };

  React.useEffect(() => {
    if (workflowState !== 'complete') {
      simulateWorkflow();
    }
  }, [workflowState]);

  const getStepStatus = (step) => {
    const currentIndex = workflowSteps.findIndex(s => s.id === workflowState);
    const stepIndex = workflowSteps.findIndex(s => s.id === step.id);
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const currentProgress = workflowSteps.find(s => s.id === workflowState)?.percent || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                P
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">PIL Draft Creation</h1>
                <p className="text-sm text-zinc-400">New Submission Workflow</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-zinc-500">Product</div>
                <div className="text-sm font-semibold text-white">Paracetamol 500mg</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Target Market</div>
                <div className="text-sm font-semibold text-white">🇹🇭 Thailand</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-zinc-900/50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">
              {workflowSteps.find(s => s.id === workflowState)?.label}
            </span>
            <span className="text-sm font-semibold text-violet-400">{currentProgress}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-4 gap-2">
            {workflowSteps.map((step, idx) => {
              const status = getStepStatus(step);
              return (
                <div key={step.id} className="flex-1 flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    status === 'complete' ? 'bg-emerald-500 text-white' :
                    status === 'active' ? 'bg-violet-500 text-white animate-pulse' :
                    'bg-zinc-800 text-zinc-600'
                  }`}>
                    {status === 'complete' ? '✓' : idx + 1}
                  </div>
                  {idx < workflowSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 ${status === 'complete' ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['workflow', 'alignment', 'gaps', 'outline'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === tab
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab === 'workflow' && '📊 Workflow Status'}
              {tab === 'alignment' && '🔗 Section Alignment'}
              {tab === 'gaps' && '⚠️ Gap Analysis'}
              {tab === 'outline' && '📋 Draft Outline'}
            </button>
          ))}
        </div>

        {/* Workflow Status Tab */}
        {activeTab === 'workflow' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline */}
            <div className="lg:col-span-2 bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-6">Processing Timeline</h2>
              <div className="space-y-4">
                {workflowSteps.map((step, idx) => {
                  const status = getStepStatus(step);
                  return (
                    <div key={step.id} className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        status === 'complete' ? 'bg-emerald-500/20 text-emerald-400' :
                        status === 'active' ? 'bg-violet-500/20 text-violet-400' :
                        'bg-zinc-800 text-zinc-600'
                      }`}>
                        {status === 'complete' ? '✓' : status === 'active' ? '⟳' : idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-semibold ${
                            status === 'complete' ? 'text-emerald-400' :
                            status === 'active' ? 'text-violet-400' :
                            'text-zinc-500'
                          }`}>
                            {step.label}
                          </h3>
                          {status === 'complete' && (
                            <span className="text-xs text-zinc-500">1.2s</span>
                          )}
                          {status === 'active' && (
                            <span className="inline-flex items-center gap-1 text-xs text-violet-400">
                              <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                              Processing...
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-400">
                          {status === 'complete' && 'Completed successfully'}
                          {status === 'active' && 'Analyzing content and matching sections...'}
                          {status === 'pending' && 'Waiting to start'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-6">
              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                <h3 className="text-sm font-semibold text-zinc-400 mb-4">Processing Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-500">Extraction Time</span>
                      <span className="text-sm font-bold text-white">2.4s</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-500">Alignment Time</span>
                      <span className="text-sm font-bold text-white">1.8s</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-violet-500 animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-500">Gap Analysis</span>
                      <span className="text-sm font-bold text-zinc-600">Pending</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                <h3 className="text-sm font-semibold text-zinc-400 mb-4">Document Info</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs text-zinc-500 mb-1">Innovator PIL</div>
                    <div className="text-sm font-medium text-white">paracetamol_uk_pil.pdf</div>
                    <div className="text-xs text-zinc-600">12 pages • English</div>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <div className="text-xs text-zinc-500 mb-1">Regulatory Source</div>
                    <div className="text-sm font-medium text-white">thai_fda_pil_template.pdf</div>
                    <div className="text-xs text-zinc-600">8 pages • Thai</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alignment Tab */}
        {activeTab === 'alignment' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-emerald-500/10 rounded-2xl p-5 border border-emerald-500/20">
                <div className="text-3xl font-bold text-emerald-400">{alignments.length}</div>
                <div className="text-sm text-emerald-300 mt-1">Matched Sections</div>
              </div>
              <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20">
                <div className="text-3xl font-bold text-amber-400">{orphanedSections.length}</div>
                <div className="text-sm text-amber-300 mt-1">Orphaned Sections</div>
              </div>
              <div className="bg-rose-500/10 rounded-2xl p-5 border border-rose-500/20">
                <div className="text-3xl font-bold text-rose-400">{unmatchedSections.length}</div>
                <div className="text-sm text-rose-300 mt-1">Unmatched Sections</div>
              </div>
              <div className="bg-violet-500/10 rounded-2xl p-5 border border-violet-500/20">
                <div className="text-3xl font-bold text-violet-400">92%</div>
                <div className="text-sm text-violet-300 mt-1">Avg Confidence</div>
              </div>
            </div>

            {/* Alignments */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4">Section Alignments</h2>
              <div className="space-y-4">
                {alignments.map((alignment, idx) => (
                  <div key={idx} className="bg-zinc-900/50 rounded-xl p-4 border border-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold text-white">{alignment.innovatorSection}</span>
                          <span className="text-zinc-600">→</span>
                          <span className="text-sm font-semibold text-violet-400">{alignment.regulatorySection}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            alignment.type === 'exact' ? 'bg-emerald-500/20 text-emerald-400' :
                            alignment.type === 'semantic' ? 'bg-violet-500/20 text-violet-400' :
                            'bg-amber-500/20 text-amber-400'
                          }`}>
                            {alignment.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="h-1.5 w-24 bg-zinc-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-violet-500"
                                style={{ width: `${alignment.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-zinc-400">{(alignment.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedSection(selectedSection === idx ? null : idx)}
                        className="text-zinc-400 hover:text-white transition-colors"
                      >
                        {selectedSection === idx ? '▼' : '▶'}
                      </button>
                    </div>
                    {selectedSection === idx && (
                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div>
                          <div className="text-xs font-semibold text-zinc-500 mb-1">Innovator Content</div>
                          <div className="text-sm text-zinc-300 bg-zinc-950/50 rounded-lg p-3">{alignment.innovatorContent}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-500 mb-1">Regulatory Requirements</div>
                          <div className="text-sm text-zinc-300 bg-zinc-950/50 rounded-lg p-3">{alignment.regulatoryReq}</div>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-500 mb-1">Notes</div>
                          <ul className="space-y-1">
                            {alignment.notes.map((note, i) => (
                              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                                <span className="text-violet-400 mt-0.5">•</span>
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Orphaned & Unmatched */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                <h3 className="text-lg font-bold text-white mb-4">Orphaned Sections</h3>
                <div className="space-y-3">
                  {orphanedSections.map((section, idx) => (
                    <div key={idx} className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/20">
                      <div className="font-semibold text-amber-400 mb-2">{section.name}</div>
                      <div className="text-xs text-zinc-400 mb-2">{section.reason}</div>
                      <div className="text-xs text-amber-300 bg-amber-500/10 rounded-lg px-3 py-2">
                        💡 {section.disposition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                <h3 className="text-lg font-bold text-white mb-4">Unmatched Sections</h3>
                <div className="space-y-3">
                  {unmatchedSections.map((section, idx) => (
                    <div key={idx} className="bg-rose-500/5 rounded-xl p-4 border border-rose-500/20">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-rose-400">{section.name}</div>
                        {section.mandatory && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/20 text-rose-300">
                            Required
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mb-2">{section.requirements}</div>
                      <div className="text-xs text-rose-300">{section.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gaps Tab */}
        {activeTab === 'gaps' && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-rose-500/10 rounded-2xl p-5 border border-rose-500/20">
                <div className="text-3xl font-bold text-rose-400">2</div>
                <div className="text-sm text-rose-300 mt-1">Critical Gaps</div>
              </div>
              <div className="bg-amber-500/10 rounded-2xl p-5 border border-amber-500/20">
                <div className="text-3xl font-bold text-amber-400">2</div>
                <div className="text-sm text-amber-300 mt-1">Major Gaps</div>
              </div>
              <div className="bg-cyan-500/10 rounded-2xl p-5 border border-cyan-500/20">
                <div className="text-3xl font-bold text-cyan-400">1</div>
                <div className="text-sm text-cyan-300 mt-1">Minor Gaps</div>
              </div>
            </div>

            {/* Gap List */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <h2 className="text-lg font-bold text-white mb-4">Content Gaps</h2>
              <div className="space-y-3">
                {gaps.map((gap, idx) => (
                  <div key={idx} className={`rounded-xl p-4 border ${
                    gap.severity === 'critical' ? 'bg-rose-500/5 border-rose-500/20' :
                    gap.severity === 'major' ? 'bg-amber-500/5 border-amber-500/20' :
                    'bg-cyan-500/5 border-cyan-500/20'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                            gap.severity === 'critical' ? 'bg-rose-500 text-white' :
                            gap.severity === 'major' ? 'bg-amber-500 text-white' :
                            'bg-cyan-500 text-white'
                          }`}>
                            {gap.severity.toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-white">{gap.section}</span>
                        </div>
                        <div className="text-sm text-zinc-300 mb-2">{gap.description}</div>
                        <div className="text-xs text-zinc-500 mb-3">
                          <span className="font-semibold">Requirement:</span> {gap.requirement}
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedGaps({...expandedGaps, [idx]: !expandedGaps[idx]})}
                        className="text-zinc-400 hover:text-white transition-colors ml-4"
                      >
                        {expandedGaps[idx] ? '▼' : '▶'}
                      </button>
                    </div>
                    {expandedGaps[idx] && (
                      <div className={`pt-3 border-t ${
                        gap.severity === 'critical' ? 'border-rose-500/20' :
                        gap.severity === 'major' ? 'border-amber-500/20' :
                        'border-cyan-500/20'
                      }`}>
                        <div className="text-xs font-semibold text-zinc-500 mb-2">Suggested Action</div>
                        <div className={`text-sm rounded-lg p-3 ${
                          gap.severity === 'critical' ? 'bg-rose-500/10 text-rose-300' :
                          gap.severity === 'major' ? 'bg-amber-500/10 text-amber-300' :
                          'bg-cyan-500/10 text-cyan-300'
                        }`}>
                          ✓ {gap.action}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Outline Tab */}
        {activeTab === 'outline' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl p-6 border border-violet-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Draft PIL Outline</h2>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span>🇹🇭 Thailand FDA</span>
                    <span>•</span>
                    <span>Thai Language</span>
                    <span>•</span>
                    <span>{draftOutline.length} Sections</span>
                  </div>
                </div>
                <button className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl transition-colors">
                  Export Outline
                </button>
              </div>
            </div>

            {/* Sections */}
            <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="space-y-4">
                {draftOutline.map((section, idx) => (
                  <div key={idx} className="bg-zinc-900/50 rounded-xl p-5 border border-white/5">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {section.order}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-base font-bold text-white">{section.name}</h3>
                          {section.specialAttention && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400">
                              ⚠️ Special Attention
                            </span>
                          )}
                          {section.gaps && section.gaps.length > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-rose-500/20 text-rose-400">
                              {section.gaps.length} Gap{section.gaps.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-xs font-semibold text-zinc-500 mb-1">Source Content (English)</div>
                            <div className="text-sm text-zinc-300 bg-zinc-950/50 rounded-lg p-3">
                              {section.sourceContent}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-zinc-500 mb-1">Target Requirements (Thai)</div>
                            <div className="text-sm text-zinc-300 bg-zinc-950/50 rounded-lg p-3">
                              {section.targetReq}
                            </div>
                          </div>
                        </div>

                        {section.translationNotes.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-semibold text-zinc-500 mb-2">Translation Notes</div>
                            <div className="space-y-1">
                              {section.translationNotes.map((note, i) => (
                                <div key={i} className="text-sm text-cyan-400 flex items-start gap-2">
                                  <span className="mt-0.5">📝</span>
                                  <span>{note}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.specialAttention && (
                          <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/20">
                            <div className="text-xs font-semibold text-amber-400 mb-1">
                              Special Attention: {section.attentionType.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div className="text-xs text-amber-300">
                              {section.attentionType === 'dosage_table' && 'Requires formatted dosage table with age/weight groups'}
                              {section.attentionType === 'regulatory_reference' && 'Must include Thai FDA registration number'}
                              {section.attentionType === 'local_contacts' && 'Add Thailand-specific emergency contacts'}
                            </div>
                          </div>
                        )}

                        {section.gaps && section.gaps.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {section.gaps.map((gap, i) => (
                              <div key={i} className="bg-rose-500/5 rounded-lg p-3 border border-rose-500/20">
                                <div className="text-xs font-semibold text-rose-400 mb-1">Gap: {gap.description}</div>
                                <div className="text-xs text-rose-300">Action: {gap.action}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06]">
              <div className="text-sm text-zinc-400">
                Estimated translation time: <span className="font-semibold text-white">12-16 hours</span>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-colors">
                  Save Draft
                </button>
                <button className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-violet-500/30">
                  Start Translation
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}