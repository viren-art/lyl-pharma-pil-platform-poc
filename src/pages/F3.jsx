import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
export default function F3MarketConfigPreview() {
  const [activeTab, setActiveTab] = React.useState('markets');
  const [selectedMarket, setSelectedMarket] = React.useState(null);
  const [showVersionHistory, setShowVersionHistory] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedDocType, setSelectedDocType] = React.useState('all');
  const [selectedStatus, setSelectedStatus] = React.useState('all');

  const markets = [
    {
      id: 1,
      name: 'Taiwan',
      regulatoryAuthority: 'TFDA',
      language: 'zh-TW',
      script: 'Traditional Chinese',
      extractionProvider: 'GoogleDocAI',
      sectionsCount: 17,
      updatedAt: '2024-01-15T10:30:00Z',
      status: 'active'
    },
    {
      id: 2,
      name: 'Thailand',
      regulatoryAuthority: 'Thai FDA',
      language: 'th',
      script: 'Thai',
      extractionProvider: 'GoogleDocAI',
      sectionsCount: 19,
      updatedAt: '2024-01-14T14:20:00Z',
      status: 'active'
    },
    {
      id: 3,
      name: 'Vietnam',
      regulatoryAuthority: 'DAV',
      language: 'vi',
      script: 'Vietnamese',
      extractionProvider: 'ClaudeVision',
      sectionsCount: 20,
      updatedAt: '2024-01-13T09:15:00Z',
      status: 'active'
    },
    {
      id: 4,
      name: 'Korea',
      regulatoryAuthority: 'KFDA',
      language: 'ko',
      script: 'Korean',
      extractionProvider: 'GoogleDocAI',
      sectionsCount: 19,
      updatedAt: '2024-01-12T16:45:00Z',
      status: 'active'
    }
  ];

  const documents = [
    {
      id: 1,
      fileName: 'Paracetamol_PIL_TW_v3.pdf',
      productName: 'Paracetamol 500mg',
      type: 'PIL',
      marketName: 'Taiwan',
      status: 'Active',
      uploadDate: '2024-01-15T08:30:00Z',
      uploadedBy: 'สมชาย วงศ์ใหญ่',
      fileSize: '2.4 MB',
      version: 3
    },
    {
      id: 2,
      fileName: 'Ibuprofen_SmPC_TH_v2.pdf',
      productName: 'Ibuprofen 400mg',
      type: 'SmPC',
      marketName: 'Thailand',
      status: 'Active',
      uploadDate: '2024-01-14T15:20:00Z',
      uploadedBy: 'สุภาพ ชัยวงศ์',
      fileSize: '3.1 MB',
      version: 2
    },
    {
      id: 3,
      fileName: 'Amoxicillin_PIL_VN_v1.pdf',
      productName: 'Amoxicillin 250mg',
      type: 'PIL',
      marketName: 'Vietnam',
      status: 'Draft',
      uploadDate: '2024-01-13T11:45:00Z',
      uploadedBy: 'วิชัย ประสิทธิ์',
      fileSize: '1.8 MB',
      version: 1
    },
    {
      id: 4,
      fileName: 'Metformin_SmPC_KR_v4.pdf',
      productName: 'Metformin 850mg',
      type: 'SmPC',
      marketName: 'Korea',
      status: 'Active',
      uploadDate: '2024-01-12T09:15:00Z',
      uploadedBy: 'นภา สุขสันต์',
      fileSize: '2.9 MB',
      version: 4
    },
    {
      id: 5,
      fileName: 'Aspirin_PIL_TW_v2.pdf',
      productName: 'Aspirin 100mg',
      type: 'PIL',
      marketName: 'Taiwan',
      status: 'Active',
      uploadDate: '2024-01-11T14:30:00Z',
      uploadedBy: 'สมชาย วงศ์ใหญ่',
      fileSize: '2.1 MB',
      version: 2
    },
    {
      id: 6,
      fileName: 'Omeprazole_SmPC_TH_v1.pdf',
      productName: 'Omeprazole 20mg',
      type: 'SmPC',
      marketName: 'Thailand',
      status: 'Archived',
      uploadDate: '2024-01-10T10:00:00Z',
      uploadedBy: 'วิชัย ประสิทธิ์',
      fileSize: '2.7 MB',
      version: 1
    }
  ];

  const versionHistory = [
    {
      version: 4,
      changedBy: 'สมชาย วงศ์ใหญ่',
      changeNotes: 'Updated section ordering for new TFDA requirements',
      timestamp: '2024-01-15T10:30:00Z',
      isCurrent: true
    },
    {
      version: 3,
      changedBy: 'สุภาพ ชัยวงศ์',
      changeNotes: 'Added mandatory disclaimers',
      timestamp: '2024-01-10T14:20:00Z',
      isCurrent: false
    },
    {
      version: 2,
      changedBy: 'วิชัย ประสิทธิ์',
      changeNotes: 'Changed extraction provider preference',
      timestamp: '2024-01-05T09:15:00Z',
      isCurrent: false
    },
    {
      version: 1,
      changedBy: 'นภา สุขสันต์',
      changeNotes: 'Initial configuration',
      timestamp: '2024-01-01T08:00:00Z',
      isCurrent: false
    }
  ];

  const stats = {
    totalMarkets: 4,
    totalDocuments: 156,
    documentsByType: { PIL: 89, SmPC: 67 },
    documentsByStatus: { Active: 124, Draft: 18, Archived: 14 },
    averageSections: 19
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedDocType === 'all' || doc.type === selectedDocType;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Draft':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Archived':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-zinc-900 to-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-900/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <span className="text-xl">⚙️</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Market Configuration</h1>
                  <p className="text-xs text-zinc-400">Manage markets & document library</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20"
            >
              <span className="text-lg">+</span>
              New Market
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('markets')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'markets'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              🌏 Markets
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'library'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              📚 Document Library
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'stats'
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              📊 Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Markets Tab */}
        {activeTab === 'markets' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {markets.map((market) => (
                <div
                  key={market.id}
                  onClick={() => setSelectedMarket(market)}
                  className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20 hover:border-violet-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-violet-400 transition-colors">
                        {market.name}
                      </h3>
                      <p className="text-xs text-zinc-400">{market.regulatoryAuthority}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(market.status)}`}>
                      {market.status}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">🌐</span>
                      <span className="text-sm text-zinc-300">{market.script}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">🤖</span>
                      <span className="text-sm text-zinc-300">{market.extractionProvider}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-xs">📋</span>
                      <span className="text-sm text-zinc-300">{market.sectionsCount} sections</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-zinc-500">
                      Updated {formatDate(market.updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Market Detail Modal */}
            {selectedMarket && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedMarket.name}</h2>
                      <p className="text-sm text-zinc-400 mt-1">{selectedMarket.regulatoryAuthority}</p>
                    </div>
                    <button
                      onClick={() => setSelectedMarket(null)}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Configuration Details */}
                    <div className="bg-zinc-800/50 rounded-xl p-5 border border-white/5">
                      <h3 className="text-sm font-semibold text-white mb-4">Configuration</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Language</p>
                          <p className="text-sm text-white font-medium">{selectedMarket.language}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Script</p>
                          <p className="text-sm text-white font-medium">{selectedMarket.script}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Extraction Provider</p>
                          <p className="text-sm text-white font-medium">{selectedMarket.extractionProvider}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Required Sections</p>
                          <p className="text-sm text-white font-medium">{selectedMarket.sectionsCount} sections</p>
                        </div>
                      </div>
                    </div>

                    {/* Formatting Rules */}
                    <div className="bg-zinc-800/50 rounded-xl p-5 border border-white/5">
                      <h3 className="text-sm font-semibold text-white mb-4">Formatting Rules</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Date Format</p>
                          <p className="text-sm text-white">YYYY/MM/DD</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Measurement Units</p>
                          <p className="text-sm text-white">Metric</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Emergency Contacts</p>
                          <p className="text-sm text-white">TFDA Drug Safety Hotline: 02-2787-8200</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowVersionHistory(true)}
                        className="flex-1 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-all border border-white/10"
                      >
                        📜 Version History
                      </button>
                      <button className="flex-1 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all shadow-lg shadow-violet-500/20">
                        ✏️ Edit Configuration
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Version History Modal */}
            {showVersionHistory && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-6 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Version History</h2>
                      <p className="text-sm text-zinc-400 mt-1">{selectedMarket?.name}</p>
                    </div>
                    <button
                      onClick={() => setShowVersionHistory(false)}
                      className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="space-y-3">
                      {versionHistory.map((version) => (
                        <div
                          key={version.version}
                          className={`bg-zinc-800/50 rounded-xl p-4 border transition-all ${
                            version.isCurrent
                              ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
                              : 'border-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                                version.isCurrent
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-white/5 text-zinc-400'
                              }`}>
                                v{version.version}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{version.changedBy}</p>
                                <p className="text-xs text-zinc-500">{formatDate(version.timestamp)}</p>
                              </div>
                            </div>
                            {version.isCurrent && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-300">{version.changeNotes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-zinc-800/50 rounded-2xl p-5 border border-white/[0.06] shadow-lg shadow-black/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Search</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Product name or file..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Document Type</label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="PIL">PIL</option>
                    <option value="SmPC">SmPC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-zinc-800/50 rounded-2xl border border-white/[0.06] shadow-lg shadow-black/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Market
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-white">{doc.fileName}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{doc.fileSize} • v{doc.version}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-zinc-300">{doc.productName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                            {doc.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-zinc-300">{doc.marketName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-zinc-300">{doc.uploadedBy}</p>
                            <p className="text-xs text-zinc-500 mt-0.5">{formatDate(doc.uploadDate)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium transition-all">
                            <span>📥</span>
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredDocuments.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm">No documents found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 rounded-2xl p-5 border border-violet-500/30 shadow-lg shadow-violet-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🌏</span>
                  <span className="text-xs font-medium text-violet-400">Markets</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stats.totalMarkets}</p>
                <p className="text-xs text-zinc-400">Active markets</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 rounded-2xl p-5 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📚</span>
                  <span className="text-xs font-medium text-emerald-400">Documents</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stats.totalDocuments}</p>
                <p className="text-xs text-zinc-400">Total documents</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-2xl p-5 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">📋</span>
                  <span className="text-xs font-medium text-cyan-400">Sections</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stats.averageSections}</p>
                <p className="text-xs text-zinc-400">Avg per market</p>
              </div>

              <div className="bg-gradient-to-br from-amber-600/20 to-orange-600/20 rounded-2xl p-5 border border-amber-500/30 shadow-lg shadow-amber-500/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">✅</span>
                  <span className="text-xs font-medium text-amber-400">Active</span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stats.documentsByStatus.Active}</p>
                <p className="text-xs text-zinc-400">Active documents</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Documents by Type */}
              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                <h3 className="text-lg font-bold text-white mb-6">Documents by Type</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">PIL</span>
                      <span className="text-sm font-semibold text-white">{stats.documentsByType.PIL}</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${(stats.documentsByType.PIL / stats.totalDocuments) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">SmPC</span>
                      <span className="text-sm font-semibold text-white">{stats.documentsByType.SmPC}</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                        style={{ width: `${(stats.documentsByType.SmPC / stats.totalDocuments) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents by Status */}
              <div className="bg-zinc-800/50 rounded-2xl p-6 border border-white/[0.06] shadow-lg shadow-black/20">
                <h3 className="text-lg font-bold text-white mb-6">Documents by Status</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">Active</span>
                      <span className="text-sm font-semibold text-white">{stats.documentsByStatus.Active}</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{ width: `${(stats.documentsByStatus.Active / stats.totalDocuments) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">Draft</span>
                      <span className="text-sm font-semibold text-white">{stats.documentsByStatus.Draft}</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                        style={{ width: `${(stats.documentsByStatus.Draft / stats.totalDocuments) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-300">Archived</span>
                      <span className="text-sm font-semibold text-white">{stats.documentsByStatus.Archived}</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-slate-500 to-zinc-500 rounded-full"
                        style={{ width: `${(stats.documentsByStatus.Archived / stats.totalDocuments) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Market Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-white/10 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Create New Market</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Market Name</label>
                <input
                  type="text"
                  placeholder="e.g., Singapore"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Regulatory Authority</label>
                <input
                  type="text"
                  placeholder="e.g., HSA"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Language Code</label>
                  <input
                    type="text"
                    placeholder="e.g., en-SG"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Script</label>
                  <input
                    type="text"
                    placeholder="e.g., Latin"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Extraction Provider</label>
                <select className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                  <option>GoogleDocAI</option>
                  <option>ClaudeVision</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button className="flex-1 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-all shadow-lg shadow-violet-500/20">
                  Create Market
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}