import { describe, it, expect } from "vitest";
import { EDID } from "../edid/edid";
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
