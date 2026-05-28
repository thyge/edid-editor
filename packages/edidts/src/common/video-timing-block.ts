import {
  decodeEdidCtaDetailedTiming,
  encodeEdidCtaDetailedTiming,
  type DetailedTiming,
  type DetailedTimingInput,
} from './detailed-timing-descriptor';

export interface VideoTimingBlockBase {
  tag: 0x10;
  revision: number;
  checksum: number;
  data: Uint8Array;
}

export type VideoTimingBlockAspectRatio = '4:3' | '16:9' | '16:10' | '5:4';

export interface VideoTimingBlockCvtTiming {
  lines: number;
  aspectRatio: VideoTimingBlockAspectRatio;
  preferredRefreshRate: number;
  refreshRates?: {
    r50Hz: boolean;
    r60Hz: boolean;
    r75Hz: boolean;
    r85Hz: boolean;
    r60HzRB: boolean;
  };
}

export interface VideoTimingBlockStandardTiming {
  width: number;
  height: number;
  refreshRate: number;
}

export type VideoTimingBlockDetailedTiming = DetailedTimingInput;

export interface VideoTimingBlock extends VideoTimingBlockBase {
  detailedTimings: DetailedTiming[];
  cvtTimings: VideoTimingBlockCvtTiming[];
  standardTimings: VideoTimingBlockStandardTiming[];
}

export interface VideoTimingBlockInput extends VideoTimingBlockBase {
  detailedTimings: VideoTimingBlockDetailedTiming[];
  cvtTimings: VideoTimingBlockCvtTiming[];
  standardTimings: VideoTimingBlockStandardTiming[];
}

export function decodeVideoTimingBlock(data: Uint8Array, base: Omit<VideoTimingBlockBase, 'tag'>): VideoTimingBlock {
  const numDTDs = data[2];
  const numCVTs = data[3];
  const numSTs = data[4];

  const vtb: VideoTimingBlock = {
    ...base,
    tag: 0x10,
    detailedTimings: [],
    cvtTimings: [],
    standardTimings: [],
  };

  let offset = 5;

  for (let i = 0; i < numDTDs && offset + 18 <= 127; i += 1) {
    const timing = decodeEdidCtaDetailedTiming(data.slice(offset, offset + 18));
    if (timing) {
      vtb.detailedTimings.push(timing);
    }
    offset += 18;
  }

  for (let i = 0; i < numCVTs && offset + 3 <= 127; i += 1) {
    const vSize = ((data[offset + 1] & 0xf0) << 4) | data[offset];
    const arCode = (data[offset + 1] >> 2) & 0x03;
    const refreshByte = data[offset + 2];
    const arMap: Record<number, VideoTimingBlockAspectRatio> = {
      0: '4:3',
      1: '16:9',
      2: '16:10',
      3: '5:4',
    };

    vtb.cvtTimings.push({
      lines: (vSize + 1) * 2,
      aspectRatio: arMap[arCode] ?? '4:3',
      preferredRefreshRate: [50, 60, 75, 85][(refreshByte >> 5) & 0x03] ?? 60,
      refreshRates: {
        r50Hz: (refreshByte & 0x10) !== 0,
        r60Hz: (refreshByte & 0x08) !== 0,
        r75Hz: (refreshByte & 0x04) !== 0,
        r85Hz: (refreshByte & 0x02) !== 0,
        r60HzRB: (refreshByte & 0x01) !== 0,
      },
    });
    offset += 3;
  }

  for (let i = 0; i < numSTs && offset + 2 <= 127; i += 1) {
    const timing = decodeStandardTimingPair(data[offset], data[offset + 1]);
    if (timing) {
      vtb.standardTimings.push(timing);
    }
    offset += 2;
  }

  return vtb;
}

