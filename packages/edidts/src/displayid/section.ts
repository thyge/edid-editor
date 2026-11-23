import { decodeDisplayIdBlocks, encodeDisplayIdBlock, getDisplayIdBlockWireLength } from './blocks';
import { decodeDisplayIdBlocksV1 } from './v1-blocks';
import { checksum8, isChecksum8Valid } from '../common/checksum';
import { DisplayIdDecodeError, type DisplayIdSection } from './types';
import { clampBits } from './clamp';

const HEADER_LENGTH = 4;
const CHECKSUM_LENGTH = 1;
const MIN_SECTION_LENGTH = HEADER_LENGTH + CHECKSUM_LENGTH;
const DISPLAY_ID_2_0_VERSION_BYTE = 0x20;
const DISPLAY_ID_2_1_VERSION_BYTE = 0x21;

/**
 * DisplayID 2.0 (0x20) and 2.1 (0x21) share one data block layout: edid-decode
 * parses every section with version >= 0x20 through the same block walker
 * (parse_displayid_block / displayid_block), only checking that v1.x tags are
 * not used.
 */
function isDisplayId2xVersionByte(byte: number): boolean {
  return byte === DISPLAY_ID_2_0_VERSION_BYTE || byte === DISPLAY_ID_2_1_VERSION_BYTE;
}

/** A recognized DisplayID section version byte: v1.x (0x10–0x1F), v2.0 or v2.1. */
function isDisplayIdVersionByte(byte: number): boolean {
  return isDisplayId2xVersionByte(byte) || (byte >= 0x10 && byte < 0x20);
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

  if (isDisplayId2xVersionByte(versionByte)) {
    const decoded = decodeDisplayIdBlocks(sectionBytes, HEADER_LENGTH, totalLength - CHECKSUM_LENGTH);
    blocks = decoded.blocks;
    fillBytes = decoded.fillBytes; // v2.0: count of 0x00 fill bytes.
    // Normally all zero (a count is enough); kept verbatim when it isn't.
    fillBytesRaw = decoded.fillBytesRaw;
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
 * v1.x (0x10–0x1F), v2.0 (0x20) and v2.1 (0x21) sections are recognized. Each section's
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

/** Number of fill bytes the section carries after its last data block. */
export function getDisplayIdSectionFillLength(section: DisplayIdSection): number {
  return section.fillBytesRaw ? section.fillBytesRaw.length : section.fillBytes;
}

/**
 * True when the section's fill is plain 0x00 padding. Such fill is free space:
 * the extension encoder may shrink it to make room when the section's blocks
 * grow. Fill holding non-zero bytes (out of spec, seen in the wild) is kept
 * verbatim and never shrunk.
 */
export function isDisplayIdSectionFillElastic(section: DisplayIdSection): boolean {
  return !section.fillBytesRaw || section.fillBytesRaw.every((byte) => byte === 0);
}

/**
 * Bytes the section needs no matter how much zero fill it gets: the 4-byte
 * header, every encoded data block, any non-zero fill and the checksum. Does
 * not throw for an oversized block (that only makes the result larger).
 */
export function getDisplayIdSectionFixedLength(section: DisplayIdSection): number {
  const blockLength = section.blocks.reduce((length, block) => length + getDisplayIdBlockWireLength(block), 0);
  const fixedFill = isDisplayIdSectionFillElastic(section) ? 0 : getDisplayIdSectionFillLength(section);
  return HEADER_LENGTH + blockLength + fixedFill + CHECKSUM_LENGTH;
}

/**
 * Encode a section. `fillLength`, when given, replaces the model's zero-fill
 * count (the 0x70 extension encoder uses it to shrink zero fill when blocks
 * grow); it is ignored for non-zero fill, which is always written verbatim.
 */
export function encodeDisplayIdSection(section: DisplayIdSection, fillLength?: number): Uint8Array {
  const encodedBlocks = section.blocks.map(encodeDisplayIdBlock);
  const blockLength = encodedBlocks.reduce((length, block) => length + block.length, 0);

  // v1.x carries verbatim trailing bytes (incl. the end-marker and any
  // non-zero leftover); v2.0 carries a count of 0x00 fill.
  const fill = isDisplayIdSectionFillElastic(section)
    ? new Uint8Array(Math.max(0, fillLength ?? getDisplayIdSectionFillLength(section)))
    : section.fillBytesRaw!;
  const bytesInSection = blockLength + fill.length;

  if (bytesInSection > 0xff) {
    throw new Error(`DisplayID section payload length ${bytesInSection} exceeds 255 bytes`);
  }

  const totalLength = bytesInSection + HEADER_LENGTH + CHECKSUM_LENGTH;
  const encoded = new Uint8Array(totalLength);

  encoded[0] = clampBits(section.versionByte, 8);
  encoded[1] = bytesInSection;
  encoded[2] = clampBits(section.primaryUseCase, 8);
  encoded[3] = clampBits(section.extensionCount, 8);

  let offset = HEADER_LENGTH;
  for (const block of encodedBlocks) {
    encoded.set(block, offset);
    offset += block.length;
  }
  encoded.set(fill, offset);

  encoded[totalLength - 1] = checksum8(encoded);
  return encoded;
}
