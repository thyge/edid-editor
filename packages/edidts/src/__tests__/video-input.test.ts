import { describe, it, expect } from "vitest";
import {
  DigitalVideoInput,
  AnalogVideoInput,
  SignalInterface,
} from "../edid/video-input";

describe("DigitalVideoInput", () => {
  it("decodes undefined bit depth and interface", () => {
    const dvi = DigitalVideoInput.decode(0x81);
    expect(dvi.SignalInterface).toBe(SignalInterface.Digital);
    expect(dvi.Interface).toBe("DVI");
    expect(dvi.BitDepth).toBe("undefined");
  });

  it("decodes all bit depths", () => {
    expect(DigitalVideoInput.decode(0x80).BitDepth).toBe("undefined");
    expect(DigitalVideoInput.decode(0x91).BitDepth).toBe("6");
    expect(DigitalVideoInput.decode(0xa1).BitDepth).toBe("8");
    expect(DigitalVideoInput.decode(0xb1).BitDepth).toBe("10");
    expect(DigitalVideoInput.decode(0xc1).BitDepth).toBe("12");
    expect(DigitalVideoInput.decode(0xe1).BitDepth).toBe("16");
  });

  it("decodes reserved bit depths as undefined", () => {
    // Bits 6:4 = 101 (5) and 111 (7) are reserved
    expect(DigitalVideoInput.decode(0xd1).BitDepth).toBe("undefined");
    expect(DigitalVideoInput.decode(0xf1).BitDepth).toBe("undefined");
  });

  it("decodes all interfaces", () => {
    expect(DigitalVideoInput.decode(0x80).Interface).toBe("undefined");
    expect(DigitalVideoInput.decode(0x81).Interface).toBe("DVI");
    expect(DigitalVideoInput.decode(0x82).Interface).toBe("HDMIa");
    expect(DigitalVideoInput.decode(0x83).Interface).toBe("HDMIb");
    expect(DigitalVideoInput.decode(0x84).Interface).toBe("MDDI");
    expect(DigitalVideoInput.decode(0x85).Interface).toBe("DisplayPort");
  });

  it("roundtrips all bit depths", () => {
    const bitDepths = ["undefined", "6", "8", "10", "12", "16"] as const;
    for (const bd of bitDepths) {
      const original = new DigitalVideoInput(0x80);
      original.BitDepth = bd;
      original.Interface = "DisplayPort";
      const encoded = original.Encode();
      const decoded = DigitalVideoInput.decode(encoded);
      expect(decoded.BitDepth).toBe(bd);
    }
  });

  it("roundtrips all interfaces", () => {
    const interfaces = [
      "undefined",
      "DVI",
      "HDMIa",
      "HDMIb",
      "MDDI",
      "DisplayPort",
    ] as const;
    for (const iface of interfaces) {
      const original = new DigitalVideoInput(0x80);
      original.Interface = iface;
      original.BitDepth = "8";
      const encoded = original.Encode();
      const decoded = DigitalVideoInput.decode(encoded);
      expect(decoded.Interface).toBe(iface);
    }
  });

  it("always sets the digital flag (bit 7)", () => {
    const dvi = new DigitalVideoInput(0x81);
    expect(dvi.Encode() & 0x80).toBe(0x80);
  });
});

describe("AnalogVideoInput", () => {
  it("decodes signal level standards", () => {
    expect(AnalogVideoInput.decode(0x00).SignalLevelStandard).toBe(0);
    expect(AnalogVideoInput.decode(0x20).SignalLevelStandard).toBe(0x20);
    expect(AnalogVideoInput.decode(0x40).SignalLevelStandard).toBe(0x40);
    expect(AnalogVideoInput.decode(0x60).SignalLevelStandard).toBe(0x60);
  });

  it("decodes video setup", () => {
    expect(AnalogVideoInput.decode(0x00).VideoSetup).toBe(
      "Blank Level = Black Level"
    );
    expect(AnalogVideoInput.decode(0x10).VideoSetup).toBe(
      "Blank-to-Black setup or pedestal"
    );
  });

  it("roundtrips signal level standard", () => {
    const standards = [0, 0x20, 0x40, 0x60];
    for (const std of standards) {
      const original = new AnalogVideoInput(std);
      const encoded = original.Encode();
      const decoded = AnalogVideoInput.decode(encoded);
      expect(decoded.SignalLevelStandard).toBe(std);
    }
  });

  it("roundtrips video setup", () => {
    const setups = [
      "Blank Level = Black Level",
      "Blank-to-Black setup or pedestal",
    ] as const;
    for (const setup of setups) {
      const original = new AnalogVideoInput(0x00);
      original.VideoSetup = setup;
      const encoded = original.Encode();
      const decoded = AnalogVideoInput.decode(encoded);
      expect(decoded.VideoSetup).toBe(setup);
    }
  });

  it("roundtrips sync flags", () => {
    const original = new AnalogVideoInput(0x00);
    original.SeparateSyncHVSignals = true;
    original.CompositeSyncSignalonHorizontal = true;
    original.CompositeSyncSignalonGreenVideo = true;
    original.SerrationsOnVSync = true;

    const encoded = original.Encode();
    const decoded = AnalogVideoInput.decode(encoded);
    expect(decoded.SeparateSyncHVSignals).toBe(true);
    expect(decoded.CompositeSyncSignalonHorizontal).toBe(true);
    expect(decoded.CompositeSyncSignalonGreenVideo).toBe(true);
    expect(decoded.SerrationsOnVSync).toBe(true);
  });

  it("always clears the digital flag (bit 7)", () => {
    const analog = new AnalogVideoInput(0x00);
    expect(analog.Encode() & 0x80).toBe(0);
  });
});
