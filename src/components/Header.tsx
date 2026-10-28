import React from 'react';
import { FileCode, Download, RefreshCw, Shield, History, LogIn, LogOut, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
  onExportTxt: () => void;
  onOpenAdmin: () => void;
  onOpenHistory: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onReset,
  hasData,
  onExportTxt,
  onOpenAdmin,
  onOpenHistory,
  onOpenLogin,
}) => {
  const { user, isAuthenticated, isAdmin, logout, deviceInfo } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <FileCode className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-white">
            MHT Tele Extractor
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span>Auth & Whitelist Device</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-mono text-[10px]">
              {deviceInfo.id.slice(0, 10)}...
            </span>
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links & Actions */}
      <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-400">
        <a href="#extractor" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
          Ekstraksi Batch
        </a>
        <a href="#result-text" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
          Format 62xx
        </a>
        <a href="#file-list" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
          Daftar File
        </a>

        {isAuthenticated && (
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Ekstraksi</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-2.5 py-1 text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-semibold">Panel Admin</span>
          </button>
        )}
      </nav>

      {/* Zone 3: User Status & Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {hasData && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Reset semua file"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        <button
          onClick={onExportTxt}
          disabled={!hasData}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            hasData
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-sm'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download .TXT</span>
        </button>

        {/* Auth status element */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-white leading-tight">
                {user.username}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-mono">
                {user.role === 'admin' ? (
                  <span className="text-purple-400 font-bold">ADMIN</span>
                ) : (
                  <span className="text-blue-400">1 DEVICE</span>
                )}
              </span>
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title="Keluar (Logout)"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>Login Akun</span>
          </button>
        )}
      </div>
    </header>
  );
};
