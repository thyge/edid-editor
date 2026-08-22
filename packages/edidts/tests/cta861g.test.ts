import { describe, it, expect } from 'vitest';
import { DetailedTimingDescriptor } from '../src/edid';
import {
  ExtensionBlockParser,
  decodeExtendedDataBlock,
  encodeExtendedDataBlock,
  type CEADetailedTiming,
  getVICDefinition,
  getVICDescription,
  isKnownVIC,
  isVIC4K,
  isVIC8K,
  getAudioFormatName,
  getAudioFormatShortName,
  getExtendedAudioFormatName,
  getSamplingRatesString,
  getBitDepthsString,
  VIC_TABLE,
  VESA_INTERFACE_CATEGORIES,
  type VideoCapabilityDataBlock,
  type ColorimetryDataBlock,
  type HDRStaticMetadataDataBlock,
  type YCbCr420VideoDataBlock,
  type VESAVideoDisplayDeviceDataBlock,
  type VESAVideoTimingBlockExtensionDataBlock,
} from '../src/cta';
import { checksum8 } from '../src/common';
import { buildCeaExtension } from './cea-utils';

describe('CTA and VTB detailed timing descriptors', () => {
  it('decodes CTA detailed timings with the common 18-byte DTD fields', () => {
    const timing = new DetailedTimingDescriptor({
      pixelClock: 148.5,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      verticalActive: 1080,
      verticalBlanking: 45,
      horizontalSyncOffset: 88,
      horizontalSyncWidth: 44,
      verticalSyncOffset: 4,
      verticalSyncWidth: 5,
      horizontalImageSize: 600,
      verticalImageSize: 340,
      horizontalBorder: 1,
      verticalBorder: 2,
      flags: {
        interlaced: true,
        syncType: 'digital-separate',
        hSyncPolarity: 'positive',
        vSyncPolarity: 'negative',
      },
    });
    const extension = new Uint8Array(128);
    extension[0] = 0x02;
    extension[1] = 0x03;
    extension[2] = 4;
    extension.set(timing.encode(), 4);
    extension[127] = checksum8(extension, 127);

    const decoded = ExtensionBlockParser.decode(extension);
    expect(decoded?.tag).toBe(0x02);
    const decodedTiming = (decoded as any).detailedTimings[0];

    expect(decodedTiming.horizontalImageSize).toBe(600);
    expect(decodedTiming.verticalImageSize).toBe(340);
    expect(decodedTiming.horizontalBorder).toBe(1);
    expect(decodedTiming.verticalBorder).toBe(2);
    expect(decodedTiming.flags.interlaced).toBe(true);
    expect(decodedTiming.flags.syncType).toBe('digital-separate');
  });

  it('encodes CTA detailed timings through the common DTD codec', () => {
    const timing = new DetailedTimingDescriptor({
      pixelClock: 148.5,
      horizontalActive: 1920,
      horizontalBlanking: 280,
      verticalActive: 1080,
      verticalBlanking: 45,
      horizontalSyncOffset: 88,
      horizontalSyncWidth: 44,
      verticalSyncOffset: 4,
      verticalSyncWidth: 5,
      horizontalImageSize: 600,
      verticalImageSize: 340,
      horizontalBorder: 1,
      verticalBorder: 2,
      flags: {
        interlaced: true,
        syncType: 'digital-separate',
        hSyncPolarity: 'positive',
        vSyncPolarity: 'negative',
      },
    });

    const encoded = ExtensionBlockParser.encode({
      tag: 0x02,
      revision: 3,
      checksum: 0,
      data: new Uint8Array(),
      dtdOffset: 4,
      underscan: false,
      basicAudio: false,
      ycbcr444: false,
      ycbcr422: false,
      nativeFormats: 0,
      dataBlocks: [],
      detailedTimings: [timing as any],
    });

    expect(encoded.slice(4, 22)).toEqual(timing.encode());
  });

  it('decodes VTB detailed timings with the common 18-byte DTD fields', () => {
    const timing = new DetailedTimingDescriptor({
      pixelClock: 74.25,
      horizontalActive: 1280,
      horizontalBlanking: 370,
      verticalActive: 720,
      verticalBlanking: 30,
      horizontalSyncOffset: 110,
      horizontalSyncWidth: 40,
      verticalSyncOffset: 5,
      verticalSyncWidth: 5,
      horizontalImageSize: 520,
      verticalImageSize: 290,
    });
    const extension = new Uint8Array(128);
    extension[0] = 0x10;
    extension[1] = 0x01;
    extension[2] = 1;
    extension.set(timing.encode(), 5);
    extension[127] = checksum8(extension, 127);

    const decoded = ExtensionBlockParser.decode(extension);
    expect(decoded?.tag).toBe(0x10);
    const decodedTiming = (decoded as any).detailedTimings[0];

    expect(decodedTiming.horizontalSyncOffset).toBe(110);
    expect(decodedTiming.horizontalSyncWidth).toBe(40);
    expect(decodedTiming.horizontalImageSize).toBe(520);
    expect(decodedTiming.verticalImageSize).toBe(290);
  });
});

