import { DeviceInfo } from '../types/auth';

/**
 * Generates or retrieves a unique persistent device ID and collects device hardware/browser attributes.
 */
export function getOrCreateDeviceInfo(): DeviceInfo {
  const STORAGE_KEY = 'mht_device_fingerprint_id';
  let deviceUuid = localStorage.getItem(STORAGE_KEY);

  if (!deviceUuid) {
    // Generate a unique, resilient UUID-like string
    const randPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timePart = Date.now().toString(36).slice(-4).toUpperCase();
    const cryptoPart = window.crypto?.randomUUID
      ? window.crypto.randomUUID().split('-')[0].toUpperCase()
      : Math.floor(Math.random() * 10000).toString(16).toUpperCase();

    deviceUuid = `DEV-${randPart}-${timePart}-${cryptoPart}`;
    try {
      localStorage.setItem(STORAGE_KEY, deviceUuid);
    } catch {
      // Storage might be restricted
    }
  }

  // Detect OS
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  // Detect Browser
  let browser = 'Browser Lain';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';

  const screenRes = typeof window !== 'undefined'
    ? `${window.screen.width}x${window.screen.height}`
    : 'Unknown';

  const friendlyName = `${os} · ${browser}`;

  return {
    id: deviceUuid,
    name: friendlyName,
    browser,
    os,
    screenResolution: screenRes,
    userAgent: ua,
    lastActive: new Date().toISOString(),
  };
}
