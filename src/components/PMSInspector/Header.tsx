import React from 'react';
import { RefreshCw } from 'lucide-react';
import { PlatformKey, PlatformConnection } from '../../types/pms.types';
import { PLATFORM_CONFIGS } from '../../constants/platforms';

interface HeaderProps {
  selectedPlatform: PlatformKey;
  selectedEnvironment: string;
  connectedPlatforms: Record<PlatformKey, PlatformConnection>;
  isLoading: boolean;
  onPlatformChange: (platform: PlatformKey) => void;
  onEnvironmentChange: (environment: string) => void;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedPlatform,
  selectedEnvironment,
  connectedPlatforms,
  isLoading,
  onPlatformChange,
  onEnvironmentChange,
  onRefresh
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-800">PMS Inspector</h1>
        <div className="flex items-center gap-2">
          <select
            value={selectedPlatform}
            onChange={(e) => onPlatformChange(e.target.value as PlatformKey)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            {Object.entries(PLATFORM_CONFIGS).map(([key, platform]) => (
              <option key={key} value={key}>
                {platform.name} {connectedPlatforms[key as PlatformKey].connected ? '✓' : '○'}
              </option>
            ))}
          </select>
          <select
            value={selectedEnvironment}
            onChange={(e) => onEnvironmentChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            {PLATFORM_CONFIGS[selectedPlatform].environments.map(env => (
              <option key={env} value={env.toLowerCase()}>{env}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={onRefresh}
        className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${isLoading ? 'animate-spin' : ''}`}
      >
        <RefreshCw className="w-4 h-4 text-gray-600" />
      </button>
    </header>
  );
};