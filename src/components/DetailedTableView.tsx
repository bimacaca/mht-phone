import React, { useState } from 'react';
import { Search, Download, MessageSquare, Copy, Check, ExternalLink } from 'lucide-react';
import { ExtractedPhone, PhoneProvider } from '../types/mht';
import { formatDisplayPhone } from '../utils/phoneNormalizer';
import { downloadAsCsv, downloadAsVcf, copyToClipboard } from '../utils/exportUtils';

interface DetailedTableViewProps {
  items: ExtractedPhone[];
}

export const DetailedTableView: React.FC<DetailedTableViewProps> = ({ items }) => {
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Provider filtering
  const filtered = items.filter((item) => {
    const matchesSearch =
      item.normalized.includes(search) ||
      item.providerName.toLowerCase().includes(search.toLowerCase()) ||
      item.sourceFiles.some((f) => f.toLowerCase().includes(search.toLowerCase()));

    const matchesProvider =
      selectedProvider === 'all' || item.provider === selectedProvider;

    return matchesSearch && matchesProvider;
  });

  const handleCopy = async (num: string, id: string) => {
    const success = await copyToClipboard(num);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const providerBadgeClasses: Record<PhoneProvider, string> = {
    telkomsel: 'text-red-400 bg-red-950/40 border border-red-800/40',
    indosat: 'text-amber-400 bg-amber-950/40 border border-amber-800/40',
    xl_axis: 'text-blue-400 bg-blue-950/40 border border-blue-800/40',
    tri: 'text-purple-400 bg-purple-950/40 border border-purple-800/40',
    smartfren: 'text-pink-400 bg-pink-950/40 border border-pink-800/40',
    pstn: 'text-teal-400 bg-teal-950/40 border border-teal-800/40',
    other: 'text-slate-400 bg-slate-800 border border-slate-700',
  };

  return (
    <div id="result-table" className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Table Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-slate-800 bg-slate-900/80">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Analisis Rinci & Operator Seluler
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Identifikasi provider otomatis, pelacakan file sumber, dan tombol interaksi WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor, file, provider..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-44 md:w-56"
            />
          </div>

          {/* Provider Filter Select */}
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-md text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Semua Operator</option>
            <option value="telkomsel">Telkomsel</option>
            <option value="indosat">Indosat Ooredoo</option>
            <option value="xl_axis">XL / AXIS</option>
            <option value="tri">Tri (3)</option>
            <option value="smartfren">Smartfren</option>
            <option value="pstn">PSTN (Kabel/Kantor)</option>
            <option value="other">Lainnya</option>
          </select>

          {/* Download CSV */}
          <button
            onClick={() => downloadAsCsv(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>

          {/* Download vCard */}
          <button
            onClick={() => downloadAsVcf(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-md transition-colors"
            title="Download kontak untuk import ke HP/Google Contact"
          >
            <Download className="w-3.5 h-3.5" />
            vCard (.vcf)
          </button>
        </div>
      </div>

      {/* High-density Data Table */}
      <div className="overflow-x-auto max-h-[500px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/90 text-slate-400 font-medium sticky top-0 z-10 border-b border-slate-800 backdrop-blur-sm">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-4 font-semibold text-slate-300">Format 62xx</th>
              <th className="py-2.5 px-4">Tampilan</th>
              <th className="py-2.5 px-4">Operator</th>
              <th className="py-2.5 px-4 text-center">Frekuensi</th>
              <th className="py-2.5 px-4">File Sumber .MHT</th>
              <th className="py-2.5 px-4 text-right">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.length > 0 ? (
              filtered.map((item, index) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  {/* # */}
                  <td className="py-2.5 px-3 text-center text-slate-500 tabular-nums">
                    {index + 1}
                  </td>

                  {/* 62xx */}
                  <td className="py-2.5 px-4 font-semibold text-emerald-400 tabular-nums tracking-wide">
                    {item.normalized}
                  </td>

                  {/* Display */}
                  <td className="py-2.5 px-4 text-slate-300 tabular-nums font-sans">
                    {formatDisplayPhone(item.normalized)}
                  </td>

                  {/* Provider */}
                  <td className="py-2.5 px-4 font-sans">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        providerBadgeClasses[item.provider]
                      }`}
                    >
                      {item.providerName}
                    </span>
                  </td>

                  {/* Occurrences */}
                  <td className="py-2.5 px-4 text-center text-slate-400 tabular-nums font-mono">
                    {item.occurrences}x
                  </td>

                  {/* Source Files */}
                  <td className="py-2.5 px-4 font-sans text-slate-400 max-w-[240px]">
                    <div className="truncate" title={item.sourceFiles.join(', ')}>
                      {item.sourceFiles.length === 1
                        ? item.sourceFiles[0]
                        : `${item.sourceFiles[0]} (+${item.sourceFiles.length - 1} file)`}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right font-sans">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopy(item.normalized, item.id)}
                        className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
                        title="Salin nomor"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {item.normalized.startsWith('628') && (
                        <a
                          href={`https://wa.me/${item.normalized}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/50 hover:bg-emerald-950/80 border border-emerald-800/50 rounded transition-colors"
                          title="Buka WhatsApp Chat"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WA</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                  {search
                    ? 'Tidak ada data yang cocok dengan pencarian.'
                    : 'Belum ada data nomor telepon.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
