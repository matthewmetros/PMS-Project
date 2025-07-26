import { PlatformConfig, PlatformKey } from '../types/pms.types';

export const PLATFORM_CONFIGS: Record<PlatformKey, PlatformConfig> = {
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

export const DEFAULT_PLATFORM: PlatformKey = 'guesty';
export const DEFAULT_ENVIRONMENT = 'production';
export const MIN_TOKEN_LENGTH = 10;
export const QUERY_HISTORY_LIMIT = 50;
export const NOTIFICATION_DURATION = 2000;