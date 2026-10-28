import { Router, Request, Response } from 'express';
import { readDb, writeDb } from './storage';
import { UserAccount, ExtractionLogItem, DeviceInfo } from '../types/auth';

export const apiRouter = Router();

// In-memory active tokens mapping: token -> { userId, role, deviceId }
const activeTokens = new Map<string, { userId: string; role: string; deviceId?: string }>();

// Helper to get client IP
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Auth Middleware
function requireAuth(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Sesi tidak valid. Silakan login kembali.' });
    return;
  }
  const token = authHeader.substring(7);
  const session = activeTokens.get(token);
  if (!session) {
    res.status(401).json({ error: 'Sesi telah berakhir. Silakan login kembali.' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    res.status(401).json({ error: 'Pengguna tidak ditemukan.' });
    return;
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Admin only middleware
function requireAdmin(req: Request, res: Response, next: () => void) {
  requireAuth(req, res, () => {
    const user = (req as any).user as UserAccount;
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Hanya Admin yang diizinkan mengakses fitur ini.' });
      return;
    }
    next();
  });
}

// ----------------- AUTH ROUTES ----------------- //

// Login endpoint
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, password, device } = req.body as {
    username?: string;
    password?: string;
    device?: DeviceInfo;
  };

  if (!username || !password) {
    res.status(400).json({ error: 'Username dan password wajib diisi.' });
    return;
  }

  const db = readDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );

  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: 'Username atau kata sandi tidak cocok.' });
    return;
  }

  const clientIp = getClientIp(req);
  const deviceId = device?.id || 'UNKNOWN_DEVICE';
  const deviceName = device?.name || 'Perangkat Web';
  const deviceBrowser = device?.browser || 'Browser';

  // Device Whitelist & 1 User = 1 Device Check:
  // For role 'user': 1 user can only use 1 device!
  // For role 'admin': no device restriction ("untuk admin tidak perlu whitelist itu")
  if (user.role === 'user') {
    if (!device?.id) {
      res.status(400).json({ error: 'Informasi identitas perangkat tidak terdeteksi.' });
      return;
    }

    // 1. If user doesn't have a registered device yet: Bind this first device!
    if (!user.boundDeviceId) {
      user.boundDeviceId = deviceId;
      user.boundDeviceName = deviceName;
      user.boundDeviceBrowser = deviceBrowser;
      user.boundDeviceRegisteredAt = new Date().toISOString();
      user.deviceStatus = 'whitelisted';
    } else {
      // 2. User already has a bound device. Check if the incoming device matches!
      if (user.boundDeviceId !== deviceId) {
        res.status(403).json({
          error: `Akses Ditolak: 1 akun pengguna hanya dapat digunakan pada 1 perangkat. Akun Anda telah terikat pada perangkat lain (${user.boundDeviceName || user.boundDeviceId}). Hubungi Admin untuk melakukan whitelist atau reset perangkat Anda.`,
          isDeviceMismatch: true,
          registeredDevice: {
            id: user.boundDeviceId,
            name: user.boundDeviceName,
            registeredAt: user.boundDeviceRegisteredAt,
          },
          currentDevice: {
            id: deviceId,
            name: deviceName,
          },
        });
        return;
      }

      // Check if blocked by admin
      if (user.deviceStatus === 'blocked') {
        res.status(403).json({
          error: 'Perangkat Anda telah diblokir oleh Admin. Hubungi Admin untuk membuka blokir.',
        });
        return;
      }
    }
  }

  // Update user last login
  user.lastLoginAt = new Date().toISOString();
  user.lastLoginIp = clientIp;
  writeDb(db);

  // Generate session token
  const token = `token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  activeTokens.set(token, { userId: user.id, role: user.role, deviceId });

  // Exclude password in response
  const { passwordHash: _, ...safeUser } = user;

  res.json({
    message: 'Login berhasil.',
    user: safeUser,
    token,
  });
});

// Current User Me
apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as UserAccount;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Logout
apiRouter.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = (req as any).token as string;
  activeTokens.delete(token);
  res.json({ message: 'Logout berhasil.' });
});

// ----------------- ADMIN ROUTES ----------------- //

// Get all users
apiRouter.get('/admin/users', requireAdmin, (_req: Request, res: Response) => {
  const db = readDb();
  const safeUsers = db.users.map(({ passwordHash: _, ...u }) => u);
  res.json({ users: safeUsers });
});

// Create new user account
apiRouter.post('/admin/users', requireAdmin, (req: Request, res: Response) => {
  const { username, name, password, role } = req.body as {
    username?: string;
    name?: string;
    password?: string;
    role?: 'admin' | 'user';
  };

  if (!username || !password || !name) {
    res.status(400).json({ error: 'Username, Nama, dan Password wajib diisi.' });
    return;
  }

  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'Username minimal 3 karakter.' });
    return;
  }

  const db = readDb();
  const existing = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan.` });
    return;
  }

  const newUser: UserAccount = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    name: name.trim(),
    passwordHash: password.trim(),
    role: role === 'admin' ? 'admin' : 'user',
    boundDeviceId: null,
    boundDeviceName: null,
    boundDeviceBrowser: null,
    boundDeviceRegisteredAt: null,
    deviceStatus: 'whitelisted',
    createdAt: new Date().toISOString(),
    lastLoginAt: null,
    lastLoginIp: null,
  };

  db.users.push(newUser);
  writeDb(db);

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ message: 'Akun baru berhasil dibuat.', user: safeUser });
});

