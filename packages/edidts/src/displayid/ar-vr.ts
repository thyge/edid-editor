/**
 * DisplayID 2.1 AR/VR HMD (tag 0x2C) and AR/VR Layer (tag 0x2D) codecs.
 *
 * Authoritative byte-level layout sourced from the edid-decode parsers
 * `parse_displayid_arvr_hmd` and `parse_displayid_arvr_layer` (v4l-utils commit
 * 6b838aad8f0204f4482f65d3e5cd5f19a3952b85, "edid-decode: implement ARVR_HMD and
 * ARVR_Layer Data Block parsers" by yassha, signed off by Hans Verkuil):
 * https://www.mail-archive.com/linuxtv-commits@linuxtv.org/msg48508.html
 *
 * The edid-decode `x` array includes the 3-byte block header (tag, revision/flags,
 * length), so its `x[3]` is the first payload byte. The layouts below index the
 * payload directly (payload[0] === edid-decode x[3]).
 *
 * Fixed-point fields (3.13, 16.16) and IEEE 754 single-precision floats are
 * stored as their raw integer bit patterns so encode reproduces the input
 * byte-for-byte without floating-point round-trip error. Reserved bits are
 * preserved (not zeroed) by the encoder, matching the round-trip contract used
 * by the rest of the displayid module (see dynamic-range-limits.ts).
 *
 * These blocks are DisplayID 2.1 additions; the shared dispatcher in blocks.ts
 * already preserves them opaquely as generic DisplayIdDataBlock. The functions
 * here are standalone utilities for callers that want structured access.
 */

import { type DisplayIdDataBlock } from './types';
import { readIeeeOui, writeIeeeOui } from '../common/bintools';

export const ARVR_HMD_TAG = 0x2c;
export const ARVR_LAYER_TAG = 0x2d;

export const ARVR_HMD_PAYLOAD_LENGTH = 79;
export const ARVR_LAYER_PAYLOAD_LENGTH = 20;

export interface DisplayIdArvrHmdBlock extends DisplayIdDataBlock {
  tag: typeof ARVR_HMD_TAG;
  // [0] Dual Layer Single Stream Transport
  dualLayerSingleStreamTransport: number; // bits 1:0
  interleavingModeStacked: boolean; // bit 4
  extendedFrameMode: number; // bits 6:5
  // [1] Number of Displays and Streams
  numberOfDisplays: number; // bits 3:0
  numberOfStreams: number; // bits 7:4
  // [2] Layers
  numberOfLayers: number; // bits 3:0
  layerMetadataSupport: number; // bits 5:4
  replicationFactor: number; // bits 7:6
  // [3..14] Area of Low Distortion Field Set (uint16 LE, pixels/lines)
  rightLowDistortionAreaX: number;
  rightLowDistortionAreaY: number;
  leftLowDistortionAreaX: number;
  leftLowDistortionAreaY: number;
  lowDistortionAreaWidth: number;
  lowDistortionAreaHeight: number;
  // [15] Eye Rotation Orientation
  rightEyeRotationOrientation: number; // bits 2:0
  leftEyeRotationOrientation: number; // bits 6:4
  // [16..21] Optics Field Set (uint16 LE, 3.13 fixed point; raw values)
  rightLensDiameterRaw: number;
  leftLensDiameterRaw: number;
  interocularAngleRaw: number;
  // [22] Lens Adjustment
  lensAdjustable: boolean; // bit 0
  lensAdjustMotion: number; // bits 2:1
  lensDistanceAvailable: boolean; // bit 3
  ipdUsefulToHmd: boolean; // bit 4
  // [23..32] Lens Adjustment Field Set (uint16 LE, 3.13 fixed point; raw values)
  lensAdjustMinimumRaw: number;
  lensAdjustmentRangeRaw: number;
  ipdCenterOffsetRaw: number; // int16 LE (signed)
  ipdMeasurementMinimumRaw: number;
  ipdMeasurementRangeRaw: number;
  // [33] Lens Adjustments Available
  distanceToRightDisplayAvailable: boolean; // bit 0
  distanceToLeftDisplayAvailable: boolean; // bit 1
  distanceToRightEyeAvailable: boolean; // bit 2
  distanceToLeftEyeAvailable: boolean; // bit 3
  // [34] Foveated Rendering Support
  foveatedRenderingSupport: number; // bits 1:0
  // [35..52] Field of View for Layer 0 (uint16 LE, 3.13 fixed point; raw values)
  horizontalFovRaw: number;
  rightFovRightRaw: number;
  rightFovLeftRaw: number;
  rightFovUpRaw: number;
  rightFovDownRaw: number;
  leftFovRightRaw: number;
  leftFovLeftRaw: number;
  leftFovUpRaw: number;
  leftFovDownRaw: number;
  // [53..60] Focal Lengths (uint32 LE, 16.16 fixed point; raw values)
  rightFocalLengthRaw: number;
  leftFocalLengthRaw: number;
  // [61..76] Center of Projection (uint32 LE, IEEE 754 float bit patterns)
  rightCenterOfProjectionYRaw: number;
  rightCenterOfProjectionXRaw: number;
  leftCenterOfProjectionYRaw: number;
  leftCenterOfProjectionXRaw: number;
  // [77] Streams per Layer
  layer0Streams: number; // bits 1:0
  layer1Streams: number; // bits 3:2
}

