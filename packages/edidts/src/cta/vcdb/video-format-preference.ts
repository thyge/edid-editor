/**
 * Video Format Preference Data Block (CTA-861-G §7.5.8, Extended Tag 13)
 *
 * VCDB-family block (see `cta/vcdb/`): indicates preferred video formats in order.
 */

import type { ExtendedDataBlock } from '../cta-extended-blocks';

export interface VideoFormatPreferenceDataBlock extends ExtendedDataBlock {
  tag: 0x07;
  extendedTag: 0x0D;
  svrs: Array<{
    vic?: number;      // If SVR < 128, it's a VIC
    dtdIndex?: number; // If SVR >= 129, it's DTD index (SVR - 128)
  }>;
}

export function decodeVideoFormatPreferenceBlock(base: ExtendedDataBlock, payload: Uint8Array): VideoFormatPreferenceDataBlock {
  const svrs: VideoFormatPreferenceDataBlock['svrs'] = [];

  for (let i = 0; i < payload.length; i++) {
    const svr = payload[i];
    if (svr === 0) continue;

    if (svr < 128) {
      svrs.push({ vic: svr });
    } else if (svr >= 129) {
      svrs.push({ dtdIndex: svr - 128 });
    }
  }

  return {
    ...base,
    extendedTag: 0x0D,
    svrs,
  };
}

export function encodeVideoFormatPreferenceBlock(block: VideoFormatPreferenceDataBlock): Uint8Array {
  const bytes = [0x0d];
  for (const svr of block.svrs) {
    if (svr.vic !== undefined) {
      // VICs occupy byte values 1..127; a 0 byte means "no entry".
      if (svr.vic > 0 && svr.vic < 128) bytes.push(svr.vic);
    } else if (svr.dtdIndex !== undefined) {
      // DTD indices are carried as 128 + index (129..255).
      bytes.push(128 + svr.dtdIndex);
    }
  }
  return new Uint8Array(bytes);
}