import { decodeDisplayIdBlocks, encodeDisplayIdBlock } from './blocks';
import { decodeDisplayIdBlocksV1 } from './v1-blocks';
import { checksum8, isChecksum8Valid } from '../common/checksum';
import { DisplayIdDecodeError, type DisplayIdSection } from './types';

const HEADER_LENGTH = 4;
const CHECKSUM_LENGTH = 1;
const MIN_SECTION_LENGTH = HEADER_LENGTH + CHECKSUM_LENGTH;
const DISPLAY_ID_2_0_VERSION_BYTE = 0x20;

/**
 * A valid DisplayID section version byte: v1.x (0x10–0x1F) or v2.0 (0x20).
 * v2.1+ (0x21+) is not handled by the v2.0 codec, so it is not recognized here
 * and a section starting with such a byte falls through to opaque at the EEDID
 * dispatcher (preserving current behavior).
 */
function isDisplayIdVersionByte(byte: number): boolean {
  return byte === DISPLAY_ID_2_0_VERSION_BYTE || (byte >= 0x10 && byte < 0x20);
}

/**
 * DisplayID v2.0 §2 — byte 0x02 "display product primary use case" (base
 * section only; extension sections are 0x00). Values 0x0–0x8 are defined;
 * 0x9–0xF reserved. Source: docs/planning/displayid-v2-spec-breakdown/02-displayid-structure.md
 */
export const DISPLAY_ID_PRIMARY_USE_CASES: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0x0, label: '0x0 — Extension inherits base use case' },
  { value: 0x1, label: '0x1 — Test structure' },
  { value: 0x2, label: '0x2 — Generic display' },
  { value: 0x3, label: '0x3 — Television display' },
  { value: 0x4, label: '0x4 — Desktop productivity display' },
  { value: 0x5, label: '0x5 — Desktop gaming display' },
  { value: 0x6, label: '0x6 — Presentation display' },
  { value: 0x7, label: '0x7 — Head-mounted VR display' },
  { value: 0x8, label: '0x8 — Head-mounted AR display' },
];

export const DISPLAY_ID_RESERVED_USE_CASES: ReadonlyArray<{ value: number; label: string }> = [
  { value: 0x9, label: '0x9 — Reserved' },
  { value: 0xa, label: '0xA — Reserved' },
  { value: 0xb, label: '0xB — Reserved' },
  { value: 0xc, label: '0xC — Reserved' },
  { value: 0xd, label: '0xD — Reserved' },
  { value: 0xe, label: '0xE — Reserved' },
  { value: 0xf, label: '0xF — Reserved' },
];

export function decodeDisplayIdSection(data: Uint8Array): DisplayIdSection {
  if (data.length < MIN_SECTION_LENGTH) {
    throw new DisplayIdDecodeError(
      `DisplayID section requires at least ${MIN_SECTION_LENGTH} bytes but only ${data.length} bytes are available`,
    );
  }

  const versionByte = data[0];
  const bytesInSection = data[1];
  const totalLength = bytesInSection + HEADER_LENGTH + CHECKSUM_LENGTH;

  if (data.length < totalLength) {
    throw new DisplayIdDecodeError(
      `DisplayID section declares ${totalLength} bytes but only ${data.length} bytes are available`,
    );
  }

  const sectionBytes = data.slice(0, totalLength);
  const isChecksumValid = isChecksum8Valid(sectionBytes);

  const version = versionByte >> 4;
  let blocks;
  let fillBytes: number;
  let fillBytesRaw: Uint8Array | undefined;

  if (versionByte === DISPLAY_ID_2_0_VERSION_BYTE) {
    const decoded = decodeDisplayIdBlocks(sectionBytes, HEADER_LENGTH, totalLength - CHECKSUM_LENGTH);
    blocks = decoded.blocks;
    fillBytes = decoded.fillBytes; // v2.0: count of 0x00 fill bytes.
    fillBytesRaw = undefined;
  } else if (version === 1) {
    const decoded = decodeDisplayIdBlocksV1(sectionBytes, HEADER_LENGTH, totalLength - CHECKSUM_LENGTH);
    blocks = decoded.blocks;
    fillBytesRaw = decoded.fillBytesRaw; // v1.x: verbatim trailing bytes.
    fillBytes = fillBytesRaw.length;
  } else {
    throw new DisplayIdDecodeError(
      `DisplayID section version byte 0x${versionByte.toString(16).padStart(2, '0')} is not a recognized DisplayID version`,
    );
  }

  return {
    version,
    revision: versionByte & 0x0f,
    versionByte,
    bytesInSection,
    totalLength,
    primaryUseCase: sectionBytes[2],
    extensionCount: sectionBytes[3],
    blocks,
    fillBytes,
    fillBytesRaw,
    checksum: sectionBytes[totalLength - 1],
    isChecksumValid,
  };
}

/**
 * Walk a byte buffer containing one or more concatenated DisplayID sections
 * and decode every section whose version byte appears at a section boundary.
 *
 * Both v1.x (0x10–0x1F) and v2.0 (0x20) sections are recognized. Each section's
 * total length is `bytesInSection + 5` (4-byte header + 1-byte trailing
 * checksum); after decoding one section we advance by `section.totalLength`
 * and look for the next version byte.
 *
 * Trailing fill bytes inside the EDID block are 0x00, so the walk stops
 * naturally when the next byte is no longer a section version byte. If a later
 * section is malformed, the error is swallowed and the sections decoded so
 * far are returned (so a single bad trailing section does not collapse the
 * whole extension into opaque bytes). Returns at least one section for valid
 * input; an empty array signals "no DisplayID section starts here".
 */
export function decodeDisplayIdSections(data: Uint8Array): DisplayIdSection[] {
  const sections: DisplayIdSection[] = [];
  let offset = 0;

  while (
    offset + MIN_SECTION_LENGTH <= data.length &&
    isDisplayIdVersionByte(data[offset])
  ) {
    let section: DisplayIdSection;
    try {
      section = decodeDisplayIdSection(data.subarray(offset));
    } catch {
      // A trailing section is malformed: keep what we have rather than
      // throwing the whole extension into opaque.
      break;
    }
    sections.push(section);
    offset += section.totalLength;
  }

  return sections;
}

export function encodeDisplayIdSection(section: DisplayIdSection): Uint8Array {
  const encodedBlocks = section.blocks.map(encodeDisplayIdBlock);
  const blockLength = encodedBlocks.reduce((length, block) => length + block.length, 0);

  // v1.x carries verbatim trailing bytes (incl. the end-marker and any
  // non-zero leftover); v2.0 carries a count of 0x00 fill.
  const fillRaw = section.fillBytesRaw;
  const fillCount = fillRaw ? fillRaw.length : section.fillBytes;
  const bytesInSection = blockLength + fillCount;

  if (bytesInSection > 0xff) {
    throw new Error(`DisplayID section payload length ${bytesInSection} exceeds 255 bytes`);
  }

  const totalLength = bytesInSection + HEADER_LENGTH + CHECKSUM_LENGTH;
  const encoded = new Uint8Array(totalLength);

  encoded[0] = section.versionByte;
  encoded[1] = bytesInSection & 0xff;
  encoded[2] = section.primaryUseCase & 0xff;
  encoded[3] = section.extensionCount & 0xff;

  let offset = HEADER_LENGTH;
  for (const block of encodedBlocks) {
    encoded.set(block, offset);
    offset += block.length;
  }
  if (fillRaw && fillRaw.length > 0) {
    encoded.set(fillRaw, offset);
  }

  encoded[totalLength - 1] = checksum8(encoded);
  return encoded;
}