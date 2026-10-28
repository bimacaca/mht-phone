import React from 'react';
import { Files, Phone, Hash, Signal } from 'lucide-react';
import { ExtractedPhone, MhtFileItem } from '../types/mht';

interface StatsOverviewProps {
  files: MhtFileItem[];
  uniquePhones: ExtractedPhone[];
  totalRawHits: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  files,
  uniquePhones,
  totalRawHits,
}) => {
  // Calculate top provider
  const providerCounts: Record<string, number> = {};
  for (const p of uniquePhones) {
    providerCounts[p.providerName] = (providerCounts[p.providerName] || 0) + 1;
  }
  let topProvider = '-';
  let topProviderCount = 0;
  for (const [provider, count] of Object.entries(providerCounts)) {
    if (count > topProviderCount) {
      topProvider = provider;
      topProviderCount = count;
    }
  }

  const duplicatesCount = Math.max(0, totalRawHits - uniquePhones.length);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-900/60 border border-slate-800">
      {/* Metric 1 */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
          <Files className="w-3.5 h-3.5 text-slate-400" />
          <span>Total File .MHT</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white font-mono tabular-nums">
            {files.length.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-slate-400">berkas</span>
        </div>
      </div>

      {/* Metric 2 */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span>Nomor Unik (62xx)</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-emerald-400 font-mono tabular-nums">
            {uniquePhones.length.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-slate-400">kontak unik</span>
        </div>
      </div>

      {/* Metric 3 */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>Total Ekstraksi (Hits)</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white font-mono tabular-nums">
            {totalRawHits.toLocaleString('id-ID')}
          </span>
          <span className="text-xs text-slate-400">
            ({duplicatesCount} duplikat)
          </span>
        </div>
      </div>

      {/* Metric 4 */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
          <Signal className="w-3.5 h-3.5 text-slate-400" />
          <span>Operator Terbanyak</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white truncate max-w-[140px]">
            {topProvider}
          </span>
          {topProviderCount > 0 && (
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              ({topProviderCount})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
