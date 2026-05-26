import { describe, it, expect } from "vitest";
import { ManufacturerID } from "../edid/edid-header";

describe("ManufacturerID", () => {
  it("decodes a known manufacturer ID", () => {
    // "DEL" = Dell
    const bytes = new Uint8Array([0x10, 0xac]);
    const mid = ManufacturerID.decode(bytes);
    expect(mid.ID).toBe("DEL");
  });

  it("decodes another known manufacturer ID", () => {
    // "SAM" = Samsung
    const bytes = new Uint8Array([0x4c, 0x2d]);
    const mid = ManufacturerID.decode(bytes);
    expect(mid.ID).toBe("SAM");
  });

  it("roundtrips a manufacturer ID", () => {
    const original = new ManufacturerID();
    original.ID = "ABC";

    const encoded = original.Encode();
    const decoded = ManufacturerID.decode(encoded);
    expect(decoded.ID).toBe("ABC");
  });

  it("roundtrips the Appendix A manufacturer ID", () => {
    // Appendix A: bytes 8-9 = 0x34, 0xA9 → decodes to "MEI"
    const bytes = new Uint8Array([0x34, 0xa9]);
    const mid = ManufacturerID.decode(bytes);
    expect(mid.ID).toBe("MEI");

    const encoded = mid.Encode();
    expect(encoded).toEqual(bytes);
  });

  it("handles edge case 'AAA'", () => {
    const original = new ManufacturerID();
    original.ID = "AAA";
    const encoded = original.Encode();
    const decoded = ManufacturerID.decode(encoded);
    expect(decoded.ID).toBe("AAA");
  });

  it("handles edge case 'ZZZ'", () => {
    const original = new ManufacturerID();
    original.ID = "ZZZ";
    const encoded = original.Encode();
    const decoded = ManufacturerID.decode(encoded);
    expect(decoded.ID).toBe("ZZZ");
  });

  it("looks up PNP company name", () => {
    const mid = new ManufacturerID();
    mid.ID = "DEL";
    expect(mid.GetPNPCompanyName()).toBe("DELL INC.");
  });

  it("returns Unknown for unrecognised ID", () => {
    const mid = new ManufacturerID();
    mid.ID = "XXX";
    expect(mid.GetPNPCompanyName()).toBe("Unknown");
  });
});
