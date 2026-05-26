import { describe, it, expect } from "vitest";
import { DetailedTimingDescriptor, SyncType, CVTMode } from "../common/DetailedTimingDescriptor";
import { hexToUint8Array } from "../common/utils";

// Appendix A Example 1: Preferred Timing Descriptor (bytes 54-71)
// Pixel clock: 0x08E8 = 2280 → 22.80 MHz
// 1280x1024 @ 60Hz
const APPENDIX_A_DTD_HEX = "08,E8,00,30,F2,70,5A,80,B0,58,8A,00,1C,00,74,00,00,1E";
const APPENDIX_A_DTD = hexToUint8Array(APPENDIX_A_DTD_HEX);

describe("DetailedTimingDescriptor", () => {
  describe("decode", () => {
    it("decodes the Appendix A preferred timing correctly", () => {
      const dtd = DetailedTimingDescriptor.decode(APPENDIX_A_DTD)!;
      expect(dtd.PixelClockKHz).toBe(59400 * 10000);
      // Actual fixture decodes to 3840x2160 (not 1280x1024)
      expect(dtd.HorizontalActive).toBe(3840);
      expect(dtd.VerticalActive).toBe(2160);
      expect(dtd.Interlaced).toBe(false);
    });

    it("returns null for empty/zero pixel clock descriptor", () => {
      const zeros = new Uint8Array(18);
      const dtd = DetailedTimingDescriptor.decode(zeros);
      expect(dtd).toBeNull();
    });

    it("correctly decodes stereo modes when stereo bit 0 is set", () => {
      const base = new Uint8Array(APPENDIX_A_DTD);
      // Set stereo bit (bit 0) and bits 5:4 to 01 → TwoWayInterleavedRight
      base[17] = (base[17] & 0x80) | 0x21;
      const dtd = DetailedTimingDescriptor.decode(base)!;
      expect(dtd.StereoMode).toBe("2-way interleaved, right image on even lines");
    });

    it("correctly decodes stereo modes when stereo bit 0 is clear", () => {
      const base = new Uint8Array(APPENDIX_A_DTD);
      // Clear stereo bit (bit 0) and set bits 6:5 to 01 → FieldSequentialRight
      base[17] = (base[17] & 0x80) | 0x20;
      const dtd = DetailedTimingDescriptor.decode(base)!;
      expect(dtd.StereoMode).toBe("Field sequential, right image on sync signal");
    });

    it("correctly decodes all stereo mode combinations", () => {
      const base = new Uint8Array(APPENDIX_A_DTD);

      // Bit 0 = 0, bits 6:5 = 01 → FieldSequentialRight
      base[17] = (base[17] & 0x80) | 0x20;
      expect(DetailedTimingDescriptor.decode(base)!.StereoMode).toBe("Field sequential, right image on sync signal");

      // Bit 0 = 0, bits 6:5 = 10 → FieldSequentialLeft
      base[17] = (base[17] & 0x80) | 0x40;
      expect(DetailedTimingDescriptor.decode(base)!.StereoMode).toBe("Field sequential, left image on sync signal");

      // Bit 0 = 0, bits 6:5 = 11 → FourWayInterleaved
      base[17] = (base[17] & 0x80) | 0x60;
      expect(DetailedTimingDescriptor.decode(base)!.StereoMode).toBe("4-way interleaved");

      // Bit 0 = 1, bits 5:4 = 01 → TwoWayInterleavedRight
      base[17] = (base[17] & 0x80) | 0x21;
      expect(DetailedTimingDescriptor.decode(base)!.StereoMode).toBe("2-way interleaved, right image on even lines");

      // Bit 0 = 1, bits 5:4 = 10 → TwoWayInterleavedLeft
      base[17] = (base[17] & 0x80) | 0x41;
      expect(DetailedTimingDescriptor.decode(base)!.StereoMode).toBe("2-way interleaved, left image on even lines");

      // Bit 0 = 1, bits 5:4 = 11 → SideBySideInterleaved
      base[17] = (base[17] & 0x80) | 0x61;
      expect(DetailedTimingDescriptor.decode(base)!.StereoMode).toBe("side-by-side interleaved");
    });

    it("correctly decodes sync types", () => {
      const base = new Uint8Array(APPENDIX_A_DTD);

      // Bits 4:3 = 00 → AnalogComposite
      base[17] = (base[17] & 0x80) | 0x00;
      expect(DetailedTimingDescriptor.decode(base)!.SyncDefinition.SyncType).toBe(SyncType.AnalogComposite);

      // Bits 4:3 = 01 → BipolarAnalogComposite
      base[17] = (base[17] & 0x80) | 0x08;
      expect(DetailedTimingDescriptor.decode(base)!.SyncDefinition.SyncType).toBe(SyncType.BipolarAnalogComposite);

      // Bits 4:3 = 10 → DigitalComposite
      base[17] = (base[17] & 0x80) | 0x10;
      expect(DetailedTimingDescriptor.decode(base)!.SyncDefinition.SyncType).toBe(SyncType.DigitalComposite);

      // Bits 4:3 = 11 → DigitalSeparate
      base[17] = (base[17] & 0x80) | 0x18;
      expect(DetailedTimingDescriptor.decode(base)!.SyncDefinition.SyncType).toBe(SyncType.DigitalSeparate);
    });
  });

  describe("encode", () => {
    it("roundtrips the Appendix A DTD", () => {
      const dtd = DetailedTimingDescriptor.decode(APPENDIX_A_DTD)!;
      const encoded = dtd.Encode();
      expect(encoded).toEqual(APPENDIX_A_DTD);
    });

    it("roundtrips a custom DTD", () => {
      const dtd = new DetailedTimingDescriptor();
      // PixelClockKHz stores Hz, not kHz (misnamed field). 148.5 MHz = 148500000 Hz.
      dtd.PixelClockKHz = 148500000;
      dtd.HorizontalActive = 1920;
      dtd.HorizontalBlanking = 280;
      dtd.VerticalActive = 1080;
      dtd.VerticalBlanking = 45;
      dtd.HorizontalFrontPorch = 88;
      dtd.HorizontalSyncPulseWidth = 44;
      dtd.VerticalFrontPorch = 4;
      dtd.VerticalSyncPulseWidth = 5;
      dtd.HorizontalImageSize = 530;
      dtd.VerticalImageSize = 300;
      dtd.HorizontalBorder = 0;
      dtd.VerticalBorder = 0;
      dtd.Interlaced = false;
      dtd.StereoMode = "No Stereo" as any;
      dtd.SyncDefinition = { SyncType: SyncType.DigitalSeparate, Encode: () => 0x1a } as any;

      const encoded = dtd.Encode();
      const decoded = DetailedTimingDescriptor.decode(encoded)!;
      expect(decoded.PixelClockKHz).toBe(148500000);
      expect(decoded.HorizontalActive).toBe(1920);
      expect(decoded.VerticalActive).toBe(1080);
    });

    it("roundtrips all stereo modes correctly", () => {
      const stereoModes = [
        "No Stereo",
        "Field sequential, right image on sync signal",
        "Field sequential, left image on sync signal",
        "2-way interleaved, right image on even lines",
        "2-way interleaved, left image on even lines",
        "4-way interleaved",
        "side-by-side interleaved",
      ];

      for (const mode of stereoModes) {
        const template = DetailedTimingDescriptor.decode(APPENDIX_A_DTD)!;
        const dtd = new DetailedTimingDescriptor();
        dtd.cloneFrom(template);
        dtd.StereoMode = mode as any;
        const encoded = dtd.Encode();
        const decoded = DetailedTimingDescriptor.decode(encoded)!;
        expect(decoded.StereoMode).toBe(mode);
      }
    });

    it("roundtrips DigitalSeparate sync with positive/negative polarities", () => {
      const dtd = DetailedTimingDescriptor.decode(APPENDIX_A_DTD)!;
      // Force DigitalSeparate sync
      dtd.SyncDefinition = {
        SyncType: SyncType.DigitalSeparate,
        VerticalSync: "Positive",
        HorizontalSync: "Negative",
        Encode: () => 0x1a,
      } as any;
      const encoded = dtd.Encode();
      const decoded = DetailedTimingDescriptor.decode(encoded)!;
      expect(decoded.SyncDefinition.SyncType).toBe(SyncType.DigitalSeparate);
    });

    it("roundtrips interlaced flag", () => {
      const dtd = DetailedTimingDescriptor.decode(APPENDIX_A_DTD)!;
      dtd.Interlaced = true;
      const encoded = dtd.Encode();
      expect(encoded[17] & 0x80).toBe(0x80);
      const decoded = DetailedTimingDescriptor.decode(encoded)!;
      expect(decoded.Interlaced).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles maximum pixel clock (655.35 MHz)", () => {
      const dtd = new DetailedTimingDescriptor();
      // PixelClockKHz stores Hz. 655.35 MHz = 655350000 Hz.
      dtd.PixelClockKHz = 655350000;
      const encoded = dtd.Encode();
      const stored = (encoded[1] << 8) | encoded[0];
      expect(stored).toBe(65535);
      const decoded = DetailedTimingDescriptor.decode(encoded)!;
      expect(decoded.PixelClockKHz).toBe(655350000);
    });

    it("handles zero pixel clock by returning null on decode", () => {
      const zeros = new Uint8Array(18);
      const dtd = DetailedTimingDescriptor.decode(zeros);
      expect(dtd).toBeNull();
    });

    it("handles large horizontal/vertical values", () => {
      const dtd = new DetailedTimingDescriptor();
      dtd.PixelClockKHz = 100000;
      dtd.HorizontalActive = 4095;
      dtd.HorizontalBlanking = 4095;
      dtd.VerticalActive = 4095;
      dtd.VerticalBlanking = 4095;
      const encoded = dtd.Encode();
      const decoded = DetailedTimingDescriptor.decode(encoded)!;
      expect(decoded.HorizontalActive).toBe(4095);
      expect(decoded.VerticalActive).toBe(4095);
    });
  });
});
