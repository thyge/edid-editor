import { describe, expect, it } from 'vitest';
import { checksum8, isChecksum8Valid } from '../src/common';
import {
  decodeDisplayIdSection,
  encodeDisplayIdSection,
  type DisplayIdDataBlock,
} from '../src/displayid';
import {
  ARVR_HMD_TAG,
  ARVR_LAYER_TAG,
  ARVR_HMD_PAYLOAD_LENGTH,
  ARVR_LAYER_PAYLOAD_LENGTH,
  decodeArvrHmdBlock,
  encodeArvrHmdBlock,
  decodeArvrLayerBlock,
  encodeArvrLayerBlock,
  type DisplayIdArvrHmdBlock,
  type DisplayIdArvrLayerBlock,
} from '../src/displayid/ar-vr';

function withChecksum(bytes: number[]): Uint8Array {
  const data = new Uint8Array(bytes);
  data[data.length - 1] = checksum8(data);
  return data;
}

function buildHmdPayload(): number[] {
  // 79-byte ARVR HMD payload (edid-decode parse_displayid_arvr_hmd layout).
  // payload[i] corresponds to edid-decode x[i + 3].
  const p = new Array<number>(ARVR_HMD_PAYLOAD_LENGTH).fill(0);

  // [0] dual layer SST: both (3), interleaving stacked (bit4), extended mode 1 (bits6:5=1)
  p[0] = 0x03 | 0x10 | 0x20;
  // [1] displays=2 (low nibble), streams=1 (high nibble)
  p[1] = 0x02 | (0x01 << 4);
  // [2] layers=1, layerMetadata=2 (bits5:4), replication=3 (bits7:6)
  p[2] = 0x01 | (0x02 << 4) | (0x03 << 6);
  // [3..14] low-distortion area (six uint16 LE)
  p[3] = 0x34; p[4] = 0x12;   // right X = 0x1234
  p[5] = 0x78; p[6] = 0x56;   // right Y = 0x5678
  p[7] = 0xbc; p[8] = 0x9a;   // left X  = 0x9abc
  p[9] = 0xf0; p[10] = 0xde;  // left Y  = 0xdef0
  p[11] = 0x11; p[12] = 0x11; // width   = 0x1111
  p[13] = 0x22; p[14] = 0x22; // height  = 0x2222
  // [15] eye rotation: right=5 (bits2:0), left=3 (bits6:4)
  p[15] = 0x05 | (0x03 << 4);
  // [16..21] optics (uint16 LE, 3.13 fixed point)
  p[16] = 0x00; p[17] = 0x40; // right lens diameter raw = 0x4000
  p[18] = 0x00; p[19] = 0x20; // left lens diameter raw  = 0x2000
  p[20] = 0x00; p[21] = 0x10; // interocular angle raw   = 0x1000
  // [22] lens adjustment: adjustable, motion=2, distance available, ipd useful
  p[22] = 0x01 | (0x02 << 1) | 0x08 | 0x10;
  // [23..32] lens adjustment field set (uint16 LE; [27..28] is signed)
  p[23] = 0x00; p[24] = 0x08; // lens adjust min raw = 0x0800
  p[25] = 0x00; p[26] = 0x04; // lens adjust range  = 0x0400
  p[27] = 0xe0; p[28] = 0xff; // ipd center offset  = 0xffe0 (signed -32)
  p[29] = 0x00; p[30] = 0x02; // ipd meas min raw   = 0x0200
  p[31] = 0x00; p[32] = 0x01; // ipd meas range    = 0x0100
  // [33] lens adjustments available: all four low bits
  p[33] = 0x0f;
  // [34] foveated rendering support = 2 (dual streams)
  p[34] = 0x02;
  // [35..52] field of view (nine uint16 LE, 3.13 fixed point)
  p[35] = 0x00; p[36] = 0x20; // horizontal fov = 0x2000
  p[37] = 0x00; p[38] = 0x08; // right fov right
  p[39] = 0x00; p[40] = 0x08; // right fov left
  p[41] = 0x00; p[42] = 0x08; // right fov up
  p[43] = 0x00; p[44] = 0x08; // right fov down
  p[45] = 0x00; p[46] = 0x08; // left fov right
  p[47] = 0x00; p[48] = 0x08; // left fov left
  p[49] = 0x00; p[50] = 0x08; // left fov up
  p[51] = 0x00; p[52] = 0x08; // left fov down
  // [53..60] focal lengths (uint32 LE, 16.16 fixed point)
  p[53] = 0x00; p[54] = 0x00; p[55] = 0x01; p[56] = 0x00; // right focal = 0x00010000
  p[57] = 0x00; p[58] = 0x00; p[59] = 0x02; p[60] = 0x00; // left focal  = 0x00020000
  // [61..76] center of projection (four uint32 LE, IEEE754 float bit patterns)
  // 0x40490fdb ~= pi, 0x40000000 = 2.0
  p[61] = 0xdb; p[62] = 0x0f; p[63] = 0x49; p[64] = 0x40; // right CoP Y
  p[65] = 0x00; p[66] = 0x00; p[67] = 0x00; p[68] = 0x40; // right CoP X
  p[69] = 0xdb; p[70] = 0x0f; p[71] = 0x49; p[72] = 0x40; // left CoP Y
  p[73] = 0x00; p[74] = 0x00; p[75] = 0x00; p[76] = 0x40; // left CoP X
  // [77] streams per layer: layer0=1 (bits1:0), layer1=2 (bits3:2)
  p[77] = 0x01 | (0x02 << 2);
  // [78] reserved (0)
  p[78] = 0x00;

  return p;
}