describe('CTA-861-G Extended Data Blocks', () => {
  describe('Video Capability Data Block (Extended Tag 0)', () => {
    it('should decode video capability block correctly', () => {
      // Extended tag 0x00, then capability byte:
      // Bits 1:0 = CE scan (01 = overscanned)
      // Bits 3:2 = IT scan (10 = underscanned)
      // Bits 5:4 = PT scan (11 = both)
      // Bit 6 = QS (1 = RGB quant range selectable)
      // Bit 7 = QY (1 = YCC quant range)
      const data = new Uint8Array([0x00, 0b11111001]);
      const block = decodeExtendedDataBlock(data) as VideoCapabilityDataBlock;
      
      expect(block.extendedTag).toBe(0x00);
      expect(block.ceVideoScanBehavior).toBe('always_overscanned');
      expect(block.itVideoScanBehavior).toBe('always_underscanned');
      expect(block.ptVideoScanBehavior).toBe('both');
      expect(block.quantizationRangeSelectable).toBe(true);
      expect(block.quantizationRangeYCC).toBe(true);
    });

    it('should encode video capability block correctly', () => {
      const block: VideoCapabilityDataBlock = {
        tag: 0x07,
        extendedTag: 0x00,
        data: new Uint8Array(),
        ceVideoScanBehavior: 'both',
        itVideoScanBehavior: 'both',
        ptVideoScanBehavior: 'both',
        quantizationRangeSelectable: true,
        quantizationRangeYCC: true,
      };
      
      const encoded = encodeExtendedDataBlock(block);
      expect(encoded[0]).toBe(0x00); // extended tag
      expect(encoded[1]).toBe(0xFF); // all flags set
    });
  });

  describe('Colorimetry Data Block (Extended Tag 5)', () => {
    it('should decode colorimetry block with BT.2020 and DCI-P3', () => {
      // Extended tag 0x05, byte1: all colorimetry flags, byte2: DCI-P3
      const data = new Uint8Array([0x05, 0xFF, 0x80]);
      const block = decodeExtendedDataBlock(data) as ColorimetryDataBlock;
      
      expect(block.extendedTag).toBe(0x05);
      expect(block.xvYCC601).toBe(true);
      expect(block.xvYCC709).toBe(true);
      expect(block.bt2020RGB).toBe(true);
      expect(block.bt2020YCC).toBe(true);
      expect(block.dciP3).toBe(true);
    });

    it('should encode colorimetry block correctly', () => {
      const block: ColorimetryDataBlock = {
        tag: 0x07,
        extendedTag: 0x05,
        data: new Uint8Array(),
        xvYCC601: false,
        xvYCC709: false,
        sYCC601: false,
        opYCC601: false,
        opRGB: false,
        bt2020cYCC: true,
        bt2020YCC: true,
        bt2020RGB: true,
        dciP3: true,
      };
      
      const encoded = encodeExtendedDataBlock(block);
      expect(encoded[0]).toBe(0x05); // extended tag
      expect(encoded[1]).toBe(0xE0); // BT.2020 flags
      expect(encoded[2]).toBe(0x80); // DCI-P3
    });
  });

  describe('HDR Static Metadata Data Block (Extended Tag 6)', () => {
    it('should decode HDR10 capable display', () => {
      // Extended tag 0x06, EOTF: SDR + HDR10, Descriptor: Type 1
      const data = new Uint8Array([0x06, 0x05, 0x01]);
      const block = decodeExtendedDataBlock(data) as HDRStaticMetadataDataBlock;
      
      expect(block.extendedTag).toBe(0x06);
      expect(block.eotf.traditionalGammaSDR).toBe(true);
      expect(block.eotf.smpte2084).toBe(true);
      expect(block.eotf.hlg).toBe(false);
      expect(block.staticMetadataType1).toBe(true);
    });

    it('should decode HDR with luminance values', () => {
      // Extended tag 0x06, EOTF: all, Descriptor: Type 1, max luminance, max avg, min
      const data = new Uint8Array([0x06, 0x0F, 0x01, 150, 120, 50]);
      const block = decodeExtendedDataBlock(data) as HDRStaticMetadataDataBlock;
      
      expect(block.eotf.traditionalGammaSDR).toBe(true);
      expect(block.eotf.traditionalGammaHDR).toBe(true);
      expect(block.eotf.smpte2084).toBe(true);
      expect(block.eotf.hlg).toBe(true);
      expect(block.maxLuminance).toBeGreaterThan(0);
      expect(block.maxFrameAvgLuminance).toBeGreaterThan(0);
      expect(block.minLuminance).toBeDefined();
    });

    it('should encode HDR static metadata correctly', () => {
      const block: HDRStaticMetadataDataBlock = {
        tag: 0x07,
        extendedTag: 0x06,
        data: new Uint8Array(),
        eotf: {
          traditionalGammaSDR: true,
          traditionalGammaHDR: false,
          smpte2084: true,
          hlg: true,
        },
        staticMetadataType1: true,
        maxLuminance: 1000,
      };
      
      const encoded = encodeExtendedDataBlock(block);
      expect(encoded[0]).toBe(0x06); // extended tag
      expect(encoded[1]).toBe(0x0D); // EOTF flags
      expect(encoded[2]).toBe(0x01); // Static Metadata Type 1
      expect(encoded.length).toBeGreaterThanOrEqual(4); // Should include luminance
    });
  });

  describe('YCbCr 4:2:0 Video Data Block (Extended Tag 14)', () => {
    it('should decode 4:2:0 capable VICs', () => {
      // Extended tag 0x0E, followed by VICs with native flags
      const data = new Uint8Array([0x0E, 0x80 | 97, 96, 95]); // Native 4K60, 4K50, 4K30
      const block = decodeExtendedDataBlock(data) as YCbCr420VideoDataBlock;
      
      expect(block.extendedTag).toBe(0x0E);
      expect(block.vics.length).toBe(3);
      expect(block.vics[0].vic).toBe(97);
      expect(block.vics[0].native).toBe(true);
      expect(block.vics[1].vic).toBe(96);
      expect(block.vics[1].native).toBe(false);
    });
  });
});