export interface DisplayIdArvrLayerBlock extends DisplayIdDataBlock {
  tag: typeof ARVR_LAYER_TAG;
  // [0..2] HMD Manufacturer/Vendor ID (24-bit IEEE OUI, big-endian)
  hmdManufacturerOui: number;
  // [3..4] HMD Product ID Code (uint16 LE)
  hmdProductIdCode: number;
  // [5..8] HMD Serial Number (uint32 LE)
  hmdSerialNumber: number;
  // [9] Layers
  layerNumber: number; // bits 3:0
  layerConfigurable: boolean; // bit 4
  croppingSupported: boolean; // bit 5
  // [10] reserved
  // [11] Lens Distortion
  lensDistortionSupport: number; // bits 1:0
  lensDistortionConfigurable: number; // bits 3:2
  // [12] Gamma / Degamma / Mura / VBI
  gammaSupport: boolean; // bit 0
  gammaConfigurable: boolean; // bit 1
  degammaSupport: boolean; // bit 2
  degammaConfigurable: boolean; // bit 3
  muraCompensationSupport: boolean; // bit 4
  muraCompensationConfigurable: boolean; // bit 5
  vbiSupport: boolean; // bit 6
  vbiConfigurable: boolean; // bit 7
  // [13] Asynchronous Reprojection
  asyncReprojectionSupport: number; // bits 1:0
  asyncReprojectionConfigurable: number; // bits 3:2
  // [14] Scaling Support
  scaling2x: boolean; // bit 0
  scaling3x: boolean; // bit 1
  scaling4x: boolean; // bit 2
  scaling5x: boolean; // bit 3
  scaling6x: boolean; // bit 4
  scaling8x: boolean; // bit 5
  scalingOther: boolean; // bit 6
  scalingConfigurable: boolean; // bit 7
  // [15..18] Scaling NonListed (four 3.5 fixed-point bytes; raw values)
  scalingNonListed0: number;
  scalingNonListed1: number;
  scalingNonListed2: number;
  scalingNonListed3: number;
  // [19] Multiple Stream Stereo Modes
  stereoModeSideBySide: boolean; // bit 0
  stereoModeStacked: boolean; // bit 1
}

