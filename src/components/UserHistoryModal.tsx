import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ExtractionLogItem } from '../types/auth';
import { History, X, RefreshCw } from 'lucide-react';

interface UserHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserHistoryModal: React.FC<UserHistoryModalProps> = ({ isOpen, onClose }) => {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState<ExtractionLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserLogs = async () => {
    if (!token) return;
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchUserLogs();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Riwayat Ekstraksi Saya</h3>
              <p className="text-xs text-slate-400">
                Akun: <span className="font-semibold text-slate-200">{user?.username}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUserLogs}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Segarkan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-3">
          {logs.length > 0 ? (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Waktu</th>
                    <th className="py-2.5 px-4 text-center">Berkas .MHT</th>
                    <th className="py-2.5 px-4 text-center">Nomor (62xx)</th>
                    <th className="py-2.5 px-4">Contoh Nomor Terdeteksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        <div>{new Date(log.timestamp).toLocaleDateString('id-ID')}</div>
                        <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</div>
                      </td>
                      <td className="py-2.5 px-4 text-center font-sans">
                        <span className="font-semibold text-white">{log.fileCount} file</span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 font-bold rounded">
                          {log.phoneCount} nomor
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {log.samplePhones && log.samplePhones.length > 0 ? (
                            log.samplePhones.slice(0, 3).map((p, idx) => (
                              <span key={idx} className="text-[10px] text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              Belum ada riwayat ekstraksi yang tercatat untuk akun ini.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
