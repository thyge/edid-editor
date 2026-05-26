import { describe, it, expect } from "vitest";
import {
  FeatureSupport,
  DigitalColourEncoding,
  AnalogueColourEncoding,
  EdidVersion,
} from "../edid/feature-support";
import { SignalInterface } from "../edid/video-input";

describe("FeatureSupport", () => {
  it("decodes digital colour encoding", () => {
    const fs = FeatureSupport.decode(0xff, SignalInterface.Digital);
    expect(fs.DPMSstandby).toBe(true);
    expect(fs.DPMSsuspend).toBe(true);
    expect(fs.DPMSactiveOff).toBe(true);
    expect(fs.sRGB).toBe(true);
    expect(fs.PreferredTiming).toBe(true);
  });

  it("decodes analog colour encoding", () => {
    const fs = FeatureSupport.decode(0xff, SignalInterface.Analog);
    expect(fs.DPMSstandby).toBe(true);
    expect(fs.DPMSsuspend).toBe(true);
    expect(fs.DPMSactiveOff).toBe(true);
  });

  it("roundtrips DPMS flags", () => {
    const original = FeatureSupport.decode(0x00, SignalInterface.Digital);
    original.DPMSstandby = true;
    original.DPMSsuspend = true;
    original.DPMSactiveOff = true;

    const encoded = original.Encode();
    const decoded = FeatureSupport.decode(encoded, SignalInterface.Digital);
    expect(decoded.DPMSstandby).toBe(true);
    expect(decoded.DPMSsuspend).toBe(true);
    expect(decoded.DPMSactiveOff).toBe(true);
  });

  it("roundtrips digital colour encoding", () => {
    const original = FeatureSupport.decode(0x00, SignalInterface.Digital);
    const ce = original.ColourEncoding as DigitalColourEncoding;
    ce.RGB444 = true;
    ce.YUV444 = true;
    ce.YUV422 = true;

    const encoded = original.Encode();
    const decoded = FeatureSupport.decode(encoded, SignalInterface.Digital);
    const decodedCe = decoded.ColourEncoding as DigitalColourEncoding;
    expect(decodedCe.RGB444).toBe(true);
    expect(decodedCe.YUV444).toBe(true);
    expect(decodedCe.YUV422).toBe(true);
  });

  it("roundtrips analog colour encoding", () => {
    const original = FeatureSupport.decode(0x00, SignalInterface.Analog);
    const ce = original.ColourEncoding as AnalogueColourEncoding;
    ce.AnalogColour = 2; // NonRGB

    const encoded = original.Encode();
    const decoded = FeatureSupport.decode(encoded, SignalInterface.Analog);
    const decodedCe = decoded.ColourEncoding as AnalogueColourEncoding;
    expect(decodedCe.AnalogColour).toBe(2);
  });

  it("defaults to V14 for undefined version", () => {
    const fs = FeatureSupport.decode(0x01, SignalInterface.Digital);
    expect(fs.Version).toBe(EdidVersion.V14);
    expect(fs.ContiniousFrequency).toBe(true);
    expect(fs.GTFSupport).toBe(false);
  });

  it("handles V13 GTF support bit", () => {
    const fs = FeatureSupport.decode(
      0x01,
      SignalInterface.Digital,
      EdidVersion.V13
    );
    expect(fs.Version).toBe(EdidVersion.V13);
    expect(fs.GTFSupport).toBe(true);
    expect(fs.ContiniousFrequency).toBe(false);
  });

  it("roundtrips V13 GTF support", () => {
    const original = FeatureSupport.decode(
      0x00,
      SignalInterface.Digital,
      EdidVersion.V13
    );
    original.GTFSupport = true;

    const encoded = original.Encode();
    const decoded = FeatureSupport.decode(
      encoded,
      SignalInterface.Digital,
      EdidVersion.V13
    );
    expect(decoded.GTFSupport).toBe(true);
    expect(decoded.ContiniousFrequency).toBe(false);
  });

  it("roundtrips V14 continuous frequency", () => {
    const original = FeatureSupport.decode(
      0x00,
      SignalInterface.Digital,
      EdidVersion.V14
    );
    original.ContiniousFrequency = true;

    const encoded = original.Encode();
    const decoded = FeatureSupport.decode(
      encoded,
      SignalInterface.Digital,
      EdidVersion.V14
    );
    expect(decoded.ContiniousFrequency).toBe(true);
    expect(decoded.GTFSupport).toBe(false);
  });

  it("roundtrips Pre13 version as GTF support", () => {
    // For Pre13, bit 0 should represent GTF support, not continuous frequency
    const original = FeatureSupport.decode(
      0x00,
      SignalInterface.Digital,
      EdidVersion.Pre13
    );
    original.GTFSupport = true;

    const encoded = original.Encode();
    const decoded = FeatureSupport.decode(
      encoded,
      SignalInterface.Digital,
      EdidVersion.Pre13
    );
    expect(decoded.GTFSupport).toBe(true);
  });
});

describe("DigitalColourEncoding", () => {
  it("roundtrips all colour encoding flags", () => {
    const original = new DigitalColourEncoding(0);
    original.RGB444 = true;
    original.YUV444 = true;
    original.YUV422 = true;

    const encoded = original.Encode();
    const decoded = DigitalColourEncoding.decode(encoded);
    expect(decoded.RGB444).toBe(true);
    expect(decoded.YUV444).toBe(true);
    expect(decoded.YUV422).toBe(true);
  });
});

describe("AnalogueColourEncoding", () => {
  it("roundtrips all colour types", () => {
    const types = [0, 1, 2, 3];
    for (const t of types) {
      const original = new AnalogueColourEncoding(0);
      original.AnalogColour = t;
      const encoded = original.Encode();
      expect(encoded & 0x03).toBe(t);
      const decoded = AnalogueColourEncoding.decode(encoded);
      expect(decoded.AnalogColour).toBe(t);
    }
  });
});
