// server.ts
import express from "express";
import path2 from "path";
import { fileURLToPath } from "url";

// src/server/routes.ts
import { Router } from "express";

// src/server/storage.ts
import fs from "fs";
import path from "path";
var DATA_DIR = path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "app_db.json");
var realInitialDatabase = {
  users: [
    {
      id: "usr_admin_master",
      username: "admin",
      name: "Administrator",
      passwordHash: "admin123",
      role: "admin",
      boundDeviceId: null,
      // Admin login has no device restriction
      boundDeviceName: null,
      boundDeviceBrowser: null,
      boundDeviceRegisteredAt: null,
      deviceStatus: "whitelisted",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastLoginAt: null,
      lastLoginIp: null
    }
  ],
  logs: []
  // Clean, empty log history - only populated when real extractions occur
};
function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}
function readDb() {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(realInitialDatabase, null, 2), "utf-8");
    return realInitialDatabase;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = realInitialDatabase.users;
      writeDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error("Error reading DB, using clean seed:", err);
    return realInitialDatabase;
  }
}
function writeDb(data) {
  ensureDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// src/server/routes.ts
var apiRouter = Router();
var activeTokens = /* @__PURE__ */ new Map();
function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Sesi tidak valid. Silakan login kembali." });
    return;
  }
  const token = authHeader.substring(7);
  const session = activeTokens.get(token);
  if (!session) {
    res.status(401).json({ error: "Sesi telah berakhir. Silakan login kembali." });
    return;
  }
  const db = readDb();
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    res.status(401).json({ error: "Pengguna tidak ditemukan." });
    return;
  }
  req.user = user;
  req.token = token;
  next();
}
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    const user = req.user;
    if (user.role !== "admin") {
      res.status(403).json({ error: "Hanya Admin yang diizinkan mengakses fitur ini." });
      return;
    }
    next();
  });
}
apiRouter.post("/auth/login", (req, res) => {
  const { username, password, device } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Username dan password wajib diisi." });
    return;
  }
  const db = readDb();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: "Username atau kata sandi tidak cocok." });
    return;
  }
  const clientIp = getClientIp(req);
  const deviceId = device?.id || "UNKNOWN_DEVICE";
  const deviceName = device?.name || "Perangkat Web";
  const deviceBrowser = device?.browser || "Browser";
  if (user.role === "user") {
    if (!device?.id) {
      res.status(400).json({ error: "Informasi identitas perangkat tidak terdeteksi." });
      return;
    }
    if (!user.boundDeviceId) {
      user.boundDeviceId = deviceId;
      user.boundDeviceName = deviceName;
      user.boundDeviceBrowser = deviceBrowser;
      user.boundDeviceRegisteredAt = (/* @__PURE__ */ new Date()).toISOString();
      user.deviceStatus = "whitelisted";
    } else {
      if (user.boundDeviceId !== deviceId) {
        res.status(403).json({
          error: `Akses Ditolak: 1 akun pengguna hanya dapat digunakan pada 1 perangkat. Akun Anda telah terikat pada perangkat lain (${user.boundDeviceName || user.boundDeviceId}). Hubungi Admin untuk melakukan whitelist atau reset perangkat Anda.`,
          isDeviceMismatch: true,
          registeredDevice: {
            id: user.boundDeviceId,
            name: user.boundDeviceName,
            registeredAt: user.boundDeviceRegisteredAt
          },
          currentDevice: {
            id: deviceId,
            name: deviceName
          }
        });
        return;
      }
      if (user.deviceStatus === "blocked") {
        res.status(403).json({
          error: "Perangkat Anda telah diblokir oleh Admin. Hubungi Admin untuk membuka blokir."
        });
        return;
      }
    }
  }
  user.lastLoginAt = (/* @__PURE__ */ new Date()).toISOString();
  user.lastLoginIp = clientIp;
  writeDb(db);
  const token = `token_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  activeTokens.set(token, { userId: user.id, role: user.role, deviceId });
  const { passwordHash: _, ...safeUser } = user;
  res.json({
    message: "Login berhasil.",
    user: safeUser,
    token
  });
});
apiRouter.get("/auth/me", requireAuth, (req, res) => {
  const user = req.user;
  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});
apiRouter.post("/auth/logout", requireAuth, (req, res) => {
  const token = req.token;
  activeTokens.delete(token);
  res.json({ message: "Logout berhasil." });
});
apiRouter.get("/admin/users", requireAdmin, (_req, res) => {
  const db = readDb();
  const safeUsers = db.users.map(({ passwordHash: _, ...u }) => u);
  res.json({ users: safeUsers });
});
apiRouter.post("/admin/users", requireAdmin, (req, res) => {
  const { username, name, password, role } = req.body;
  if (!username || !password || !name) {
    res.status(400).json({ error: "Username, Nama, dan Password wajib diisi." });
    return;
  }
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: "Username minimal 3 karakter." });
    return;
  }
  const db = readDb();
  const existing = db.users.find((u) => u.username.toLowerCase() === cleanUsername);
  if (existing) {
    res.status(400).json({ error: `Username "${cleanUsername}" sudah digunakan.` });
    return;
  }
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUsername,
    name: name.trim(),
    passwordHash: password.trim(),
    role: role === "admin" ? "admin" : "user",
    boundDeviceId: null,
    boundDeviceName: null,
    boundDeviceBrowser: null,
    boundDeviceRegisteredAt: null,
    deviceStatus: "whitelisted",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    lastLoginAt: null,
    lastLoginIp: null
  };
  db.users.push(newUser);
  writeDb(db);
  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({ message: "Akun baru berhasil dibuat.", user: safeUser });
});
apiRouter.delete("/admin/users/:userId", requireAdmin, (req, res) => {
  const { userId } = req.params;
  const currentAdmin = req.user;
  if (userId === currentAdmin.id) {
    res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri." });
    return;
  }
  const db = readDb();
  const initialLen = db.users.length;
  db.users = db.users.filter((u) => u.id !== userId);
  if (db.users.length === initialLen) {
    res.status(404).json({ error: "User tidak ditemukan." });
    return;
  }
  writeDb(db);
  res.json({ message: "Akun berhasil dihapus." });
});
apiRouter.post("/admin/users/:userId/password", requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.trim().length < 4) {
    res.status(400).json({ error: "Password baru minimal 4 karakter." });
    return;
  }
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ error: "User tidak ditemukan." });
    return;
  }
  user.passwordHash = newPassword.trim();
  writeDb(db);
  res.json({ message: `Password untuk user "${user.username}" berhasil diperbarui.` });
});
apiRouter.post("/admin/devices/:userId/reset", requireAdmin, (req, res) => {
  const { userId } = req.params;
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ error: "User tidak ditemukan." });
    return;
  }
  const prevDevice = user.boundDeviceName || user.boundDeviceId || "Belum ada";
  user.boundDeviceId = null;
  user.boundDeviceName = null;
  user.boundDeviceBrowser = null;
  user.boundDeviceRegisteredAt = null;
  user.deviceStatus = "none";
  writeDb(db);
  res.json({
    message: `Perangkat (${prevDevice}) untuk akun ${user.username} berhasil di-reset. Pengguna sekarang dapat login menggunakan perangkat barunya.`,
    user
  });
});
apiRouter.post("/admin/devices/:userId/status", requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;
  if (!status || !["whitelisted", "blocked", "pending"].includes(status)) {
    res.status(400).json({ error: "Status tidak valid." });
    return;
  }
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    res.status(404).json({ error: "User tidak ditemukan." });
    return;
  }
  user.deviceStatus = status;
  writeDb(db);
  res.json({
    message: `Status perangkat user ${user.username} diubah menjadi "${status}".`,
    user
  });
});
apiRouter.get("/logs/extractions", requireAuth, (req, res) => {
  const currentUser = req.user;
  const db = readDb();
  let logs = db.logs;
  if (currentUser.role !== "admin") {
    logs = logs.filter((l) => l.userId === currentUser.id);
  } else {
    const filterUserId = req.query.userId;
    if (filterUserId) {
      logs = logs.filter((l) => l.userId === filterUserId);
    }
  }
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json({ logs });
});
apiRouter.post("/logs/extractions", requireAuth, (req, res) => {
  const currentUser = req.user;
  const { fileCount, fileNames, phoneCount, extractionMode, deviceInfo, samplePhones } = req.body;
  const db = readDb();
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId: currentUser.id,
    username: currentUser.username,
    userRole: currentUser.role,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    fileCount: Number(fileCount) || 0,
    fileNames: Array.isArray(fileNames) ? fileNames : [],
    phoneCount: Number(phoneCount) || 0,
    extractionMode: extractionMode === "all_numbers" ? "all_numbers" : "one_per_file",
    deviceInfo: {
      id: deviceInfo?.id || currentUser.boundDeviceId || "UNKNOWN",
      name: deviceInfo?.name || currentUser.boundDeviceName || "Perangkat Web",
      ip: getClientIp(req)
    },
    samplePhones: Array.isArray(samplePhones) ? samplePhones.slice(0, 5) : []
  };
  db.logs.unshift(newLog);
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  writeDb(db);
  res.status(201).json({ message: "Log ekstraksi dicatat.", log: newLog });
});

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3e3);
  const isProduction = process.env.NODE_ENV === "production" || process.argv.includes("--production");
  app.use(express.json());
  app.use("/api", apiRouter);
  app.use("/api", (err, _req, res, _next) => {
    console.error("API error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Kesalahan internal server." });
    }
  });
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      configFile: path2.resolve(__dirname, "vite.config.ts"),
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === "true" ? false : void 0
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  }
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT} (mode: ${isProduction ? "production" : "development"})`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