export function decodeArvrHmdBlock(block: DisplayIdDataBlock): DisplayIdArvrHmdBlock {
  const p = block.payload;

  return {
    ...block,
    tag: ARVR_HMD_TAG,
    dualLayerSingleStreamTransport: p[0] & 0x03,
    interleavingModeStacked: (p[0] & 0x10) !== 0,
    extendedFrameMode: (p[0] >> 5) & 0x03,
    numberOfDisplays: p[1] & 0x0f,
    numberOfStreams: (p[1] >> 4) & 0x0f,
    numberOfLayers: p[2] & 0x0f,
    layerMetadataSupport: (p[2] >> 4) & 0x03,
    replicationFactor: (p[2] >> 6) & 0x03,
    rightLowDistortionAreaX: readUint16LE(p, 3),
    rightLowDistortionAreaY: readUint16LE(p, 5),
    leftLowDistortionAreaX: readUint16LE(p, 7),
    leftLowDistortionAreaY: readUint16LE(p, 9),
    lowDistortionAreaWidth: readUint16LE(p, 11),
    lowDistortionAreaHeight: readUint16LE(p, 13),
    rightEyeRotationOrientation: p[15] & 0x07,
    leftEyeRotationOrientation: (p[15] >> 4) & 0x07,
    rightLensDiameterRaw: readUint16LE(p, 16),
    leftLensDiameterRaw: readUint16LE(p, 18),
    interocularAngleRaw: readUint16LE(p, 20),
    lensAdjustable: (p[22] & 0x01) !== 0,
    lensAdjustMotion: (p[22] >> 1) & 0x03,
    lensDistanceAvailable: (p[22] & 0x08) !== 0,
    ipdUsefulToHmd: (p[22] & 0x10) !== 0,
    lensAdjustMinimumRaw: readUint16LE(p, 23),
    lensAdjustmentRangeRaw: readUint16LE(p, 25),
    ipdCenterOffsetRaw: readInt16LE(p, 27),
    ipdMeasurementMinimumRaw: readUint16LE(p, 29),
    ipdMeasurementRangeRaw: readUint16LE(p, 31),
    distanceToRightDisplayAvailable: (p[33] & 0x01) !== 0,
    distanceToLeftDisplayAvailable: (p[33] & 0x02) !== 0,
    distanceToRightEyeAvailable: (p[33] & 0x04) !== 0,
    distanceToLeftEyeAvailable: (p[33] & 0x08) !== 0,
    foveatedRenderingSupport: p[34] & 0x03,
    horizontalFovRaw: readUint16LE(p, 35),
    rightFovRightRaw: readUint16LE(p, 37),
    rightFovLeftRaw: readUint16LE(p, 39),
    rightFovUpRaw: readUint16LE(p, 41),
    rightFovDownRaw: readUint16LE(p, 43),
    leftFovRightRaw: readUint16LE(p, 45),
    leftFovLeftRaw: readUint16LE(p, 47),
    leftFovUpRaw: readUint16LE(p, 49),
    leftFovDownRaw: readUint16LE(p, 51),
    rightFocalLengthRaw: readUint32LE(p, 53),
    leftFocalLengthRaw: readUint32LE(p, 57),
    rightCenterOfProjectionYRaw: readUint32LE(p, 61),
    rightCenterOfProjectionXRaw: readUint32LE(p, 65),
    leftCenterOfProjectionYRaw: readUint32LE(p, 69),
    leftCenterOfProjectionXRaw: readUint32LE(p, 73),
    layer0Streams: p[77] & 0x03,
    layer1Streams: (p[77] >> 2) & 0x03,
  };
}

