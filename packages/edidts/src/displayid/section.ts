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

export function encodeDisplayIdSection(section: DisplayIdSection): Uint8Array {
  const encodedBlocks = section.blocks.map(encodeDisplayIdBlock);
  const blockLength = encodedBlocks.reduce((length, block) => length + block.length, 0);
  const fillBytes = section.fillBytes;
  const bytesInSection = blockLength + fillBytes;
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
