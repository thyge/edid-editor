import {
  DisplayIdDataBlockTag,
  type DisplayIdDataBlock,
  type DisplayIdContainerIdBlock,
  type DisplayIdCtaBlock,
  type DisplayIdDisplayInterfaceFeaturesBlock,
  type DisplayIdDisplayParametersBlock,
  type DisplayIdDynamicVideoTimingRangeLimitsBlock,
  type DisplayIdProductIdentificationBlock,
  type DisplayIdStereoDisplayInterfaceBlock,
  type DisplayIdTiledDisplayTopologyBlock,
  type DisplayIdTypeVIIDetailedTimingBlock,
  type DisplayIdTypeVIIIEnumeratedTimingCodeBlock,
  type DisplayIdTypeIXFormulaBasedTimingBlock,
  type DisplayIdVendorSpecificBlock,
  DisplayIdDecodeError,
  DISPLAY_ID_V1_BLOCK_TAGS,
} from './types';
import {
  decodeDisplayParametersBlock,
  encodeDisplayParametersBlock,
  isDisplayParametersPayloadLengthValid,
} from './display-parameters';
import {
  decodeProductIdentificationBlock,
  encodeProductIdentificationBlock,
  isProductIdentificationPayloadLengthValid,
} from './product-identification';
import {
  decodeTypeVIITimingBlock,
  encodeTypeVIITimingBlock,
  isTypeVIITimingPayloadLengthValid,
} from './type-vii-timing';
import {
  decodeTypeVIIITimingBlock,
  encodeTypeVIIITimingBlock,
  isTypeVIIITimingPayloadLengthValid,
} from './type-viii-timing';
import {
  decodeTypeIXTimingBlock,
  encodeTypeIXTimingBlock,
  isTypeIXTimingPayloadLengthValid,
} from './type-ix-timing';
import {
  decodeDynamicVideoTimingRangeLimitsBlock,
  encodeDynamicVideoTimingRangeLimitsBlock,
  isDynamicVideoTimingRangeLimitsPayloadLengthValid,
} from './dynamic-range-limits';
import {
  decodeDisplayInterfaceFeaturesBlock,
  encodeDisplayInterfaceFeaturesBlock,
  isDisplayInterfaceFeaturesPayloadLengthValid,
} from './interface-features';
import {
  decodeStereoDisplayInterfaceBlock,
  encodeStereoDisplayInterfaceBlock,
  isStereoDisplayInterfacePayloadLengthValid,
} from './stereo-interface';
import {
  decodeTiledDisplayTopologyBlock,
  encodeTiledDisplayTopologyBlock,
  isTiledDisplayTopologyPayloadLengthValid,
} from './tiled-topology';
import {
  decodeContainerIdBlock,
  encodeContainerIdBlock,
  isContainerIdPayloadLengthValid,
} from './container-id';
import {
  decodeVendorSpecificBlock,
  encodeVendorSpecificBlock,
} from './vendor-specific';
import {
  decodeCtaDisplayIdBlock,
  encodeCtaDisplayIdBlock,
} from './cta-displayid';
import {
  decodeTypeXTimingBlock,
  encodeTypeXTimingBlock,
  isTypeXTimingPayloadLengthValid,
  type DisplayIdTypeXTimingBlock,
} from './type-x-timing';
import {
  decodeAdaptiveSyncBlock,
  encodeAdaptiveSyncBlock,
  isAdaptiveSyncPayloadValid,
  type DisplayIdAdaptiveSyncBlock,
} from './adaptive-sync';
import {
  decodeArvrHmdBlock,
  encodeArvrHmdBlock,
  decodeArvrLayerBlock,
  encodeArvrLayerBlock,
  ARVR_HMD_PAYLOAD_LENGTH,
  ARVR_LAYER_PAYLOAD_LENGTH,
  type DisplayIdArvrHmdBlock,
  type DisplayIdArvrLayerBlock,
} from './ar-vr';
import {
  decodeBrightnessLuminanceRangeBlock,
  encodeBrightnessLuminanceRangeBlock,
  isBrightnessLuminanceRangePayloadLengthValid,
  type DisplayIdBrightnessLuminanceRangeBlock,
} from './brightness-luminance';
import {
  decodeV1ProductIdentificationBlock,
  decodeV1DisplayParametersBlock,
  decodeV1TypeITimingBlock,
  decodeV1TiledDisplayTopologyBlock,
  decodeV1VendorSpecificBlock,
  encodeV1ProductIdentificationBlock,
  encodeV1DisplayParametersBlock,
  encodeV1TypeITimingBlock,
  encodeV1TiledDisplayTopologyBlock,
  encodeV1VendorSpecificBlock,
  isTypedV1ProductIdentificationBlock,
  isTypedV1DisplayParametersBlock,
  isTypedV1TypeITimingBlock,
  isTypedV1TiledDisplayTopologyBlock,
  isTypedV1VendorSpecificBlock,
  isV1ProductIdentificationPayloadLengthValid,
  isV1DisplayParametersPayloadLengthValid,
  isV1TypeITimingPayloadLengthValid,
  isV1TiledDisplayTopologyPayloadLengthValid,
  isV1VendorSpecificPayloadLengthValid,
} from './v1-codecs';

