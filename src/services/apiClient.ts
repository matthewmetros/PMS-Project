import { PlatformKey, QueryResult, QueryError } from '../types/pms.types';

interface ApiConfig {
  baseUrl: string;
  defaultHeaders: Record<string, string>;
}

interface ApiRequest {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  params?: Record<string, any>;
  body?: any;
}

export class ApiClient {
  private config: ApiConfig;
  private token: string;

  constructor(platform: PlatformKey, token: string) {
    this.token = token;
    this.config = this.getApiConfig(platform);
  }

  private getApiConfig(platform: PlatformKey): ApiConfig {
    const configs = {
      hospitable: {
        baseUrl: 'https://api.hospitable.com/v1',
        defaultHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      },
      guesty: {
        baseUrl: 'https://api.guesty.com/api/v2',
        defaultHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      },
      ownerrez: {
        baseUrl: 'https://api.ownerreservations.com/v2',
        defaultHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      },
      hostaway: {
        baseUrl: 'https://api.hostaway.com/v1',
        defaultHeaders: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      }
    };

    return configs[platform];
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  async request<T = any>(request: ApiRequest): Promise<T> {
    const { endpoint, method, params, body } = request;
    const url = this.buildUrl(endpoint, method === 'GET' ? params : undefined);

    const options: RequestInit = {
      method,
      headers: this.config.defaultHeaders,
      mode: 'cors',
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as T;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async discoverEndpoints(): Promise<Record<string, any>> {
    // For Hospitable API, we'll define known endpoints
    // In a real implementation, you might call an introspection endpoint
    return {
      '/properties': {
        methods: ['GET', 'POST'],
        description: 'Manage properties',
        parameters: {
          limit: { type: 'number', description: 'Number of results per page', default: 20 },
          offset: { type: 'number', description: 'Number of results to skip', default: 0 },
          status: { type: 'enum', values: ['active', 'inactive'], description: 'Property status' }
        }
      },
      '/reservations': {
        methods: ['GET', 'POST', 'PUT'],
        description: 'Manage reservations',
        parameters: {
          limit: { type: 'number', description: 'Number of results per page', default: 20 },
          offset: { type: 'number', description: 'Number of results to skip', default: 0 },
          status: { type: 'enum', values: ['pending', 'confirmed', 'cancelled'], description: 'Reservation status' },
          check_in_after: { type: 'date', description: 'Filter by check-in date' },
          check_out_before: { type: 'date', description: 'Filter by check-out date' }
        }
      },
      '/guests': {
        methods: ['GET', 'POST', 'PUT'],
        description: 'Manage guests',
        parameters: {
          limit: { type: 'number', description: 'Number of results per page', default: 20 },
          offset: { type: 'number', description: 'Number of results to skip', default: 0 },
          email: { type: 'string', description: 'Filter by guest email' }
        }
      },
      '/messages': {
        methods: ['GET', 'POST'],
        description: 'Manage guest messages',
        parameters: {
          limit: { type: 'number', description: 'Number of results per page', default: 20 },
          offset: { type: 'number', description: 'Number of results to skip', default: 0 },
          reservation_id: { type: 'string', description: 'Filter by reservation ID' }
        }
      },
      '/pricing': {
        methods: ['GET', 'PUT'],
        description: 'Manage pricing rules',
        parameters: {
          property_id: { type: 'string', description: 'Property ID', required: true },
          start_date: { type: 'date', description: 'Start date for pricing', required: true },
          end_date: { type: 'date', description: 'End date for pricing', required: true }
        }
      }
    };
  }

  async executeQuery(endpoint: string, params?: Record<string, any>): Promise<QueryResult> {
    try {
      const response = await this.request({
        endpoint,
        method: 'GET',
        params
      });

      // Handle different response formats
      let data: any[] = [];
      let count = 0;

      if (Array.isArray(response)) {
        data = response;
        count = response.length;
      } else if (response && typeof response === 'object') {
        // Handle paginated responses
        if (response.data && Array.isArray(response.data)) {
          data = response.data;
          count = response.total || response.count || response.data.length;
        } else if (response.results && Array.isArray(response.results)) {
          data = response.results;
          count = response.total || response.count || response.results.length;
        } else {
          // Single object response
          data = [response];
          count = 1;
        }
      }

      return {
        success: true,
        count,
        data,
        executionTime: '< 1s',
        metadata: {
          endpoint,
          params,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown API error',
        details: `Failed to execute query: ${endpoint}`
      } as QueryError;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch a simple endpoint to test the connection
      await this.request({
        endpoint: '/properties',
        method: 'GET',
        params: { limit: 1 }
      });
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}