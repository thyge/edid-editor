/**
 * CEA data-block default-value factory.
 *
 * Constructs the empty/default `CEADataBlock` literals the editor pushes when
 * a user adds a new CTA-861 data block. The enum-keyed defaults (speaker
 * allocation mask, colorimetry flags, EOTF flags) are derived from the lib's
 * own label maps so there is a single source of truth for the field key set —
 * adding a bit to `SPEAKER_ALLOCATION_BITS` / `COLORIMETRY_FLAGS` / `EOTF_FLAGS`
 * automatically flows into the default block here.
 */

import type { CEADataBlock, SpeakerAllocationBlock } from './extension-block';
import { SPEAKER_ALLOCATION_BITS, COLORIMETRY_FLAGS, EOTF_FLAGS } from './cta-extended-blocks';

/** Discriminator identifying which CEA data block to construct. */
export type CEADefaultBlockType =
  | 'video'
  | 'audio'
  | 'speakers'
  | 'video-capability'
  | 'colorimetry'
  | 'hdr-static'
  | 'video-format-preference'
  | 'vendor-audio'
  | 'room-config'
  | 'speaker-location'
  | 'infoframe'
  | 'vesa-transfer';

/** Default SADB speaker mask: FL/FR on, every other bit off. */
function defaultSpeakers(): SpeakerAllocationBlock['speakers'] {
  const speakers = {} as SpeakerAllocationBlock['speakers'];
  for (const bit of SPEAKER_ALLOCATION_BITS) {
    speakers[bit.key] = bit.key === 'frontLeftRight';
  }
  return speakers;
}

/** Default Colorimetry block: every flag off. */
function defaultColorimetry(): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  for (const f of COLORIMETRY_FLAGS) flags[f.key] = false;
  return flags;
}

/** Default HDR Static Metadata EOTF mask: every flag off. */
function defaultEotf(): Record<string, boolean> {
  const eotf: Record<string, boolean> = {};
  for (const f of EOTF_FLAGS) eotf[f.key] = false;
  return eotf;
}

/**
 * Build a default CEA data block for the given type, ready to push onto
 * `CEAExtensionBlock.dataBlocks`. Returns `undefined` for an unknown type so
 * callers can no-op on unrecognised discriminator values.
 */
export function createDefaultCEADataBlock(type: CEADefaultBlockType): CEADataBlock | undefined {
  const empty = new Uint8Array(0);
  switch (type) {
    case 'video':
      return { tag: 0x02, payload: empty, vics: [] } as unknown as CEADataBlock;
    case 'audio':
      return { tag: 0x01, payload: empty, descriptors: [] } as unknown as CEADataBlock;
    case 'speakers':
      return {
        tag: 0x04,
        payload: empty,
        speakers: defaultSpeakers(),
        trailing: new Uint8Array(),
      } as unknown as CEADataBlock;
    case 'video-capability':
      return {
        tag: 0x07,
        extendedTag: 0x00,
        payload: empty,
        ceVideoScanBehavior: 'not_supported',
        itVideoScanBehavior: 'not_supported',
        ptVideoScanBehavior: 'not_supported',
        quantizationRangeSelectable: false,
        quantizationRangeYCC: false,
      } as unknown as CEADataBlock;
    case 'colorimetry':
      return {
        tag: 0x07,
        extendedTag: 0x05,
        payload: empty,
        ...defaultColorimetry(),
      } as unknown as CEADataBlock;
    case 'hdr-static':
      return {
        tag: 0x07,
        extendedTag: 0x06,
        payload: empty,
        eotf: defaultEotf(),
        staticMetadataType1: false,
      } as unknown as CEADataBlock;
    case 'video-format-preference':
      return {
        tag: 0x07,
        extendedTag: 0x0D,
        payload: empty,
        svrs: [],
      } as unknown as CEADataBlock;
    case 'vendor-audio':
      return {
        tag: 0x07,
        extendedTag: 0x11,
        payload: empty,
        ieeeOui: 0,
        vendorPayload: new Uint8Array(),
      } as unknown as CEADataBlock;
    case 'room-config':
      return {
        tag: 0x07,
        extendedTag: 0x13,
        payload: empty,
        speakerCount: 0,
        speakerPresenceDescriptor: 0,
      } as unknown as CEADataBlock;
    case 'speaker-location':
      return {
        tag: 0x07,
        extendedTag: 0x14,
        payload: empty,
        descriptors: [],
        trailing: new Uint8Array(),
      } as unknown as CEADataBlock;
    case 'infoframe':
      return {
        tag: 0x07,
        extendedTag: 0x20,
        payload: empty,
        additionalVsifs: 0,
        processingPayload: new Uint8Array(),
        descriptors: [],
        trailing: new Uint8Array(),
      } as unknown as CEADataBlock;
    case 'vesa-transfer':
      return {
        tag: 0x05,
        payload: new Uint8Array(1),
        transferType: 'white',
        numEntries: 8,
        gammaValues: new Array(8).fill(0),
      } as unknown as CEADataBlock;
    default:
      return undefined;
  }
}