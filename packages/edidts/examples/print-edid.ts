/**
 * edidts — print an EDID example.
 *
 * Decodes the built-in demo EDID (the same blob `src/App.vue` loads on mount)
 * into the `EEDID` data model and prints a human-readable summary, then
 * re-encodes it back to bytes to show the round-trip.
 *
 * Run from the repo root (build the library first so `dist/` is current):
 *
 *   cd packages/edidts && npm run build && cd ../..
 *   node packages/edidts/examples/print-edid.ts
 *   # or: npx tsx packages/edidts/examples/print-edid.ts
 *
 * To decode a different EDID, pass a hex string (commas/spaces ok) as the
 * first argument:
 *
 *   node packages/edidts/examples/print-edid.ts "00,FF,FF,..."
 *
 * The example imports the built bundle (`from 'edidts'` → `dist/index.js`),
 * not the source tree, so it runs under bare `node` without a TypeScript
 * loader. Rebuild after editing `src/` to see the changes here.
 */

import {
  EEDID,
  getCEAExtension,
  getDisplayIdExtension,
  isDisplayIdExtension,
  getVICDefinition,
} from 'edidts';
import type {
  CEAExtension,
  DisplayIdExtension,
  DisplayDescriptor,
  ProductNameDescriptor,
  ProductSerialDescriptor,
  AlphanumericDataDescriptor,
  DisplayRangeLimitsDescriptor,
} from 'edidts';

/** The demo EDID loaded by `src/App.vue` on mount. 256 bytes (base + one CTA-861 block). */
const DEFAULT_EDID_HEX =
  '00,FF,FF,FF,FF,FF,FF,00,34,A9,1C,D1,01,01,01,01,' +
  '00,19,01,03,80,DD,7D,78,0A,06,12,AF,51,4E,AD,24,' +
  '0B,4C,51,20,08,00,A9,C0,A9,40,90,40,01,01,01,01,' +
  '01,01,01,01,01,01,08,E8,00,30,F2,70,5A,80,B0,58,' +
  '8A,00,1C,00,74,00,00,1E,02,3A,80,18,71,38,2D,40,' +
  '58,2C,45,00,1C,00,74,00,00,1E,00,00,00,FC,00,45,' +
  '54,2D,4D,44,4E,48,4D,31,30,0A,20,20,00,00,00,FD,' +
  '00,17,79,0F,96,3C,00,0A,20,20,20,20,20,20,01,75,' +
  '02,03,41,B1,57,61,60,5F,5E,5D,66,65,64,63,62,3F,' +
  '10,1F,05,14,22,21,20,04,13,02,11,01,E3,05,E0,00,' +
  '6E,03,0C,00,10,00,38,3C,20,08,80,01,02,03,04,67,' +
  'D8,5D,C4,01,78,80,03,E2,00,FF,E2,0F,63,E3,06,0D,' +
  '01,28,3C,80,A0,70,B0,23,40,30,20,36,00,66,00,64,' +
  '00,00,1A,00,00,00,00,00,00,00,00,00,00,00,00,00,' +
  '00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,' +
  '00,00,00,00,00,00,00,00,00,00,00,00,00,00,00,5A';

/** Parse a hex string (whitespace/commas/newlines ignored) into bytes. */
function parseHexString(hex: string): Uint8Array {
  const cleaned = hex.replace(/[^0-9A-Fa-f]/g, '');
  if (cleaned.length === 0 || cleaned.length % 2 !== 0) {
    throw new Error(`Invalid hex string: ${cleaned.length} hex digits`);
  }
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Format bytes as a comma-separated hex block (16 per line), matching the EDID viewer style. */
function toHexBlock(bytes: Uint8Array): string {
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    lines.push(
      Array.from(bytes.subarray(i, i + 16))
        .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
        .join(','),
    );
  }
  return lines.join(',\n');
}

function productName(descriptors: DisplayDescriptor[]): string | undefined {
  return (descriptors.find((d) => d.tag === 0xfc) as ProductNameDescriptor | undefined)?.productName.trim();
}