export function encodeVideoTimingBlock(block: VideoTimingBlockInput): Uint8Array {
  const bytes = new Uint8Array(128);
  bytes[0] = 0x10;
  bytes[1] = block.revision & 0xff;

  let offset = 5;
  let detailedTimingCount = 0;
  let cvtTimingCount = 0;
  let standardTimingCount = 0;

  for (let i = 0; i < block.detailedTimings.length && detailedTimingCount < 6 && offset + 18 <= 127; i += 1) {
    bytes.set(encodeEdidCtaDetailedTiming(block.detailedTimings[i]), offset);
    offset += 18;
    detailedTimingCount += 1;
  }

  for (let i = 0; i < block.cvtTimings.length && cvtTimingCount < 40 && offset + 3 <= 127; i += 1) {
    const timing = block.cvtTimings[i];
    const vSize = Math.max(0, Math.round(timing.lines / 2) - 1);
    const aspectCode = cvtAspectCode(timing.aspectRatio);
    const refreshCode = cvtRefreshCode(timing.preferredRefreshRate);

    bytes[offset] = vSize & 0xff;
    bytes[offset + 1] = ((vSize >> 8) & 0x0f) << 4 | ((aspectCode & 0x03) << 2);
    bytes[offset + 2] = ((refreshCode & 0x03) << 5) | encodeCvtRefreshRates(timing);
    offset += 3;
    cvtTimingCount += 1;
  }

  for (let i = 0; i < block.standardTimings.length && standardTimingCount < 61 && offset + 2 <= 127; i += 1) {
    const [byte1, byte2] = encodeStandardTimingPair(block.standardTimings[i]);
    bytes[offset] = byte1;
    bytes[offset + 1] = byte2;
    offset += 2;
    standardTimingCount += 1;
  }

  bytes[2] = detailedTimingCount & 0xff;
  bytes[3] = cvtTimingCount & 0xff;
  bytes[4] = standardTimingCount & 0xff;
  bytes[127] = calculateChecksum(bytes);

  return bytes;
}

function decodeStandardTimingPair(byte1: number, byte2: number): VideoTimingBlockStandardTiming | null {
  if (byte1 === 0x01 && byte2 === 0x01) {
    return null;
  }

  const width = (byte1 + 31) * 8;
  const aspectRatio = (byte2 >> 6) & 0x03;
  let height: number;

  switch (aspectRatio) {
    case 0: height = Math.round(width * 10 / 16); break;
    case 1: height = Math.round(width * 3 / 4); break;
    case 2: height = Math.round(width * 4 / 5); break;
    case 3: height = Math.round(width * 9 / 16); break;
    default: height = width;
  }

  return {
    width,
    height,
    refreshRate: (byte2 & 0x3f) + 60,
  };
}

function encodeStandardTimingPair(timing: VideoTimingBlockStandardTiming): [number, number] {
  const roundedWidth = Math.round(timing.width / 8) * 8;
  const clampedWidth = Math.min(2288, Math.max(256, roundedWidth));
  const widthByte = Math.max(1, Math.min(255, Math.round(clampedWidth / 8) - 31));
  const refresh = Math.min(123, Math.max(60, Math.round(timing.refreshRate))) - 60;

  return [widthByte, ((standardTimingAspectCode(clampedWidth, timing.height) & 0x03) << 6) | (refresh & 0x3f)];
}

function standardTimingAspectCode(width: number, height: number): number {
  const targetRatio = width / height;
  const ratios = [
    { code: 0, ratio: 16 / 10 },
    { code: 1, ratio: 4 / 3 },
    { code: 2, ratio: 5 / 4 },
    { code: 3, ratio: 16 / 9 },
  ];
  let best = 3;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const candidate of ratios) {
    const diff = Math.abs(targetRatio - candidate.ratio);
    if (diff < bestDiff) {
      best = candidate.code;
      bestDiff = diff;
    }
  }

  return best;
}

function cvtAspectCode(aspectRatio: VideoTimingBlockAspectRatio): number {
  switch (aspectRatio) {
    case '4:3': return 0;
    case '16:9': return 1;
    case '16:10': return 2;
    case '5:4': return 3;
  }
}

function cvtRefreshCode(refreshRate: number): number {
  const refreshRates = [50, 60, 75, 85];
  let best = 1;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (let i = 0; i < refreshRates.length; i += 1) {
    const diff = Math.abs(refreshRate - refreshRates[i]);
    if (diff < bestDiff) {
      best = i;
      bestDiff = diff;
    }
  }

  return best;
}

function encodeCvtRefreshRates(timing: VideoTimingBlockCvtTiming): number {
  const rates = timing.refreshRates;
  if (!rates) return 0;

  let byte = 0;
  if (rates.r50Hz) byte |= 0x10;
  if (rates.r60Hz) byte |= 0x08;
  if (rates.r75Hz) byte |= 0x04;
  if (rates.r85Hz) byte |= 0x02;
  if (rates.r60HzRB) byte |= 0x01;
  return byte;
}

function calculateChecksum(bytes: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < 127; i += 1) {
    sum += bytes[i];
  }

  return (256 - (sum % 256)) % 256;
}
