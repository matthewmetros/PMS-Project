import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '../useClipboard';

// Mock navigator.clipboard
const mockWriteText = jest.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe('useClipboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should copy text to clipboard', async () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copyToClipboard('test text');
    });

    expect(mockWriteText).toHaveBeenCalledWith('test text');
    expect(result.current.copyNotification).toBe('Copied!');
  });

  it('should copy text with custom label', async () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copyToClipboard('test text', 'Custom message');
    });

    expect(result.current.copyNotification).toBe('Custom message');
  });

  it('should clear notification after timeout', async () => {
    const { result } = renderHook(() => useClipboard());

    act(() => {
      result.current.copyToClipboard('test text');
    });

    expect(result.current.copyNotification).toBe('Copied!');

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.copyNotification).toBe('');
  });
});