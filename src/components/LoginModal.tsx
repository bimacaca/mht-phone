import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, User, Smartphone, AlertTriangle, ShieldCheck, KeyRound, Sparkles, X } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  canClose = false,
}) => {
  const { login, deviceInfo } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceMismatchData, setDeviceMismatchData] = useState<any>(null);

  if (!isOpen) return null;

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

    if (result.success) {
      if (onClose) onClose();
    } else {
      setErrorMessage(result.error || 'Login gagal.');
      if (result.isDeviceMismatch) {
        setDeviceMismatchData(result.registeredDevice);
      }
    }
  };

  const handleFillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
    setDeviceMismatchData(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Login Autentikasi</h3>
              <p className="text-xs text-slate-400">Keamanan Akses & Whitelist Device</p>
            </div>
          </div>

          {canClose && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Current Device Info Banner */}
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                Identitas Perangkat Ini:
              </span>
              <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                {deviceInfo.id.slice(0, 16)}...
              </span>
            </div>
            <div className="text-xs text-slate-300 font-mono flex items-center justify-between">
              <span>{deviceInfo.name}</span>
              <span className="text-[11px] text-slate-500">Res: {deviceInfo.screenResolution}</span>
            </div>
          </div>

          {/* Device Mismatch Error Box */}
          {deviceMismatchData && (
            <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-xl space-y-2 text-xs">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Akses Ditolak: 1 User Hanya 1 Device</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Akun ini telah terikat pada perangkat lain:
              </p>
              <div className="bg-slate-950 p-2.5 rounded border border-red-900/60 font-mono text-[11px] space-y-1">
                <div className="text-red-300">
                  <span className="text-slate-500">Perangkat Terdaftar: </span>
                  {deviceMismatchData.name || deviceMismatchData.id}
                </div>
                <div className="text-slate-400">
                  <span className="text-slate-500">Perangkat Saat Ini: </span>
                  {deviceInfo.name} ({deviceInfo.id.slice(0, 14)}...)
                </div>
              </div>
              <p className="text-slate-400 text-[11px] pt-1">
                Silakan hubungi <strong>Admin</strong> untuk melakukan whitelist atau mereset perangkat akun Anda.
              </p>
            </div>
          )}

          {/* General Error Message */}
          {errorMessage && !deviceMismatchData && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center gap-2">
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
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
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
              <span>{isSubmitting ? 'Memeriksa Device & Sesi...' : 'Masuk Sekarang'}</span>
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Akun Demo untuk Uji Coba:</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 text-xs">
              {/* Admin Button */}
              <button
                type="button"
                onClick={() => handleFillDemo('admin', 'admin123')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
              >
                <div>
                  <div className="text-white font-medium group-hover:text-emerald-400">
                    admin <span className="text-[10px] text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40 ml-1">Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Pass: admin123 · Bebas device (kelola whitelist & log)</div>
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">Pakai ➔</span>
              </button>

              {/* Operator 1 Button */}
              <button
                type="button"
                onClick={() => handleFillDemo('operator1', 'user123')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
              >
                <div>
                  <div className="text-white font-medium group-hover:text-emerald-400">
                    operator1 <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40 ml-1">User</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Pass: user123 · Mengikat device saat ini (1 user = 1 device)</div>
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">Pakai ➔</span>
              </button>

              {/* Operator 2 Button (Locked) */}
              <button
                type="button"
                onClick={() => handleFillDemo('operator2', 'user123')}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer group"
              >
                <div>
                  <div className="text-white font-medium group-hover:text-red-400">
                    operator2 <span className="text-[10px] text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/40 ml-1">Terkunci Device Lain</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Pass: user123 · Uji coba penolakan login jika device berbeda</div>
                </div>
                <span className="text-[11px] text-red-400 font-medium">Uji Tolak ➔</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