export interface DecodeBlocksResult {
  blocks: DisplayIdDataBlock[];
  fillBytes: number;
}

export function decodeDisplayIdBlocks(
  data: Uint8Array,
  startOffset: number,
  endOffset: number,
): DecodeBlocksResult {
  const blocks: DisplayIdDataBlock[] = [];
  let offset = startOffset;
  let fillBytes = 0;

  while (offset < endOffset) {
    const tag = data[offset];

    if (tag === 0x00) {
      fillBytes = endOffset - offset;
      break;
    }

    if (offset + 3 > endOffset) {
      throw new DisplayIdDecodeError('DisplayID data block header extends past the section payload');
    }

    const revisionAndFlags = data[offset + 1];
    const payloadLength = data[offset + 2];
    const blockEnd = offset + 3 + payloadLength;

    if (blockEnd > endOffset) {
      throw new DisplayIdDecodeError(
        `DisplayID data block at offset ${offset} declares ${payloadLength} payload bytes past the section payload`,
      );
    }

    if (tag < DisplayIdDataBlockTag.ProductIdentification) {
      throw new DisplayIdDecodeError(
        `DisplayID v2.0 reserves legacy data block tag 0x${tag.toString(16).padStart(2, '0')}`,
      );
    }

    const genericBlock: DisplayIdDataBlock = {
      tag,
      revision: revisionAndFlags & 0x07,
      flags: revisionAndFlags >> 3,
      payloadLength,
      payload: data.slice(offset + 3, blockEnd),
    };

    blocks.push(decodeKnownBlock(genericBlock));

    offset = blockEnd;
  }

  return { blocks, fillBytes };
}

export function encodeDisplayIdBlock(block: DisplayIdDataBlock): Uint8Array {
  const payload = encodeKnownPayload(block);

  if (payload.length > 0xff) {
    throw new Error(
      `DisplayID data block 0x${block.tag.toString(16).padStart(2, '0')} payload length ${payload.length} exceeds 255 bytes`,
    );
  }

  const encoded = new Uint8Array(3 + payload.length);

  encoded[0] = block.tag & 0xff;
  encoded[1] = ((block.flags & 0x1f) << 3) | (block.revision & 0x07);
  encoded[2] = payload.length & 0xff;
  encoded.set(payload, 3);

  return encoded;
}

// ---------------------------------------------------------------------------
// Tag → {decode, encode} registry — the single dispatch site for DisplayID
// data blocks (TASK-68 AC#1). The v1.x (0x00–0x12) and v2.0 (0x20+) tag spaces
// do not overlap, so one merged registry serves both the v2.0 walker
// (decodeDisplayIdBlocks) and the v1.x walker (decodeDisplayIdBlocksV1). Each
// decode entry gates on its payload-length validator (flags-aware where the
// layout depends on the block's flags byte); a known tag with a malformed
// payload falls through to OPAQUE_DISPLAYID_BLOCK and returns the raw
// carrier. Each encode entry gates on its structural isTyped* guard so an
// opaque/raw block with a known tag still round-trips verbatim. Mirrors
// mp4box BoxRegistry: per-block codecs stay free-standing, the registry is
// just the dispatch table plus an opaque default entry.
// ---------------------------------------------------------------------------

