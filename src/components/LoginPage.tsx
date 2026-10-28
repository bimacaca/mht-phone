import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FileCode,
  Lock,
  User,
  Smartphone,
  AlertTriangle,
  ShieldCheck,
  KeyRound,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, deviceInfo } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceMismatchData, setDeviceMismatchData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username dan kata sandi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setDeviceMismatchData(null);

    const result = await login(username.trim(), password.trim());
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Login gagal.');
      if (result.isDeviceMismatch) {
        setDeviceMismatchData(result.registeredDevice);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background radial highlight */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.06),transparent_50%)]" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        {/* <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2 shadow-inner">
            <FileCode className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            MHT Tele Extractor
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Sistem ekstraksi batch nomor telepon format <span className="font-mono text-emerald-400">62xx</span>. Silakan login untuk membuka akses.
          </p>
        </div> */}

        {/* Main Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-white">Autentikasi Pengguna</span>
            </div>
            <span className="text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded">
              1 User = 1 Device
            </span>
          </div>

          {/* Real Device Detection Banner */}
          {/* <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Perangkat Anda:
              </span>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                {deviceInfo.id.slice(0, 14)}...
              </span>
            </div>
            <div className="text-xs text-slate-300 font-mono flex items-center justify-between pt-0.5">
              <span>{deviceInfo.name}</span>
              <span className="text-[11px] text-slate-500">{deviceInfo.screenResolution}</span>
            </div>
          </div> */}

          {/* Device Mismatch Error Banner */}
          {deviceMismatchData && (
            <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-xl space-y-2 text-xs animate-in fade-in">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Akses Ditolak: 1 Akun Hanya 1 Device</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Akun ini telah terdaftar dan terkunci pada perangkat lain:
              </p>
              <div className="bg-slate-950 p-2.5 rounded border border-red-900/60 font-mono text-[11px] space-y-1">
                <div className="text-red-300">
                  <span className="text-slate-500">Perangkat Sah: </span>
                  {deviceMismatchData.name || deviceMismatchData.id}
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">Perangkat Anda: </span>
                  {deviceInfo.name} ({deviceInfo.id.slice(0, 12)}...)
                </div>
              </div>
              <p className="text-slate-400 text-[11px] pt-1">
                Silakan hubungi <strong>Admin</strong> untuk mereset binding perangkat atau melakukan whitelist akun Anda.
              </p>
            </div>
          )}

          {/* General Error Message */}
          {errorMessage && !deviceMismatchData && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] disabled:opacity-50 rounded-lg transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Memverifikasi Kredensial & Device...' : 'Masuk ke Aplikasi'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          <span>Keamanan Berlapis: Verifikasi Perangkat + Hak Akses Berbasis Peran</span>
        </div>
      </div>
    </div>
  );
};
