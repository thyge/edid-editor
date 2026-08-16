import { decodeDisplayIdBlocks, encodeDisplayIdBlock } from './blocks';
import { checksum8, isChecksum8Valid } from '../common/checksum';
import { DisplayIdDecodeError, type DisplayIdSection } from './types';

const HEADER_LENGTH = 4;
const CHECKSUM_LENGTH = 1;
const MIN_SECTION_LENGTH = HEADER_LENGTH + CHECKSUM_LENGTH;
const DISPLAY_ID_2_0_VERSION_BYTE = 0x20;

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

  if (versionByte !== DISPLAY_ID_2_0_VERSION_BYTE) {
    throw new DisplayIdDecodeError(
      `DisplayID section version byte 0x${versionByte.toString(16).padStart(2, '0')} is not v2.0`,
    );
  }

  const decodedBlocks = decodeDisplayIdBlocks(sectionBytes, HEADER_LENGTH, totalLength - CHECKSUM_LENGTH);

  return {
    version: versionByte >> 4,
    revision: versionByte & 0x0f,
    versionByte,
    bytesInSection,
    totalLength,
    primaryUseCase: sectionBytes[2],
    extensionCount: sectionBytes[3],
    blocks: decodedBlocks.blocks,
    fillBytes: decodedBlocks.fillBytes,
    checksum: sectionBytes[totalLength - 1],
    isChecksumValid,
  };
}

/**
 * Walk a byte buffer containing one or more concatenated DisplayID 2.0
 * sections and decode every section whose version byte (0x20) appears at a
 * section boundary.
 *
 * The DisplayID 2.0 spec allows a single EDID `0x70` extension block to carry
 * multiple chained sections when the base section's `extensionCount` (byte 3
 * of the section) is greater than zero. Each section's total length is
 * `bytesInSection + 5` (4-byte header + 1-byte trailing checksum), so after
 * decoding one section we advance by `section.totalLength` and look for the
 * next `0x20` version byte.
 *
 * Trailing fill bytes inside the EDID block are `0x00`, so the walk stops
 * naturally when the next byte is no longer a section version byte. If a
 * later section is malformed, the error is swallowed and the sections decoded
 * so far are returned (so a single bad trailing section does not collapse the
 * whole extension into opaque bytes). Returns at least one section for valid
 * input; an empty array signals "no DisplayID section starts here".
 */
export function decodeDisplayIdSections(data: Uint8Array): DisplayIdSection[] {
  const sections: DisplayIdSection[] = [];
  let offset = 0;

  while (
    offset + MIN_SECTION_LENGTH <= data.length &&
    data[offset] === DISPLAY_ID_2_0_VERSION_BYTE
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
  const fillBytes = section.fillBytes;
  const bytesInSection = blockLength + fillBytes;

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

  encoded[totalLength - 1] = checksum8(encoded);
  return encoded;
}