interface DisplayIdBlockCodec {
  decode(block: DisplayIdDataBlock): DisplayIdDataBlock;
  encode(block: DisplayIdDataBlock): Uint8Array;
}

const OPAQUE_DISPLAYID_BLOCK: DisplayIdBlockCodec = {
  decode: (block) => block,
  encode: (block) => block.payload,
};

const DISPLAYID_BLOCK_CODECS: Partial<Record<number, DisplayIdBlockCodec>> = {
  // DisplayID 2.0 blocks (tags 0x20–0x2e, 0x7e, 0x81)
  [DisplayIdDataBlockTag.ProductIdentification]: {
    decode: (b) =>
      isProductIdentificationPayloadLengthValid(b.payloadLength)
        ? decodeProductIdentificationBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedProductIdentificationBlock(b)
        ? encodeProductIdentificationBlock(b as DisplayIdProductIdentificationBlock)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.DisplayParameters]: {
    decode: (b) =>
      isDisplayParametersPayloadLengthValid(b.payloadLength)
        ? decodeDisplayParametersBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedDisplayParametersBlock(b)
        ? encodeDisplayParametersBlock(b as DisplayIdDisplayParametersBlock)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.TypeVIIDetailedTiming]: {
    decode: (b) =>
      isTypeVIITimingPayloadLengthValid(b.payloadLength)
        ? decodeTypeVIITimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedTypeVIITimingBlock(b)
        ? encodeTypeVIITimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode]: {
    decode: (b) =>
      isTypeVIIITimingPayloadLengthValid(b.payloadLength, b.flags)
        ? decodeTypeVIIITimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedTypeVIIITimingBlock(b)
        ? encodeTypeVIIITimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.TypeIXFormulaBasedTiming]: {
    decode: (b) =>
      isTypeIXTimingPayloadLengthValid(b.payloadLength)
        ? decodeTypeIXTimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedTypeIXTimingBlock(b)
        ? encodeTypeIXTimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits]: {
    decode: (b) =>
      isDynamicVideoTimingRangeLimitsPayloadLengthValid(b.payloadLength)
        ? decodeDynamicVideoTimingRangeLimitsBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedDynamicVideoTimingRangeLimitsBlock(b)
        ? encodeDynamicVideoTimingRangeLimitsBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.DisplayInterfaceFeatures]: {
    decode: (b) =>
      isDisplayInterfaceFeaturesPayloadLengthValid(b.payloadLength)
        ? decodeDisplayInterfaceFeaturesBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedDisplayInterfaceFeaturesBlock(b)
        ? encodeDisplayInterfaceFeaturesBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.StereoDisplayInterface]: {
    decode: (b) =>
      isStereoDisplayInterfacePayloadLengthValid(b.payloadLength)
        ? decodeStereoDisplayInterfaceBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedStereoDisplayInterfaceBlock(b)
        ? encodeStereoDisplayInterfaceBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.TiledDisplayTopology]: {
    decode: (b) =>
      isTiledDisplayTopologyPayloadLengthValid(b.payloadLength)
        ? decodeTiledDisplayTopologyBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedTiledDisplayTopologyBlock(b)
        ? encodeTiledDisplayTopologyBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.ContainerId]: {
    decode: (b) =>
      isContainerIdPayloadLengthValid(b.payloadLength)
        ? decodeContainerIdBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedContainerIdBlock(b)
        ? encodeContainerIdBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.TypeXTiming]: {
    decode: (b) => {
      const descriptorSizeCode = (b.flags >> 1) & 0x07;
      const descriptorSize = 6 + descriptorSizeCode;
      return descriptorSizeCode <= 2 && isTypeXTimingPayloadLengthValid(b.payloadLength, descriptorSize)
        ? decodeTypeXTimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b);
    },
    encode: (b) =>
      isTypedTypeXTimingBlock(b)
        ? encodeTypeXTimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.AdaptiveSync]: {
    decode: (b) => {
      const descriptorLenCode = (b.flags >> 1) & 0x07;
      return descriptorLenCode === 0 && isAdaptiveSyncPayloadValid(b.payloadLength)
        ? decodeAdaptiveSyncBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b);
    },
    encode: (b) =>
      isTypedAdaptiveSyncBlock(b)
        ? encodeAdaptiveSyncBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.ArvrHmd]: {
    decode: (b) =>
      b.payloadLength === ARVR_HMD_PAYLOAD_LENGTH
        ? decodeArvrHmdBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedArvrHmdBlock(b)
        ? encodeArvrHmdBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.ArvrLayer]: {
    decode: (b) =>
      b.payloadLength === ARVR_LAYER_PAYLOAD_LENGTH
        ? decodeArvrLayerBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedArvrLayerBlock(b)
        ? encodeArvrLayerBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.BrightnessLuminanceRange]: {
    decode: (b) =>
      isBrightnessLuminanceRangePayloadLengthValid(b.payloadLength)
        ? decodeBrightnessLuminanceRangeBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedBrightnessLuminanceRangeBlock(b)
        ? encodeBrightnessLuminanceRangeBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.VendorSpecific]: {
    decode: (b) => decodeVendorSpecificBlock(b),
    encode: (b) =>
      isTypedVendorSpecificBlock(b)
        ? encodeVendorSpecificBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DisplayIdDataBlockTag.CtaDisplayId]: {
    decode: (b) => decodeCtaDisplayIdBlock(b),
    encode: (b) =>
      isTypedCtaDisplayIdBlock(b)
        ? encodeCtaDisplayIdBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },

  // DisplayID 1.x blocks (tags 0x00, 0x01, 0x03, 0x12) — no tag overlap with v2.0.
  [DISPLAY_ID_V1_BLOCK_TAGS.ProductIdentification]: {
    decode: (b) =>
      isV1ProductIdentificationPayloadLengthValid(b.payloadLength)
        ? decodeV1ProductIdentificationBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedV1ProductIdentificationBlock(b)
        ? encodeV1ProductIdentificationBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DISPLAY_ID_V1_BLOCK_TAGS.DisplayParameters]: {
    decode: (b) =>
      isV1DisplayParametersPayloadLengthValid(b.payloadLength)
        ? decodeV1DisplayParametersBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedV1DisplayParametersBlock(b)
        ? encodeV1DisplayParametersBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DISPLAY_ID_V1_BLOCK_TAGS.TypeIDetailedTiming]: {
    decode: (b) =>
      isV1TypeITimingPayloadLengthValid(b.payloadLength)
        ? decodeV1TypeITimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedV1TypeITimingBlock(b)
        ? encodeV1TypeITimingBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DISPLAY_ID_V1_BLOCK_TAGS.TiledDisplayTopology]: {
    decode: (b) =>
      isV1TiledDisplayTopologyPayloadLengthValid(b.payloadLength)
        ? decodeV1TiledDisplayTopologyBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedV1TiledDisplayTopologyBlock(b)
        ? encodeV1TiledDisplayTopologyBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
  [DISPLAY_ID_V1_BLOCK_TAGS.VendorSpecific]: {
    decode: (b) =>
      isV1VendorSpecificPayloadLengthValid(b.payloadLength)
        ? decodeV1VendorSpecificBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.decode(b),
    encode: (b) =>
      isTypedV1VendorSpecificBlock(b)
        ? encodeV1VendorSpecificBlock(b)
        : OPAQUE_DISPLAYID_BLOCK.encode(b),
  },
};

