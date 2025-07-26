import React, { useState, useEffect, useCallback } from 'react';
import { ChevronRight, RefreshCw, Search, Database, Settings, Info, Code, Calendar, X, Loader, Download, Copy, Filter, Lock, Unlock } from 'lucide-react';

const PMSInspector = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [selectedPlatform, setSelectedPlatform] = useState('guesty');
  const [selectedEnvironment, setSelectedEnvironment] = useState('production');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [queryText, setQueryText] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  const [queryError, setQueryError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);
  const [exportFormat, setExportFormat] = useState('csv');
  const [queryLocked, setQueryLocked] = useState(true);
  const [connectedPlatforms, setConnectedPlatforms] = useState({
    guesty: { connected: true, token: 'demo-token' },
    hospitable: { connected: false, token: null },
    ownerrez: { connected: false, token: null },
    hostaway: { connected: false, token: null }
  });
  const [authToken, setAuthToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState({});
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [copyNotification, setCopyNotification] = useState('');

  // Platform configurations
  const platformConfigs = {
    guesty: { 
      name: 'Guesty', 
      environments: ['Production', 'Sandbox'], 
      baseUrl: 'https://api.guesty.com/api/v2'
    },
    hospitable: { 
      name: 'Hospitable', 
      environments: ['Live', 'Test'], 
      baseUrl: 'https://api.hospitable.com/v1'
    },
    ownerrez: { 
      name: 'OwnerRez', 
      environments: ['Production', 'Demo'], 
      baseUrl: 'https://api.ownerreservations.com/v2'
    },
    hostaway: { 
      name: 'Hostaway', 
      environments: ['Live', 'Sandbox'], 
      baseUrl: 'https://api.hostaway.com/v1'
    }
  };

  // Discover endpoints
  const discoverEndpoints = useCallback(async () => {
    setIsDiscovering(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endpoints = {
        '/listings': {
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          description: 'Property listings',
          parameters: {
            active: { type: 'boolean', description: 'Filter active listings' },
            city: { type: 'string', description: 'Filter by city' },
            bedrooms: { type: 'number', description: 'Number of bedrooms' },
            limit: { type: 'number', description: 'Results per page', default: 20 }
          }
        },
        '/reservations': {
          methods: ['GET', 'POST', 'PUT'],
          description: 'Booking reservations',
          parameters: {
            status: { type: 'enum', values: ['confirmed', 'pending', 'cancelled'], description: 'Booking status' },
            checkIn: { type: 'date', description: 'Check-in date' },
            checkOut: { type: 'date', description: 'Check-out date' },
            guestId: { type: 'string', description: 'Guest ID' },
            limit: { type: 'number', description: 'Results per page', default: 20 }
          }
        },
        '/guests': {
          methods: ['GET', 'POST', 'PUT'],
          description: 'Guest management',
          parameters: {
            email: { type: 'string', description: 'Guest email' },
            phone: { type: 'string', description: 'Guest phone' },
            name: { type: 'string', description: 'Guest name' },
            limit: { type: 'number', description: 'Results per page', default: 20 }
          }
        },
        '/calendar': {
          methods: ['GET', 'PUT'],
          description: 'Availability calendar',
          parameters: {
            propertyId: { type: 'string', description: 'Property ID', required: true },
            startDate: { type: 'date', description: 'Start date', required: true },
            endDate: { type: 'date', description: 'End date', required: true }
          }
        }
      };
      
      setDiscoveredEndpoints(prev => ({
        ...prev,
        [selectedPlatform]: endpoints
      }));
      
    } finally {
      setIsDiscovering(false);
    }
  }, [selectedPlatform]);

  // Auto-discover on connect
  useEffect(() => {
    if (connectedPlatforms[selectedPlatform].connected && !discoveredEndpoints[selectedPlatform]) {
      discoverEndpoints();
    }
  }, [selectedPlatform, connectedPlatforms, discoveredEndpoints, discoverEndpoints]);

  // FIX 1: Auto-start on first endpoint when query builder tab is clicked
  useEffect(() => {
    if (activeTab === 'query' && discoveredEndpoints[selectedPlatform] && !selectedEndpoint) {
      const firstEndpoint = Object.keys(discoveredEndpoints[selectedPlatform])[0];
      if (firstEndpoint) {
        setSelectedEndpoint(firstEndpoint);
        setActiveFilters([]);
        setQueryResults(null);
      }
    }
  }, [activeTab, discoveredEndpoints, selectedPlatform, selectedEndpoint]);

  // Get available filters
  const getAvailableFilters = useCallback(() => {
    if (!selectedEndpoint || !discoveredEndpoints[selectedPlatform] || !discoveredEndpoints[selectedPlatform][selectedEndpoint]) {
      return {};
    }
    return discoveredEndpoints[selectedPlatform][selectedEndpoint].parameters || {};
  }, [selectedPlatform, selectedEndpoint, discoveredEndpoints]);

  // Build query from filters
  const buildQueryFromFilters = useCallback(() => {
    if (!selectedEndpoint) return '';
    
    const params = activeFilters
      .filter(f => f.value)
      .map(f => `${f.key}=${encodeURIComponent(f.value)}`)
      .join('&');
    
    return `GET ${selectedEndpoint}${params ? '?' + params : ''}`;
  }, [selectedEndpoint, activeFilters]);

  // Update query when filters change
  useEffect(() => {
    if (activeFilters.length > 0) {
      setQueryText(buildQueryFromFilters());
    }
  }, [activeFilters, buildQueryFromFilters]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  // Handle authentication
  const handleAuthenticate = useCallback(() => {
    setIsAuthenticating(true);
    setAuthError('');
    
    setTimeout(() => {
      if (authToken.length < 10) {
        setAuthError('Token must be at least 10 characters');
        setIsAuthenticating(false);
      } else {
        setConnectedPlatforms(prev => ({
          ...prev,
          [selectedPlatform]: { connected: true, token: authToken }
        }));
        setAuthToken('');
        setAuthError('');
        setIsAuthenticating(false);
      }
    }, 1000);
  }, [authToken, selectedPlatform]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    setConnectedPlatforms(prev => ({
      ...prev,
      [selectedPlatform]: { connected: false, token: null }
    }));
    setDiscoveredEndpoints(prev => {
      const updated = { ...prev };
      delete updated[selectedPlatform];
      return updated;
    });
    setSelectedEndpoint(null);
    setActiveFilters([]);
    setQueryResults(null);
    setQueryError(null);
  }, [selectedPlatform]);

  // Execute query
  const executeQuery = useCallback(() => {
    setIsLoading(true);
    setQueryError(null);
    
    const entry = {
      query: queryText,
      timestamp: new Date().toISOString(),
      platform: selectedPlatform,
      endpoint: selectedEndpoint
    };
    setQueryHistory(prev => [entry, ...prev.slice(0, 49)]);
    
    setTimeout(() => {
      if (Math.random() > 0.8) {
        setQueryError({
          code: 'ERROR',
          message: 'Query failed. Please check your syntax.',
          details: 'Invalid query format'
        });
        setQueryResults(null);
      } else {
        // Generate sample data
        const data = [];
        const count = Math.floor(Math.random() * 20) + 5;
        
        for (let i = 0; i < count; i++) {
          if (selectedEndpoint === '/listings') {
            data.push({
              id: `prop_${i + 1}`,
              name: `Property ${i + 1}`,
              city: ['Miami', 'New York', 'Los Angeles'][Math.floor(Math.random() * 3)],
              bedrooms: Math.floor(Math.random() * 4) + 1,
              status: ['Active', 'Inactive'][Math.floor(Math.random() * 2)],
              price: `$${Math.floor(Math.random() * 300) + 100}/night`
            });
          } else if (selectedEndpoint === '/reservations') {
            data.push({
              id: `res_${i + 1}`,
              guestName: `Guest ${i + 1}`,
              checkIn: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              checkOut: new Date(Date.now() + (Math.random() * 30 + 3) * 24 * 60 * 60 * 1000).toLocaleDateString(),
              status: ['Confirmed', 'Pending', 'Cancelled'][Math.floor(Math.random() * 3)],
              total: `$${Math.floor(Math.random() * 2000) + 500}`
            });
          } else {
            data.push({
              id: `item_${i + 1}`,
              name: `Item ${i + 1}`,
              type: selectedEndpoint ? selectedEndpoint.slice(1) : 'unknown',
              status: 'Active',
              created: new Date().toLocaleDateString()
            });
          }
        }
        
        setQueryResults({
          success: true,
          count: data.length,
          data: data,
          executionTime: `${Math.floor(Math.random() * 200) + 50}ms`
        });
      }
      setIsLoading(false);
    }, 800);
  }, [queryText, selectedPlatform, selectedEndpoint]);

  // Quick copy
  const quickCopy = useCallback((text, label) => {
    navigator.clipboard.writeText(text);
    setCopyNotification(label || 'Copied!');
    setTimeout(() => setCopyNotification(''), 2000);
  }, []);

  // Export data
  const exportData = useCallback(() => {
    if (!queryResults || !queryResults.data) return;
    
    const headers = Object.keys(queryResults.data[0]).join(',');
    const rows = queryResults.data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [queryResults]);

  // Add filter
  const addFilter = (filterKey) => {
    const filterDef = getAvailableFilters()[filterKey];
    if (filterDef && !activeFilters.find(f => f.key === filterKey)) {
      setActiveFilters([...activeFilters, { 
        key: filterKey, 
        value: filterDef.default || '', 
        type: filterDef.type,
        values: filterDef.values 
      }]);
    }
  };

  // Update filter
  const updateFilter = (index, value) => {
    const newFilters = [...activeFilters];
    newFilters[index].value = value;
    setActiveFilters(newFilters);
  };

  // Remove filter
  const removeFilter = (index) => {
    setActiveFilters(activeFilters.filter((_, i) => i !== index));
  };

  // Auth screen
  if (!connectedPlatforms[selectedPlatform].connected) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connect to {platformConfigs[selectedPlatform].name}
            </h2>
            <p className="text-sm text-gray-600">
              Enter your personal access token to connect to the {selectedEnvironment} environment
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Access Token
              </label>
              <input
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="Enter your API token..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAuthenticate()}
              />
              <p className="mt-1 text-xs text-gray-500">
                You can find your API token in your {platformConfigs[selectedPlatform].name} account settings
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{authError}</p>
              </div>
            )}

            <button
              onClick={handleAuthenticate}
              disabled={!authToken || isAuthenticating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isAuthenticating ? 'Authenticating...' : 'Authorize'}
            </button>
            
            <button
              onClick={() => {
                // Find a connected platform to switch to
                const connectedPlatform = Object.entries(connectedPlatforms).find(([key, value]) => value.connected);
                if (connectedPlatform) {
                  setSelectedPlatform(connectedPlatform[0]);
                  setAuthToken('');
                  setAuthError('');
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Other Platforms</h3>
            <div className="space-y-2">
              {Object.entries(platformConfigs).map(([key, platform]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedPlatform(key);
                    setAuthToken('');
                    setAuthError('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                    key === selectedPlatform
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{platform.name}</span>
                  {connectedPlatforms[key].connected && (
                    <span className="text-xs text-green-600">Connected</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Copy Notification */}
      {copyNotification && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-md shadow-lg z-50">
          {copyNotification}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-800">PMS Inspector</h1>
          <div className="flex items-center gap-2">
            <select
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value);
                setActiveFilters([]);
                setQueryResults(null);
                setSelectedEndpoint(null);
                setQueryError(null);
                setAuthToken('');
                setAuthError('');
              }}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              {Object.entries(platformConfigs).map(([key, platform]) => (
                <option key={key} value={key}>
                  {platform.name} {connectedPlatforms[key].connected ? '✓' : '○'}
                </option>
              ))}
            </select>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              {platformConfigs[selectedPlatform].environments.map(env => (
                <option key={env} value={env.toLowerCase()}>{env}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${isLoading ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-4 h-4 text-gray-600" />
        </button>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="flex">
          {[
            { id: 'info', label: 'Info', icon: Info },
            { id: 'discovery', label: 'API Discovery', icon: Search },
            { id: 'query', label: 'Query Builder', icon: Code },
            { id: 'export', label: 'Export Center', icon: Download },
            { id: 'history', label: 'History', icon: Calendar }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600 bg-blue-50'
                  : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 transition-all duration-200 ${
          sidebarCollapsed ? 'w-12' : 'w-64'
        }`}>
          <div className="p-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${
                sidebarCollapsed ? '' : 'rotate-180'
              }`} />
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="px-3 pb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Endpoints
                </h3>
                <button
                  onClick={discoverEndpoints}
                  disabled={isDiscovering}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {isDiscovering ? <Loader className="w-3 h-3 animate-spin" /> : 'Refresh'}
                </button>
              </div>
              
              <div className="space-y-1">
                {discoveredEndpoints[selectedPlatform] ? (
                  Object.entries(discoveredEndpoints[selectedPlatform]).map(([endpoint, config]) => (
                    <button
                      key={endpoint}
                      onClick={() => {
                        setSelectedEndpoint(endpoint);
                        setActiveFilters([]);
                        setQueryResults(null);
                      }}
                      className={`w-full flex items-start px-3 py-2 text-sm rounded transition-colors ${
                        selectedEndpoint === endpoint
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-mono text-xs">{endpoint}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {config.methods.join(', ')}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-gray-500 text-center py-4">
                    No endpoints discovered yet
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {activeTab === 'info' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Platform Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-gray-500">Platform</dt>
                    <dd className="text-sm font-medium text-gray-900">{platformConfigs[selectedPlatform].name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Environment</dt>
                    <dd className="text-sm font-medium text-gray-900">{selectedEnvironment}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Base URL</dt>
                    <dd className="text-sm font-medium text-gray-900 font-mono text-xs">{platformConfigs[selectedPlatform].baseUrl}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Status</dt>
                    <dd className="text-sm font-medium text-green-600">Connected</dd>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={handleDisconnect}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Disconnect from {platformConfigs[selectedPlatform].name}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discovery' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  API Discovery
                </h2>
                <button
                  onClick={discoverEndpoints}
                  disabled={isDiscovering}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isDiscovering ? 'Discovering...' : 'Run Discovery'}
                </button>
                
                {discoveredEndpoints[selectedPlatform] && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {Object.entries(discoveredEndpoints[selectedPlatform]).map(([endpoint, config]) => (
                      <div key={endpoint} className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-mono text-sm text-gray-800">{endpoint}</h3>
                        <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          Methods: {config.methods.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'query' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Query Builder
                  </h2>
                </div>
                
                {selectedEndpoint && discoveredEndpoints[selectedPlatform] && discoveredEndpoints[selectedPlatform][selectedEndpoint] ? (
                  <div className="space-y-6">
                    {/* Available Filters */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Available Parameters</h3>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(getAvailableFilters()).map(([key, filter]) => {
                          const isActive = activeFilters.some(f => f.key === key);
                          return (
                            <button
                              key={key}
                              onClick={() => {
                                if (isActive) {
                                  setActiveFilters(activeFilters.filter(f => f.key !== key));
                                } else {
                                  addFilter(key);
                                }
                              }}
                              className={`px-3 py-1 text-sm rounded border transition-colors ${
                                isActive
                                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {key} {filter.required && '*'}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Filters */}
                    {activeFilters.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Active Filters</h3>
                        <div className="space-y-2">
                          {activeFilters.map((filter, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 w-32">{filter.key}:</span>
                              {filter.type === 'boolean' ? (
                                <select
                                  value={filter.value}
                                  onChange={(e) => updateFilter(index, e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                >
                                  <option value="">Select...</option>
                                  <option value="true">True</option>
                                  <option value="false">False</option>
                                </select>
                              ) : filter.type === 'enum' && filter.values ? (
                                <select
                                  value={filter.value}
                                  onChange={(e) => updateFilter(index, e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                >
                                  <option value="">Select...</option>
                                  {filter.values.map(val => (
                                    <option key={val} value={val}>{val}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={filter.type === 'number' ? 'number' : 'text'}
                                  value={filter.value}
                                  onChange={(e) => updateFilter(index, e.target.value)}
                                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder={`Enter ${filter.key}...`}
                                />
                              )}
                              <button
                                onClick={() => removeFilter(index)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Query */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Query</label>
                        <button
                          onClick={() => setQueryLocked(!queryLocked)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                            queryLocked 
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                          title={queryLocked ? 'Click to unlock query editing' : 'Click to lock query editing'}
                        >
                          {queryLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {queryLocked ? 'Locked' : 'Unlocked'}
                        </button>
                      </div>
                      <textarea
                        value={queryText}
                        onChange={(e) => !queryLocked && setQueryText(e.target.value)}
                        disabled={queryLocked}
                        className={`w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm ${
                          queryLocked ? 'bg-gray-50 cursor-not-allowed' : ''
                        }`}
                        rows={3}
                        placeholder="Enter your query..."
                      />
                      {queryLocked && (
                        <p className="text-xs text-gray-500 mt-1">
                          Query is locked. Click the lock button to edit manually.
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={executeQuery}
                        disabled={!queryText || isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isLoading ? 'Executing...' : 'Execute Query'}
                      </button>
                      {queryResults && (
                        <button
                          onClick={exportData}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                          Export CSV
                        </button>
                      )}
                    </div>

                    {/* Error */}
                    {queryError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded">
                        <h3 className="text-sm font-medium text-red-800">
                          Error: {queryError.code}
                        </h3>
                        <p className="text-sm text-red-700 mt-1">{queryError.message}</p>
                      </div>
                    )}

                    {/* Results */}
                    {queryResults && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-semibold text-gray-700">
                            Results ({queryResults.count} records) • {queryResults.executionTime}
                          </h3>
                          {/* FIX 2: Copy buttons for CSV and Excel */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const headers = Object.keys(queryResults.data[0]).join(',');
                                const rows = queryResults.data.map(row => 
                                  Object.values(row).map(val => 
                                    typeof val === 'string' && val.includes(',') ? `"${val}"` : val
                                  ).join(',')
                                );
                                const csv = [headers, ...rows].join('\n');
                                quickCopy(csv, 'CSV data copied to clipboard!');
                              }}
                              className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded border border-green-300 transition-colors flex items-center gap-1"
                              title="Copy as CSV"
                            >
                              <Copy className="w-3 h-3" />
                              CSV
                            </button>
                            <button
                              onClick={() => {
                                // Create Excel-compatible tab-separated format
                                const headers = Object.keys(queryResults.data[0]).join('\t');
                                const rows = queryResults.data.map(row => 
                                  Object.values(row).map(val => 
                                    typeof val === 'string' && (val.includes('\t') || val.includes('\n')) ? `"${val.replace(/"/g, '""')}"` : val
                                  ).join('\t')
                                );
                                const excel = [headers, ...rows].join('\n');
                                quickCopy(excel, 'Excel data copied to clipboard!');
                              }}
                              className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border border-blue-300 transition-colors flex items-center gap-1"
                              title="Copy as Excel (tab-separated)"
                            >
                              <Copy className="w-3 h-3" />
                              Excel
                            </button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                {queryResults.data.length > 0 && Object.keys(queryResults.data[0]).map(key => (
                                  <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {queryResults.data.map((row, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  {Object.entries(row).map(([key, value], cellIdx) => (
                                    <td
                                      key={cellIdx}
                                      onClick={() => quickCopy(String(value), `Copied: ${value}`)}
                                      className="px-4 py-2 text-sm text-gray-900 cursor-pointer hover:bg-blue-50"
                                      title="Click to copy"
                                    >
                                      {value}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Select an endpoint from the sidebar to start building queries</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Export Center
                </h2>
                <p className="text-sm text-gray-600 mb-6">
                  Export your data in various formats. Run a query first to export results.
                </p>
                
                {queryResults ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="w-64 px-3 py-2 border border-gray-300 rounded"
                      >
                        <option value="csv">CSV - Comma-separated values</option>
                        <option value="json">JSON - JavaScript Object Notation</option>
                        <option value="excel">Excel - Microsoft Excel format</option>
                      </select>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={exportData}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4 inline mr-2" />
                        Export Data
                      </button>
                      <button
                        onClick={() => {
                          const text = JSON.stringify(queryResults.data, null, 2);
                          quickCopy(text, 'Data copied to clipboard!');
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                      >
                        <Copy className="w-4 h-4 inline mr-2" />
                        Copy to Clipboard
                      </button>
                    </div>
                    
                    <div className="mt-4 p-4 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">
                        <strong>Records to export:</strong> {queryResults.count}<br />
                        <strong>Fields:</strong> {Object.keys(queryResults.data[0] || {}).join(', ')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No data to export. Run a query first.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Query History
                </h2>
                <div className="space-y-2">
                  {queryHistory.length > 0 ? (
                    queryHistory.map((entry, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
                        <div className="font-mono text-sm text-gray-800">{entry.query}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(entry.timestamp).toLocaleString()} • {entry.endpoint || 'No endpoint'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No query history yet</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PMSInspector;