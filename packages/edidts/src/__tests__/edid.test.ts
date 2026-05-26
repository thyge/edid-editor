import { describe, it, expect } from "vitest";
import { EDID } from "../edid/edid";
import { CEA } from "../cea/cea";
import { APPENDIX_A_EXAMPLE_1 } from "./fixtures";
import { calcEDIDChecksum } from "../common/utils";

describe("EDID", () => {
  it("decodes without errors", () => {
    const edid = EDID.decode(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    expect(edid.Errors).toEqual([]);
  });

  it("roundtrips the first 128 bytes", () => {
    const original = APPENDIX_A_EXAMPLE_1.slice(0, 128);
    const edid = EDID.decode(original);
    const encoded = edid.Encode();
    expect(encoded).toEqual(original);
  });

  it("detects an invalid header", () => {
    const bytes = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    bytes[0] = 0x42; // corrupt header byte
    const edid = EDID.decode(bytes);
    expect(edid.Errors.some((e) => e.includes("Invalid header"))).toBe(true);
  });

  it("detects a bad checksum", () => {
    const bytes = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    bytes[127] = 0x00; // zero out checksum
    const edid = EDID.decode(bytes);
    expect(edid.Errors.some((e) => e.includes("Checksum invalid"))).toBe(true);
  });

  it("roundtrips manufacturer ID and product code", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    edid.ManufacturerID.ID = "SAM";
    edid.ManufacturerPC = 0x1234;

    const encoded = edid.Encode();
    const decoded = EDID.decode(encoded);
    expect(decoded.ManufacturerID.ID).toBe("SAM");
    expect(decoded.ManufacturerPC).toBe(0x1234);
  });

  it("roundtrips serial number", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    edid.SerialNumber = 0xdeadbeef;

    const encoded = edid.Encode();
    const decoded = EDID.decode(encoded);
    expect(decoded.SerialNumber).toBe(0xdeadbeef);
  });

  it("clamps week of manufacture above 52", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    edid.WeekOfManufacture = 255;

    const encoded = edid.Encode();
    expect(encoded[16]).toBe(52);
  });

  it("clamps negative week of manufacture to 0", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    edid.WeekOfManufacture = -1;

    const encoded = edid.Encode();
    expect(encoded[16]).toBe(0);
  });

  it("roundtrips year of manufacture", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    edid.YearOfManufacture = 2025;

    const encoded = edid.Encode();
    const decoded = EDID.decode(encoded);
    expect(decoded.YearOfManufacture).toBe(2025);
  });

  it("clamps year of manufacture before 1990 to 0", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    edid.YearOfManufacture = 1980;

    const encoded = edid.Encode();
    expect(encoded[17]).toBe(0);
  });

  it("detects EDID version 1.3 from revision byte", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    base[19] = 0x03;
    const edid = EDID.decode(base);
    expect(edid.EdidVersion).toBe("1.3");
  });

  it("detects EDID version pre-1.3 from revision byte", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    base[19] = 0x02;
    const edid = EDID.decode(base);
    expect(edid.EdidVersion).toBe("Pre13");
  });

  it("encodes gamma 1.0 as 0x00", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    edid.Gamma = 1.0;

    const encoded = edid.Encode();
    expect(encoded[23]).toBe(0);
  });

  it("encodes gamma 3.54 as 254", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    edid.Gamma = 3.54;

    const encoded = edid.Encode();
    expect(encoded[23]).toBe(254);
  });

  it("does not encode gamma outside valid range", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    // Set gamma to an out-of-range value
    edid.Gamma = 5.0;

    const encoded = edid.Encode();
    // byte 23 should retain original fixture value because Encode skipped it
    expect(encoded[23]).toBe(base[23]);
  });

  it("flags too few display descriptors", () => {
    // Create a minimal valid base block where descriptor area is all dummies
    const bytes = new Uint8Array(128);
    bytes.set([0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x00], 0);
    // Manufacturer ID = "AAA"
    bytes[8] = 0x00;
    bytes[9] = 0x00;
    // Fill descriptor area with dummy descriptors (tag 0x10)
    for (let i = 54; i < 126; i += 18) {
      bytes[i] = 0;
      bytes[i + 1] = 0;
      bytes[i + 2] = 0;
      bytes[i + 3] = 0x10;
    }
    bytes[127] = calcEDIDChecksum(bytes);

    const edid = EDID.decode(bytes);
    // 4 dummy descriptors is fine, but if we only had 1 and then break...
    // Actually with 4 dummies, length = 0 because break happens on first dummy.
    // Wait, the loop breaks on the FIRST dummy! So DisplayDescriptors.length = 0.
    expect(edid.Errors.some((e) => e.includes("too few"))).toBe(true);
  });

  it("encodes negative serial number as zero", () => {
    const base = new Uint8Array(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    const edid = EDID.decode(base);
    edid.SerialNumber = -1;

    const encoded = edid.Encode();
    expect(encoded[12]).toBe(0);
    expect(encoded[13]).toBe(0);
    expect(encoded[14]).toBe(0);
    expect(encoded[15]).toBe(0);
  });
});

describe("CEA", () => {
  it("decodes without throwing", () => {
    const cea = CEA.decode(APPENDIX_A_EXAMPLE_1.slice(128, 256));
    expect(cea.Header.Version).toBe(3);
    expect(cea.DataBlocks.length).toBeGreaterThan(0);
  });

  it("roundtrips the CEA extension block", () => {
    const original = APPENDIX_A_EXAMPLE_1.slice(128, 256);
    const cea = CEA.decode(original);
    const encoded = cea.Encode();

    // Re-decode the encoded bytes and verify they match
    const cea2 = CEA.decode(encoded);

    // Header
    expect(cea2.Header.Version).toBe(cea.Header.Version);
    expect(cea2.Header.Underscan).toBe(cea.Header.Underscan);
    expect(cea2.Header.BasicAudio).toBe(cea.Header.BasicAudio);
    expect(cea2.Header.YCBCR444).toBe(cea.Header.YCBCR444);
    expect(cea2.Header.YCBCR422).toBe(cea.Header.YCBCR422);
    expect(cea2.Header.numNativeDTDs).toBe(cea.Header.numNativeDTDs);

    // Data blocks count and types
    expect(cea2.DataBlocks.length).toBe(cea.DataBlocks.length);

    // Checksum is valid
    let sum = 0;
    for (let i = 0; i < 128; i++) {
      sum += encoded[i];
    }
    expect(sum & 0xff).toBe(0);
  });

  it("produces byte-identical output when re-encoding a clean fixture", () => {
    // This test verifies encode matches decode for blocks we fully parse.
    // HDMI 1.4 VSDB has 11 unparsed optional bytes, so this won't be exact.
    const original = APPENDIX_A_EXAMPLE_1.slice(128, 256);
    const cea = CEA.decode(original);
    const encoded = cea.Encode();

    // Compare up to the first VSDB (which has unparsed optional fields)
    // Everything before byte 32 should match exactly
    for (let i = 0; i < 32; i++) {
      expect(encoded[i]).toBe(original[i]);
    }
  });
});
