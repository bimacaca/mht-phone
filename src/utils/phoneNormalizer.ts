import { PhoneProvider } from '../types/mht';

/**
 * Valid Indonesian cellular prefixes (after 62):
 * Telkomsel: 811, 812, 813, 821, 822, 823, 851, 852, 853
 * Indosat: 814, 815, 816, 855, 856, 857, 858
 * XL/Axis: 817, 818, 819, 831, 832, 833, 838, 859, 877, 878
 * Smartfren: 881, 882, 883, 884, 885, 886, 887, 888, 889
 * Tri: 895, 896, 897, 898, 899
 */
const VALID_MOBILE_PREFIXES = new Set([
  // Telkomsel
  '811', '812', '813', '821', '822', '823', '851', '852', '853',
  // Indosat
  '814', '815', '816', '855', '856', '857', '858',
  // XL / AXIS
  '817', '818', '819', '831', '832', '833', '838', '859', '877', '878',
  // Smartfren
  '881', '882', '883', '884', '885', '886', '887', '888', '889',
  // Tri (3)
  '895', '896', '897', '898', '899',
]);

/**
 * Normalizes phone number into "62xx..." format.
 * Strips all non-digit characters (+, -, space, parentheses, dots).
 * If starts with '0', replaces with '62'.
 * If starts with '62', retains '62'.
 * If starts with '+62', replaces with '62'.
 */
export function normalizeIndonesianPhone(raw: string): string | null {
  if (!raw) return null;

  // Clean characters
  const cleaned = raw.replace(/[^\d+]/g, '');

  let digits = cleaned;
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  // Convert leading 0 to 62
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (!digits.startsWith('62')) {
    if (digits.startsWith('8') && digits.length >= 9 && digits.length <= 13) {
      digits = '62' + digits;
    } else {
      return null;
    }
  }

  // Check mobile number: 628...
  if (digits.startsWith('628')) {
    const p3 = digits.slice(2, 5); // e.g. "812"
    // Must match a valid Indonesian mobile operator prefix
    if (!VALID_MOBILE_PREFIXES.has(p3)) {
      return null;
    }
    // Indonesian mobile numbers are 10 to 14 digits total (usually 11 to 13 digits)
    if (digits.length >= 10 && digits.length <= 14) {
      return digits;
    }
    return null;
  }

  // Valid Landlines: 6221, 6222, 6231, 6224, 62274, 6261, etc.
  const landlinePrefixes = ['6221', '6222', '6224', '6231', '62274', '6261', '62711', '62411', '62541'];
  for (const prefix of landlinePrefixes) {
    if (digits.startsWith(prefix) && digits.length >= 9 && digits.length <= 12) {
      return digits;
    }
  }

  return null;
}

/**
 * Identifies the cellular operator or line category
 */
export function detectProvider(phone: string): { provider: PhoneProvider; name: string } {
  if (!phone.startsWith('62')) {
    return { provider: 'other', name: 'Lainnya' };
  }

  const p4 = phone.slice(0, 5); // e.g. "62812"
  const p3 = phone.slice(0, 4); // e.g. "6221"

  // Telkomsel
  if (['62811', '62812', '62813', '62821', '62822', '62823', '62851', '62852', '62853'].includes(p4)) {
    return { provider: 'telkomsel', name: 'Telkomsel' };
  }

  // Indosat Ooredoo Hutchison
  if (['62814', '62815', '62816', '62855', '62856', '62857', '62858'].includes(p4)) {
    return { provider: 'indosat', name: 'Indosat Ooredoo' };
  }

  // XL Axiata / AXIS
  if (['62817', '62818', '62819', '62859', '62877', '62878', '62831', '62832', '62833', '62838'].includes(p4)) {
    return { provider: 'xl_axis', name: 'XL / AXIS' };
  }

  // Tri (3)
  if (['62895', '62896', '62897', '62898', '62899'].includes(p4)) {
    return { provider: 'tri', name: 'Tri (3)' };
  }

  // Smartfren
  if (['62881', '62882', '62883', '62884', '62885', '62886', '62887', '62888', '62889'].includes(p4)) {
    return { provider: 'smartfren', name: 'Smartfren' };
  }

  // PSTN / Telepon Rumah / Kantor
  if (['6221', '6222', '6224', '6231', '6227', '6234', '6236', '6261', '6271', '6241', '6254'].includes(p3)) {
    return { provider: 'pstn', name: 'Telepon Kantor (PSTN)' };
  }

  if (phone.startsWith('628')) {
    return { provider: 'other', name: 'Seluler Lain' };
  }

  return { provider: 'other', name: 'Lainnya' };
}

export function formatDisplayPhone(normalized: string): string {
  if (!normalized.startsWith('62')) return normalized;
  
  if (normalized.startsWith('628')) {
    const prefix = normalized.slice(0, 5); // 62812
    const mid = normalized.slice(5, 9);
    const end = normalized.slice(9);
    return `+${prefix.slice(0, 2)} ${prefix.slice(2)}-${mid}${end ? '-' + end : ''}`;
  }

  return `+${normalized.slice(0, 2)} ${normalized.slice(2)}`;
}