export function decodeKnownBlock(block: DisplayIdDataBlock): DisplayIdDataBlock {
  return (DISPLAYID_BLOCK_CODECS[block.tag] ?? OPAQUE_DISPLAYID_BLOCK).decode(block);
}

export function encodeKnownPayload(block: DisplayIdDataBlock): Uint8Array {
  return (DISPLAYID_BLOCK_CODECS[block.tag] ?? OPAQUE_DISPLAYID_BLOCK).encode(block);
}

/**
 * True when a structured codec is registered for `tag` (merged v1.x + v2.0 tag
 * space). UI raw-payload editors use this to decide editability: a block with a
 * codec re-encodes from its structured fields, so a raw payload edit would be
 * silently dropped; blocks without a codec pass the payload through verbatim
 * (opaque default entry) and a raw edit round-trips.
 */
export function hasDisplayIdBlockCodec(tag: number): boolean {
  return Object.prototype.hasOwnProperty.call(DISPLAYID_BLOCK_CODECS, tag);
}

function isTypedProductIdentificationBlock(block: DisplayIdDataBlock): block is DisplayIdProductIdentificationBlock {
  const maybeBlock = block as Partial<DisplayIdProductIdentificationBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.ProductIdentification &&
    isProductIdentificationPayloadLengthValid(block.payloadLength) &&
    maybeBlock.productNameBytes instanceof Uint8Array &&
    typeof maybeBlock.productName === 'string' &&
    typeof maybeBlock.ieeeOui === 'number' &&
    typeof maybeBlock.productId === 'number' &&
    typeof maybeBlock.isModelYear === 'boolean'
  );
}

