import { describe, it, expect } from "vitest";
import { EstablishedTimings } from "../edid/established-timing";

describe("EstablishedTimings", () => {
  it("decodes all false from zero bytes", () => {
    const et = EstablishedTimings.decode(new Uint8Array([0, 0, 0]));
    expect(et.ET720_400_70).toBe(false);
    expect(et.ET640_480_60).toBe(false);
    expect(et.ET1024_768_60).toBe(false);
    expect(et.ET1152_870_75).toBe(false);
  });

  it("decodes all true from full bytes", () => {
    const et = EstablishedTimings.decode(new Uint8Array([0xff, 0xff, 0x80]));
    expect(et.ET720_400_70).toBe(true);
    expect(et.ET720_400_88).toBe(true);
    expect(et.ET640_480_60).toBe(true);
    expect(et.ET640_480_67).toBe(true);
    expect(et.ET640_480_72).toBe(true);
    expect(et.ET640_480_75).toBe(true);
    expect(et.ET800_600_56).toBe(true);
    expect(et.ET800_600_60).toBe(true);
    expect(et.ET800_600_72).toBe(true);
    expect(et.ET800_600_75).toBe(true);
    expect(et.ET832_624_75).toBe(true);
    expect(et.ET1024_768_87).toBe(true);
    expect(et.ET1024_768_60).toBe(true);
    expect(et.ET1024_768_70).toBe(true);
    expect(et.ET1024_768_75).toBe(true);
    expect(et.ET1280_1024_75).toBe(true);
    expect(et.ET1152_870_75).toBe(true);
  });

  it("roundtrips each individual bit", () => {
    const fields = [
      "ET720_400_70",
      "ET720_400_88",
      "ET640_480_60",
      "ET640_480_67",
      "ET640_480_72",
      "ET640_480_75",
      "ET800_600_56",
      "ET800_600_60",
      "ET800_600_72",
      "ET800_600_75",
      "ET832_624_75",
      "ET1024_768_87",
      "ET1024_768_60",
      "ET1024_768_70",
      "ET1024_768_75",
      "ET1280_1024_75",
      "ET1152_870_75",
    ] as const;

    for (const field of fields) {
      const original = new EstablishedTimings(new Uint8Array(3));
      (original as any)[field] = true;

      const encoded = original.Encode();
      const decoded = EstablishedTimings.decode(encoded);
      expect((decoded as any)[field], `field ${field} should roundtrip`).toBe(true);
    }
  });

  it("roundtrips mixed bits", () => {
    const original = new EstablishedTimings(new Uint8Array(3));
    original.ET640_480_60 = true;
    original.ET800_600_60 = true;
    original.ET1024_768_60 = true;
    original.ET1280_1024_75 = true;

    const encoded = original.Encode();
    const decoded = EstablishedTimings.decode(encoded);
    expect(decoded.ET640_480_60).toBe(true);
    expect(decoded.ET800_600_60).toBe(true);
    expect(decoded.ET1024_768_60).toBe(true);
    expect(decoded.ET1280_1024_75).toBe(true);
    expect(decoded.ET720_400_70).toBe(false);
    expect(decoded.ET1152_870_75).toBe(false);
  });

  it("matches Appendix A fixture", () => {
    // Appendix A bytes 35-37 = 0x20, 0x08, 0x00
    const et = EstablishedTimings.decode(new Uint8Array([0x20, 0x08, 0x00]));
    expect(et.ET640_480_60).toBe(true);
    expect(et.ET1024_768_60).toBe(true);
    expect(et.ET720_400_70).toBe(false);
    expect(et.ET1152_870_75).toBe(false);

    const encoded = et.Encode();
    expect(encoded).toEqual(new Uint8Array([0x20, 0x08, 0x00]));
  });
});
