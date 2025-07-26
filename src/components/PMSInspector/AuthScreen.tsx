import React from 'react';
import { Database } from 'lucide-react';
import { PlatformKey, PlatformConnection } from '../../types/pms.types';
import { PLATFORM_CONFIGS } from '../../constants/platforms';

interface AuthScreenProps {
  selectedPlatform: PlatformKey;
  selectedEnvironment: string;
  authToken: string;
  authError: string;
  isAuthenticating: boolean;
  connectedPlatforms: Record<PlatformKey, PlatformConnection>;
  onAuthTokenChange: (token: string) => void;
  onAuthenticate: () => void;
  onPlatformSwitch: (platform: PlatformKey) => void;
  onCancel: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  selectedPlatform,
  selectedEnvironment,
  authToken,
  authError,
  isAuthenticating,
  connectedPlatforms,
  onAuthTokenChange,
  onAuthenticate,
  onPlatformSwitch,
  onCancel
}) => {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Connect to {PLATFORM_CONFIGS[selectedPlatform].name}
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
              onChange={(e) => onAuthTokenChange(e.target.value)}
              placeholder="Enter your API token..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && onAuthenticate()}
            />
            <p className="mt-1 text-xs text-gray-500">
              You can find your API token in your {PLATFORM_CONFIGS[selectedPlatform].name} account settings
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          )}

          <button
            onClick={onAuthenticate}
            disabled={!authToken || isAuthenticating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isAuthenticating ? 'Authenticating...' : 'Authorize'}
          </button>
          
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Other Platforms</h3>
          <div className="space-y-2">
            {Object.entries(PLATFORM_CONFIGS).map(([key, platform]) => (
              <button
                key={key}
                onClick={() => onPlatformSwitch(key as PlatformKey)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                  key === selectedPlatform
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>{platform.name}</span>
                {connectedPlatforms[key as PlatformKey].connected && (
                  <span className="text-xs text-green-600">Connected</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};