function serialNumber(descriptors: DisplayDescriptor[]): string | undefined {
  return (descriptors.find((d) => d.tag === 0xff) as ProductSerialDescriptor | undefined)?.serialNumber.trim();
}

function rangeLimits(descriptors: DisplayDescriptor[]): DisplayRangeLimitsDescriptor | undefined {
  return descriptors.find((d) => d.tag === 0xfd) as DisplayRangeLimitsDescriptor | undefined;
}

function printBase(eedid: EEDID): void {
  const base = eedid.base;
  const h = base.header;
  const desc = base.displayDescriptors;

  console.log('=== EDID base block (128 bytes) ===');
  console.log(`  Version:        ${h.versionString}`);
  console.log(`  Manufacturer:   ${h.manufacturerId}${h.manufacturerName ? ` (${h.manufacturerName})` : ''}`);
  console.log(`  Product code:   0x${base.header.productCode.toString(16).padStart(4, '0').toUpperCase()} (${base.header.productCode})`);
  console.log(`  Serial number: ${base.header.serialNumber}${serialNumber(desc) ? ` — "${serialNumber(desc)}"` : ''}`);
  if (h.isModelYear) {
    console.log(`  Model year:     ${h.yearOfManufacture}`);
  } else {
    console.log(`  Made:           week ${h.weekOfManufacture}, ${h.yearOfManufacture}`);
  }

  const product = productName(desc);
  if (product) console.log(`  Product name:   ${product}`);

  const size = base.screenSize;
  if (size.type === 'absolute') {
    console.log(`  Screen size:    ${size.horizontalCm} cm × ${size.verticalCm} cm (${(size.horizontalCm / 2.54).toFixed(1)}" × ${(size.verticalCm / 2.54).toFixed(1)}")`);
  } else if (size.type === 'landscape-aspect') {
    console.log(`  Aspect ratio:   ${((size.encodedRatio + 99) / 100).toFixed(2)}:1 (landscape)`);
  } else if (size.type === 'portrait-aspect') {
    console.log(`  Aspect ratio:   ${(100 / (size.encodedRatio + 99)).toFixed(2)}:1 (portrait)`);
  }

  console.log(`  Gamma:          ${base.gamma ? base.gamma.toFixed(2) : 'n/a'}`);

  const rl = rangeLimits(desc);
  if (rl) {
    console.log(`  Range limits:   ${rl.minVerticalRate}–${rl.maxVerticalRate} Hz V, ${rl.minHorizontalRate}–${rl.maxHorizontalRate} kHz H, ${rl.maxPixelClock * 10} MHz pixel clock`);
  }

  if (base.establishedTimings.length) {
    console.log('  Established timings:');
    for (const t of base.establishedTimings) {
      console.log(`    - ${t.name} (${t.width}×${t.height}@${t.refreshRate}Hz)`);
    }
  }

  const stdTimings = base.standardTimings.filter((t) => t.isValid);
  if (stdTimings.length) {
    console.log('  Standard timings:');
    for (const t of stdTimings) {
      console.log(`    - ${t.width}×${t.height}@${t.refreshRate}Hz (${t.aspectRatio})`);
    }
  }

  if (base.detailedTimings.length) {
    console.log('  Detailed timings (DTD):');
    for (const [i, t] of base.detailedTimings.entries()) {
      console.log(
        `    [${i}] ${t.horizontalActive}×${t.verticalActive}@${t.refreshRate.toFixed(2)}Hz, ` +
          `${t.pixelClock.toFixed(2)} MHz pixel clock`,
      );
    }
  }

  for (const d of desc) {
    if (d.tag === 0xfe) {
      console.log(`  Alphanumeric data: "${(d as AlphanumericDataDescriptor).data.trim()}"`);
    }
  }

  console.log(`  Base checksum:  ${base.checksumValid ? 'valid' : 'INVALID'}`);
}

function printExtensions(eedid: EEDID): void {
  if (!eedid.extensions.length) {
    console.log('\n=== Extensions: none ===');
    return;
  }
  console.log(`\n=== Extensions (${eedid.extensions.length}) ===`);

  const cea = getCEAExtension(eedid);
  if (cea) printCEA(cea);

  for (const ext of eedid.extensions) {
    if (isDisplayIdExtension(ext)) {
      printDisplayId(ext);
    }
  }
}

