import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MarketConfig() {
  const { token, user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [versionHistory, setVersionHistory] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    regulatoryAuthority: '',
    language: '',
    script: '',
    requiredSections: [],
    sectionOrdering: {},
    extractionProviderPreference: 'GoogleDocAI',
    formattingRules: {
      dateFormat: '',
      measurementUnits: 'metric',
      emergencyContacts: '',
      mandatoryDisclaimers: []
    }
  });

  const [newSection, setNewSection] = useState('');
  const [newDisclaimer, setNewDisclaimer] = useState('');
  const [changeNotes, setChangeNotes] = useState('');

  // Check if user is admin
  const isAdmin = hasRole(['Admin']);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadMarkets();
  }, [isAdmin, navigate]);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/markets', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch markets');

      const data = await response.json();
      setMarkets(data.markets);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMarketDetails = async (marketId) => {
    try {
      const response = await fetch(`/api/markets/${marketId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch market details');

      const market = await response.json();
      setSelectedMarket(market);
      setFormData(market);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadVersionHistory = async (marketId) => {
    try {
      const response = await fetch(`/api/markets/${marketId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch version history');

      const history = await response.json();
      setVersionHistory(history);
      setShowHistoryModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateMarket = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/markets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create market');
      }

      setSuccess('Market configuration created successfully');
      setShowCreateModal(false);
      loadMarkets();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMarket = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/markets/${selectedMarket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, changeNotes })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update market');
      }

      setSuccess('Market configuration updated successfully');
      loadMarkets();
      setChangeNotes('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    if (!newSection.trim()) return;

    const sections = [...formData.requiredSections, newSection.trim()];
    const ordering = { ...formData.sectionOrdering };
    ordering[newSection.trim()] = sections.length;

    setFormData({
      ...formData,
      requiredSections: sections,
      sectionOrdering: ordering
    });
    setNewSection('');
  };

  const removeSection = (section) => {
    const sections = formData.requiredSections.filter(s => s !== section);
    const ordering = { ...formData.sectionOrdering };
    delete ordering[section];

    // Reorder remaining sections
    const reordered = {};
    sections.forEach((s, index) => {
      reordered[s] = index + 1;
    });

    setFormData({
      ...formData,
      requiredSections: sections,
      sectionOrdering: reordered
    });
  };

  const moveSectionUp = (section) => {
    const currentOrder = formData.sectionOrdering[section];
    if (currentOrder <= 1) return;

    const ordering = { ...formData.sectionOrdering };
    const otherSection = Object.keys(ordering).find(s => ordering[s] === currentOrder - 1);

    ordering[section] = currentOrder - 1;
    ordering[otherSection] = currentOrder;

    setFormData({ ...formData, sectionOrdering: ordering });
  };

  const moveSectionDown = (section) => {
    const currentOrder = formData.sectionOrdering[section];
    const maxOrder = Math.max(...Object.values(formData.sectionOrdering));
    if (currentOrder >= maxOrder) return;

    const ordering = { ...formData.sectionOrdering };
    const otherSection = Object.keys(ordering).find(s => ordering[s] === currentOrder + 1);

    ordering[section] = currentOrder + 1;
    ordering[otherSection] = currentOrder;

    setFormData({ ...formData, sectionOrdering: ordering });
  };

  const addDisclaimer = () => {
    if (!newDisclaimer.trim()) return;

    setFormData({
      ...formData,
      formattingRules: {
        ...formData.formattingRules,
        mandatoryDisclaimers: [
          ...(formData.formattingRules.mandatoryDisclaimers || []),
          newDisclaimer.trim()
        ]
      }
    });
    setNewDisclaimer('');
  };

  const removeDisclaimer = (index) => {
    const disclaimers = [...formData.formattingRules.mandatoryDisclaimers];
    disclaimers.splice(index, 1);

    setFormData({
      ...formData,
      formattingRules: {
        ...formData.formattingRules,
        mandatoryDisclaimers: disclaimers
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      regulatoryAuthority: '',
      language: '',
      script: '',
      requiredSections: [],
      sectionOrdering: {},
      extractionProviderPreference: 'GoogleDocAI',
      formattingRules: {
        dateFormat: '',
        measurementUnits: 'metric',
        emergencyContacts: '',
        mandatoryDisclaimers: []
      }
    });
    setSelectedMarket(null);
    setChangeNotes('');
  };

  const getSortedSections = () => {
    return formData.requiredSections.sort((a, b) => 
      formData.sectionOrdering[a] - formData.sectionOrdering[b]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading markets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Market Configuration</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage regulatory requirements and extraction settings for each market
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Market
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      )}

      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
            {success}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Markets</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {markets.map(market => (
                  <div
                    key={market.id}
                    className={`px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedMarket?.id === market.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => loadMarketDetails(market.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{market.name}</h3>
                        <p className="text-sm text-gray-600">{market.regulatoryAuthority}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {market.language}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            market.extractionProviderPreference === 'GoogleDocAI'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {market.extractionProviderPreference}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          loadVersionHistory(market.id);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                        title="View history"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Market Details/Edit Form */}
          <div className="lg:col-span-2">
            {selectedMarket ? (
              <form onSubmit={handleUpdateMarket} className="bg-white rounded-lg shadow">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Edit Market: {selectedMarket.name}
                  </h2>
                </div>

                <div className="px-6 py-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Market Name
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Regulatory Authority
                        </label>
                        <input
                          type="text"
                          value={formData.regulatoryAuthority}
                          onChange={(e) => setFormData({ ...formData, regulatoryAuthority: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Language Code
                        </label>
                        <input
                          type="text"
                          value={formData.language}
                          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                          placeholder="e.g., zh-TW, th, vi, ko"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Script
                        </label>
                        <input
                          type="text"
                          value={formData.script}
                          onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                          placeholder="e.g., Traditional Chinese"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Extraction Provider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extraction Provider Preference
                    </label>
                    <select
                      value={formData.extractionProviderPreference}
                      onChange={(e) => setFormData({ ...formData, extractionProviderPreference: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="GoogleDocAI">Google Document AI</option>
                      <option value="ClaudeVision">Claude Vision</option>
                    </select>
                  </div>

                  {/* Required Sections */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Required PIL Sections</h3>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newSection}
                        onChange={(e) => setNewSection(e.target.value)}
                        placeholder="Add new section..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSection())}
                      />
                      <button
                        type="button"
                        onClick={addSection}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {getSortedSections().map((section) => (
                        <div
                          key={section}
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
                        >
                          <span className="text-sm font-medium text-gray-700 w-8">
                            {formData.sectionOrdering[section]}
                          </span>
                          <span className="flex-1 text-sm text-gray-900">{section}</span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveSectionUp(section)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Move up"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSectionDown(section)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Move down"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeSection(section)}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Formatting Rules */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Formatting Rules</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date Format
                        </label>
                        <input
                          type="text"
                          value={formData.formattingRules.dateFormat}
                          onChange={(e) => setFormData({
                            ...formData,
                            formattingRules: { ...formData.formattingRules, dateFormat: e.target.value }
                          })}
                          placeholder="e.g., DD/MM/YYYY"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Measurement Units
                        </label>
                        <select
                          value={formData.formattingRules.measurementUnits}
                          onChange={(e) => setFormData({
                            ...formData,
                            formattingRules: { ...formData.formattingRules, measurementUnits: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="metric">Metric</option>
                          <option value="imperial">Imperial</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contacts
                      </label>
                      <input
                        type="text"
                        value={formData.formattingRules.emergencyContacts}
                        onChange={(e) => setFormData({
                          ...formData,
                          formattingRules: { ...formData.formattingRules, emergencyContacts: e.target.value }
                        })}
                        placeholder="e.g., TFDA Hotline: 02-2787-8200"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Mandatory Disclaimers */}
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 mb-4">Mandatory Disclaimers</h3>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        value={newDisclaimer}
                        onChange={(e) => setNewDisclaimer(e.target.value)}
                        placeholder="Add disclaimer text..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDisclaimer())}
                      />
                      <button
                        type="button"
                        onClick={addDisclaimer}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(formData.formattingRules.mandatoryDisclaimers || []).map((disclaimer, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <span className="flex-1 text-sm text-gray-900">{disclaimer}</span>
                          <button
                            type="button"
                            onClick={() => removeDisclaimer(index)}
                            className="p-1 text-red-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Change Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Change Notes (required for audit trail)
                    </label>
                    <textarea
                      value={changeNotes}
                      onChange={(e) => setChangeNotes(e.target.value)}
                      placeholder="Describe what changes you made..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">🌏</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Market Selected</h3>
                <p className="text-gray-600">
                  Select a market from the list to view and edit its configuration
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Market Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateMarket}>
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Create New Market</h2>
              </div>

              <div className="px-6 py-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Market Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regulatory Authority *
                    </label>
                    <input
                      type="text"
                      value={formData.regulatoryAuthority}
                      onChange={(e) => setFormData({ ...formData, regulatoryAuthority: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language Code *
                    </label>
                    <input
                      type="text"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      placeholder="e.g., zh-TW"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Script *
                    </label>
                    <input
                      type="text"
                      value={formData.script}
                      onChange={(e) => setFormData({ ...formData, script: e.target.value })}
                      placeholder="e.g., Traditional Chinese"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Extraction Provider *
                  </label>
                  <select
                    value={formData.extractionProviderPreference}
                    onChange={(e) => setFormData({ ...formData, extractionProviderPreference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GoogleDocAI">Google Document AI</option>
                    <option value="ClaudeVision">Claude Vision</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Sections * (add at least one)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      placeholder="Section name..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue