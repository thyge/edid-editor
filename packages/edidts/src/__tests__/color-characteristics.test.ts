import { describe, it, expect } from "vitest";
import { Chromaticity } from "../edid/color-characteristics";

describe("Chromaticity", () => {
  it("roundtrips zero chromaticity", () => {
    const original = new Chromaticity(new Uint8Array(10));
    const encoded = original.Encode();
    const decoded = Chromaticity.decode(encoded);
    expect(decoded.RedX).toBe(0);
    expect(decoded.RedY).toBe(0);
    expect(decoded.GreenX).toBe(0);
    expect(decoded.GreenY).toBe(0);
    expect(decoded.BlueX).toBe(0);
    expect(decoded.BlueY).toBe(0);
    expect(decoded.WhiteX).toBe(0);
    expect(decoded.WhiteY).toBe(0);
  });

  it("roundtrips maximum chromaticity", () => {
    // 10-bit max = 1023 / 1024 ≈ 0.999
    const bytes = new Uint8Array(10);
    bytes[0] = 0xff;
    bytes[1] = 0xff;
    bytes[2] = 0xff;
    bytes[3] = 0xff;
    bytes[4] = 0xff;
    bytes[5] = 0xff;
    bytes[6] = 0xff;
    bytes[7] = 0xff;
    bytes[8] = 0xff;
    bytes[9] = 0xff;
    const original = Chromaticity.decode(bytes);
    const encoded = original.Encode();
    const decoded = Chromaticity.decode(encoded);
    expect(decoded.RedX).toBeCloseTo(1023 / 1024, 6);
    expect(decoded.RedY).toBeCloseTo(1023 / 1024, 6);
  });

  it("roundtrips a custom chromaticity", () => {
    // Use values that are exact multiples of 1/1024 for perfect roundtrip
    const original = new Chromaticity(new Uint8Array(10));
    original.RedX = 640 / 1024;   // 0.625
    original.RedY = 348 / 1024;   // ~0.340
    original.GreenX = 286 / 1024; // ~0.279
    original.GreenY = 609 / 1024; // ~0.595
    original.BlueX = 159 / 1024;  // ~0.155
    original.BlueY = 72 / 1024;   // ~0.070
    original.WhiteX = 320 / 1024; // ~0.313
    original.WhiteY = 337 / 1024; // ~0.329

    const encoded = original.Encode();
    const decoded = Chromaticity.decode(encoded);
    expect(decoded.RedX).toBe(640 / 1024);
    expect(decoded.RedY).toBe(348 / 1024);
    expect(decoded.GreenX).toBe(286 / 1024);
    expect(decoded.GreenY).toBe(609 / 1024);
    expect(decoded.BlueX).toBe(159 / 1024);
    expect(decoded.BlueY).toBe(72 / 1024);
    expect(decoded.WhiteX).toBe(320 / 1024);
    expect(decoded.WhiteY).toBe(337 / 1024);
  });

  it("preserves byte-level accuracy", () => {
    // Create bytes that represent exact 10-bit values
    const bytes = new Uint8Array([
      0b00000011, 0b00001100, 0x80, 0x40, 0x20, 0x10, 0x08, 0x04, 0x02,
      0x01,
    ]);
    const original = Chromaticity.decode(bytes);
    const encoded = original.Encode();
    expect(encoded).toEqual(bytes);
  });
});
