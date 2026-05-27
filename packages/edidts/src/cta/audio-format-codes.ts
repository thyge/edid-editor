/**
 * Audio Format Codes
 * 
 * Per CTA-861-G Table 53 - Audio Format Codes
 */

export interface AudioFormatDefinition {
  code: number;
  name: string;
  shortName: string;
  maxChannels?: number;
  description: string;
}

/**
 * Audio format codes as defined in CTA-861-G
 */
export const AUDIO_FORMAT_CODES: AudioFormatDefinition[] = [
  { code: 0, name: 'Reserved', shortName: 'Reserved', description: 'Reserved' },
  { code: 1, name: 'Linear PCM', shortName: 'LPCM', description: 'Linear Pulse Code Modulation' },
  { code: 2, name: 'AC-3', shortName: 'AC3', description: 'Dolby Digital' },
  { code: 3, name: 'MPEG-1 Audio', shortName: 'MPEG1', description: 'MPEG-1 Audio Layer 1 & 2' },
  { code: 4, name: 'MP3', shortName: 'MP3', description: 'MPEG-1 Audio Layer 3' },
  { code: 5, name: 'MPEG2 Audio', shortName: 'MPEG2', description: 'MPEG-2 Multi-channel Audio' },
  { code: 6, name: 'AAC LC', shortName: 'AAC', description: 'Advanced Audio Coding Low Complexity' },
  { code: 7, name: 'DTS', shortName: 'DTS', description: 'Digital Theater Systems' },
  { code: 8, name: 'ATRAC', shortName: 'ATRAC', description: 'Adaptive Transform Acoustic Coding' },
  { code: 9, name: 'One Bit Audio', shortName: 'DSD', description: 'DSD (Direct Stream Digital)' },
  { code: 10, name: 'Enhanced AC-3', shortName: 'E-AC3', description: 'Dolby Digital Plus' },
  { code: 11, name: 'DTS-HD', shortName: 'DTS-HD', description: 'DTS-HD Master Audio' },
  { code: 12, name: 'MAT', shortName: 'TrueHD', description: 'Dolby TrueHD (Meridian Lossless Packing)' },
  { code: 13, name: 'DST', shortName: 'DST', description: 'Direct Stream Transfer' },
  { code: 14, name: 'WMA Pro', shortName: 'WMA', description: 'Windows Media Audio Professional' },
  { code: 15, name: 'Audio Format Extension', shortName: 'Ext', description: 'Extended Audio Format Code in byte 3' },
];

/**
 * Extended Audio Format Codes (when code 15 is used)
 * The extended code is in bits 7:3 of byte 3 of the SAD
 */
export const EXTENDED_AUDIO_FORMAT_CODES: AudioFormatDefinition[] = [
  { code: 4, name: 'MPEG-4 HE AAC', shortName: 'HE-AAC', description: 'High-Efficiency AAC' },
  { code: 5, name: 'MPEG-4 HE AAC v2', shortName: 'HE-AACv2', description: 'High-Efficiency AAC version 2' },
  { code: 6, name: 'MPEG-4 AAC LC', shortName: 'AAC-LC', description: 'MPEG-4 AAC Low Complexity' },
  { code: 7, name: 'DRA', shortName: 'DRA', description: 'Dynamic Resolution Adaptation' },
  { code: 8, name: 'MPEG-4 HE AAC + MPEG Surround', shortName: 'HE-AAC+MPS', description: 'HE-AAC with MPEG Surround' },
  { code: 10, name: 'MPEG-4 AAC LC + MPEG Surround', shortName: 'AAC-LC+MPS', description: 'AAC-LC with MPEG Surround' },
  { code: 11, name: 'MPEG-H 3D Audio', shortName: 'MPEG-H', description: 'MPEG-H 3D Audio' },
  { code: 12, name: 'AC-4', shortName: 'AC-4', description: 'Dolby AC-4' },
  { code: 13, name: 'L-PCM 3D Audio', shortName: 'LPCM-3D', description: 'LPCM 3D Audio' },
];

// Create lookup maps
const AUDIO_FORMAT_MAP = new Map<number, AudioFormatDefinition>();
for (const fmt of AUDIO_FORMAT_CODES) {
  AUDIO_FORMAT_MAP.set(fmt.code, fmt);
}

const EXT_AUDIO_FORMAT_MAP = new Map<number, AudioFormatDefinition>();
for (const fmt of EXTENDED_AUDIO_FORMAT_CODES) {
  EXT_AUDIO_FORMAT_MAP.set(fmt.code, fmt);
}

/**
 * Get audio format name from code
 */
export function getAudioFormatName(code: number): string {
  const fmt = AUDIO_FORMAT_MAP.get(code);
  return fmt?.name ?? `Unknown (${code})`;
}

/**
 * Get audio format short name from code
 */
export function getAudioFormatShortName(code: number): string {
  const fmt = AUDIO_FORMAT_MAP.get(code);
  return fmt?.shortName ?? `Unknown`;
}

/**
 * Get extended audio format name (when code=15)
 */
export function getExtendedAudioFormatName(extCode: number): string {
  const fmt = EXT_AUDIO_FORMAT_MAP.get(extCode);
  return fmt?.name ?? `Unknown Extended (${extCode})`;
}

/**
 * Sampling rate flags to human-readable string
 */
export function getSamplingRatesString(rates: {
  sr32kHz?: boolean;
  sr44_1kHz?: boolean;
  sr48kHz?: boolean;
  sr88_2kHz?: boolean;
  sr96kHz?: boolean;
  sr176_4kHz?: boolean;
  sr192kHz?: boolean;
}): string {
  const rateStrings: string[] = [];
  if (rates.sr32kHz) rateStrings.push('32');
  if (rates.sr44_1kHz) rateStrings.push('44.1');
  if (rates.sr48kHz) rateStrings.push('48');
  if (rates.sr88_2kHz) rateStrings.push('88.2');
  if (rates.sr96kHz) rateStrings.push('96');
  if (rates.sr176_4kHz) rateStrings.push('176.4');
  if (rates.sr192kHz) rateStrings.push('192');
  return rateStrings.join(', ') + ' kHz';
}

/**
 * Bit depth flags to human-readable string (for LPCM)
 */
export function getBitDepthsString(depths: {
  bd16?: boolean;
  bd20?: boolean;
  bd24?: boolean;
}): string {
  const depthStrings: string[] = [];
  if (depths.bd16) depthStrings.push('16');
  if (depths.bd20) depthStrings.push('20');
  if (depths.bd24) depthStrings.push('24');
  return depthStrings.join('/') + '-bit';
}
