export type UserRole = 'admin' | 'user';

export type DeviceStatus = 'whitelisted' | 'pending' | 'blocked' | 'none';

export interface DeviceInfo {
  id: string; // Persistent unique device fingerprint
  name: string; // e.g., "Windows 11 · Chrome 126"
  browser: string;
  os: string;
  screenResolution: string;
  userAgent?: string;
  ip?: string;
  lastActive?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  boundDeviceId: string | null;
  boundDeviceName: string | null;
  boundDeviceBrowser: string | null;
  boundDeviceRegisteredAt: string | null;
  deviceStatus: DeviceStatus;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

export interface ExtractionLogItem {
  id: string;
  userId: string;
  username: string;
  userRole: UserRole;
  timestamp: string;
  fileCount: number;
  fileNames: string[];
  phoneCount: number;
  extractionMode: 'one_per_file' | 'all_numbers';
  deviceInfo: {
    id: string;
    name: string;
    ip?: string;
  };
  samplePhones: string[];
}