describe('VIC Table', () => {
  it('should have common VICs defined', () => {
    expect(getVICDefinition(1)).toBeDefined(); // 640x480p
    expect(getVICDefinition(4)).toBeDefined(); // 720p60
    expect(getVICDefinition(16)).toBeDefined(); // 1080p60
    expect(getVICDefinition(97)).toBeDefined(); // 4K60
    expect(getVICDefinition(118)).toBeDefined(); // 4K120
  });

  describe('isKnownVIC (TASK-4)', () => {
    it('returns true for in-range VICs in the table', () => {
      expect(isKnownVIC(1)).toBe(true);
      expect(isKnownVIC(16)).toBe(true);
      expect(isKnownVIC(127)).toBe(true);
    });

    it('returns false for reserved VIC 0', () => {
      expect(isKnownVIC(0)).toBe(false);
    });

    it('returns false for out-of-range / reserved-gap VICs', () => {
      // 128-192 is the CTA-861 reserved gap; 220 is beyond the HDMI-VIC range
      // (193-219). HDMI-VICs themselves (e.g. 200) ARE in the table.
      expect(isKnownVIC(128)).toBe(false);
      expect(isKnownVIC(192)).toBe(false);
      expect(isKnownVIC(220)).toBe(false);
    });
  });

  it('should return correct VIC details', () => {
    const vic16 = getVICDefinition(16);
    expect(vic16?.width).toBe(1920);
    expect(vic16?.height).toBe(1080);
    expect(vic16?.refreshRate).toBe(60);
    expect(vic16?.interlaced).toBe(false);
    
    const vic97 = getVICDefinition(97);
    expect(vic97?.width).toBe(3840);
    expect(vic97?.height).toBe(2160);
    expect(vic97?.refreshRate).toBe(60);
  });

  it('should identify 4K VICs correctly', () => {
    expect(isVIC4K(16)).toBe(false); // 1080p
    expect(isVIC4K(97)).toBe(true);  // 4K60
    expect(isVIC4K(118)).toBe(true); // 4K120
    expect(isVIC4K(194)).toBe(true); // 8K (also > 4K)
  });

  it('should identify 8K VICs correctly', () => {
    expect(isVIC8K(97)).toBe(false);  // 4K
    expect(isVIC8K(194)).toBe(true);  // 8K24
    expect(isVIC8K(201)).toBe(true);  // 8K120
  });

  it('should return description for VICs', () => {
    expect(getVICDescription(16)).toContain('1920x1080');
    expect(getVICDescription(97)).toContain('3840x2160');
    expect(getVICDescription(999)).toContain('Unknown');
  });

  it('should have 8K and 10K VICs', () => {
    expect(getVICDefinition(194)?.width).toBe(7680);
    expect(getVICDefinition(210)?.width).toBe(10240);
  });

  it('should have a reasonable number of VICs defined', () => {
    expect(VIC_TABLE.length).toBeGreaterThan(100);
  });
});

