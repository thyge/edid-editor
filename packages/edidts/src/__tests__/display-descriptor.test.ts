import { describe, it, expect } from "vitest";
import {
  DisplayRangeLimits,
  ColorPointData,
  DisplayColorManagement,
  DummyDesciptor,
  DisplayProductName,
  DisplayProductSerialNumber,
  AlphanumericDataString,
  StandardTimingIdentification,
  CVT3ByteCodes,
  CVT3ByteCodeDescriptor,
  EstablishedTimingsIII,
  DescriptorType,
  DecodeDesciptor,
} from "../edid/display-descriptor";
import { StandardTiming, AspectRatio } from "../edid/standard-timing";

describe("DisplayRangeLimits", () => {
  it("roundtrips basic range limits", () => {
    const original = new DisplayRangeLimits();
    original.MinimumVerticalRate = 50;
    original.MaximumVerticalRate = 75;
    original.MinimumHorizontalRate = 30;
    original.MaximumHorizontalRate = 80;
    original.MaximumPixelClockMHz = 170;
    original.VideoTimingSupport = "DefaultGTF";

    const encoded = original.Encode();
    const decoded = DisplayRangeLimits.decode(encoded);
    expect(decoded.MinimumVerticalRate).toBe(50);
    expect(decoded.MaximumVerticalRate).toBe(75);
    expect(decoded.MinimumHorizontalRate).toBe(30);
    expect(decoded.MaximumHorizontalRate).toBe(80);
    expect(decoded.MaximumPixelClockMHz).toBe(170);
    expect(decoded.VideoTimingSupport).toBe("DefaultGTF");
  });

  it("roundtrips range limits with values over 255 using offset flags", () => {
    const original = new DisplayRangeLimits();
    original.MinimumVerticalRate = 300;
    original.MaximumVerticalRate = 400;
    original.MinimumHorizontalRate = 300;
    original.MaximumHorizontalRate = 400;
    original.MaximumPixelClockMHz = 2550;

    const encoded = original.Encode();
    const decoded = DisplayRangeLimits.decode(encoded);
    expect(decoded.MinimumVerticalRate).toBe(300);
    expect(decoded.MaximumVerticalRate).toBe(400);
    expect(decoded.MinimumHorizontalRate).toBe(300);
    expect(decoded.MaximumHorizontalRate).toBe(400);
    expect(decoded.MaximumPixelClockMHz).toBe(2550);
  });

  it("roundtrips CVT support", () => {
    const original = new DisplayRangeLimits();
    original.MinimumVerticalRate = 50;
    original.MaximumVerticalRate = 75;
    original.MinimumHorizontalRate = 30;
    original.MaximumHorizontalRate = 80;
    original.MaximumPixelClockMHz = 150;
    original.VideoTimingSupport = "CVTSupported";
    original.CVTSupportDefinition.PrecisionPixelClock = 150;
    original.CVTSupportDefinition.MaximumActivePixels = 128; // keep < 256 so lowBits = 0
    original.CVTSupportDefinition.PreferredAspectRatio = "16:9";
    original.CVTSupportDefinition.CVTReducedBlanking = true;

    const encoded = original.Encode();
    const decoded = DisplayRangeLimits.decode(encoded);
    expect(decoded.VideoTimingSupport).toBe("CVTSupported");
    expect(decoded.CVTSupportDefinition.PrecisionPixelClock).toBe(150);
    expect(decoded.CVTSupportDefinition.MaximumActivePixels).toBe(128);
    expect(decoded.CVTSupportDefinition.PreferredAspectRatio).toBe("16:9");
    expect(decoded.CVTSupportDefinition.CVTReducedBlanking).toBe(true);
  });

  it("roundtrips edge case rate of 1 Hz", () => {
    // Minimum rate + 1 = 1, offset flag = 0
    const original = new DisplayRangeLimits();
    original.MinimumVerticalRate = 1;
    original.MaximumVerticalRate = 1;
    original.MinimumHorizontalRate = 1;
    original.MaximumHorizontalRate = 1;

    const encoded = original.Encode();
    const decoded = DisplayRangeLimits.decode(encoded);
    expect(decoded.MinimumVerticalRate).toBe(1);
    expect(decoded.MaximumVerticalRate).toBe(1);
    expect(decoded.MinimumHorizontalRate).toBe(1);
    expect(decoded.MaximumHorizontalRate).toBe(1);
  });

  it("roundtrips maximum rate 511 Hz", () => {
    // Max with offset: 255 + 256 = 511
    const original = new DisplayRangeLimits();
    original.MinimumVerticalRate = 511;
    original.MaximumVerticalRate = 511;
    original.MinimumHorizontalRate = 511;
    original.MaximumHorizontalRate = 511;

    const encoded = original.Encode();
    const decoded = DisplayRangeLimits.decode(encoded);
    expect(decoded.MinimumVerticalRate).toBe(511);
    expect(decoded.MaximumVerticalRate).toBe(511);
    expect(decoded.MinimumHorizontalRate).toBe(511);
    expect(decoded.MaximumHorizontalRate).toBe(511);
  });
});