// Delete user account
apiRouter.delete('/admin/users/:userId', requireAdmin, (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentAdmin = (req as any).user as UserAccount;

  if (userId === currentAdmin.id) {
    res.status(400).json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    return;
  }

  const db = readDb();
  const initialLen = db.users.length;
  db.users = db.users.filter((u) => u.id !== userId);

  if (db.users.length === initialLen) {
    res.status(404).json({ error: 'User tidak ditemukan.' });
    return;
  }

  writeDb(db);
  res.json({ message: 'Akun berhasil dihapus.' });
});

// Update user password
apiRouter.post('/admin/users/:userId/password', requireAdmin, (req: Request, res: Response) => {
  const { userId } = req.params;
  const { newPassword } = req.body as { newPassword?: string };

  if (!newPassword || newPassword.trim().length < 4) {
    res.status(400).json({ error: 'Password baru minimal 4 karakter.' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan.' });
    return;
  }

  user.passwordHash = newPassword.trim();
  writeDb(db);
  res.json({ message: `Password untuk user "${user.username}" berhasil diperbarui.` });
});

// Reset Device Binding (allowing user to bind a new device)
apiRouter.post('/admin/devices/:userId/reset', requireAdmin, (req: Request, res: Response) => {
  const { userId } = req.params;
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan.' });
    return;
  }

  const prevDevice = user.boundDeviceName || user.boundDeviceId || 'Belum ada';
  user.boundDeviceId = null;
  user.boundDeviceName = null;
  user.boundDeviceBrowser = null;
  user.boundDeviceRegisteredAt = null;
  user.deviceStatus = 'none';

  writeDb(db);
  res.json({
    message: `Perangkat (${prevDevice}) untuk akun ${user.username} berhasil di-reset. Pengguna sekarang dapat login menggunakan perangkat barunya.`,
    user,
  });
});

// Update Device Status (whitelisted, blocked, pending)
apiRouter.post('/admin/devices/:userId/status', requireAdmin, (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status } = req.body as { status?: 'whitelisted' | 'blocked' | 'pending' };

  if (!status || !['whitelisted', 'blocked', 'pending'].includes(status)) {
    res.status(400).json({ error: 'Status tidak valid.' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    res.status(404).json({ error: 'User tidak ditemukan.' });
    return;
  }

  user.deviceStatus = status;
  writeDb(db);

  res.json({
    message: `Status perangkat user ${user.username} diubah menjadi "${status}".`,
    user,
  });
});

// ----------------- EXTRACTION LOGS ROUTES ----------------- //

// Get Extraction Logs
apiRouter.get('/logs/extractions', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user as UserAccount;
  const db = readDb();

  // If admin: can view all logs, or filter by userId
  // If regular user: can only view their own logs
  let logs = db.logs;
  if (currentUser.role !== 'admin') {
    logs = logs.filter((l) => l.userId === currentUser.id);
  } else {
    const filterUserId = req.query.userId as string;
    if (filterUserId) {
      logs = logs.filter((l) => l.userId === filterUserId);
    }
  }

  // Sort by newest first
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({ logs });
});

// Record Extraction Log
apiRouter.post('/logs/extractions', requireAuth, (req: Request, res: Response) => {
  const currentUser = (req as any).user as UserAccount;
  const { fileCount, fileNames, phoneCount, extractionMode, deviceInfo, samplePhones } = req.body;

  const db = readDb();
  const newLog: ExtractionLogItem = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: currentUser.id,
    username: currentUser.username,
    userRole: currentUser.role,
    timestamp: new Date().toISOString(),
    fileCount: Number(fileCount) || 0,
    fileNames: Array.isArray(fileNames) ? fileNames : [],
    phoneCount: Number(phoneCount) || 0,
    extractionMode: extractionMode === 'all_numbers' ? 'all_numbers' : 'one_per_file',
    deviceInfo: {
      id: deviceInfo?.id || currentUser.boundDeviceId || 'UNKNOWN',
      name: deviceInfo?.name || currentUser.boundDeviceName || 'Perangkat Web',
      ip: getClientIp(req),
    },
    samplePhones: Array.isArray(samplePhones) ? samplePhones.slice(0, 5) : [],
  };

  db.logs.unshift(newLog);
  // Keep max 500 logs
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }

  writeDb(db);
  res.status(201).json({ message: 'Log ekstraksi dicatat.', log: newLog });
});