describe('Audio Format Codes', () => {
  it('should return correct format names', () => {
    expect(getAudioFormatName(1)).toBe('Linear PCM');
    expect(getAudioFormatName(2)).toBe('AC-3');
    expect(getAudioFormatName(10)).toBe('Enhanced AC-3');
    expect(getAudioFormatName(12)).toBe('MAT');
  });

  it('should return correct short names', () => {
    expect(getAudioFormatShortName(1)).toBe('LPCM');
    expect(getAudioFormatShortName(10)).toBe('E-AC3');
    expect(getAudioFormatShortName(12)).toBe('TrueHD');
  });

  it('should format sampling rates correctly', () => {
    const rates = {
      sr32kHz: true,
      sr48kHz: true,
      sr96kHz: true,
      sr192kHz: true,
    };
    const str = getSamplingRatesString(rates);
    expect(str).toContain('32');
    expect(str).toContain('48');
    expect(str).toContain('96');
    expect(str).toContain('192');
    expect(str).toContain('kHz');
  });

  it('should format bit depths correctly', () => {
    const depths = { bd16: true, bd20: true, bd24: true };
    const str = getBitDepthsString(depths);
    expect(str).toContain('16');
    expect(str).toContain('20');
    expect(str).toContain('24');
    expect(str).toContain('bit');
  });

  it('extended audio format code 9 has a name (MPEG-4 HE AAC v2 + MPEG Surround)', () => {
    expect(getExtendedAudioFormatName(9)).toBe('MPEG-4 HE AAC v2 + MPEG Surround');
    // Surround-bearing codes form a contiguous run 8/9/10.
    expect(getExtendedAudioFormatName(8)).toBe('MPEG-4 HE AAC + MPEG Surround');
    expect(getExtendedAudioFormatName(10)).toBe('MPEG-4 AAC LC + MPEG Surround');
  });
});

