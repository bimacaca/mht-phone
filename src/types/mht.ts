export interface ExtractedPhone {
  id: string;
  originalRaw: string;
  normalized: string; // "628xxxxxxxxxx"
  prefix: string; // "62812", "6221", etc.
  provider: PhoneProvider;
  providerName: string;
  sourceFiles: string[]; // List of file names where this number was found
  occurrences: number;
}

export type PhoneProvider = 
  | 'telkomsel' 
  | 'indosat' 
  | 'xl_axis' 
  | 'smartfren' 
  | 'tri' 
  | 'pstn' 
  | 'other';

export interface MhtFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  primaryNumber?: string | null;
  extractedCount: number;
  extractedNumbers: string[];
  errorMessage?: string;
  rawTextPreview?: string;
}

export type SortOrder = 'asc' | 'desc' | 'original';

export type FilterCategory = 'all' | 'mobile_only' | 'pstn_only';

export type ExtractionMode = 'one_per_file' | 'all_numbers';