describe("ColorPointData", () => {
  it("roundtrips color point data", () => {
    const original = new ColorPointData();
    // WhitePoints not directly settable, but decode/encode roundtrips raw bytes
    const bytes = new Uint8Array(18);
    bytes[3] = 0xfb;
    bytes[5] = 0x01; // white point index 1
    bytes[6] = 0x80; // white x MSB
    bytes[7] = 0x40; // white x LSB bits
    bytes[8] = 0x20; // white y MSB
    bytes[9] = 0x10; // white y LSB bits
    bytes[10] = 0x02; // white point index 2
    bytes[11] = 0x00;
    bytes[12] = 0x00;
    bytes[13] = 0x00;
    bytes[14] = 0x00;

    const decoded = ColorPointData.decode(bytes);
    expect(decoded.WhitePoints.length).toBe(2);
    expect(decoded.WhitePoints[0].WhitePointIndex).toBe(1);

    const encoded = decoded.Encode();
    expect(encoded[3]).toBe(0xfb);
  });
});

describe("DisplayColorManagement", () => {
  it("roundtrips DCM coefficients", () => {
    const original = new DisplayColorManagement();
    original.Version = 3;
    original.Red_a3 = 0x1234;
    original.Red_a2 = 0x5678;
    original.Green_a3 = 0x9ABC;
    original.Green_a2 = 0xDEF0;
    original.Blue_a3 = 0x0F0F;
    original.Blue_a2 = 0xF0F0;

    const encoded = original.Encode();
    const decoded = DisplayColorManagement.decode(encoded);
    expect(decoded.Version).toBe(3);
    expect(decoded.Red_a3).toBe(0x1234);
    expect(decoded.Red_a2).toBe(0x5678);
    expect(decoded.Green_a3).toBe(0x9ABC);
    expect(decoded.Green_a2).toBe(0xDEF0);
    expect(decoded.Blue_a3).toBe(0x0F0F);
    expect(decoded.Blue_a2).toBe(0xF0F0);
  });
});

describe("DummyDesciptor", () => {
  it("roundtrips a dummy descriptor", () => {
    const original = new DummyDesciptor();
    const encoded = original.Encode();
    expect(encoded[3]).toBe(0x10);
    const decoded = DummyDesciptor.decode(encoded);
    expect(decoded.Type).toBe(DescriptorType.Dummy);
  });
});

