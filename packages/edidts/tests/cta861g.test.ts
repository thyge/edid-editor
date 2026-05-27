import { describe, it, expect } from 'vitest';
import {
  decodeExtendedDataBlock,
  encodeExtendedDataBlock,
  getVICDefinition,
  getVICDescription,
  isVIC4K,
  isVIC8K,
  getAudioFormatName,
  getAudioFormatShortName,
  getSamplingRatesString,
  getBitDepthsString,
  VIC_TABLE,
  type VideoCapabilityDataBlock,
  type ColorimetryDataBlock,
  type HDRStaticMetadataDataBlock,
  type YCbCr420VideoDataBlock,
} from '../src/edid/index';

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
});
