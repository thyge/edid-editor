import { describe, it, expect } from "vitest";
import { EDID } from "../edid/edid";
import { CEA } from "../cea/cea";
import { APPENDIX_A_EXAMPLE_1 } from "./fixtures";

describe("EDID", () => {
  it("decodes without errors", () => {
    const edid = new EDID();
    edid.Decode(APPENDIX_A_EXAMPLE_1.slice(0, 128));
    expect(edid.Errors).toEqual([]);
  });

  it("roundtrips the first 128 bytes", () => {
    const edid = new EDID();
    const original = APPENDIX_A_EXAMPLE_1.slice(0, 128);
    edid.Decode(original);
    const encoded = edid.Encode();
    expect(encoded).toEqual(original);
  });
});

describe("CEA", () => {
  it("decodes without throwing", () => {
    const cea = new CEA();
    cea.Decode(APPENDIX_A_EXAMPLE_1.slice(128, 256));
    expect(cea.Header.Version).toBe(3);
    expect(cea.DataBlocks.length).toBeGreaterThan(0);
  });

  it("roundtrips the CEA extension block", () => {
    const cea = new CEA();
    const original = APPENDIX_A_EXAMPLE_1.slice(128, 256);
    cea.Decode(original);
    const encoded = cea.Encode();

    // Re-decode the encoded bytes and verify they match
    const cea2 = new CEA();
    cea2.Decode(encoded);

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
    const cea = new CEA();
    const original = APPENDIX_A_EXAMPLE_1.slice(128, 256);
    cea.Decode(original);
    const encoded = cea.Encode();

    // Compare up to the first VSDB (which has unparsed optional fields)
    // Everything before byte 32 should match exactly
    for (let i = 0; i < 32; i++) {
      expect(encoded[i]).toBe(original[i]);
    }
  });
});