describe("ASCIIDescriptor", () => {
  it("roundtrips display product name", () => {
    const original = new DisplayProductName();
    original.text = "Test Display";

    const encoded = original.Encode();
    const decoded = DisplayProductName.decode(encoded);
    expect(decoded.text).toBe("Test Display");
    expect(decoded.Type).toBe(DescriptorType.DisplayProductName);
  });

  it("roundtrips serial number", () => {
    const original = new DisplayProductSerialNumber();
    original.text = "SN12345";

    const encoded = original.Encode();
    const decoded = DisplayProductSerialNumber.decode(encoded);
    expect(decoded.text).toBe("SN12345");
    expect(decoded.Type).toBe(DescriptorType.DisplayProductSerialNumber);
  });

  it("roundtrips alphanumeric data", () => {
    const original = new AlphanumericDataString();
    original.text = "Model X";

    const encoded = original.Encode();
    const decoded = AlphanumericDataString.decode(encoded);
    expect(decoded.text).toBe("Model X");
    expect(decoded.Type).toBe(DescriptorType.AlphanumericDataString);
  });

  it("truncates text longer than 13 characters", () => {
    const original = new DisplayProductName();
    original.text = "This is a very long display name";

    const encoded = original.Encode();
    const decoded = DisplayProductName.decode(encoded);
    // The text field holds 13 bytes max; long text is truncated
    expect(decoded.text.replace(/\0/g, "").trim().length).toBeLessThanOrEqual(13);
  });
});

describe("StandardTimingIdentification", () => {
  it("roundtrips standard timing identification", () => {
    const original = new StandardTimingIdentification();
    const t1 = new StandardTiming();
    t1.Enabled = true;
    t1.HorizontalActive = 1920;
    t1.AspectRatio = AspectRatio.SixteenNine;
    t1.RefreshRate = 60;
    original.timings.push(t1);

    const encoded = original.Encode();
    const decoded = StandardTimingIdentification.decode(encoded);
    expect(decoded.timings[0].HorizontalActive).toBe(1920);
    expect(decoded.timings[0].AspectRatio).toBe("16:9");
    expect(decoded.timings[0].RefreshRate).toBe(60);
  });
});

describe("CVT3ByteCodes", () => {
  it("roundtrips CVT 3-byte codes", () => {
    const original = new CVT3ByteCodes();
    original.Version = 1;
    const desc = new CVT3ByteCodeDescriptor();
    desc.AddressableLines = 1080;
    desc.AspectRatio = AspectRatio.SixteenNine;
    desc.PreferredRefreshRate = 60;
    desc.Supports50Hz = true;
    desc.Supports60Hz = true;
    original.Descriptors.push(desc);

    const encoded = original.Encode();
    const decoded = CVT3ByteCodes.decode(encoded);
    expect(decoded.Version).toBe(1);
    expect(decoded.Descriptors[0].AddressableLines).toBe(1080);
    expect(decoded.Descriptors[0].AspectRatio).toBe("16:9");
    expect(decoded.Descriptors[0].PreferredRefreshRate).toBe(60);
    expect(decoded.Descriptors[0].Supports50Hz).toBe(true);
    expect(decoded.Descriptors[0].Supports60Hz).toBe(true);
  });
});

describe("EstablishedTimingsIII", () => {
  it("roundtrips established timings III", () => {
    const original = new EstablishedTimingsIII();
    const timings = new Uint8Array(12);
    timings[0] = 0xff;
    timings[11] = 0xaa;
    original.Timings = timings;

    const encoded = original.Encode();
    const decoded = EstablishedTimingsIII.decode(encoded);
    expect(decoded.Timings[0]).toBe(0xff);
    expect(decoded.Timings[11]).toBe(0xaa);
  });
});

describe("DecodeDesciptor factory", () => {
  it("routes to correct descriptor type by tag byte", () => {
    const dummy = new Uint8Array(18);
    dummy[3] = 0x10;
    expect(DecodeDesciptor(dummy)?.Type).toBe(DescriptorType.Dummy);

    const name = new Uint8Array(18);
    name[3] = 0xfc;
    name[5] = 0x41; // 'A'
    expect(DecodeDesciptor(name)?.Type).toBe(DescriptorType.DisplayProductName);

    const serial = new Uint8Array(18);
    serial[3] = 0xff;
    expect(DecodeDesciptor(serial)?.Type).toBe(DescriptorType.DisplayProductSerialNumber);

    const range = new Uint8Array(18);
    range[3] = 0xfd;
    expect(DecodeDesciptor(range)?.Type).toBe(DescriptorType.DisplayRangeLimits);

    const unknown = new Uint8Array(18);
    unknown[3] = 0x42;
    expect(DecodeDesciptor(unknown)).toBeNull();
  });
});
