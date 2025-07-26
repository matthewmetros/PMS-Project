import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Database, Download, Copy } from 'lucide-react';
import { 
  PlatformKey, 
  TabId, 
  PlatformConnection, 
  EndpointConfig, 
  ActiveFilter 
} from '../../types/pms.types';
import { 
  PLATFORM_CONFIGS, 
  DEFAULT_PLATFORM, 
  DEFAULT_ENVIRONMENT, 
  MIN_TOKEN_LENGTH 
} from '../../constants/platforms';
import { MOCK_ENDPOINTS } from '../../constants/endpoints';
import { useClipboard } from '../../hooks/useClipboard';
import { useQueryExecution } from '../../hooks/useQueryExecution';
import { exportCSV, generateCSV, generateExcelFormat } from '../../utils/dataExport';

import { AuthScreen } from './AuthScreen';
import { Header } from './Header';
import { TabNavigation } from './TabNavigation';
import { Sidebar } from './Sidebar';
import { QueryBuilder } from './QueryBuilder';

const PMSInspectorOptimized: React.FC = () => {
  // Core state
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey>(DEFAULT_PLATFORM);
  const [selectedEnvironment, setSelectedEnvironment] = useState(DEFAULT_ENVIRONMENT);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [queryText, setQueryText] = useState('');
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [queryLocked, setQueryLocked] = useState(true);
  const [exportFormat, setExportFormat] = useState('csv');

  // Platform connection state
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<PlatformKey, PlatformConnection>>({
    guesty: { connected: true, token: 'demo-token' },
    hospitable: { connected: false, token: null },
    ownerrez: { connected: false, token: null },
    hostaway: { connected: false, token: null }
  });

  // Auth state
  const [authToken, setAuthToken] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Discovery state
  const [discoveredEndpoints, setDiscoveredEndpoints] = useState<Record<PlatformKey, Record<string, EndpointConfig>>>({});
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Custom hooks
  const { copyNotification, copyToClipboard } = useClipboard();
  const { queryResults, queryError, queryHistory, isLoading: isQueryLoading, executeQuery, clearResults } = useQueryExecution();

  // Memoized values
  const isConnected = useMemo(() => 
    connectedPlatforms[selectedPlatform].connected, 
    [connectedPlatforms, selectedPlatform]
  );

  const availableFilters = useMemo(() => {
    if (!selectedEndpoint || !discoveredEndpoints[selectedPlatform] || !discoveredEndpoints[selectedPlatform][selectedEndpoint]) {
      return {};
    }
    return discoveredEndpoints[selectedPlatform][selectedEndpoint].parameters || {};
  }, [selectedPlatform, selectedEndpoint, discoveredEndpoints]);

  // Discover endpoints
  const discoverEndpoints = useCallback(async () => {
    setIsDiscovering(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDiscoveredEndpoints(prev => ({
        ...prev,
        [selectedPlatform]: MOCK_ENDPOINTS
      }));
      
    } finally {
      setIsDiscovering(false);
    }
  }, [selectedPlatform]);

  // Auto-discover on connect
  useEffect(() => {
    if (isConnected && !discoveredEndpoints[selectedPlatform]) {
      discoverEndpoints();
    }
  }, [selectedPlatform, isConnected, discoveredEndpoints, discoverEndpoints]);

  // Auto-start on first endpoint when query builder tab is clicked
  useEffect(() => {
    if (activeTab === 'query' && discoveredEndpoints[selectedPlatform] && !selectedEndpoint) {
      const firstEndpoint = Object.keys(discoveredEndpoints[selectedPlatform])[0];
      if (firstEndpoint) {
        setSelectedEndpoint(firstEndpoint);
        setActiveFilters([]);
        clearResults();
      }
    }
  }, [activeTab, discoveredEndpoints, selectedPlatform, selectedEndpoint, clearResults]);

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
    if (activeFilters.length > 0 && queryLocked) {
      setQueryText(buildQueryFromFilters());
    }
  }, [activeFilters, buildQueryFromFilters, queryLocked]);

  // Handlers
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  const handleAuthenticate = useCallback(() => {
    setIsAuthenticating(true);
    setAuthError('');
    
    setTimeout(() => {
      if (authToken.length < MIN_TOKEN_LENGTH) {
        setAuthError(`Token must be at least ${MIN_TOKEN_LENGTH} characters`);
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
    clearResults();
  }, [selectedPlatform, clearResults]);

  const handlePlatformChange = useCallback((platform: PlatformKey) => {
    setSelectedPlatform(platform);
    setActiveFilters([]);
    clearResults();
    setSelectedEndpoint(null);
    setAuthToken('');
    setAuthError('');
  }, [clearResults]);

  const handleEndpointSelect = useCallback((endpoint: string) => {
    setSelectedEndpoint(endpoint);
    setActiveFilters([]);
    clearResults();
  }, [clearResults]);

  const handleAddFilter = useCallback((filterKey: string) => {
    const filterDef = availableFilters[filterKey];
    if (filterDef && !activeFilters.find(f => f.key === filterKey)) {
      setActiveFilters(prev => [...prev, { 
        key: filterKey, 
        value: filterDef.default || '', 
        type: filterDef.type,
        values: filterDef.values 
      }]);
    }
  }, [availableFilters, activeFilters]);

  const handleUpdateFilter = useCallback((index: number, value: string) => {
    setActiveFilters(prev => {
      const newFilters = [...prev];
      newFilters[index].value = value;
      return newFilters;
    });
  }, []);

  const handleRemoveFilter = useCallback((index: number) => {
    setActiveFilters(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleExecuteQuery = useCallback(() => {
    executeQuery(queryText, selectedPlatform, selectedEndpoint);
  }, [executeQuery, queryText, selectedPlatform, selectedEndpoint]);

  const handleExportData = useCallback(() => {
    exportCSV(queryResults);
  }, [queryResults]);

  const handleAuthCancel = useCallback(() => {
    const connectedPlatform = Object.entries(connectedPlatforms).find(([key, value]) => value.connected);
    if (connectedPlatform) {
      setSelectedPlatform(connectedPlatform[0] as PlatformKey);
      setAuthToken('');
      setAuthError('');
    }
  }, [connectedPlatforms]);

  // Show auth screen if not connected
  if (!isConnected) {
    return (
      <AuthScreen
        selectedPlatform={selectedPlatform}
        selectedEnvironment={selectedEnvironment}
        authToken={authToken}
        authError={authError}
        isAuthenticating={isAuthenticating}
        connectedPlatforms={connectedPlatforms}
        onAuthTokenChange={setAuthToken}
        onAuthenticate={handleAuthenticate}
        onPlatformSwitch={handlePlatformChange}
        onCancel={handleAuthCancel}
      />
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

      <Header
        selectedPlatform={selectedPlatform}
        selectedEnvironment={selectedEnvironment}
        connectedPlatforms={connectedPlatforms}
        isLoading={isLoading || isQueryLoading}
        onPlatformChange={handlePlatformChange}
        onEnvironmentChange={setSelectedEnvironment}
        onRefresh={handleRefresh}
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          selectedPlatform={selectedPlatform}
          selectedEndpoint={selectedEndpoint}
          discoveredEndpoints={discoveredEndpoints}
          isDiscovering={isDiscovering}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onEndpointSelect={handleEndpointSelect}
          onDiscoverEndpoints={discoverEndpoints}
        />

        <main className="flex-1 overflow-auto bg-gray-50">
          {activeTab === 'info' && (
            <InfoTab
              selectedPlatform={selectedPlatform}
              selectedEnvironment={selectedEnvironment}
              onDisconnect={handleDisconnect}
            />
          )}

          {activeTab === 'discovery' && (
            <DiscoveryTab
              selectedPlatform={selectedPlatform}
              discoveredEndpoints={discoveredEndpoints}
              isDiscovering={isDiscovering}
              onDiscoverEndpoints={discoverEndpoints}
            />
          )}

          {activeTab === 'query' && (
            <QueryBuilder
              selectedEndpoint={selectedEndpoint}
              availableFilters={availableFilters}
              activeFilters={activeFilters}
              queryText={queryText}
              queryLocked={queryLocked}
              queryResults={queryResults}
              queryError={queryError}
              isLoading={isQueryLoading}
              onAddFilter={handleAddFilter}
              onUpdateFilter={handleUpdateFilter}
              onRemoveFilter={handleRemoveFilter}
              onQueryTextChange={setQueryText}
              onToggleQueryLock={() => setQueryLocked(!queryLocked)}
              onExecuteQuery={handleExecuteQuery}
              onExportData={handleExportData}
              onCopyData={copyToClipboard}
            />
          )}

          {activeTab === 'export' && (
            <ExportTab
              queryResults={queryResults}
              exportFormat={exportFormat}
              onExportFormatChange={setExportFormat}
              onExportData={handleExportData}
              onCopyData={copyToClipboard}
            />
          )}

          {activeTab === 'history' && (
            <HistoryTab queryHistory={queryHistory} />
          )}
        </main>
      </div>
    </div>
  );
};

// Tab Components (memoized for performance)
const InfoTab = React.memo<{
  selectedPlatform: PlatformKey;
  selectedEnvironment: string;
  onDisconnect: () => void;
}>(({ selectedPlatform, selectedEnvironment, onDisconnect }) => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Platform Information</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-gray-500">Platform</dt>
          <dd className="text-sm font-medium text-gray-900">{PLATFORM_CONFIGS[selectedPlatform].name}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Environment</dt>
          <dd className="text-sm font-medium text-gray-900">{selectedEnvironment}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Base URL</dt>
          <dd className="text-sm font-medium text-gray-900 font-mono text-xs">{PLATFORM_CONFIGS[selectedPlatform].baseUrl}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Status</dt>
          <dd className="text-sm font-medium text-green-600">Connected</dd>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onDisconnect}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Disconnect from {PLATFORM_CONFIGS[selectedPlatform].name}
        </button>
      </div>
    </div>
  </div>
));

const DiscoveryTab = React.memo<{
  selectedPlatform: PlatformKey;
  discoveredEndpoints: Record<PlatformKey, Record<string, EndpointConfig>>;
  isDiscovering: boolean;
  onDiscoverEndpoints: () => void;
}>(({ selectedPlatform, discoveredEndpoints, isDiscovering, onDiscoverEndpoints }) => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">API Discovery</h2>
      <button
        onClick={onDiscoverEndpoints}
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
));

const ExportTab = React.memo<{
  queryResults: any;
  exportFormat: string;
  onExportFormatChange: (format: string) => void;
  onExportData: () => void;
  onCopyData: (text: string, label: string) => void;
}>(({ queryResults, exportFormat, onExportFormatChange, onExportData, onCopyData }) => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Export Center</h2>
      <p className="text-sm text-gray-600 mb-6">
        Export your data in various formats. Run a query first to export results.
      </p>
      
      {queryResults ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => onExportFormatChange(e.target.value)}
              className="w-64 px-3 py-2 border border-gray-300 rounded"
            >
              <option value="csv">CSV - Comma-separated values</option>
              <option value="json">JSON - JavaScript Object Notation</option>
              <option value="excel">Excel - Microsoft Excel format</option>
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onExportData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export Data
            </button>
            <button
              onClick={() => {
                const text = JSON.stringify(queryResults.data, null, 2);
                onCopyData(text, 'Data copied to clipboard!');
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
));

const HistoryTab = React.memo<{
  queryHistory: any[];
}>(({ queryHistory }) => (
  <div className="p-6">
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Query History</h2>
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
));

export default PMSInspectorOptimized;