import React from 'react';
import { ChevronRight, Loader } from 'lucide-react';
import { PlatformKey, EndpointConfig } from '../../types/pms.types';

interface SidebarProps {
  collapsed: boolean;
  selectedPlatform: PlatformKey;
  selectedEndpoint: string | null;
  discoveredEndpoints: Record<PlatformKey, Record<string, EndpointConfig>>;
  isDiscovering: boolean;
  onToggleCollapse: () => void;
  onEndpointSelect: (endpoint: string) => void;
  onDiscoverEndpoints: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  selectedPlatform,
  selectedEndpoint,
  discoveredEndpoints,
  isDiscovering,
  onToggleCollapse,
  onEndpointSelect,
  onDiscoverEndpoints
}) => {
  return (
    <aside className={`bg-white border-r border-gray-200 transition-all duration-200 ${
      collapsed ? 'w-12' : 'w-64'
    }`}>
      <div className="p-3">
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className={`w-4 h-4 text-gray-600 transition-transform ${
            collapsed ? '' : 'rotate-180'
          }`} />
        </button>
      </div>
      
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Endpoints
            </h3>
            <button
              onClick={onDiscoverEndpoints}
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
                  onClick={() => onEndpointSelect(endpoint)}
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
  );
};