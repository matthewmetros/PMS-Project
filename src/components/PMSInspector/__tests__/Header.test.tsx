import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';
import { PlatformKey } from '../../../types/pms.types';

const mockProps = {
  selectedPlatform: 'guesty' as PlatformKey,
  selectedEnvironment: 'production',
  connectedPlatforms: {
    guesty: { connected: true, token: 'test-token' },
    hospitable: { connected: false, token: null },
    ownerrez: { connected: false, token: null },
    hostaway: { connected: false, token: null }
  },
  isLoading: false,
  onPlatformChange: jest.fn(),
  onEnvironmentChange: jest.fn(),
  onRefresh: jest.fn()
};

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component title', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByText('PMS Inspector')).toBeInTheDocument();
  });

  it('displays the correct platform in dropdown', () => {
    render(<Header {...mockProps} />);
    const platformSelect = screen.getByDisplayValue('Guesty ✓');
    expect(platformSelect).toBeInTheDocument();
  });

  it('calls onPlatformChange when platform is changed', () => {
    render(<Header {...mockProps} />);
    const platformSelect = screen.getByDisplayValue('Guesty ✓');
    
    fireEvent.change(platformSelect, { target: { value: 'hospitable' } });
    expect(mockProps.onPlatformChange).toHaveBeenCalledWith('hospitable');
  });

  it('calls onRefresh when refresh button is clicked', () => {
    render(<Header {...mockProps} />);
    const refreshButton = screen.getByRole('button');
    
    fireEvent.click(refreshButton);
    expect(mockProps.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on refresh button', () => {
    render(<Header {...mockProps} isLoading={true} />);
    const refreshButton = screen.getByRole('button');
    
    expect(refreshButton).toHaveClass('animate-spin');
  });
});