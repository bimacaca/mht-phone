import { normalizeIndonesianPhone } from './phoneNormalizer';

/**
 * Decodes Quoted-Printable encoded string to standard UTF-8 text.
 */
export function decodeQuotedPrintable(input: string): string {
  // 1. Remove soft line breaks
  const cleaned = input.replace(/=(?:\r\n|\n|\r)/g, '');

  // 2. Decode hex bytes via Uint8Array
  const bytes: number[] = [];
  let i = 0;
  const len = cleaned.length;

  while (i < len) {
    if (cleaned[i] === '=' && i + 2 < len) {
      const hex = cleaned.substring(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 3;
        continue;
      }
    }
    bytes.push(cleaned.charCodeAt(i) & 0xff);
    i++;
  }

  try {
    return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
  } catch {
    return String.fromCharCode(...bytes);
  }
}

/**
 * Decodes Base64 string safely
 */
export function decodeBase64(input: string): string {
  try {
    const sanitized = input.replace(/[\r\n\s]/g, '');
    const binary = atob(sanitized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return '';
  }
}

/**
 * Unescape HTML entities
 */
export function decodeHtmlEntities(html: string): string {
  return html
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#43;/gi, '+')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export interface ParsedMhtResult {
  primaryNumber: string | null;
  phoneNumbers: string[];
  rawPreview: string;
}

/**
 * Parses an MHT file text and extracts phone numbers
 */
export async function parseMhtFile(file: File): Promise<ParsedMhtResult> {
  const text = await file.text();
  const phoneList: string[] = [];
  const seen = new Set<string>();

  // Extract from MIME parts
  const mimeExtractedText: string[] = [];
  const boundaryMatch = text.match(/boundary="?([^"\r\n;]+)"?/i);

  if (boundaryMatch && boundaryMatch[1]) {
    const boundary = boundaryMatch[1].trim();
    const parts = text.split(new RegExp(`--${escapeRegExp(boundary)}(?:--)?`));

    for (const part of parts) {
      const headerEndIndex = part.indexOf('\r\n\r\n');
      const altHeaderEndIndex = part.indexOf('\n\n');
      const splitIdx = headerEndIndex !== -1 ? headerEndIndex : altHeaderEndIndex;

      let headers = '';
      let body = part;

      if (splitIdx !== -1) {
        headers = part.substring(0, splitIdx);
        body = part.substring(splitIdx + (headerEndIndex !== -1 ? 4 : 2));
      }

      const isBase64 = /content-transfer-encoding:\s*base64/i.test(headers);
      const isQP = /content-transfer-encoding:\s*quoted-printable/i.test(headers);
      const isText = /content-type:\s*text\/(html|plain)/i.test(headers) || headers.length === 0;

      let decodedBody = body;
      if (isQP) {
        decodedBody = decodeQuotedPrintable(body);
      } else if (isBase64 && isText) {
        decodedBody = decodeBase64(body);
      }

      if (decodedBody) {
        mimeExtractedText.push(decodedBody);
      }
    }
  }

  // Include raw QP decoded as backup
  mimeExtractedText.push(decodeQuotedPrintable(text));

  const combinedContent = mimeExtractedText.join('\n');
  const decodedContent = decodeHtmlEntities(combinedContent);

  // Clean CSS, script, and comments to prevent matching CSS colors or script variables
  const cleanBodyText = decodedContent
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/style="[^"]*"/gi, ' ')
    .replace(/class="[^"]*"/gi, ' ');

  // 1. Check for labeled phone numbers (highest priority for primary number)
  // e.g. "No HP: 08123456789", "WhatsApp: 0812...", "Kontak: 0812..."
  let labeledPrimary: string | null = null;
  const labeledRegex = /(?:no(?:\.|\s+)?hp|telepon|telp|whatsapp|kontak|mobile|phone|hp)\s*[:=-]?\s*([+0-9\s().-]{9,20})/gi;
  let labelMatch: RegExpExecArray | null;
  while ((labelMatch = labeledRegex.exec(cleanBodyText)) !== null) {
    const cand = labelMatch[1];
    const norm = normalizeIndonesianPhone(cand);
    if (norm) {
      if (!labeledPrimary) labeledPrimary = norm;
      if (!seen.has(norm)) {
        seen.add(norm);
        phoneList.push(norm);
      }
    }
  }

  // 2. Extract special href links (tel: and wa.me)
  const telRegex = /href=["'](?:tel:|https?:\/\/wa\.me\/|https?:\/\/api\.whatsapp\.com\/send\?phone=)([^"'>\s&]+)["']/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = telRegex.exec(decodedContent)) !== null) {
    const rawNum = linkMatch[1];
    const normalized = normalizeIndonesianPhone(rawNum);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      phoneList.push(normalized);
    }
  }

  // 3. Regular Expression with strict boundaries:
  // Must NOT be part of a longer digit sequence (prevent date matching)
  const phonePatterns = [
    // Separated phone format: e.g. 0812-3456-7890, +62 812 3456 7890, (0812) 3456-7890
    /(?:^|[^\d+])((?:\+?62|0)\s*(?:8[1-9]\d{1,2}|2\d{1,2})[-.\s]?\d{3,4}[-.\s]?\d{3,5})(?=[^\d]|$)/g,
    // Solid phone digits: 081234567890, 6281234567890
    /(?:^|[^\d+])((?:\+?628|08)[1-9]\d{7,10})(?=[^\d]|$)/g,
    // Solid landlines: 021xxxxxxx, 6221xxxxxxx
    /(?:^|[^\d+])((?:\+?622|02)[1-9]\d{6,8})(?=[^\d]|$)/g,
  ];

  for (const pattern of phonePatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(cleanBodyText)) !== null) {
      const candidate = match[1];
      const normalized = normalizeIndonesianPhone(candidate);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        phoneList.push(normalized);
      }
    }
  }

  // Primary number selection:
  // Priority 1: Labeled number (No HP / WA)
  // Priority 2: First mobile number (628...)
  // Priority 3: First number in list
  let primary: string | null = labeledPrimary;
  if (!primary) {
    primary = phoneList.find((p) => p.startsWith('628')) || phoneList[0] || null;
  }

  // Generate clean text preview for user inspection
  const sampleCleanPreview = cleanBodyText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);

  return {
    primaryNumber: primary,
    phoneNumbers: phoneList,
    rawPreview: sampleCleanPreview || '(Tidak ada teks pratinjau)',
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