function buildLayerPayload(): number[] {
  // 20-byte ARVR Layer payload (edid-decode parse_displayid_arvr_layer layout).
  const p = new Array<number>(ARVR_LAYER_PAYLOAD_LENGTH).fill(0);

  // [0..2] HMD manufacturer OUI (big-endian) = 0x123456
  p[0] = 0x12; p[1] = 0x34; p[2] = 0x56;
  // [3..4] HMD product ID code (uint16 LE) = 0xbeef
  p[3] = 0xef; p[4] = 0xbe;
  // [5..8] HMD serial number (uint32 LE) = 0x12345678
  p[5] = 0x78; p[6] = 0x56; p[7] = 0x34; p[8] = 0x12;
  // [9] layer number=1, layer configurable, cropping supported
  p[9] = 0x01 | 0x10 | 0x20;
  // [10] reserved
  p[10] = 0x00;
  // [11] lens distortion support=2, configurable=1
  p[11] = 0x02 | (0x01 << 2);
  // [12] gamma support+configurable, degamma support, mura support, vbi support
  p[12] = 0x01 | 0x02 | 0x04 | 0x10 | 0x40;
  // [13] async reprojection support=2, configurable=1
  p[13] = 0x02 | (0x01 << 2);
  // [14] scaling 2x|4x|8x|other|configurable
  p[14] = 0x01 | 0x04 | 0x20 | 0x40 | 0x80;
  // [15..18] scaling non-listed (four 3.5 fixed-point bytes)
  p[15] = 0x20; p[16] = 0x40; p[17] = 0x60; p[18] = 0x80;
  // [19] stereo modes: side-by-side + stacked
  p[19] = 0x01 | 0x02;

  return p;
}

function genericBlock(tag: number, payload: number[]): DisplayIdDataBlock {
  return {
    tag,
    revision: 0,
    flags: 0,
    payloadLength: payload.length,
    payload: new Uint8Array(payload),
  };
}

