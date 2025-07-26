import { useState, useCallback } from 'react';
import { NOTIFICATION_DURATION } from '../constants/platforms';

export const useClipboard = () => {
  const [copyNotification, setCopyNotification] = useState('');

  const copyToClipboard = useCallback((text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    setCopyNotification(label || 'Copied!');
    setTimeout(() => setCopyNotification(''), NOTIFICATION_DURATION);
  }, []);

  return { copyNotification, copyToClipboard };
};