function isTypedDisplayParametersBlock(block: DisplayIdDataBlock): block is DisplayIdDisplayParametersBlock {
  return (
    block.tag === DisplayIdDataBlockTag.DisplayParameters &&
    isDisplayParametersPayloadLengthValid(block.payloadLength) &&
    typeof (block as Partial<DisplayIdDisplayParametersBlock>).horizontalImageSizeMm === 'number' &&
    typeof (block as Partial<DisplayIdDisplayParametersBlock>).verticalImageSizeMm === 'number'
  );
}

function isTypedTypeVIITimingBlock(block: DisplayIdDataBlock): block is DisplayIdTypeVIIDetailedTimingBlock {
  const maybeBlock = block as Partial<DisplayIdTypeVIIDetailedTimingBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.TypeVIIDetailedTiming &&
    Array.isArray(maybeBlock.timings) &&
    maybeBlock.timings.every((timing) => (
      typeof timing.pixelClockKHz === 'number' &&
      typeof timing.aspectRatio === 'number' &&
      typeof timing.interlaced === 'boolean' &&
      typeof timing.stereo === 'number' &&
      typeof timing.preferred === 'boolean' &&
      typeof timing.horizontalActive === 'number' &&
      typeof timing.horizontalBlanking === 'number' &&
      typeof timing.horizontalSyncOffset === 'number' &&
      typeof timing.horizontalSyncPolarity === 'boolean' &&
      typeof timing.horizontalSyncWidth === 'number' &&
      typeof timing.verticalActive === 'number' &&
      typeof timing.verticalBlanking === 'number' &&
      typeof timing.verticalSyncOffset === 'number' &&
      typeof timing.verticalSyncPolarity === 'boolean' &&
      typeof timing.verticalSyncWidth === 'number'
    ))
  );
}

function isTypedTypeVIIITimingBlock(block: DisplayIdDataBlock): block is DisplayIdTypeVIIIEnumeratedTimingCodeBlock {
  const maybeBlock = block as Partial<DisplayIdTypeVIIIEnumeratedTimingCodeBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode &&
    typeof maybeBlock.codeType === 'number' &&
    typeof maybeBlock.codeSize === 'number' &&
    Array.isArray(maybeBlock.timingCodes) &&
    maybeBlock.timingCodes.every((code) => typeof code === 'number')
  );
}

function isTypedTypeIXTimingBlock(block: DisplayIdDataBlock): block is DisplayIdTypeIXFormulaBasedTimingBlock {
  const maybeBlock = block as Partial<DisplayIdTypeIXFormulaBasedTimingBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.TypeIXFormulaBasedTiming &&
    Array.isArray(maybeBlock.timings) &&
    maybeBlock.timings.every((timing) => (
      typeof timing.formula === 'number' &&
      typeof timing.ntscPullDown === 'boolean' &&
      typeof timing.stereo === 'number' &&
      typeof timing.horizontalActive === 'number' &&
      typeof timing.verticalActive === 'number' &&
      typeof timing.refreshRateHz === 'number'
    ))
  );
}

