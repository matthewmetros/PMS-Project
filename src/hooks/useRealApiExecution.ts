import { useState, useCallback, useRef } from 'react';
import { QueryResult, QueryError, QueryHistoryEntry, PlatformKey } from '../types/pms.types';
import { ApiClient } from '../services/apiClient';
import { QUERY_HISTORY_LIMIT } from '../constants/platforms';

export const useRealApiExecution = () => {
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<QueryError | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  
  const apiClientRef = useRef<ApiClient | null>(null);

  const initializeApiClient = useCallback(async (platform: PlatformKey, token: string): Promise<boolean> => {
    setConnectionStatus('connecting');
    
    try {
      const client = new ApiClient(platform, token);
      const isConnected = await client.testConnection();
      
      if (isConnected) {
        apiClientRef.current = client;
        setConnectionStatus('connected');
        return true;
      } else {
        setConnectionStatus('error');
        return false;
      }
    } catch (error) {
      console.error('Failed to initialize API client:', error);
      setConnectionStatus('error');
      return false;
    }
  }, []);

  const discoverEndpoints = useCallback(async () => {
    if (!apiClientRef.current) {
      throw new Error('API client not initialized');
    }
    
    return await apiClientRef.current.discoverEndpoints();
  }, []);

  const executeQuery = useCallback(async (
    queryText: string, 
    selectedPlatform: PlatformKey, 
    selectedEndpoint: string | null,
    filters?: Record<string, any>
  ) => {
    if (!apiClientRef.current) {
      setQueryError({
        code: 'CONNECTION_ERROR',
        message: 'API client not initialized. Please connect first.',
        details: 'No active API connection'
      });
      return;
    }

    setIsLoading(true);
    setQueryError(null);
    
    // Parse endpoint from query text
    const endpoint = selectedEndpoint || parseEndpointFromQuery(queryText);
    const params = filters || parseParamsFromQuery(queryText);
    
    const entry: QueryHistoryEntry = {
      query: queryText,
      timestamp: new Date().toISOString(),
      platform: selectedPlatform,
      endpoint: endpoint
    };
    
    setQueryHistory(prev => [entry, ...prev.slice(0, QUERY_HISTORY_LIMIT - 1)]);
    
    try {
      const result = await apiClientRef.current.executeQuery(endpoint, params);
      setQueryResults(result);
    } catch (error) {
      console.error('Query execution failed:', error);
      setQueryError(error as QueryError);
      setQueryResults(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setQueryResults(null);
    setQueryError(null);
  }, []);

  const disconnect = useCallback(() => {
    apiClientRef.current = null;
    setConnectionStatus('disconnected');
    clearResults();
  }, [clearResults]);

  return {
    queryResults,
    queryError,
    queryHistory,
    isLoading,
    connectionStatus,
    executeQuery,
    clearResults,
    initializeApiClient,
    discoverEndpoints,
    disconnect
  };
};

// Helper functions to parse query text
function parseEndpointFromQuery(queryText: string): string {
  const match = queryText.match(/(?:GET|POST|PUT|DELETE)\s+([^\s?]+)/i);
  return match ? match[1] : '/properties';
}

function parseParamsFromQuery(queryText: string): Record<string, any> {
  const params: Record<string, any> = {};
  const queryPart = queryText.split('?')[1];
  
  if (queryPart) {
    const urlParams = new URLSearchParams(queryPart);
    urlParams.forEach((value, key) => {
      // Try to parse as number or boolean
      if (value === 'true') params[key] = true;
      else if (value === 'false') params[key] = false;
      else if (!isNaN(Number(value)) && value !== '') params[key] = Number(value);
      else params[key] = value;
    });
  }
  
  return params;
}