describe('DisplayID AR/VR HMD block (tag 0x2C)', () => {
  it('decodes structured fields from a 79-byte payload', () => {
    const block = decodeArvrHmdBlock(genericBlock(ARVR_HMD_TAG, buildHmdPayload()));

    expect(block.tag).toBe(ARVR_HMD_TAG);
    expect(block.dualLayerSingleStreamTransport).toBe(3);
    expect(block.interleavingModeStacked).toBe(true);
    expect(block.extendedFrameMode).toBe(1);
    expect(block.numberOfDisplays).toBe(2);
    expect(block.numberOfStreams).toBe(1);
    expect(block.numberOfLayers).toBe(1);
    expect(block.layerMetadataSupport).toBe(2);
    expect(block.replicationFactor).toBe(3);
    expect(block.rightLowDistortionAreaX).toBe(0x1234);
    expect(block.rightLowDistortionAreaY).toBe(0x5678);
    expect(block.leftLowDistortionAreaX).toBe(0x9abc);
    expect(block.leftLowDistortionAreaY).toBe(0xdef0);
    expect(block.lowDistortionAreaWidth).toBe(0x1111);
    expect(block.lowDistortionAreaHeight).toBe(0x2222);
    expect(block.rightEyeRotationOrientation).toBe(5);
    expect(block.leftEyeRotationOrientation).toBe(3);
    expect(block.rightLensDiameterRaw).toBe(0x4000);
    expect(block.leftLensDiameterRaw).toBe(0x2000);
    expect(block.interocularAngleRaw).toBe(0x1000);
    expect(block.lensAdjustable).toBe(true);
    expect(block.lensAdjustMotion).toBe(2);
    expect(block.lensDistanceAvailable).toBe(true);
    expect(block.ipdUsefulToHmd).toBe(true);
    expect(block.lensAdjustMinimumRaw).toBe(0x0800);
    expect(block.lensAdjustmentRangeRaw).toBe(0x0400);
    expect(block.ipdCenterOffsetRaw).toBe(-32);
    expect(block.ipdMeasurementMinimumRaw).toBe(0x0200);
    expect(block.ipdMeasurementRangeRaw).toBe(0x0100);
    expect(block.distanceToRightDisplayAvailable).toBe(true);
    expect(block.distanceToLeftDisplayAvailable).toBe(true);
    expect(block.distanceToRightEyeAvailable).toBe(true);
    expect(block.distanceToLeftEyeAvailable).toBe(true);
    expect(block.foveatedRenderingSupport).toBe(2);
    expect(block.horizontalFovRaw).toBe(0x2000);
    expect(block.rightFovRightRaw).toBe(0x0800);
    expect(block.rightFocalLengthRaw).toBe(0x00010000);
    expect(block.leftFocalLengthRaw).toBe(0x00020000);
    expect(block.rightCenterOfProjectionYRaw).toBe(0x40490fdb);
    expect(block.rightCenterOfProjectionXRaw).toBe(0x40000000);
    expect(block.leftCenterOfProjectionYRaw).toBe(0x40490fdb);
    expect(block.leftCenterOfProjectionXRaw).toBe(0x40000000);
    expect(block.layer0Streams).toBe(1);
    expect(block.layer1Streams).toBe(2);
  });

  it('encodes structured fields back to the same bytes (round-trip)', () => {
    const payload = new Uint8Array(buildHmdPayload());
    const decoded = decodeArvrHmdBlock(genericBlock(ARVR_HMD_TAG, buildHmdPayload()));
    const encoded = encodeArvrHmdBlock(decoded);

    expect(Array.from(encoded)).toEqual(Array.from(payload));
  });

  it('overwrites modeled fields while preserving reserved bits', () => {
    const payload = new Uint8Array(buildHmdPayload());
    // Flip a reserved bit that the codec must not touch (bit 7 of payload[78] is the
    // whole reserved byte; instead exercise a byte with reserved bits: payload[0] bits 3:2).
    payload[0] = payload[0] | 0x0c; // set reserved bits 3:2

    const decoded = decodeArvrHmdBlock({
      tag: ARVR_HMD_TAG,
      revision: 0,
      flags: 0,
      payloadLength: payload.length,
      payload: payload.slice(),
    });
    const encoded = encodeArvrHmdBlock(decoded);

    expect(Array.from(encoded)).toEqual(Array.from(payload));
    expect(encoded[0] & 0x0c).toBe(0x0c);
  });

  it('re-encodes modified fields correctly', () => {
    const decoded = decodeArvrHmdBlock(genericBlock(ARVR_HMD_TAG, buildHmdPayload()));
    decoded.numberOfDisplays = 3;
    decoded.numberOfStreams = 2;
    decoded.rightLensDiameterRaw = 0x7fff;
    decoded.ipdCenterOffsetRaw = 100;
    decoded.rightFocalLengthRaw = 0x00030000;

    const encoded = encodeArvrHmdBlock(decoded);
    const redecoded = decodeArvrHmdBlock({
      tag: ARVR_HMD_TAG,
      revision: 0,
      flags: 0,
      payloadLength: encoded.length,
      payload: encoded,
    });

    expect(redecoded.numberOfDisplays).toBe(3);
    expect(redecoded.numberOfStreams).toBe(2);
    expect(redecoded.rightLensDiameterRaw).toBe(0x7fff);
    expect(redecoded.ipdCenterOffsetRaw).toBe(100);
    expect(redecoded.rightFocalLengthRaw).toBe(0x00030000);
  });

  it('preserves trailing bytes beyond the 79-byte model when encoding', () => {
    const extended = buildHmdPayload().concat([0xaa, 0xbb]);
    const decoded = decodeArvrHmdBlock(genericBlock(ARVR_HMD_TAG, extended));
    const encoded = encodeArvrHmdBlock(decoded);

    expect(Array.from(encoded)).toEqual(Array.from(extended));
    expect(encoded.length).toBe(81);
  });
});