function isTypedDynamicVideoTimingRangeLimitsBlock(
  block: DisplayIdDataBlock,
): block is DisplayIdDynamicVideoTimingRangeLimitsBlock {
  const maybeBlock = block as Partial<DisplayIdDynamicVideoTimingRangeLimitsBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits &&
    isDynamicVideoTimingRangeLimitsPayloadLengthValid(block.payloadLength) &&
    typeof maybeBlock.minimumPixelClockKHz === 'number' &&
    typeof maybeBlock.maximumPixelClockKHz === 'number' &&
    typeof maybeBlock.minimumHorizontalFrequencyHz === 'number' &&
    typeof maybeBlock.maximumHorizontalFrequencyHz === 'number' &&
    typeof maybeBlock.minimumVerticalFrequencyHz === 'number' &&
    typeof maybeBlock.maximumVerticalFrequencyHz === 'number' &&
    typeof maybeBlock.seamlessDynamicVideoTiming === 'boolean'
  );
}

function isTypedDisplayInterfaceFeaturesBlock(
  block: DisplayIdDataBlock,
): block is DisplayIdDisplayInterfaceFeaturesBlock {
  const maybeBlock = block as Partial<DisplayIdDisplayInterfaceFeaturesBlock>;
  const audio = maybeBlock.audioSampleRates;
  const std1 = maybeBlock.colorSpaceEotfStandard1;

  return (
    block.tag === DisplayIdDataBlockTag.DisplayInterfaceFeatures &&
    isDisplayInterfaceFeaturesPayloadLengthValid(block.payloadLength) &&
    Array.isArray(maybeBlock.rgbColorDepths) &&
    Array.isArray(maybeBlock.ycbcr444ColorDepths) &&
    Array.isArray(maybeBlock.ycbcr422ColorDepths) &&
    Array.isArray(maybeBlock.ycbcr420ColorDepths) &&
    maybeBlock.rgbColorDepths.every((d) => typeof d === 'number') &&
    typeof maybeBlock.ycbcr420MinPixelRateMultiplier === 'number' &&
    audio !== undefined &&
    typeof audio.sr32kHz === 'boolean' &&
    typeof audio.sr44_1kHz === 'boolean' &&
    typeof audio.sr48kHz === 'boolean' &&
    std1 !== undefined &&
    typeof std1.srgb === 'boolean' &&
    typeof std1.bt601 === 'boolean' &&
    typeof std1.bt709Bt1886 === 'boolean' &&
    typeof std1.adobeRgb === 'boolean' &&
    typeof std1.dciP3 === 'boolean' &&
    typeof std1.bt2020 === 'boolean' &&
    typeof std1.bt2020St2084 === 'boolean' &&
    Array.isArray(maybeBlock.additionalColorSpaceEotfCombinations) &&
    maybeBlock.additionalColorSpaceEotfCombinations.every(
      (c) => typeof c?.colorSpace === 'number' && typeof c?.eotf === 'number',
    ) &&
    block.payload instanceof Uint8Array
  );
}

function isTypedStereoDisplayInterfaceBlock(block: DisplayIdDataBlock): block is DisplayIdStereoDisplayInterfaceBlock {
  const maybeBlock = block as Partial<DisplayIdStereoDisplayInterfaceBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.StereoDisplayInterface &&
    isStereoDisplayInterfacePayloadLengthValid(block.payloadLength) &&
    typeof maybeBlock.timingSupport === 'number' &&
    typeof maybeBlock.methodCode === 'number' &&
    maybeBlock.methodParameters instanceof Uint8Array &&
    Array.isArray(maybeBlock.stereoTimingCodeDescriptors) &&
    maybeBlock.stereoTimingCodeDescriptors.every(
      (d) => typeof d?.type === 'number' && Array.isArray(d?.timingCodes) && d.timingCodes.every((c) => typeof c === 'number'),
    ) &&
    maybeBlock.trailing instanceof Uint8Array
  );
}