describe('CEA DTD shared model and native association (TASK-8)', () => {
  it('associates the native DTD count with specific DTD objects (first N are native)', () => {
    const dtd = () => new DetailedTimingDescriptor({
      pixelClock: 74.25,
      horizontalActive: 1280, horizontalBlanking: 370,
      verticalActive: 720, verticalBlanking: 30,
      horizontalSyncOffset: 110, horizontalSyncWidth: 40,
      verticalSyncOffset: 5, verticalSyncWidth: 5,
      horizontalImageSize: 520, verticalImageSize: 290,
    });
    const cea = buildCeaExtension({
      detailedTimings: [dtd(), dtd(), dtd()] as unknown as CEADetailedTiming[],
      partial: { nativeFormats: 2, dtdOffset: 4 },
    });
    const bytes = ExtensionBlockParser.encode(cea as any);
    const decoded = ExtensionBlockParser.decode(bytes) as any;

    expect(decoded.nativeFormats).toBe(2);
    expect(decoded.detailedTimings.length).toBe(3);
    expect(decoded.detailedTimings[0].isNative).toBe(true);
    expect(decoded.detailedTimings[1].isNative).toBe(true);
    expect(decoded.detailedTimings[2].isNative).toBe(false);
  });

  it('round-trips stereo mode, borders, and sync flags inside a CEA extension', () => {
    const timing = new DetailedTimingDescriptor({
      pixelClock: 148.5,
      horizontalActive: 1920, horizontalBlanking: 280,
      verticalActive: 1080, verticalBlanking: 45,
      horizontalSyncOffset: 88, horizontalSyncWidth: 44,
      verticalSyncOffset: 4, verticalSyncWidth: 5,
      horizontalImageSize: 600, verticalImageSize: 340,
      horizontalBorder: 3, verticalBorder: 4,
      flags: {
        interlaced: false,
        stereoMode: 'side-by-side-interleaved',
        syncType: 'digital-composite',
        hSyncPolarity: 'negative',
        serrationOnVSync: true,
      },
    });
    const cea = buildCeaExtension({
      detailedTimings: [timing] as unknown as CEADetailedTiming[],
      partial: { nativeFormats: 0, dtdOffset: 4 },
    });
    const bytes = ExtensionBlockParser.encode(cea as any);
    const decoded = ExtensionBlockParser.decode(bytes) as any;
    const out = decoded.detailedTimings[0];

    expect(out.horizontalBorder).toBe(3);
    expect(out.verticalBorder).toBe(4);
    expect(out.flags.stereoMode).toBe('side-by-side-interleaved');
    expect(out.flags.syncType).toBe('digital-composite');
    expect(out.flags.hSyncPolarity).toBe('negative');
    expect(out.flags.serrationOnVSync).toBe(true);
    // isNative is modelled even when the native count is 0.
    expect(out.isNative).toBe(false);
  });
});

