export type PlatformKey = 'guesty' | 'hospitable' | 'ownerrez' | 'hostaway';
export type Environment = 'production' | 'sandbox' | 'live' | 'test' | 'demo';
export type TabId = 'info' | 'discovery' | 'query' | 'export' | 'history';
export type ParameterType = 'string' | 'number' | 'boolean' | 'date' | 'enum';

export interface PlatformConfig {
  name: string;
  environments: string[];
  baseUrl: string;
}

export interface PlatformConnection {
  connected: boolean;
  token: string | null;
}

export interface EndpointParameter {
  type: ParameterType;
  description: string;
  required?: boolean;
  default?: any;
  values?: string[];
}

export interface EndpointConfig {
  methods: string[];
  description: string;
  parameters: Record<string, EndpointParameter>;
}

export interface ActiveFilter {
  key: string;
  value: string;
  type: ParameterType;
  values?: string[];
}

export interface QueryError {
  code: string;
  message: string;
  details?: string;
}

export interface QueryResult {
  success: boolean;
  count: number;
  data: Record<string, any>[];
  executionTime: string;
  metadata?: {
    endpoint: string;
    params?: Record<string, any>;
    timestamp: string;
  };
}

export interface QueryHistoryEntry {
  query: string;
  timestamp: string;
  platform: PlatformKey;
  endpoint: string | null;
}

export interface TabConfig {
  id: TabId;
  label: string;
  icon: any;
}