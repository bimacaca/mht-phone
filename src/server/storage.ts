import fs from 'fs';
import path from 'path';
import { UserAccount, ExtractionLogItem } from '../types/auth';

interface AppDatabase {
  users: UserAccount[];
  logs: ExtractionLogItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_db.json');

// Real initial database seed: Master Admin account only, 0 mock users, 0 mock logs
const realInitialDatabase: AppDatabase = {
  users: [
    {
      id: 'usr_admin_master',
      username: 'admin',
      name: 'Administrator',
      passwordHash: 'admin123',
      role: 'admin',
      boundDeviceId: null, // Admin login has no device restriction
      boundDeviceName: null,
      boundDeviceBrowser: null,
      boundDeviceRegisteredAt: null,
      deviceStatus: 'whitelisted',
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      lastLoginIp: null,
    },
  ],
  logs: [], // Clean, empty log history - only populated when real extractions occur
};

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function readDb(): AppDatabase {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(realInitialDatabase, null, 2), 'utf-8');
    return realInitialDatabase;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as AppDatabase;
    // Ensure admin exists
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = realInitialDatabase.users;
      writeDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, using clean seed:', err);
    return realInitialDatabase;
  }
}

export function writeDb(data: AppDatabase) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}
