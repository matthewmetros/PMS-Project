import React from 'react';
import { Info, Search, Code, Download, Calendar } from 'lucide-react';
import { TabId, TabConfig } from '../../types/pms.types';

const TABS: TabConfig[] = [
  { id: 'info', label: 'Info', icon: Info },
  { id: 'discovery', label: 'API Discovery', icon: Search },
  { id: 'query', label: 'Query Builder', icon: Code },
  { id: 'export', label: 'Export Center', icon: Download },
  { id: 'history', label: 'History', icon: Calendar }
];

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="flex">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-blue-600 bg-blue-50'
                : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};