describe('DisplayID AR/VR Layer block (tag 0x2D)', () => {
  it('decodes structured fields from a 20-byte payload', () => {
    const block = decodeArvrLayerBlock(genericBlock(ARVR_LAYER_TAG, buildLayerPayload()));

    expect(block.tag).toBe(ARVR_LAYER_TAG);
    expect(block.hmdManufacturerOui).toBe(0x123456);
    expect(block.hmdProductIdCode).toBe(0xbeef);
    expect(block.hmdSerialNumber).toBe(0x12345678);
    expect(block.layerNumber).toBe(1);
    expect(block.layerConfigurable).toBe(true);
    expect(block.croppingSupported).toBe(true);
    expect(block.lensDistortionSupport).toBe(2);
    expect(block.lensDistortionConfigurable).toBe(1);
    expect(block.gammaSupport).toBe(true);
    expect(block.gammaConfigurable).toBe(true);
    expect(block.degammaSupport).toBe(true);
    expect(block.degammaConfigurable).toBe(false);
    expect(block.muraCompensationSupport).toBe(true);
    expect(block.muraCompensationConfigurable).toBe(false);
    expect(block.vbiSupport).toBe(true);
    expect(block.vbiConfigurable).toBe(false);
    expect(block.asyncReprojectionSupport).toBe(2);
    expect(block.asyncReprojectionConfigurable).toBe(1);
    expect(block.scaling2x).toBe(true);
    expect(block.scaling4x).toBe(true);
    expect(block.scaling8x).toBe(true);
    expect(block.scalingOther).toBe(true);
    expect(block.scalingConfigurable).toBe(true);
    expect(block.scalingNonListed0).toBe(0x20);
    expect(block.scalingNonListed1).toBe(0x40);
    expect(block.scalingNonListed2).toBe(0x60);
    expect(block.scalingNonListed3).toBe(0x80);
    expect(block.stereoModeSideBySide).toBe(true);
    expect(block.stereoModeStacked).toBe(true);
  });

  it('encodes structured fields back to the same bytes (round-trip)', () => {
    const payload = new Uint8Array(buildLayerPayload());
    const decoded = decodeArvrLayerBlock(genericBlock(ARVR_LAYER_TAG, buildLayerPayload()));
    const encoded = encodeArvrLayerBlock(decoded);

    expect(Array.from(encoded)).toEqual(Array.from(payload));
  });

  it('overwrites modeled fields while preserving reserved bits', () => {
    const payload = new Uint8Array(buildLayerPayload());
    // Set reserved bits 7:6 of byte [9] (layer flags).
    payload[9] = payload[9] | 0xc0;

    const decoded = decodeArvrLayerBlock({
      tag: ARVR_LAYER_TAG,
      revision: 0,
      flags: 0,
      payloadLength: payload.length,
      payload: payload.slice(),
    });
    const encoded = encodeArvrLayerBlock(decoded);

    expect(Array.from(encoded)).toEqual(Array.from(payload));
    expect(encoded[9] & 0xc0).toBe(0xc0);
  });

  it('re-encodes modified fields correctly', () => {
    const decoded = decodeArvrLayerBlock(genericBlock(ARVR_LAYER_TAG, buildLayerPayload()));
    decoded.hmdManufacturerOui = 0x000c03;
    decoded.hmdProductIdCode = 0x4321;
    decoded.layerNumber = 0;
    decoded.asyncReprojectionSupport = 1;
    decoded.scalingNonListed2 = 0xff;

    const encoded = encodeArvrLayerBlock(decoded);
    const redecoded = decodeArvrLayerBlock({
      tag: ARVR_LAYER_TAG,
      revision: 0,
      flags: 0,
      payloadLength: encoded.length,
      payload: encoded,
    });

    expect(redecoded.hmdManufacturerOui).toBe(0x000c03);
    expect(redecoded.hmdProductIdCode).toBe(0x4321);
    expect(redecoded.layerNumber).toBe(0);
    expect(redecoded.asyncReprojectionSupport).toBe(1);
    expect(redecoded.scalingNonListed2).toBe(0xff);
  });
});

