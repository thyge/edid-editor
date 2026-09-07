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
import { SPEAKER_ALLOCATION_BITS, COLORIMETRY_FLAGS } from './cta-extended-blocks';
import { EOTF_FLAGS } from './vcdb/hdr-static';
import { writeIeeeOuiLE } from '../common/bintools';
import { VENDOR_ENCODERS, type VendorEncoder } from './vsdb/registry';
import { OUI, type VendorSpecificDecoded, type VendorSpecificDataBlock } from './vsdb/types';
import { HDMI14_DEFAULT } from './vsdb/hdmi14';
import { HDMI_FORUM_DEFAULT } from './vsdb/hdmi-forum';
import { MICROSOFT_HMD_DEFAULT } from './vsdb/microsoft-hmd';
import { AMD_FREESYNC_DEFAULT } from './vsdb/amd';

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
  | 'vesa-transfer'
  | 'vsdb-hdmi14'
  | 'vsdb-hdmi-forum'
  | 'vsdb-microsoft-hmd'
  | 'vsdb-amd'
  | 'vsdb-mhl';

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
 * Assemble a default vendor-specific data block (tag 0x03) from a vendor kind,
 * its OUI, and default `fields`: the fields are encoded through the kind's
 * registered `VENDOR_ENCODERS` codec, and the carrier `payload` is built as
 * OUI (3 bytes, LE wire order) + encoded vendor body — the same shape
 * `decodeVendorSpecificBlock` produces, so the block round-trips immediately
 * (TASK-109). `fields` must be a fresh object per call: the block becomes the
 * live edit target in the Vue editor, so the exported `*_DEFAULT` literals
 * must never be handed over by reference.
 */
function createDefaultVsdb<K extends Exclude<VendorSpecificDecoded['kind'], 'unknown'>>(
  kind: K,
  oui: number,
  fields: Parameters<VendorEncoder<K>['encode']>[0],
): VendorSpecificDataBlock {
  const body = (VENDOR_ENCODERS[kind] as unknown as VendorEncoder<K>).encode(fields);
  const payload = new Uint8Array(3 + body.length);
  writeIeeeOuiLE(payload, 0, oui);
  payload.set(body, 3);
  return {
    tag: 0x03,
    payload,
    ieeeOui: oui,
    vendorPayload: body,
    vendor: { kind, fields } as unknown as VendorSpecificDecoded,
  };
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
    // Vendor-specific data blocks (tag 0x03, TASK-109): unlike the short
    // blocks above, multiple VSDBs may legally coexist, and each needs its
    // vendor type chosen at instantiation. Defaults are fresh copies of the
    // codecs' own `*_DEFAULT` field literals (never the shared constants —
    // the returned block becomes the editor's live mutation target).
    case 'vsdb-hdmi14':
      return createDefaultVsdb('hdmi14', OUI.HDMI_1_4, {
        ...HDMI14_DEFAULT,
        trailing: new Uint8Array(HDMI14_DEFAULT.trailing),
      });
    case 'vsdb-hdmi-forum':
      return createDefaultVsdb('hdmiForum', OUI.HDMI_FORUM, { ...HDMI_FORUM_DEFAULT });
    case 'vsdb-microsoft-hmd':
      return createDefaultVsdb('microsoftHmd', OUI.MICROSOFT_HMD, {
        ...MICROSOFT_HMD_DEFAULT,
        // The shared literal's use case 0 is NOT a valid code — the encoder
        // rejects it (isValidMicrosoftHMDUseCase). Default to 'Generic
        // Display' (0x02) so a freshly added block encodes immediately.
        primaryUseCase: 0x02,
        containerId: new Uint8Array(MICROSOFT_HMD_DEFAULT.containerId),
      });
    case 'vsdb-amd':
      return createDefaultVsdb('amdFreeSync', OUI.AMD, {
        ...AMD_FREESYNC_DEFAULT,
        trailing: new Uint8Array(AMD_FREESYNC_DEFAULT.trailing),
      });
    case 'vsdb-mhl':
      return createDefaultVsdb('mhl', OUI.MHL, {
        version: 0,
        revision: 0,
        deviceCapability: 0,
        trailing: new Uint8Array(),
      });
    default:
      return undefined;
  }
}