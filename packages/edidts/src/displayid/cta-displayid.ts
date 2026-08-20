// packages/edidts/src/displayid/cta-displayid.ts

import {
  DisplayIdDataBlockTag,
  type DisplayIdCtaBlock,
  type DisplayIdDataBlock,
} from './types';
import { ExtensionBlockParser } from '../cta/extension-block';

/**
 * DisplayID 2.0 §4.10 CTA DisplayID Data Block (tag 0x81).
 *
 * The payload is a stream of CTA-861 short data blocks — the same format a
 * CEA-861 extension block uses for its data-block region. Parsing/encoding is
 * delegated to the existing CTA short-block codec on `ExtensionBlockParser`
 * (`decodeCtaDataBlockStream` / `encodeCtaDataBlockStream`), which reuse the
 * same per-block decoders/encoders (audio, video, VSDB, speaker, VESA transfer,
 * extended-tag) as the CEA extension block.
 *
 * Cross-checked against edid-decode parse_displayid_cta_data_block
 * (parse-displayid-block.cpp:1459).
 *
 * `ctaPayload` keeps the raw decoded bytes (for the UI hex editor); encode
 * rebuilds from `dataBlocks` (+ `trailing` remainder) per the task's AC #2.
 */

export function decodeCtaDisplayIdBlock(block: DisplayIdDataBlock): DisplayIdCtaBlock {
  const raw = block.payload;
  const { dataBlocks, trailing } = ExtensionBlockParser.decodeCtaDataBlockStream(raw);
  return {
    ...block,
    tag: DisplayIdDataBlockTag.CtaDisplayId,
    ctaPayload: raw.slice(),
    dataBlocks,
    trailing,
  };
}

export function encodeCtaDisplayIdBlock(block: DisplayIdCtaBlock): Uint8Array {
  return ExtensionBlockParser.encodeCtaDataBlockStream(block.dataBlocks, block.trailing);
}