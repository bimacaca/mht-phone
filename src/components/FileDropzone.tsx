import React, { useRef, useState } from 'react';
import { UploadCloud, FolderUp, Sparkles, Files, FileText, X, Play, ArrowRight, ClipboardPaste } from 'lucide-react';

interface FileDropzoneProps {
  stagedFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemoveStagedFile: (index: number) => void;
  onClearStagedFiles: () => void;
  onExecuteExtraction: () => void | Promise<void>;
  onLoadSample: () => void;
  isProcessing: boolean;
  progressPercent: number;
  processedCount: number;
  totalFiles: number;
  onPasteTextSubmit: (text: string, title?: string) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  stagedFiles,
  onAddFiles,
  onRemoveStagedFile,
  onClearStagedFiles,
  onExecuteExtraction,
  onLoadSample,
  isProcessing,
  progressPercent,
  processedCount,
  totalFiles,
  onPasteTextSubmit,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onAddFiles(filesArray);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onAddFiles(filesArray);
      e.target.value = '';
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    onPasteTextSubmit(pastedText, 'Teks_MHT_Tempel.mht');
    setPastedText('');
  };

  const handleExtractionClick = (e: React.SyntheticEvent<HTMLDivElement>) => {
    // Keep this action client-side even if the component is rendered inside a
    // form by a host page or a browser integration.
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      void onExecuteExtraction();
    }
  };

  const preventExtractionNavigation = (e: React.SyntheticEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Input Mode Selector */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveInputMode('upload')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeInputMode === 'upload'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload File .MHT</span>
        </button>
        <button
          onClick={() => setActiveInputMode('paste')}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeInputMode === 'paste'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700/80'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Tempel / Paste Teks .MHT</span>
        </button>
      </div>

      {activeInputMode === 'upload' ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-6 sm:p-8 transition-all ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-950/20 shadow-lg shadow-emerald-900/10'
              : stagedFiles.length > 0
              ? 'border-emerald-500/50 bg-slate-900/70'
              : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            multiple
            accept=".mht,.mhtml,.txt,message/rfc822,multipart/related"
            className="hidden"
          />
          <input
            type="file"
            ref={folderInputRef}
            onChange={handleFileInputChange}
            // @ts-expect-error webkitdirectory is standard in browser engines
            webkitdirectory="true"
            multiple
            className="hidden"
          />

          <div className="flex flex-col items-center text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-emerald-400 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-white mb-1">
              Langkah 1: Masukkan File .MHT
            </h3>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Tarik file ke sini atau klik tombol di bawah untuk memilih satu atau banyak file <span className="font-mono text-emerald-400">.mht</span> sekaligus.
            </p>

            {/* Selection Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Files className="w-3.5 h-3.5" />
                Pilih File .MHT
              </button>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/90 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
              >
                <FolderUp className="w-3.5 h-3.5" />
                Pilih Folder
              </button>

              <button
                type="button"
                onClick={onLoadSample}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/50 rounded-lg transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Gunakan 3 File Contoh
              </button>
            </div>
          </div>

          {/* Staged Files Preview (Before Clicking) */}
          {stagedFiles.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {stagedFiles.length} file .mht siap diekstrak
                </span>
                <button
                  type="button"
                  onClick={onClearStagedFiles}
                  className="text-xs text-slate-400 hover:text-red-400 transition-colors"
                >
                  Bersihkan daftar
                </button>
              </div>

              {/* Scrollable chip list */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {stagedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-md text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate text-slate-200">{file.name}</span>
                      <span className="text-slate-500 tabular-nums shrink-0">
                        ({formatSize(file.size)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveStagedFile(idx)}
                      className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors"
                      title="Hapus file ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Step 2: The Core Click Action requested by user */}
              <div className="mt-5 flex flex-col items-center">
                <div
                  role="button"
                  tabIndex={isProcessing ? -1 : 0}
                  aria-disabled={isProcessing}
                  onMouseDown={preventExtractionNavigation}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      preventExtractionNavigation(e);
                      handleExtractionClick(e);
                    }
                  }}
                  onClick={handleExtractionClick}
                  className={`w-full sm:w-auto min-w-[280px] flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] rounded-xl transition-all shadow-lg shadow-emerald-500/20 ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>KLIK DI SINI: EKSTRAK BARIS NOMOR 62xx</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Klik tombol di atas untuk memindai isi file dan menampilkan baris nomor telepon format 62xx
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar when running */}
          {isProcessing && (
            <div className="w-full mt-6 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-300 mb-2 font-mono">
                <span>Sedang memindai file .mht...</span>
                <span className="tabular-nums">
                  {processedCount} / {totalFiles} Berkas ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Direct Text Paste Mode */
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">
              Tempel / Paste Langsung Isi File .MHT
            </h3>
            <p className="text-xs text-slate-400">
              Jika Anda membuka file .mht di Notepad atau browser, salin seluruh teksnya dan tempel di bawah ini.
            </p>
          </div>

          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Tempel teks .mht di sini... (Contoh: From: <Saved by Web Browser>&#10;Content-Type: multipart/related; ... &#10;No HP: 081234567890)"
            className="w-full h-44 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-y"
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePasteSubmit}
              disabled={!pastedText.trim() || isProcessing}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>KLIK DI SINI: EKSTRAK NOMOR DARI TEKS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