describe('DisplayID AR/VR section round-trip', () => {
  it('preserves an ARVR HMD block byte-for-byte through section decode/encode', () => {
    const payload = buildHmdPayload();
    // section: header (0x20, bytesInSection, 0x04, 0x00) + block (tag, 0x00, len, payload) + checksum
    const bytesInSection = 3 + payload.length; // block header (3) + payload
    const section = withChecksum([
      0x20, bytesInSection, 0x04, 0x00,
      ARVR_HMD_TAG, 0x00, payload.length,
      ...payload,
      0x00,
    ]);

    const decoded = decodeDisplayIdSection(section);
    const block = decoded.blocks[0];

    expect(block.tag).toBe(ARVR_HMD_TAG);
    expect(block.payloadLength).toBe(payload.length);
    expect(Array.from(block.payload)).toEqual(payload);

    const encoded = encodeDisplayIdSection(decoded);
    expect(Array.from(encoded)).toEqual(Array.from(section));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves an ARVR Layer block byte-for-byte through section decode/encode', () => {
    const payload = buildLayerPayload();
    const bytesInSection = 3 + payload.length;
    const section = withChecksum([
      0x20, bytesInSection, 0x04, 0x00,
      ARVR_LAYER_TAG, 0x00, payload.length,
      ...payload,
      0x00,
    ]);

    const decoded = decodeDisplayIdSection(section);
    const block = decoded.blocks[0];

    expect(block.tag).toBe(ARVR_LAYER_TAG);
    expect(block.payloadLength).toBe(payload.length);
    expect(Array.from(block.payload)).toEqual(payload);

    const encoded = encodeDisplayIdSection(decoded);
    expect(Array.from(encoded)).toEqual(Array.from(section));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });

  it('preserves both ARVR blocks together through section decode/encode', () => {
    const hmd = buildHmdPayload();
    const layer = buildLayerPayload();
    const bytesInSection = (3 + hmd.length) + (3 + layer.length);
    const section = withChecksum([
      0x20, bytesInSection, 0x04, 0x00,
      ARVR_HMD_TAG, 0x00, hmd.length,
      ...hmd,
      ARVR_LAYER_TAG, 0x00, layer.length,
      ...layer,
      0x00,
    ]);

    const decoded = decodeDisplayIdSection(section);
    expect(decoded.blocks).toHaveLength(2);
    expect(Array.from(decoded.blocks[0].payload)).toEqual(hmd);
    expect(Array.from(decoded.blocks[1].payload)).toEqual(layer);

    const encoded = encodeDisplayIdSection(decoded);
    expect(Array.from(encoded)).toEqual(Array.from(section));
    expect(isChecksum8Valid(encoded)).toBe(true);
  });
});