export function encodeArvrHmdBlock(block: DisplayIdArvrHmdBlock): Uint8Array {
  const payload = copyPayload(block.payload, ARVR_HMD_PAYLOAD_LENGTH);

  payload[0] = (payload[0] & 0x8c) | (block.dualLayerSingleStreamTransport & 0x03)
    | (block.interleavingModeStacked ? 0x10 : 0)
    | ((block.extendedFrameMode & 0x03) << 5);
  payload[1] = (payload[1] & 0x00) | (block.numberOfDisplays & 0x0f)
    | ((block.numberOfStreams & 0x0f) << 4);
  payload[2] = (payload[2] & 0x00) | (block.numberOfLayers & 0x0f)
    | ((block.layerMetadataSupport & 0x03) << 4)
    | ((block.replicationFactor & 0x03) << 6);
  writeUint16LE(payload, 3, block.rightLowDistortionAreaX);
  writeUint16LE(payload, 5, block.rightLowDistortionAreaY);
  writeUint16LE(payload, 7, block.leftLowDistortionAreaX);
  writeUint16LE(payload, 9, block.leftLowDistortionAreaY);
  writeUint16LE(payload, 11, block.lowDistortionAreaWidth);
  writeUint16LE(payload, 13, block.lowDistortionAreaHeight);
  payload[15] = (payload[15] & 0x88) | (block.rightEyeRotationOrientation & 0x07)
    | ((block.leftEyeRotationOrientation & 0x07) << 4);
  writeUint16LE(payload, 16, block.rightLensDiameterRaw);
  writeUint16LE(payload, 18, block.leftLensDiameterRaw);
  writeUint16LE(payload, 20, block.interocularAngleRaw);
  payload[22] = (payload[22] & 0xe0) | (block.lensAdjustable ? 0x01 : 0)
    | ((block.lensAdjustMotion & 0x03) << 1)
    | (block.lensDistanceAvailable ? 0x08 : 0)
    | (block.ipdUsefulToHmd ? 0x10 : 0);
  writeUint16LE(payload, 23, block.lensAdjustMinimumRaw);
  writeUint16LE(payload, 25, block.lensAdjustmentRangeRaw);
  writeInt16LE(payload, 27, block.ipdCenterOffsetRaw);
  writeUint16LE(payload, 29, block.ipdMeasurementMinimumRaw);
  writeUint16LE(payload, 31, block.ipdMeasurementRangeRaw);
  payload[33] = (payload[33] & 0xf0) | (block.distanceToRightDisplayAvailable ? 0x01 : 0)
    | (block.distanceToLeftDisplayAvailable ? 0x02 : 0)
    | (block.distanceToRightEyeAvailable ? 0x04 : 0)
    | (block.distanceToLeftEyeAvailable ? 0x08 : 0);
  payload[34] = (payload[34] & 0xfc) | (block.foveatedRenderingSupport & 0x03);
  writeUint16LE(payload, 35, block.horizontalFovRaw);
  writeUint16LE(payload, 37, block.rightFovRightRaw);
  writeUint16LE(payload, 39, block.rightFovLeftRaw);
  writeUint16LE(payload, 41, block.rightFovUpRaw);
  writeUint16LE(payload, 43, block.rightFovDownRaw);
  writeUint16LE(payload, 45, block.leftFovRightRaw);
  writeUint16LE(payload, 47, block.leftFovLeftRaw);
  writeUint16LE(payload, 49, block.leftFovUpRaw);
  writeUint16LE(payload, 51, block.leftFovDownRaw);
  writeUint32LE(payload, 53, block.rightFocalLengthRaw);
  writeUint32LE(payload, 57, block.leftFocalLengthRaw);
  writeUint32LE(payload, 61, block.rightCenterOfProjectionYRaw);
  writeUint32LE(payload, 65, block.rightCenterOfProjectionXRaw);
  writeUint32LE(payload, 69, block.leftCenterOfProjectionYRaw);
  writeUint32LE(payload, 73, block.leftCenterOfProjectionXRaw);
  payload[77] = (payload[77] & 0xf0) | (block.layer0Streams & 0x03)
    | ((block.layer1Streams & 0x03) << 2);

  return payload;
}

export function decodeArvrLayerBlock(block: DisplayIdDataBlock): DisplayIdArvrLayerBlock {
  const p = block.payload;

  return {
    ...block,
    tag: ARVR_LAYER_TAG,
    hmdManufacturerOui: readIeeeOui(p, 0),
    hmdProductIdCode: readUint16LE(p, 3),
    hmdSerialNumber: readUint32LE(p, 5),
    layerNumber: p[9] & 0x0f,
    layerConfigurable: (p[9] & 0x10) !== 0,
    croppingSupported: (p[9] & 0x20) !== 0,
    lensDistortionSupport: p[11] & 0x03,
    lensDistortionConfigurable: (p[11] >> 2) & 0x03,
    gammaSupport: (p[12] & 0x01) !== 0,
    gammaConfigurable: (p[12] & 0x02) !== 0,
    degammaSupport: (p[12] & 0x04) !== 0,
    degammaConfigurable: (p[12] & 0x08) !== 0,
    muraCompensationSupport: (p[12] & 0x10) !== 0,
    muraCompensationConfigurable: (p[12] & 0x20) !== 0,
    vbiSupport: (p[12] & 0x40) !== 0,
    vbiConfigurable: (p[12] & 0x80) !== 0,
    asyncReprojectionSupport: p[13] & 0x03,
    asyncReprojectionConfigurable: (p[13] >> 2) & 0x03,
    scaling2x: (p[14] & 0x01) !== 0,
    scaling3x: (p[14] & 0x02) !== 0,
    scaling4x: (p[14] & 0x04) !== 0,
    scaling5x: (p[14] & 0x08) !== 0,
    scaling6x: (p[14] & 0x10) !== 0,
    scaling8x: (p[14] & 0x20) !== 0,
    scalingOther: (p[14] & 0x40) !== 0,
    scalingConfigurable: (p[14] & 0x80) !== 0,
    scalingNonListed0: p[15],
    scalingNonListed1: p[16],
    scalingNonListed2: p[17],
    scalingNonListed3: p[18],
    stereoModeSideBySide: (p[19] & 0x01) !== 0,
    stereoModeStacked: (p[19] & 0x02) !== 0,
  };
}