describe('VESA extended tag 0x02 (Video Display Device Data Block) — TASK-9', () => {
  // 30-byte payload exercising a representative set of fields.
  // x[0]=0x92 → DisplayPort (cat 9), 2 channels; x[1]=0x12 → std v1.2;
  // x[2]=0x01 → HDCP; x[3]=0x22,x[4]=0x21 → min 8 MHz, max ((2)<<8)|0x21 = 545 MHz;
  // x[5..8]=1920x1080; x[9]=0x06 → aspect 1.06; x[0x0a]=0x2f → orient0/rot2/zp3/sd3;
  // x[0x0b]=0x07 → delta triad; x[0x0c]=0x19,x[0x0d]=0x23 → 0.25 x 0.35 mm;
  // x[0x0e]=0xb8 → dither2, direct-drive, overdrive NOT rec (bit4=1→false), deinterlace;
  // x[0x0f]=0xc0 → audio support + separate inputs; x[0x10]=0x83 → +6 ms;
  // x[0x11]=0x45 → conv1, range 5; x[0x12]=0x3c → 60 fps; x[0x13]=0x57 → 6@intf, 8@disp;
  // x[0x14]=0x1c, x[0x15]=0x83 → count3; primaries 10-bit packed (see expects);
  // x[0x1c]=0x8a → White→Black, 10 ms; x[0x1d]=0x46 → 4% x 6% overscan.
  const payload = new Uint8Array([
    0x92, 0x12, 0x01, 0x22, 0x21, 0x80, 0x07, 0x38, 0x04, 0x06,
    0x2f, 0x07, 0x19, 0x23, 0xb8, 0xc0, 0x83, 0x45, 0x3c, 0x57,
    0x1c, 0x83, 0x64, 0xc8, 0x14, 0x28, 0x1a, 0x2c, 0x8a, 0x46,
  ]);
  if (payload.length !== 30) throw new Error(`payload must be 30 bytes, got ${payload.length}`);

  it('decodes the structured 30-byte block and the label map resolves the interface', () => {
    const blockData = new Uint8Array([0x02, ...payload]);
    const block = decodeExtendedDataBlock(blockData) as VESAVideoDisplayDeviceDataBlock;
    expect(block.extendedTag).toBe(0x02);
    expect(block.interfaceCategory).toBe(9);
    expect(block.interfaceDetail).toBe(2);
    expect(VESA_INTERFACE_CATEGORIES.find((e) => e.id === block.interfaceCategory)?.label).toBe('DisplayPort');
    expect(block.interfaceStandardMajor).toBe(1);
    expect(block.interfaceStandardMinor).toBe(2);
    expect(block.contentProtection).toBe(1);
    expect(block.minClockMHz).toBe(8);
    expect(block.maxClockMHz).toBe(0x221);
    expect(block.nativePixelWidth).toBe(1920);
    expect(block.nativePixelHeight).toBe(1080);
    expect(block.aspectRatio).toBe(0x06);
    expect(block.orientation).toBe(0);
    expect(block.rotationCapability).toBe(2);
    expect(block.zeroPixelLocation).toBe(3);
    expect(block.scanDirection).toBe(3);
    expect(block.subpixelInformation).toBe(0x07);
    expect(block.horizontalPitchMm).toBeCloseTo(0.25, 5);
    expect(block.verticalPitchMm).toBeCloseTo(0.35, 5);
    expect(block.dithering).toBe(2);
    expect(block.directDrive).toBe(true);
    expect(block.overdriveRecommended).toBe(false);
    expect(block.deinterlacing).toBe(true);
    expect(block.audioSupport).toBe(true);
    expect(block.separateAudioInputs).toBe(true);
    expect(block.audioInputOverride).toBe(false);
    expect(block.audioDelayMs).toBe(6);
    expect(block.audioDelayPositive).toBe(true);
    expect(block.frameRateConversion).toBe(1);
    expect(block.frameRateRange).toBe(5);
    expect(block.nominalFrameRate).toBe(60);
    expect(block.colorBitDepthInterface).toBe(6);
    expect(block.colorBitDepthDisplay).toBe(8);
    expect(block.additionalPrimaryCount).toBe(3);
    // P4: x=(0x64<<2)|(0x1c>>6)=0x190, y=(0xc8<<2)|((0x1c>>4)&3)=0x321
    expect(block.primary4).toEqual({ x: 0x190, y: 0x321 });
    // P5: x=(0x14<<2)|((0x1c>>2)&3)=0x53, y=(0x28<<2)|(0x1c&3)=0xa0
    expect(block.primary5).toEqual({ x: 0x53, y: 0xa0 });
    // P6: x=(0x1a<<2)|(0x83>>6)=0x6a, y=(0x2c<<2)|((0x83>>4)&3)=0xb0
    expect(block.primary6).toEqual({ x: 0x6a, y: 0xb0 });
    expect(block.responseTimeDirection).toBe(1);
    expect(block.responseTimeMs).toBe(10);
    expect(block.overscanHorizontal).toBe(4);
    expect(block.overscanVertical).toBe(6);
  });

  it('round-trips byte-identically through decode → encode', () => {
    const blockData = new Uint8Array([0x02, ...payload]);
    const block = decodeExtendedDataBlock(blockData);
    const reencoded = encodeExtendedDataBlock(block);
    expect(Array.from(reencoded)).toEqual(Array.from(blockData));
  });

  it('mutates a decoded field, re-encodes, re-decodes, and keeps other fields stable (TASK-61)', () => {
    // The corpus has zero VDDB fixtures, so this synthetic mutation test is the
    // only safety net for the field-driven encode path.
    const blockData = new Uint8Array([0x02, ...payload]);
    const block = decodeExtendedDataBlock(blockData) as VESAVideoDisplayDeviceDataBlock;
    expect(block.maxClockMHz).toBe(0x221);
    expect(block.nativePixelHeight).toBe(1080);

    // Edit maxClockMHz; leave nativePixelHeight (packed across x[5..8]) untouched.
    block.maxClockMHz = 0x300;
    const reencoded = encodeExtendedDataBlock(block);
    const redecoded = decodeExtendedDataBlock(reencoded) as VESAVideoDisplayDeviceDataBlock;

    expect(redecoded.maxClockMHz).toBe(0x300);
    expect(redecoded.nativePixelHeight).toBe(1080);
    expect(redecoded.minClockMHz).toBe(8);
  });

  it('round-trips the audio-delay sign for +0 (0x80) and −0 (0x00)', () => {
    for (const raw of [0x80, 0x00]) {
      const p = new Uint8Array(payload);
      p[0x10] = raw;
      const blockData = new Uint8Array([0x02, ...p]);
      const reencoded = encodeExtendedDataBlock(decodeExtendedDataBlock(blockData));
      expect(Array.from(reencoded)).toEqual(Array.from(blockData));
    }
  });

  it('falls back to raw bytes for a malformed (non-30-byte) payload and still round-trips', () => {
    const blockData = new Uint8Array([0x02, 0xaa, 0xbb, 0xcc]); // 3 payload bytes, not 30
    const block = decodeExtendedDataBlock(blockData);
    // Generic fallback: only tag/extendedTag/data, no structured fields.
    expect((block as VESAVideoDisplayDeviceDataBlock).interfaceCategory).toBeUndefined();
    const reencoded = encodeExtendedDataBlock(block);
    expect(Array.from(reencoded)).toEqual(Array.from(blockData));
  });
});

