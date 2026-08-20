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

function decodeKnownBlock(block: DisplayIdDataBlock): DisplayIdDataBlock {
  if (
    block.tag === DisplayIdDataBlockTag.ProductIdentification &&
    isProductIdentificationPayloadLengthValid(block.payloadLength)
  ) {
    return decodeProductIdentificationBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.DisplayParameters &&
    isDisplayParametersPayloadLengthValid(block.payloadLength)
  ) {
    return decodeDisplayParametersBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.TypeVIIDetailedTiming &&
    isTypeVIITimingPayloadLengthValid(block.payloadLength)
  ) {
    return decodeTypeVIITimingBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.TypeVIIIEnumeratedTimingCode &&
    isTypeVIIITimingPayloadLengthValid(block.payloadLength, block.flags)
  ) {
    return decodeTypeVIIITimingBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.TypeIXFormulaBasedTiming &&
    isTypeIXTimingPayloadLengthValid(block.payloadLength)
  ) {
    return decodeTypeIXTimingBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.DynamicVideoTimingRangeLimits &&
    isDynamicVideoTimingRangeLimitsPayloadLengthValid(block.payloadLength)
  ) {
    return decodeDynamicVideoTimingRangeLimitsBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.DisplayInterfaceFeatures &&
    isDisplayInterfaceFeaturesPayloadLengthValid(block.payloadLength)
  ) {
    return decodeDisplayInterfaceFeaturesBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.StereoDisplayInterface &&
    isStereoDisplayInterfacePayloadLengthValid(block.payloadLength)
  ) {
    return decodeStereoDisplayInterfaceBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.TiledDisplayTopology &&
    isTiledDisplayTopologyPayloadLengthValid(block.payloadLength)
  ) {
    return decodeTiledDisplayTopologyBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.ContainerId &&
    isContainerIdPayloadLengthValid(block.payloadLength)
  ) {
    return decodeContainerIdBlock(block);
  }

  if (block.tag === DisplayIdDataBlockTag.TypeXTiming) {
    const descriptorSizeCode = (block.flags >> 1) & 0x07;
    const descriptorSize = 6 + descriptorSizeCode;
    if (descriptorSizeCode <= 2 && isTypeXTimingPayloadLengthValid(block.payloadLength, descriptorSize)) {
      return decodeTypeXTimingBlock(block);
    }
  }

  if (block.tag === DisplayIdDataBlockTag.AdaptiveSync) {
    const descriptorLenCode = (block.flags >> 1) & 0x07;
    if (descriptorLenCode === 0 && isAdaptiveSyncPayloadValid(block.payloadLength)) {
      return decodeAdaptiveSyncBlock(block);
    }
  }

  if (block.tag === DisplayIdDataBlockTag.ArvrHmd && block.payloadLength === ARVR_HMD_PAYLOAD_LENGTH) {
    return decodeArvrHmdBlock(block);
  }

  if (block.tag === DisplayIdDataBlockTag.ArvrLayer && block.payloadLength === ARVR_LAYER_PAYLOAD_LENGTH) {
    return decodeArvrLayerBlock(block);
  }

  if (
    block.tag === DisplayIdDataBlockTag.BrightnessLuminanceRange &&
    isBrightnessLuminanceRangePayloadLengthValid(block.payloadLength)
  ) {
    return decodeBrightnessLuminanceRangeBlock(block);
  }

  if (block.tag === DisplayIdDataBlockTag.VendorSpecific) {
    return decodeVendorSpecificBlock(block);
  }

  if (block.tag === DisplayIdDataBlockTag.CtaDisplayId) {
    return decodeCtaDisplayIdBlock(block);
  }

  return block;
}

function encodeKnownPayload(block: DisplayIdDataBlock): Uint8Array {
  if (isTypedProductIdentificationBlock(block)) {
    return encodeProductIdentificationBlock(block as DisplayIdProductIdentificationBlock);
  }

  if (isTypedDisplayParametersBlock(block)) {
    return encodeDisplayParametersBlock(block as DisplayIdDisplayParametersBlock);
  }

  if (isTypedTypeVIITimingBlock(block)) {
    return encodeTypeVIITimingBlock(block);
  }

  if (isTypedTypeVIIITimingBlock(block)) {
    return encodeTypeVIIITimingBlock(block);
  }

  if (isTypedTypeIXTimingBlock(block)) {
    return encodeTypeIXTimingBlock(block);
  }

  if (isTypedDynamicVideoTimingRangeLimitsBlock(block)) {
    return encodeDynamicVideoTimingRangeLimitsBlock(block);
  }

  if (isTypedDisplayInterfaceFeaturesBlock(block)) {
    return encodeDisplayInterfaceFeaturesBlock(block);
  }

  if (isTypedStereoDisplayInterfaceBlock(block)) {
    return encodeStereoDisplayInterfaceBlock(block);
  }

  if (isTypedTiledDisplayTopologyBlock(block)) {
    return encodeTiledDisplayTopologyBlock(block);
  }

  if (isTypedContainerIdBlock(block)) {
    return encodeContainerIdBlock(block);
  }

  if (isTypedTypeXTimingBlock(block)) {
    return encodeTypeXTimingBlock(block);
  }

  if (isTypedAdaptiveSyncBlock(block)) {
    return encodeAdaptiveSyncBlock(block);
  }

  if (isTypedArvrHmdBlock(block)) {
    return encodeArvrHmdBlock(block);
  }

  if (isTypedArvrLayerBlock(block)) {
    return encodeArvrLayerBlock(block);
  }

  if (isTypedBrightnessLuminanceRangeBlock(block)) {
    return encodeBrightnessLuminanceRangeBlock(block);
  }

  if (isTypedVendorSpecificBlock(block)) {
    return encodeVendorSpecificBlock(block);
  }

  if (isTypedCtaDisplayIdBlock(block)) {
    return encodeCtaDisplayIdBlock(block);
  }

  return block.payload;
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
    typeof maybeBlock.tileCountHorizontal === 'number' &&
    typeof maybeBlock.tileCountVertical === 'number' &&
    typeof maybeBlock.tileLocationHorizontal === 'number' &&
    typeof maybeBlock.tileLocationVertical === 'number' &&
    typeof maybeBlock.tileWidthPixels === 'number' &&
    typeof maybeBlock.tileHeightPixels === 'number'
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
  return block.tag === DisplayIdDataBlockTag.VendorSpecific;
}

function isTypedCtaDisplayIdBlock(block: DisplayIdDataBlock): block is DisplayIdCtaBlock {
  const maybeBlock = block as Partial<DisplayIdCtaBlock>;

  return (
    block.tag === DisplayIdDataBlockTag.CtaDisplayId &&
    maybeBlock.ctaPayload instanceof Uint8Array
  );
}