function printCEA(cea: CEAExtension): void {
  console.log('\n  -- CTA-861 extension (tag 0x02) --');
  console.log(`    Revision:          ${cea.revision}`);
  console.log(`    Underscan:         ${cea.underscan}`);
  console.log(`    Basic audio:       ${cea.basicAudio}`);
  console.log(`    YCbCr 4:4:4:       ${cea.ycbcr444}`);
  console.log(`    YCbCr 4:2:2:       ${cea.ycbcr422}`);
  console.log(`    Native DTDs:       ${cea.nativeFormats}`);

  const video = cea.dataBlocks.find((b) => b.tag === 0x02);
  if (video && 'vics' in video && video.vics.length) {
    console.log('    CEA video formats (VICs):');
    for (const v of video.vics) {
      const def = getVICDefinition(v.vic);
      const name = def ? `${def.width}×${def.height}@${def.refreshRate}Hz (${def.name})` : 'unknown/reserved';
      console.log(`      - VIC ${v.vic}${v.native ? ' (native)' : ''}: ${name}`);
    }
  }

  const audio = cea.dataBlocks.find((b) => b.tag === 0x01);
  if (audio && 'descriptors' in audio) {
    console.log(`    Audio data block: ${audio.descriptors.length} format(s)`);
  }

  const vendor = cea.dataBlocks.find((b) => b.tag === 0x03);
  if (vendor) {
    console.log('    Vendor-specific data block: present (tag 0x03)');
  }

  if (cea.detailedTimings.length) {
    console.log('    CEA detailed timings:');
    for (const [i, t] of cea.detailedTimings.entries()) {
      const hTotal = t.horizontalActive + t.horizontalBlanking;
      const vTotal = t.verticalActive + t.verticalBlanking;
      const refresh = hTotal && vTotal && t.pixelClock ? (t.pixelClock * 1e6) / (hTotal * vTotal) : 0;
      console.log(
        `      [${i}] ${t.horizontalActive}×${t.verticalActive}@${refresh.toFixed(2)}Hz` +
          `${t.isNative ? ' (native)' : ''}`,
      );
    }
  }

  console.log(`    Block checksum:   ${cea.checksumValid ? 'valid' : 'INVALID'}`);
}

function printDisplayId(ext: DisplayIdExtension): void {
  const sections = ext.sections ?? [ext.section];
  console.log('\n  -- DisplayID extension (tag 0x70) --');
  console.log(`    Revision:      ${ext.revision}`);
  console.log(`    Sections:      ${sections.length}`);
  for (const [i, s] of sections.entries()) {
    console.log(`      section ${i}: version ${s.version}, ${s.blocks.length} data block(s)`);
  }
  console.log(`    Block checksum: ${ext.checksumValid ? 'valid' : 'INVALID'}`);
}

function main(): void {
  const hex = process.argv[2] ?? DEFAULT_EDID_HEX;
  const bytes = parseHexString(hex);

  console.log(`Input: ${bytes.length} bytes (${Math.floor(bytes.length / 128)} × 128-byte block(s))\n`);

  const eedid = EEDID.decode(bytes);

  printBase(eedid);
  printExtensions(eedid);

  if (eedid.checksumDiagnostics.length) {
    console.log('\n=== Checksum diagnostics ===');
    for (const d of eedid.checksumDiagnostics) console.log(`  ! ${d}`);
  } else {
    console.log('\n=== Checksums: all valid ===');
  }

  // Round-trip: re-encode the model back to bytes.
  const reencoded = EEDID.encode(eedid);
  const matches = reencoded.every((b, i) => b === bytes[i]);
  console.log(`\n=== Round-trip: ${reencoded.length} bytes, ${matches ? 'byte-identical to input ✓' : 'differs from input (canonical re-encode)'} ===`);
  if (!matches) {
    console.log(toHexBlock(reencoded));
  }
}

main();