import { useState, useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { FileDropzone } from './components/FileDropzone';
import { StatsOverview } from './components/StatsOverview';
import { CleanTextView } from './components/CleanTextView';
import { DetailedTableView } from './components/DetailedTableView';
import { FileListSection } from './components/FileListSection';
import { AdminPanelModal } from './components/AdminPanelModal';
import { UserHistoryModal } from './components/UserHistoryModal';
import { ExtractedPhone, MhtFileItem, SortOrder, FilterCategory, ExtractionMode } from './types/mht';
import { parseMhtFile } from './utils/mhtParser';
import { detectProvider } from './utils/phoneNormalizer';
import { createSampleMhtFiles } from './utils/sampleData';
import { downloadAsTxt } from './utils/exportUtils';
import {
  FileText,
  TableProperties,
  ShieldCheck,
  Zap,
  Layers,
  CheckCircle2,
  Smartphone,
  Shield,
  History
} from 'lucide-react';

function MainAppContent() {
  const { user, token, deviceInfo, isAdmin } = useAuth();

  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [files, setFiles] = useState<MhtFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFilesToProcess, setTotalFilesToProcess] = useState(0);

  // Sorting and extraction mode
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('one_per_file');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [dedupEnabled, setDedupEnabled] = useState(true);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [activeTab, setActiveTab] = useState<'text' | 'table'>('text');
  const [selectedFileFilter, setSelectedFileFilter] = useState<string>('all');

  // Modal dialog states
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);



  // Step 1: User adds files into stage
  const handleAddFiles = (newFiles: File[]) => {
    if (newFiles.length === 0) return;
    setStagedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearStagedFiles = () => {
    setStagedFiles([]);
  };

  // Helper to record extraction to server log
  const recordExtractionLog = async (
    processedFiles: MhtFileItem[],
    extractedNumbersList: string[]
  ) => {
    if (!token) return;
    try {
      await fetch('/api/logs/extractions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileCount: processedFiles.length,
          fileNames: processedFiles.map((f) => f.name),
          phoneCount: extractedNumbersList.length,
          extractionMode,
          deviceInfo,
          samplePhones: extractedNumbersList.slice(0, 5),
        }),
      });
    } catch (err) {
      console.error('Failed to record extraction log:', err);
    }
  };

  // Step 2: User clicks extraction button
  const handleExecuteExtraction = async () => {
    // The button is disabled while processing, but keep this guard here too
    // so an already queued click cannot start a second extraction.
    if (stagedFiles.length === 0 || isProcessing) return;

    const fileListToUse = stagedFiles;
    setIsProcessing(true);
    setProcessedCount(0);
    setTotalFilesToProcess(fileListToUse.length);

    const initialFileItems: MhtFileItem[] = fileListToUse.map((file, idx) => ({
      id: `file-${Date.now()}-${idx}-${file.name}`,
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      extractedCount: 0,
      extractedNumbers: [],
    }));

    setFiles((prev) => [...prev, ...initialFileItems]);

    const updatedItems: MhtFileItem[] = [];
    const allFoundPhones: string[] = [];

    for (let i = 0; i < initialFileItems.length; i++) {
      const current = initialFileItems[i];
      try {
        const { primaryNumber, phoneNumbers, rawPreview } = await parseMhtFile(current.file);
        updatedItems.push({
          ...current,
          status: 'done',
          primaryNumber,
          extractedCount: phoneNumbers.length,
          extractedNumbers: phoneNumbers,
          rawTextPreview: rawPreview,
        });
        if (primaryNumber) allFoundPhones.push(primaryNumber);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Gagal membaca berkas';
        updatedItems.push({
          ...current,
          status: 'error',
          errorMessage: message,
          extractedCount: 0,
          extractedNumbers: [],
        });
      }

      setProcessedCount(i + 1);
      if (i % 2 === 0) {
        await new Promise((r) => setTimeout(r, 10));
      }
    }

    setFiles((prev) => {
      const map = new Map(updatedItems.map((u) => [u.id, u]));
      return prev.map((f) => map.get(f.id) || f);
    });

    setStagedFiles([]);
    setIsProcessing(false);

    recordExtractionLog(updatedItems, allFoundPhones);

    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Direct Paste handler
  const handlePasteTextSubmit = (rawText: string, title = 'Teks_MHT_Langsung.mht') => {
    const file = new File([rawText], title, { type: 'multipart/related' });
    setStagedFiles([file]);
    setTimeout(() => {
      runDirectFileExtraction([file]);
    }, 50);
  };

  const runDirectFileExtraction = async (filesToProcess: File[]) => {
    setIsProcessing(true);
    setProcessedCount(0);
    setTotalFilesToProcess(filesToProcess.length);

    const initialItems: MhtFileItem[] = filesToProcess.map((f, idx) => ({
      id: `file-${Date.now()}-${idx}-${f.name}`,
      file: f,
      name: f.name,
      size: f.size,
      status: 'pending',
      extractedCount: 0,
      extractedNumbers: [],
    }));

    setFiles((prev) => [...prev, ...initialItems]);

    const updated: MhtFileItem[] = [];
    const allFoundPhones: string[] = [];

    for (let i = 0; i < initialItems.length; i++) {
      const cur = initialItems[i];
      try {
        const { primaryNumber, phoneNumbers, rawPreview } = await parseMhtFile(cur.file);
        updated.push({
          ...cur,
          status: 'done',
          primaryNumber,
          extractedCount: phoneNumbers.length,
          extractedNumbers: phoneNumbers,
          rawTextPreview: rawPreview,
        });
        if (primaryNumber) allFoundPhones.push(primaryNumber);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal';
        updated.push({
          ...cur,
          status: 'error',
          errorMessage: msg,
          extractedCount: 0,
          extractedNumbers: [],
        });
      }
      setProcessedCount(i + 1);
    }

    setFiles((prev) => {
      const map = new Map(updated.map((u) => [u.id, u]));
      return prev.map((f) => map.get(f.id) || f);
    });

    setStagedFiles([]);
    setIsProcessing(false);

    recordExtractionLog(updated, allFoundPhones);

    setTimeout(() => {
      document.getElementById('result-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleLoadSample = () => {
    const samples = createSampleMhtFiles();
    setStagedFiles(samples);
  };

  const handleReset = () => {
    setStagedFiles([]);
    setFiles([]);
    setProcessedCount(0);
    setTotalFilesToProcess(0);
    setSelectedFileFilter('all');
  };

  const handleSetPrimaryNumber = (fileId: string, phone: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, primaryNumber: phone } : f))
    );
  };

  const distinctFileNames = useMemo(() => {
    return Array.from(new Set(files.filter((f) => f.status === 'done').map((f) => f.name)));
  }, [files]);

  const { detailedPhones, totalRawHits } = useMemo(() => {
    const phoneMap = new Map<
      string,
      { occurrences: number; sourceFiles: Set<string>; originalRaw: string }
    >();
    let totalHits = 0;

    const targetFiles = selectedFileFilter === 'all'
      ? files
      : files.filter((f) => f.name === selectedFileFilter);

    for (const f of targetFiles) {
      if (f.status === 'done') {
        if (extractionMode === 'one_per_file') {
          const phone = f.primaryNumber || (f.extractedNumbers.length > 0 ? f.extractedNumbers[0] : null);
          if (phone) {
            totalHits++;
            if (!phoneMap.has(phone)) {
              phoneMap.set(phone, {
                occurrences: 1,
                sourceFiles: new Set([f.name]),
                originalRaw: phone,
              });
            } else {
              const entry = phoneMap.get(phone)!;
              entry.occurrences += 1;
              entry.sourceFiles.add(f.name);
            }
          }
        } else {
          for (const phone of f.extractedNumbers) {
            totalHits++;
            if (!phoneMap.has(phone)) {
              phoneMap.set(phone, {
                occurrences: 1,
                sourceFiles: new Set([f.name]),
                originalRaw: phone,
              });
            } else {
              const entry = phoneMap.get(phone)!;
              entry.occurrences += 1;
              entry.sourceFiles.add(f.name);
            }
          }
        }
      }
    }

    const result: ExtractedPhone[] = [];
    for (const [phone, data] of phoneMap.entries()) {
      const { provider, name } = detectProvider(phone);
      result.push({
        id: phone,
        originalRaw: data.originalRaw,
        normalized: phone,
        prefix: phone.slice(0, 5),
        provider,
        providerName: name,
        sourceFiles: Array.from(data.sourceFiles),
        occurrences: data.occurrences,
      });
    }

    return {
      detailedPhones: result,
      totalRawHits: totalHits,
    };
  }, [files, selectedFileFilter, extractionMode]);

  const filteredDetailedPhones = useMemo(() => {
    return detailedPhones.filter((p) => {
      if (filterCategory === 'mobile_only') {
        return p.normalized.startsWith('628');
      }
      if (filterCategory === 'pstn_only') {
        return !p.normalized.startsWith('628');
      }
      return true;
    });
  }, [detailedPhones, filterCategory]);

  const plainFormattedPhones = useMemo(() => {
    let list: string[] = [];

    if (dedupEnabled) {
      list = filteredDetailedPhones.map((p) => p.normalized);
    } else {
      for (const item of filteredDetailedPhones) {
        for (let i = 0; i < item.occurrences; i++) {
          list.push(item.normalized);
        }
      }
    }

    if (sortOrder === 'asc') {
      list.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    } else if (sortOrder === 'desc') {
      list.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    }

    return list;
  }, [filteredDetailedPhones, dedupEnabled, sortOrder]);

  const progressPercent = totalFilesToProcess > 0
    ? Math.round((processedCount / totalFilesToProcess) * 100)
    : 0;

  const hasData = detailedPhones.length > 0;
  const completedFilesCount = files.filter((f) => f.status === 'done').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <Header
        onReset={handleReset}
        hasData={hasData || stagedFiles.length > 0}
        onExportTxt={() => downloadAsTxt(plainFormattedPhones)}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenLogin={() => {}}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* User Info & Device Whitelist Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Ekstraksi Nomor Telepon File .MHT
                </h1>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    isAdmin
                      ? 'bg-purple-950/70 border-purple-800 text-purple-300'
                      : 'bg-blue-950/70 border-blue-800 text-blue-300'
                  }`}
                >
                  {isAdmin ? 'ADMINISTRATOR' : 'USER'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Aturan: <span className="text-emerald-400 font-semibold">1 berkas .mht menghasilkan tepat 1 nomor telepon</span> format 62xx.
              </p>
            </div>

            {/* Device Whitelist Status */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-400">Device:</span>
                  <span className="text-emerald-400 font-semibold">{deviceInfo.id.slice(0, 14)}...</span>
                </div>

                <span className="text-slate-700" aria-hidden="true">|</span>

                {isAdmin ? (
                  <button
                    onClick={() => setIsAdminPanelOpen(true)}
                    className="flex items-center gap-1 text-purple-400 font-semibold hover:text-purple-300 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Panel Admin (Whitelist & Log)</span>
                  </button>
                ) : (
                  <span className="text-blue-400 font-medium">
                    Status: Whitelisted (1 User = 1 Device)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Step 1 & 2: Dropzone & Action Button */}
        <FileDropzone
          stagedFiles={stagedFiles}
          onAddFiles={handleAddFiles}
          onRemoveStagedFile={handleRemoveStagedFile}
          onClearStagedFiles={handleClearStagedFiles}
          onExecuteExtraction={handleExecuteExtraction}
          onLoadSample={handleLoadSample}
          isProcessing={isProcessing}
          progressPercent={progressPercent}
          processedCount={processedCount}
          totalFiles={totalFilesToProcess}
          onPasteTextSubmit={handlePasteTextSubmit}
        />

        {/* Explanations when Empty */}
        {!hasData && stagedFiles.length === 0 && !isProcessing && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <Smartphone className="w-4 h-4" />
                <span>Whitelist Device (1 User = 1 Device)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Akun Anda aman dan terkunci pada perangkat ini. Admin dapat mereset ikatan perangkat jika Anda berganti perangkat kerja.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <Zap className="w-4 h-4" />
                <span>Aturan 1 Berkas = 1 Nomor</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Menstandarkan nomor telepon ke format murni <span className="font-mono text-emerald-400">62xx</span> secara terurut, mengabaikan kontak CS website, dan mencegah duplikasi.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                <History className="w-4 h-4" />
                <span>Log Riwayat Ekstraksi</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Setiap pemindaian nomor otomatis tercatat di log audit server yang dapat ditinjau oleh Admin dan diakses di menu Riwayat.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Result Section */}
        {hasData && (
          <div id="result-section" className="space-y-6 pt-2">
            <StatsOverview
              files={files}
              uniquePhones={filteredDetailedPhones}
              totalRawHits={totalRawHits}
            />

            {/* View Switcher Tabs & Category Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Daftar Baris Nomor (62xx)</span>
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    activeTab === 'table'
                      ? 'bg-slate-800 text-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TableProperties className="w-4 h-4" />
                  <span>Tabel Operator & Sumber</span>
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Kategori:</span>
                <div className="flex items-center bg-slate-900 p-0.5 rounded-md border border-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      filterCategory === 'all'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({detailedPhones.length})
                  </button>
                  <button
                    onClick={() => setFilterCategory('mobile_only')}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      filterCategory === 'mobile_only'
                        ? 'bg-slate-800 text-emerald-400 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Seluler 628xx ({detailedPhones.filter((p) => p.normalized.startsWith('628')).length})
                  </button>
                  <button
                    onClick={() => setFilterCategory('pstn_only')}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                      filterCategory === 'pstn_only'
                        ? 'bg-slate-800 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PSTN ({detailedPhones.filter((p) => !p.normalized.startsWith('628')).length})
                  </button>
                </div>
              </div>
            </div>

            {/* Tab 1: Clean Text View */}
            {activeTab === 'text' && (
              <CleanTextView
                phones={plainFormattedPhones}
                sortOrder={sortOrder}
                onSortChange={setSortOrder}
                dedupEnabled={dedupEnabled}
                onToggleDedup={setDedupEnabled}
                extractionMode={extractionMode}
                onExtractionModeChange={setExtractionMode}
                fileCount={completedFilesCount}
                fileList={distinctFileNames}
                selectedFileFilter={selectedFileFilter}
                onSelectFileFilter={setSelectedFileFilter}
              />
            )}

            {/* Tab 2: Detailed Table View */}
            {activeTab === 'table' && (
              <DetailedTableView items={filteredDetailedPhones} />
            )}

            {/* File List Section with 1:1 mapping */}
            <FileListSection
              files={files}
              onSetPrimaryNumber={handleSetPrimaryNumber}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
      />

      <UserHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span>MHT Tele Extractor</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>Autentikasi & Whitelist Device (1 User = 1 Device)</span>
          </div>
          <div>
            <span>Format Standar 62xx Terurut</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppGate() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span>Memeriksa autentikasi & identitas perangkat...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainAppContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
