import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserAccount, ExtractionLogItem } from '../types/auth';
import {
  Shield,
  Smartphone,
  Users,
  History,
  X,
  RotateCcw,
  CheckCircle,
  Ban,
  UserPlus,
  Trash2,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  KeyRound
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const { token, user: currentAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'devices' | 'users' | 'logs'>('devices');

  // State for Users & Devices
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // State for Logs
  const [logs, setLogs] = useState<ExtractionLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');

  // New User Form State
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Action notice message
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchLogs = async () => {
    if (!token) return;
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/logs/extractions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchUsers();
      fetchLogs();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  // Handler: Reset Device Binding
  const handleResetDevice = async (userId: string, username: string) => {
    if (!confirm(`Reset binding perangkat untuk akun "${username}"? User akan dapat mengikat perangkat baru saat login.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/devices/${userId}/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotice({ type: 'success', text: data.message });
        fetchUsers();
      } else {
        setActionNotice({ type: 'error', text: data.error });
      }
    } catch {
      setActionNotice({ type: 'error', text: 'Gagal menghubungi server.' });
    }
  };

  // Handler: Update Device Status
  const handleUpdateDeviceStatus = async (userId: string, status: 'whitelisted' | 'blocked') => {
    try {
      const res = await fetch(`/api/admin/devices/${userId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotice({ type: 'success', text: data.message });
        fetchUsers();
      } else {
        setActionNotice({ type: 'error', text: data.error });
      }
    } catch {
      setActionNotice({ type: 'error', text: 'Gagal menghubungi server.' });
    }
  };

  // Handler: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) {
      setFormError('Semua field wajib diisi.');
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          name: newName.trim(),
          password: newPassword.trim(),
          role: newRole,
        }),
      });

      const data = await res.json();
      setIsCreatingUser(false);

      if (res.ok) {
        setFormSuccess(`Akun "${newUsername}" berhasil dibuat!`);
        setNewUsername('');
        setNewName('');
        setNewPassword('');
        setNewRole('user');
        fetchUsers();
      } else {
        setFormError(data.error || 'Gagal membuat akun.');
      }
    } catch {
      setIsCreatingUser(false);
      setFormError('Terjadi kesalahan jaringan.');
    }
  };

  // Handler: Delete User
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Hapus akun "${username}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotice({ type: 'success', text: data.message });
        fetchUsers();
      } else {
        setActionNotice({ type: 'error', text: data.error });
      }
    } catch {
      setActionNotice({ type: 'error', text: 'Gagal menghapus user.' });
    }
  };

  // Handler: Change Password
  const handleChangePassword = async (userId: string, username: string) => {
    const newPass = prompt(`Masukkan kata sandi baru untuk akun "${username}":`);
    if (!newPass || newPass.trim().length < 4) {
      if (newPass !== null) alert('Kata sandi minimal 4 karakter.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword: newPass.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionNotice({ type: 'success', text: data.message });
      } else {
        setActionNotice({ type: 'error', text: data.error });
      }
    } catch {
      setActionNotice({ type: 'error', text: 'Gagal mengubah kata sandi.' });
    }
  };

  const filteredLogs = logs.filter((l) => {
    return (
      l.username.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.fileNames.some((f) => f.toLowerCase().includes(logSearch.toLowerCase())) ||
      (l.deviceInfo?.name || '').toLowerCase().includes(logSearch.toLowerCase()) ||
      l.samplePhones.some((p) => p.includes(logSearch))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Panel Administrator</h3>
                <span className="text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded">
                  Admin: {currentAdmin?.username}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manajemen Whitelist Device, Pembuatan Akun, & Log Ekstraksi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div
            className={`px-4 py-2 text-xs flex items-center justify-between border-b ${
              actionNotice.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-300'
                : 'bg-red-950/60 border-red-800/50 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? (
                <Check className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span>{actionNotice.text}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'devices'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Whitelist Device (1 User = 1 Device)</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              {users.filter((u) => u.role === 'user').length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Manajemen & Buat Akun</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'logs'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900/50'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Log Riwayat Ekstraksi</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
              {logs.length}
            </span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: DEVICE WHITELIST */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Tinjau & Kelola Whitelist Device Pengguna
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kebijakan: <strong className="text-emerald-400">1 User hanya dapat menggunakan 1 Device</strong>. Akun Admin bebas device. Jika user berganti perangkat atau laptop hilang, Admin dapat mengeklik tombol <em>Reset Device</em>.
                  </p>
                </div>
                <button
                  onClick={fetchUsers}
                  disabled={isLoadingUsers}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                  <span>Segarkan</span>
                </button>
              </div>

              {/* Table of User Device Bindings */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Perangkat Terikat (1 Device)</th>
                      <th className="py-2.5 px-4">Status Whitelist</th>
                      <th className="py-2.5 px-4">Login Terakhir</th>
                      <th className="py-2.5 px-4 text-right">Aksi Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                        {/* User */}
                        <td className="py-3 px-4 font-sans">
                          <div className="font-semibold text-white">{u.username}</div>
                          <div className="text-[11px] text-slate-500">{u.name}</div>
                        </td>

                        {/* Role */}
                        <td className="py-3 px-4 font-sans">
                          {u.role === 'admin' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-800/40">
                              Admin (Bebas Device)
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-950/60 text-blue-300 border border-blue-800/40">
                              User (1 Device)
                            </span>
                          )}
                        </td>

                        {/* Device Info */}
                        <td className="py-3 px-4 font-sans">
                          {u.role === 'admin' ? (
                            <span className="text-slate-500 italic">Tidak dibatasi device</span>
                          ) : u.boundDeviceId ? (
                            <div>
                              <div className="text-emerald-400 font-medium">
                                {u.boundDeviceName || 'Perangkat Terdaftar'}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={u.boundDeviceId}>
                                ID: {u.boundDeviceId}
                              </div>
                            </div>
                          ) : (
                            <span className="text-amber-400/90 italic">
                              Belum mengikat device (akan auto-bind saat login pertama)
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 font-sans">
                          {u.role === 'admin' ? (
                            <span className="text-slate-400 text-[11px]">Bebas</span>
                          ) : u.deviceStatus === 'whitelisted' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Di-whitelist</span>
                            </span>
                          ) : u.deviceStatus === 'blocked' ? (
                            <span className="inline-flex items-center gap-1 text-red-400 font-medium text-[11px]">
                              <Ban className="w-3.5 h-3.5" />
                              <span>Diblokir</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Belum Ada</span>
                          )}
                        </td>

                        {/* Last Login */}
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {u.lastLoginAt ? (
                            <div>
                              <div>{new Date(u.lastLoginAt).toLocaleDateString('id-ID')}</div>
                              <div className="text-[10px] text-slate-500">{new Date(u.lastLoginAt).toLocaleTimeString('id-ID')}</div>
                            </div>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right font-sans">
                          {u.role !== 'admin' && (
                            <div className="flex items-center justify-end gap-1.5">
                              {u.boundDeviceId && (
                                <button
                                  onClick={() => handleResetDevice(u.id, u.username)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 rounded transition-colors cursor-pointer"
                                  title="Hapus ikatan device lama agar user bisa login di device baru"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reset Device</span>
                                </button>
                              )}

                              {u.deviceStatus === 'blocked' ? (
                                <button
                                  onClick={() => handleUpdateDeviceStatus(u.id, 'whitelisted')}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:text-white bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 rounded transition-colors cursor-pointer"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Buka Blokir</span>
                                </button>
                              ) : (
                                u.boundDeviceId && (
                                  <button
                                    onClick={() => handleUpdateDeviceStatus(u.id, 'blocked')}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-red-300 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 rounded transition-colors cursor-pointer"
                                  >
                                    <Ban className="w-3 h-3" />
                                    <span>Blokir</span>
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE & CREATE USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Create User Form */}
              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>Buat Akun Pengguna Baru</span>
                </div>

                {formError && (
                  <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300">
                    {formSuccess}
                  </div>
                )}

                <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      placeholder="e.g. staf_jakarta"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="e.g. Ahmad Fauzi"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Kata Sandi</label>
                    <input
                      type="password"
                      placeholder="Password akun"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Role / Peran</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value as 'user' | 'admin')}
                      className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="user">User (1 User = 1 Device)</option>
                      <option value="admin">Admin (Bebas Device)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isCreatingUser}
                      className="px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      {isCreatingUser ? 'Menyimpan...' : '+ Tambahkan Akun Baru'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Users List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white">Daftar Akun Terdaftar ({users.length})</h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Username</th>
                        <th className="py-2.5 px-4">Nama</th>
                        <th className="py-2.5 px-4">Role</th>
                        <th className="py-2.5 px-4">Dibuat Pada</th>
                        <th className="py-2.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 px-4 font-mono font-semibold text-emerald-400">
                            {u.username}
                          </td>
                          <td className="py-2.5 px-4 text-slate-300">{u.name}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.role === 'admin'
                                  ? 'bg-purple-950 text-purple-300 border border-purple-800/40'
                                  : 'bg-blue-950 text-blue-300 border border-blue-800/40'
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleChangePassword(u.id, u.username)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                title="Ubah kata sandi"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              {u.id !== currentAdmin?.id ? (
                                <button
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                  title="Hapus akun"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-600 italic px-1">Anda</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EXTRACTION HISTORY LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Log Riwayat Ekstraksi Nomor Seluruh Pengguna
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Catatan audit setiap kali pengguna melakukan pemindaian nomor dari berkas .mht.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari user, file, nomor..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 font-mono"
                    />
                  </div>
                  <button
                    onClick={fetchLogs}
                    disabled={isLoadingLogs}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Logs Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Waktu</th>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Perangkat</th>
                      <th className="py-2.5 px-4 text-center">Berkas .MHT</th>
                      <th className="py-2.5 px-4 text-center">Nomor (62xx)</th>
                      <th className="py-2.5 px-4">Cuplikan Nomor Ditemukan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-mono">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                          {/* Timestamp */}
                          <td className="py-3 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                            <div>{new Date(log.timestamp).toLocaleDateString('id-ID')}</div>
                            <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</div>
                          </td>

                          {/* User */}
                          <td className="py-3 px-4 font-sans">
                            <div className="font-semibold text-white">{log.username}</div>
                            <span className="text-[10px] text-slate-500">
                              {log.userRole === 'admin' ? 'Admin' : 'Operator'}
                            </span>
                          </td>

                          {/* Device Info */}
                          <td className="py-3 px-4 font-sans text-slate-300">
                            <div>{log.deviceInfo.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              IP: {log.deviceInfo.ip || '-'}
                            </div>
                          </td>

                          {/* File Count */}
                          <td className="py-3 px-4 text-center">
                            <span className="text-white font-semibold tabular-nums">
                              {log.fileCount} file
                            </span>
                            <div className="text-[10px] text-slate-500 truncate max-w-[120px] mx-auto font-sans" title={log.fileNames.join(', ')}>
                              {log.fileNames[0] || ''}
                            </div>
                          </td>

                          {/* Phone Count */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-bold rounded tabular-nums">
                              {log.phoneCount} nomor
                            </span>
                          </td>

                          {/* Sample Phones */}
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {log.samplePhones && log.samplePhones.length > 0 ? (
                                log.samplePhones.slice(0, 3).map((p, idx) => (
                                  <span key={idx} className="text-[10px] text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                    {p}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                              {log.samplePhones && log.samplePhones.length > 3 && (
                                <span className="text-[10px] text-slate-500">+{log.samplePhones.length - 3}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                          {logSearch ? 'Tidak ada log yang sesuai pencarian.' : 'Belum ada log ekstraksi tercatat.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