describe('VESA extended tag 0x03 (Video Timing Block Extension) — TASK-9', () => {
  it('decodes as a structured opaque-payload block and round-trips verbatim', () => {
    const blockData = new Uint8Array([0x03, 0x10, 0x20, 0x30, 0x40, 0x50]);
    const block = decodeExtendedDataBlock(blockData) as VESAVideoTimingBlockExtensionDataBlock;
    expect(block.extendedTag).toBe(0x03);
    expect(Array.from(block.payload)).toEqual([0x10, 0x20, 0x30, 0x40, 0x50]);
    const reencoded = encodeExtendedDataBlock(block);
    expect(Array.from(reencoded)).toEqual(Array.from(blockData));
  });

  it('mutates a decoded field, re-encodes, re-decodes, and keeps other fields stable (TASK-61)', () => {
    // The corpus has zero VTB-Extension fixtures, so this synthetic mutation
    // test is the only safety net for the encode path. The block is an opaque
    // payload wrapper, so the modeled "field" is the payload bytes themselves.
    const blockData = new Uint8Array([0x03, 0x10, 0x20, 0x30, 0x40, 0x50]);
    const block = decodeExtendedDataBlock(blockData) as VESAVideoTimingBlockExtensionDataBlock;
    expect(block.extendedTag).toBe(0x03);

    block.payload = new Uint8Array([0xaa, 0xbb, 0xcc]);
    const reencoded = encodeExtendedDataBlock(block);
    const redecoded = decodeExtendedDataBlock(reencoded) as VESAVideoTimingBlockExtensionDataBlock;

    expect(redecoded.extendedTag).toBe(0x03);
    expect(Array.from(redecoded.payload)).toEqual([0xaa, 0xbb, 0xcc]);
  });

  it('round-trips an empty payload (length-0 block data is still ≥ ext tag)', () => {
    const blockData = new Uint8Array([0x03]);
    const block = decodeExtendedDataBlock(blockData) as VESAVideoTimingBlockExtensionDataBlock;
    expect(block.payload.length).toBe(0);
    const reencoded = encodeExtendedDataBlock(block);
    expect(Array.from(reencoded)).toEqual([0x03]);
  });
});