function isTypedTiledDisplayTopologyBlock(block: DisplayIdDataBlock): block is DisplayIdTiledDisplayTopologyBlock {
  const maybeBlock = block as Partial<DisplayIdTiledDisplayTopologyBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.TiledDisplayTopology &&
    isTiledDisplayTopologyPayloadLengthValid(block.payloadLength) &&
    typeof maybeBlock.singleTileBehavior === 'number' &&
    typeof maybeBlock.subsetTileBehavior === 'number' &&
    typeof maybeBlock.bezelInfoPresent === 'boolean' &&
    typeof maybeBlock.singleEnclosure === 'boolean' &&
    typeof maybeBlock.tileCountHorizontal === 'number' &&
    typeof maybeBlock.tileCountVertical === 'number' &&
    typeof maybeBlock.tileLocationHorizontal === 'number' &&
    typeof maybeBlock.tileLocationVertical === 'number' &&
    typeof maybeBlock.tileWidthPixels === 'number' &&
    typeof maybeBlock.tileHeightPixels === 'number' &&
    typeof maybeBlock.pixelMultiplier === 'number' &&
    typeof maybeBlock.topBezelSize === 'number' &&
    typeof maybeBlock.bottomBezelSize === 'number' &&
    typeof maybeBlock.rightBezelSize === 'number' &&
    typeof maybeBlock.leftBezelSize === 'number' &&
    typeof maybeBlock.vendorOui === 'number' &&
    typeof maybeBlock.productId === 'number' &&
    typeof maybeBlock.serialNumber === 'number'
  );
}

function isTypedContainerIdBlock(block: DisplayIdDataBlock): block is DisplayIdContainerIdBlock {
  const maybeBlock = block as Partial<DisplayIdContainerIdBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.ContainerId &&
    maybeBlock.containerId instanceof Uint8Array &&
    isContainerIdPayloadLengthValid(maybeBlock.containerId.length)
  );
}

function isTypedTypeXTimingBlock(block: DisplayIdDataBlock): block is DisplayIdTypeXTimingBlock {
  const maybeBlock = block as Partial<DisplayIdTypeXTimingBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.TypeXTiming &&
    typeof maybeBlock.descriptorSize === 'number' &&
    Array.isArray(maybeBlock.timings)
  );
}

function isTypedAdaptiveSyncBlock(block: DisplayIdDataBlock): block is DisplayIdAdaptiveSyncBlock {
  return (
    block.tag === DisplayIdDataBlockTag.AdaptiveSync &&
    Array.isArray((block as Partial<DisplayIdAdaptiveSyncBlock>).descriptors)
  );
}

function isTypedArvrHmdBlock(block: DisplayIdDataBlock): block is DisplayIdArvrHmdBlock {
  return (
    block.tag === DisplayIdDataBlockTag.ArvrHmd &&
    typeof (block as Partial<DisplayIdArvrHmdBlock>).dualLayerSingleStreamTransport === 'number'
  );
}

function isTypedArvrLayerBlock(block: DisplayIdDataBlock): block is DisplayIdArvrLayerBlock {
  return (
    block.tag === DisplayIdDataBlockTag.ArvrLayer &&
    typeof (block as Partial<DisplayIdArvrLayerBlock>).hmdManufacturerOui === 'number'
  );
}

function isTypedBrightnessLuminanceRangeBlock(
  block: DisplayIdDataBlock,
): block is DisplayIdBrightnessLuminanceRangeBlock {
  return (
    block.tag === DisplayIdDataBlockTag.BrightnessLuminanceRange &&
    typeof (block as Partial<DisplayIdBrightnessLuminanceRangeBlock>).minSdrLuminance === 'number'
  );
}

function isTypedVendorSpecificBlock(block: DisplayIdDataBlock): block is DisplayIdVendorSpecificBlock {
  const maybeBlock = block as Partial<DisplayIdVendorSpecificBlock>;
  return (
    block.tag === DisplayIdDataBlockTag.VendorSpecific &&
    typeof maybeBlock.ieeeOui === 'number'
  );
}

function isTypedCtaDisplayIdBlock(block: DisplayIdDataBlock): block is DisplayIdCtaBlock {
  const maybeBlock = block as Partial<DisplayIdCtaBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.CtaDisplayId &&
    maybeBlock.ctaPayload instanceof Uint8Array &&
    Array.isArray(maybeBlock.dataBlocks) &&
    maybeBlock.trailing instanceof Uint8Array
  );
}