export function encodeArvrLayerBlock(block: DisplayIdArvrLayerBlock): Uint8Array {
  const payload = copyPayload(block.payload, ARVR_LAYER_PAYLOAD_LENGTH);

  writeIeeeOui(payload, 0, block.hmdManufacturerOui);
  writeUint16LE(payload, 3, block.hmdProductIdCode);
  writeUint32LE(payload, 5, block.hmdSerialNumber);
  payload[9] = (payload[9] & 0xc0) | (block.layerNumber & 0x0f)
    | (block.layerConfigurable ? 0x10 : 0)
    | (block.croppingSupported ? 0x20 : 0);
  payload[11] = (payload[11] & 0xf0) | (block.lensDistortionSupport & 0x03)
    | ((block.lensDistortionConfigurable & 0x03) << 2);
  payload[12] = (payload[12] & 0x00)
    | (block.gammaSupport ? 0x01 : 0)
    | (block.gammaConfigurable ? 0x02 : 0)
    | (block.degammaSupport ? 0x04 : 0)
    | (block.degammaConfigurable ? 0x08 : 0)
    | (block.muraCompensationSupport ? 0x10 : 0)
    | (block.muraCompensationConfigurable ? 0x20 : 0)
    | (block.vbiSupport ? 0x40 : 0)
    | (block.vbiConfigurable ? 0x80 : 0);
  payload[13] = (payload[13] & 0xf0) | (block.asyncReprojectionSupport & 0x03)
    | ((block.asyncReprojectionConfigurable & 0x03) << 2);
  payload[14] = (payload[14] & 0x00)
    | (block.scaling2x ? 0x01 : 0)
    | (block.scaling3x ? 0x02 : 0)
    | (block.scaling4x ? 0x04 : 0)
    | (block.scaling5x ? 0x08 : 0)
    | (block.scaling6x ? 0x10 : 0)
    | (block.scaling8x ? 0x20 : 0)
    | (block.scalingOther ? 0x40 : 0)
    | (block.scalingConfigurable ? 0x80 : 0);
  payload[15] = block.scalingNonListed0 & 0xff;
  payload[16] = block.scalingNonListed1 & 0xff;
  payload[17] = block.scalingNonListed2 & 0xff;
  payload[18] = block.scalingNonListed3 & 0xff;
  payload[19] = (payload[19] & 0xfc) | (block.stereoModeSideBySide ? 0x01 : 0)
    | (block.stereoModeStacked ? 0x02 : 0);

  return payload;
}

/**
 * Returns a writable copy of `payload` with at least `minLength` bytes. Existing
 * bytes (including reserved bits and any trailing bytes beyond the model) are
 * preserved so the encoder can overwrite only the modeled fields.
 */
function copyPayload(payload: Uint8Array, minLength: number): Uint8Array {
  if (payload.length >= minLength) {
    return payload.slice();
  }
  const out = new Uint8Array(minLength);
  out.set(payload);
  return out;
}

function readUint16LE(data: Uint8Array, offset: number): number {
  return (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
}

function writeUint16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}

function readInt16LE(data: Uint8Array, offset: number): number {
  const raw = (data[offset] ?? 0) | ((data[offset + 1] ?? 0) << 8);
  return raw >= 0x8000 ? raw - 0x10000 : raw;
}

function writeInt16LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >> 8) & 0xff;
}

function readUint32LE(data: Uint8Array, offset: number): number {
  return (
    (data[offset] ?? 0)
    | ((data[offset + 1] ?? 0) << 8)
    | ((data[offset + 2] ?? 0) << 16)
    | ((data[offset + 3] ?? 0) << 24)
  ) >>> 0;
}

function writeUint32LE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = value & 0xff;
  data[offset + 1] = (value >>> 8) & 0xff;
  data[offset + 2] = (value >>> 16) & 0xff;
  data[offset + 3] = (value >>> 24) & 0xff;
}