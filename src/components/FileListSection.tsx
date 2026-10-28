import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, Eye, X, Phone, Check } from 'lucide-react';
import { MhtFileItem } from '../types/mht';

interface FileListSectionProps {
  files: MhtFileItem[];
  onSetPrimaryNumber?: (fileId: string, phone: string) => void;
}

export const FileListSection: React.FC<FileListSectionProps> = ({ files, onSetPrimaryNumber }) => {
  const [selectedFile, setSelectedFile] = useState<MhtFileItem | null>(null);

  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div id="file-list" className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Daftar Berkas .MHT & Pemetaan Nomor (1 File = 1 Nomor)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Total {files.length} berkas diproses. Setiap berkas memetakan 1 nomor kontak utama.
          </p>
        </div>
      </div>

      <div className="divide-y divide-slate-800/60 max-h-[380px] overflow-y-auto">
        {files.map((fileItem, idx) => (
          <div
            key={fileItem.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors text-xs"
          >
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <span className="w-5 text-slate-600 font-mono text-center shrink-0">
                {idx + 1}.
              </span>
              <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                <FileText className="w-4 h-4" />
              </div>

              <div className="min-w-0">
                <div className="text-slate-200 font-medium truncate" title={fileItem.name}>
                  {fileItem.name}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-slate-500 font-mono text-[11px] mt-0.5">
                  <span className="tabular-nums">{formatFileSize(fileItem.size)}</span>
                  <span aria-hidden="true">·</span>
                  {fileItem.primaryNumber ? (
                    <span className="text-emerald-400 font-semibold tabular-nums">
                      Nomor: {fileItem.primaryNumber}
                    </span>
                  ) : (
                    <span className="text-amber-400">Tidak ada nomor</span>
                  )}
                  {fileItem.extractedCount > 1 && (
                    <span className="text-slate-400 text-[10px]">
                      (+{fileItem.extractedCount - 1} opsi lain)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {fileItem.status === 'done' ? (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">1 Nomor Terpilih</span>
                </span>
              ) : fileItem.status === 'error' ? (
                <span className="flex items-center gap-1 text-[11px] text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Gagal</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 animate-pulse">Memproses...</span>
              )}

              <button
                onClick={() => setSelectedFile(fileItem)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                title="Lihat rincian berkas"
              >
                <Eye className="w-3 h-3" />
                <span className="hidden sm:inline">Detail</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div>
                <h4 className="text-sm font-semibold text-white truncate max-w-md">
                  {selectedFile.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                  <span>{formatFileSize(selectedFile.size)}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400 font-semibold">
                    Nomor Utama: {selectedFile.primaryNumber || 'Tidak ada'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedFile(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div>
                <div className="text-slate-400 font-semibold mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pilih Nomor Utama untuk Berkas Ini (1 Berkas = 1 Nomor):</span>
                  </div>
                </div>

                {selectedFile.extractedNumbers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedFile.extractedNumbers.map((num, i) => {
                      const isPrimary = selectedFile.primaryNumber === num;
                      return (
                        <div
                          key={i}
                          onClick={() => {
                            if (onSetPrimaryNumber) {
                              onSetPrimaryNumber(selectedFile.id, num);
                              setSelectedFile({
                                ...selectedFile,
                                primaryNumber: num,
                              });
                            }
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                            isPrimary
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <span className="font-mono text-sm font-semibold">{num}</span>
                          {isPrimary ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <Check className="w-3.5 h-3.5" />
                              Terpilih sebagai Nomor Berkas Ini
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 hover:text-slate-300">
                              Klik untuk pilih ini
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 italic bg-slate-950 p-3 rounded-lg border border-slate-800">
                    Tidak ada nomor telepon yang terdeteksi di file ini.
                  </p>
                )}
              </div>

              <div>
                <div className="text-slate-400 font-semibold mb-2">
                  Pratinjau Cuplikan Teks File (Decoded):
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed select-text">
                  {selectedFile.rawTextPreview || '(Tidak ada cuplikan teks)'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
