import React, { useState } from 'react';
import { Copy, Check, Download, ArrowDownAZ, ArrowUpZA, Search, CheckCheck } from 'lucide-react';
import { copyToClipboard, downloadAsTxt } from '../utils/exportUtils';
import { SortOrder, ExtractionMode } from '../types/mht';

interface CleanTextViewProps {
  phones: string[];
  sortOrder: SortOrder;
  onSortChange: (order: SortOrder) => void;
  dedupEnabled: boolean;
  onToggleDedup: (val: boolean) => void;
  extractionMode: ExtractionMode;
  onExtractionModeChange: (mode: ExtractionMode) => void;
  fileCount: number;
  fileList?: string[];
  selectedFileFilter?: string;
  onSelectFileFilter?: (fileName: string) => void;
}

export const CleanTextView: React.FC<CleanTextViewProps> = ({
  phones,
  sortOrder,
  onSortChange,
  dedupEnabled,
  onToggleDedup,
  extractionMode,
  onExtractionModeChange,
  fileCount,
  fileList = [],
  selectedFileFilter = 'all',
  onSelectFileFilter,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLineIdx, setCopiedLineIdx] = useState<number | null>(null);

  const filteredPhones = searchQuery
    ? phones.filter((p) => p.includes(searchQuery))
    : phones;

  const handleCopyAll = async () => {
    if (filteredPhones.length === 0) return;
    const text = filteredPhones.join('\n');
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopySingle = async (num: string, idx: number) => {
    const success = await copyToClipboard(num);
    if (success) {
      setCopiedLineIdx(idx);
      setTimeout(() => setCopiedLineIdx(null), 1500);
    }
  };

  return (
    <div id="result-text" className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
      {/* Top Banner with Quick Copy Callout */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-slate-800 bg-slate-900/90">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white">
              Baris Nomor Telepon (Format 62xx)
            </h3>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-mono tabular-nums">
              {filteredPhones.length} Baris
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {extractionMode === 'one_per_file' ? (
              <span>
                <strong className="text-emerald-400 font-medium">Mode 1 Berkas = 1 Nomor:</strong>{' '}
                {fileCount} berkas menghasilkan tepat {filteredPhones.length} nomor kontak utama.
              </span>
            ) : (
              <span>
                Menampilkan seluruh nomor telepon yang terdeteksi di dalam berkas.
              </span>
            )}
          </p>
        </div>

        {/* Primary CTA: Copy All Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyAll}
            disabled={filteredPhones.length === 0}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
            }`}
          >
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Berhasil Disalin!' : 'Salin Semua Baris Nomor'}</span>
          </button>

          <button
            onClick={() => downloadAsTxt(filteredPhones)}
            disabled={filteredPhones.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
            title="Download file text (.txt)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.TXT</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher and Options Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-slate-800/80 bg-slate-950/80 text-xs">
        {/* Left: 1 per file vs all numbers mode */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] font-medium">Aturan Pengambilan:</span>
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => onExtractionModeChange('one_per_file')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                extractionMode === 'one_per_file'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Setiap file .mht hanya menghasilkan 1 nomor kontak utama"
            >
              1 Berkas = 1 Nomor
            </button>
            <button
              onClick={() => onExtractionModeChange('all_numbers')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                extractionMode === 'all_numbers'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Ambil seluruh nomor yang terdeteksi di setiap file"
            >
              Semua Nomor di File
            </button>
          </div>
        </div>

        {/* Right: Quick search, sort, dedup */}
        <div className="flex flex-wrap items-center gap-2">
          {/* File selector if multiple files */}
          {fileList.length > 1 && onSelectFileFilter && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedFileFilter}
                onChange={(e) => onSelectFileFilter(e.target.value)}
                className="px-2 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 focus:outline-none focus:border-emerald-500 max-w-[160px] truncate"
              >
                <option value="all">Semua File ({fileList.length})</option>
                {fileList.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari angka..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-32 font-mono"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => onSortChange('asc')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                sortOrder === 'asc'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Urutkan dari Terkecil (62811 -> 62899)"
            >
              <ArrowDownAZ className="w-3.5 h-3.5" />
              <span>Urut 0-9</span>
            </button>
            <button
              onClick={() => onSortChange('desc')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                sortOrder === 'desc'
                  ? 'bg-slate-800 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Urutkan dari Terbesar (9-0)"
            >
              <ArrowUpZA className="w-3.5 h-3.5" />
              <span>Urut 9-0</span>
            </button>
          </div>

          {/* Dedup Toggle */}
          <button
            onClick={() => onToggleDedup(!dedupEnabled)}
            className={`px-2.5 py-1 rounded border transition-colors ${
              dedupEnabled
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                : 'bg-slate-800/80 text-slate-400 border-slate-700/60 hover:text-white'
            }`}
          >
            {dedupEnabled ? 'Hapus Duplikat' : 'Sertakan Duplikat'}
          </button>
        </div>
      </div>

      {/* The Requested Number Lines View */}
      {filteredPhones.length > 0 ? (
        <div className="relative font-mono text-sm bg-slate-950 max-h-[500px] overflow-y-auto divide-y divide-slate-900">
          {filteredPhones.map((phone, idx) => (
            <div
              key={`${phone}-${idx}`}
              className="flex items-center justify-between px-4 py-2 hover:bg-slate-900/70 group transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="w-10 text-right text-xs text-slate-600 select-none tabular-nums font-mono">
                  {idx + 1}
                </span>
                <span className="text-emerald-400 font-semibold tracking-wider text-base select-all">
                  {phone}
                </span>
              </div>

              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                <button
                  onClick={() => handleCopySingle(phone, idx)}
                  className="px-2 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1"
                  title="Salin baris ini"
                >
                  {copiedLineIdx === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Disalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 text-sm">
          {searchQuery
            ? 'Tidak ada nomor yang sesuai dengan pencarian.'
            : 'Belum ada nomor telepon. Masukkan file .mht di atas lalu klik tombol ekstrak.'}
        </div>
      )}
    </div>
  );
};
