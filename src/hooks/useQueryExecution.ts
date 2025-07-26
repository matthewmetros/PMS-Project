import { useState, useCallback } from 'react';
import { QueryResult, QueryError, QueryHistoryEntry, PlatformKey } from '../types/pms.types';
import { generateMockData } from '../utils/mockData';
import { QUERY_HISTORY_LIMIT } from '../constants/platforms';

export const useQueryExecution = () => {
  const [queryResults, setQueryResults] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<QueryError | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const executeQuery = useCallback((
    queryText: string, 
    selectedPlatform: PlatformKey, 
    selectedEndpoint: string | null
  ) => {
    setIsLoading(true);
    setQueryError(null);
    
    const entry: QueryHistoryEntry = {
      query: queryText,
      timestamp: new Date().toISOString(),
      platform: selectedPlatform,
      endpoint: selectedEndpoint
    };
    
    setQueryHistory(prev => [entry, ...prev.slice(0, QUERY_HISTORY_LIMIT - 1)]);
    
    // Simulate API call
    setTimeout(() => {
      if (Math.random() > 0.8) {
        setQueryError({
          code: 'ERROR',
          message: 'Query failed. Please check your syntax.',
          details: 'Invalid query format'
        });
        setQueryResults(null);
      } else {
        const count = Math.floor(Math.random() * 20) + 5;
        const data = generateMockData(selectedEndpoint || '', count);
        
        setQueryResults({
          success: true,
          count: data.length,
          data: data,
          executionTime: `${Math.floor(Math.random() * 200) + 50}ms`
        });
      }
      setIsLoading(false);
    }, 800);
  }, []);

  const clearResults = useCallback(() => {
    setQueryResults(null);
    setQueryError(null);
  }, []);

  return {
    queryResults,
    queryError,
    queryHistory,
    isLoading,
    executeQuery,
    clearResults
  };
};