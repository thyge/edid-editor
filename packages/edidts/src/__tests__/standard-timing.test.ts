import { describe, it, expect } from "vitest";
import { StandardTiming, AspectRatio } from "../edid/standard-timing";
import { EdidVersion } from "../edid/feature-support";

describe("StandardTiming", () => {
  it("decodes an unused slot (0x01, 0x01) as disabled", () => {
    const st = StandardTiming.decode(new Uint8Array([0x01, 0x01]));
    expect(st.Enabled).toBe(false);
  });

  it("decodes a valid standard timing", () => {
    // Horizontal = (0x50 + 31) * 8 = 111 * 8 = 888
    // Aspect ratio = 16:9 (case 3), Refresh = 0x3f + 60 = 63 + 60 = 123
    const st = StandardTiming.decode(new Uint8Array([0x50, 0xff]));
    expect(st.Enabled).toBe(true);
    expect(st.HorizontalActive).toBe(888);
    expect(st.AspectRatio).toBe(AspectRatio.SixteenNine);
    expect(st.RefreshRate).toBe(123);
  });

  it("decodes aspect ratio based on EDID version", () => {
    // Byte 1 upper 2 bits = 00
    const stPre13 = StandardTiming.decode(new Uint8Array([0x00, 0x00]), EdidVersion.Pre13);
    expect(stPre13.AspectRatio).toBe(AspectRatio.OneOne);

    const stV14 = StandardTiming.decode(new Uint8Array([0x00, 0x00]), EdidVersion.V14);
    expect(stV14.AspectRatio).toBe(AspectRatio.SixteenTen);
  });

  it("roundtrips a standard timing", () => {
    const original = new StandardTiming();
    original.Enabled = true;
    original.HorizontalActive = 1920;
    original.AspectRatio = AspectRatio.SixteenNine;
    original.RefreshRate = 60;

    const encoded = original.Encode();
    const decoded = StandardTiming.decode(encoded);
    expect(decoded.Enabled).toBe(true);
    expect(decoded.HorizontalActive).toBe(1920);
    expect(decoded.AspectRatio).toBe(AspectRatio.SixteenNine);
    expect(decoded.RefreshRate).toBe(60);
  });

  it("roundtrips all aspect ratios", () => {
    const ratios = [
      AspectRatio.SixteenTen,
      AspectRatio.FourThree,
      AspectRatio.FiveFour,
      AspectRatio.SixteenNine,
    ];
    for (const ratio of ratios) {
      const original = new StandardTiming();
      original.Enabled = true;
      original.HorizontalActive = 1280;
      original.AspectRatio = ratio;
      original.RefreshRate = 60;

      const encoded = original.Encode();
      const decoded = StandardTiming.decode(encoded);
      expect(decoded.AspectRatio).toBe(ratio);
    }
  });

  it("roundtrips minimum horizontal active", () => {
    const original = new StandardTiming();
    original.Enabled = true;
    original.HorizontalActive = 248; // (0 + 31) * 8 = 248, minimum representable
    original.AspectRatio = AspectRatio.FourThree;
    original.RefreshRate = 60;

    const encoded = original.Encode();
    const decoded = StandardTiming.decode(encoded);
    expect(decoded.HorizontalActive).toBe(248);
  });

  it("roundtrips maximum horizontal active", () => {
    const original = new StandardTiming();
    original.Enabled = true;
    original.HorizontalActive = 2288; // (255 + 31) * 8 = 2288
    original.AspectRatio = AspectRatio.FourThree;
    original.RefreshRate = 123;

    const encoded = original.Encode();
    const decoded = StandardTiming.decode(encoded);
    expect(decoded.HorizontalActive).toBe(2288);
  });

  it("roundtrips edge refresh rates", () => {
    const original = new StandardTiming();
    original.Enabled = true;
    original.HorizontalActive = 640;
    original.AspectRatio = AspectRatio.FourThree;
    original.RefreshRate = 60; // min valid

    const encoded = original.Encode();
    const decoded = StandardTiming.decode(encoded);
    expect(decoded.RefreshRate).toBe(60);

    original.RefreshRate = 123; // max valid (63 + 60)
    const encoded2 = original.Encode();
    const decoded2 = StandardTiming.decode(encoded2);
    expect(decoded2.RefreshRate).toBe(123);
  });

  it("roundtrips disabled timing", () => {
    const original = new StandardTiming();
    original.Enabled = false;

    const encoded = original.Encode();
    expect(encoded[0]).toBe(1);
    expect(encoded[1]).toBe(1);
    const decoded = StandardTiming.decode(encoded);
    expect(decoded.Enabled).toBe(false);
  });

  it("handles non-multiple-of-8 horizontal active by truncation", () => {
    // This is a spec edge case: horizontal active must be representable as (byte0 + 31) * 8
    // If the user sets 255, the encode should round to the nearest valid value
    const original = new StandardTiming();
    original.Enabled = true;
    original.HorizontalActive = 255; // not divisible by 8
    original.AspectRatio = AspectRatio.FourThree;
    original.RefreshRate = 60;

    const encoded = original.Encode();
    const decoded = StandardTiming.decode(encoded);
    // 255 / 8 = 31.875 → byte0 = 0.875 → truncated to 0 → (0+31)*8 = 248
    expect(decoded.HorizontalActive).toBe(248);
  });
});
