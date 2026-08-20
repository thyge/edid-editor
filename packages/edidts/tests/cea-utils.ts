/**
 * Shared CTA-861 extension-block test builders.
 *
 * Several edidts test files constructed the same minimal `CEAExtensionBlock`
 * shell (tag 0x02, revision 3, all flags off) with slightly different
 * parameter shapes — `ceaWith`, `ceaShell`, `ceaWithDtds`, and the
 * timing-priority `ceaWith`. They are consolidated here so the shell shape is
 * defined once. Likewise the Video Data Block builders (`videoBlock`/`vdb`)
 * and the DTD factory are shared.
 */
import type { CEAExtensionBlock, CEADetailedTiming, VideoDataBlock } from '../src/cta';
import { DetailedTimingDescriptor } from '../src/common';

/** Options for {@link buildCeaExtension}. Every field is optional; sensible
 *  CEA-861 defaults are applied. `partial` is spread last so it can override
 *  any shell field (e.g. `nativeFormats`, `dtdOffset`). */
export interface BuildCeaExtensionOptions {
  dataBlocks?: CEAExtensionBlock['dataBlocks'];
  detailedTimings?: CEADetailedTiming[];
  partial?: Partial<CEAExtensionBlock>;
}

/**
 * Build a minimal CEA-861 extension shell (tag 0x02, revision 3, no flags, no
 * DTDs) with the given data blocks / detailed timings and optional overrides.
 * Equivalent to the per-file `ceaWith` / `ceaShell` / `ceaWithDtds` helpers.
 */
export function buildCeaExtension(opts: BuildCeaExtensionOptions = {}): CEAExtensionBlock {
  return {
    tag: 0x02,
    revision: 3,
    checksum: 0,
    data: new Uint8Array(0),
    dtdOffset: 0,
    underscan: false,
    basicAudio: false,
    ycbcr444: false,
    ycbcr422: false,
    nativeFormats: 0,
    dataBlocks: opts.dataBlocks ?? [],
    detailedTimings: opts.detailedTimings ?? [],
    ...opts.partial,
  };
}

/** Build a Video Data Block (tag 0x02) from an explicit VIC list. */
export function videoDataBlock(vics: Array<{ vic: number; native: boolean }>): VideoDataBlock {
  return { tag: 0x02, vics };
}

/** Build a Video Data Block with `count` sequential non-native VICs. */
export function videoBlock(count: number): VideoDataBlock {
  return videoDataBlock(
    Array.from({ length: count }, (_, i) => ({ vic: (i % 127) + 1, native: false })),
  );
}

/**
 * Build a `DetailedTimingDescriptor` with the given active resolution and pixel
 * clock and a conventional blanking budget (280 h / 45 v), matching the DTD
 * factory previously inlined in the timing-priority tests.
 */
export function makeDtd(
  horizontalActive: number,
  verticalActive: number,
  pixelClock: number,
): DetailedTimingDescriptor {
  return new DetailedTimingDescriptor({
    pixelClock,
    horizontalActive,
    horizontalBlanking: 280,
    verticalActive,
    verticalBlanking: 45,
  });
}