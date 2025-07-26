import React from 'react';
import { X, Lock, Unlock, Copy } from 'lucide-react';
import { ActiveFilter, EndpointParameter, QueryResult, QueryError } from '../../types/pms.types';

interface QueryBuilderProps {
  selectedEndpoint: string | null;
  availableFilters: Record<string, EndpointParameter>;
  activeFilters: ActiveFilter[];
  queryText: string;
  queryLocked: boolean;
  queryResults: QueryResult | null;
  queryError: QueryError | null;
  isLoading: boolean;
  onAddFilter: (filterKey: string) => void;
  onUpdateFilter: (index: number, value: string) => void;
  onRemoveFilter: (index: number) => void;
  onQueryTextChange: (text: string) => void;
  onToggleQueryLock: () => void;
  onExecuteQuery: () => void;
  onExportData: () => void;
  onCopyData: (text: string, label: string) => void;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  selectedEndpoint,
  availableFilters,
  activeFilters,
  queryText,
  queryLocked,
  queryResults,
  queryError,
  isLoading,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onQueryTextChange,
  onToggleQueryLock,
  onExecuteQuery,
  onExportData,
  onCopyData
}) => {
  if (!selectedEndpoint) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Select an endpoint from the sidebar to start building queries</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Query Builder</h2>
        </div>
        
        <div className="space-y-6">
          {/* Available Filters */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Available Parameters</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(availableFilters).map(([key, filter]) => {
                const isActive = activeFilters.some(f => f.key === key);
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (!isActive) {
                        onAddFilter(key);
                      } else {
                        const index = activeFilters.findIndex(f => f.key === key);
                        if (index !== -1) onRemoveFilter(index);
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
                        onChange={(e) => onUpdateFilter(index, e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      >
                        <option value="">Select...</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : filter.type === 'enum' && filter.values ? (
                      <select
                        value={filter.value}
                        onChange={(e) => onUpdateFilter(index, e.target.value)}
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
                        onChange={(e) => onUpdateFilter(index, e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        placeholder={`Enter ${filter.key}...`}
                      />
                    )}
                    <button
                      onClick={() => onRemoveFilter(index)}
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
                onClick={onToggleQueryLock}
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
              onChange={(e) => !queryLocked && onQueryTextChange(e.target.value)}
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
              onClick={onExecuteQuery}
              disabled={!queryText || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Executing...' : 'Execute Query'}
            </button>
            {queryResults && (
              <button
                onClick={onExportData}
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
            <QueryResults 
              queryResults={queryResults}
              onCopyData={onCopyData}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const QueryResults: React.FC<{
  queryResults: QueryResult;
  onCopyData: (text: string, label: string) => void;
}> = ({ queryResults, onCopyData }) => {
  const handleCopyCSV = () => {
    const headers = Object.keys(queryResults.data[0]).join(',');
    const rows = queryResults.data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    onCopyData(csv, 'CSV data copied to clipboard!');
  };

  const handleCopyExcel = () => {
    const headers = Object.keys(queryResults.data[0]).join('\t');
    const rows = queryResults.data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && (val.includes('\t') || val.includes('\n')) 
          ? `"${val.replace(/"/g, '""')}"` 
          : val
      ).join('\t')
    );
    const excel = [headers, ...rows].join('\n');
    onCopyData(excel, 'Excel data copied to clipboard!');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">
          Results ({queryResults.count} records) • {queryResults.executionTime}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCopyCSV}
            className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 rounded border border-green-300 transition-colors flex items-center gap-1"
            title="Copy as CSV"
          >
            <Copy className="w-3 h-3" />
            CSV
          </button>
          <button
            onClick={handleCopyExcel}
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
                    onClick={() => onCopyData(String(value), `Copied: ${value}`)}
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
  );
};