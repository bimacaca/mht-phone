import { ExtractedPhone } from '../types/mht';

/**
 * Generates plain text formatted exactly as:
 * 62xx
 * 62xx
 * 62xx
 */
export function generatePlainText(phones: string[]): string {
  return phones.join('\n');
}

/**
 * Downloads a string as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports phones to TXT format
 */
export function downloadAsTxt(phones: string[], filename = 'nomor_telepon_62xx.txt') {
  const content = generatePlainText(phones);
  downloadFile(content, filename, 'text/plain;charset=utf-8');
}

/**
 * Exports detailed list to CSV format
 */
export function downloadAsCsv(items: ExtractedPhone[], filename = 'data_nomor_telepon.csv') {
  const headers = ['Nomor Telepon (62xx)', 'Provider', 'Frekuensi', 'Daftar File Sumber'];
  const rows = items.map((item) => {
    const escapedFiles = `"${item.sourceFiles.join('; ')}"`;
    return [item.normalized, item.providerName, item.occurrences, escapedFiles].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8');
}

/**
 * Exports to .VCF (vCard 3.0) for easy import to smartphone / WhatsApp contact list
 */
export function downloadAsVcf(items: ExtractedPhone[], filename = 'kontak_62xx.vcf') {
  const vcfCards = items.map((item, idx) => {
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:Kontak ${item.normalized} (${item.providerName})`,
      `N:;Kontak ${item.normalized};;;`,
      `TEL;TYPE=CELL:+${item.normalized}`,
      `NOTE:Diekstrak dari MHT (${item.sourceFiles.join(', ')})`,
      'END:VCARD',
    ].join('\r\n');
  });

  const vcfContent = vcfCards.join('\r\n\r\n');
  downloadFile(vcfContent, filename, 'text/vcard;charset=utf-8');
}

/**
 * Safe clipboard copy with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Clipboard copy error:', err);
    return false;
  }
}
