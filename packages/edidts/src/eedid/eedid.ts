import { EDID } from '../edid';
import { decodeExtension, encodeExtension, isDisplayIdExtension, type Extension } from './extension';
import { checksum8 } from '../common/checksum';

const BLOCK_SIZE = 128;

/**
 * Top-level EEDID container (VESA E-EDID A2): a 128-byte base block plus
 * zero or more 128-byte extension blocks. This is the entry point the
 * EEDID consumer reads; the base-block shape lives in `EDID`, and each
 * extension's typed shape lives in its own spec module.
 */
export class EEDID {
  public base: EDID;
  public extensions: Extension[];
  public checksum: number;
  public isValid: boolean;
  /**
   * True iff every decoded extension block has a valid byte-127 checksum.
   * The base-block checksum validity is reported separately as `isValid`.
   * Defaults to true so consumers that construct an EEDID directly (without
   * decoding) are unaffected.
   */
  public extensionsValid: boolean;
  /**
   * Human-readable bad-checksum warnings, one per offending block. Covers the
   * base block (byte-127 8-bit checksum), each extension block (byte-127),
   * and — for DisplayID extensions — each carried section's section-level
   * checksum. Empty when every checksum is valid. Populated by `EEDID.decode`;
   * defaults to `[]` for directly-constructed instances.
   */
  public checksumDiagnostics: string[];
  /**
   * Base-block structural diagnostics (e.g. the VESA E-EDID A2 §3.10.1
   * first-descriptor warning), surfaced from `base.baseDiagnostics` so the UI
   * can render them next to `checksumDiagnostics`. Defaults to `[]`.
   */
  public baseDiagnostics: string[];
  /**
   * Bytes that followed the extension blocks the base block declares (byte
   * 126), kept verbatim so they are written back on encode. A typical case is
   * a 256-byte EEPROM dump of a monitor with no extensions: the second half is
   * 0xFF/0x00 padding, not an extension, and must neither be shown as one nor
   * bump the extension count on save. Empty when the file holds exactly the
   * declared blocks.
   */
  public trailingBytes: Uint8Array;
  /**
   * How many extensions the decoded file declared, so `encode` knows how much
   * of `trailingBytes` new extensions have since taken over. Undefined for an
   * EEDID built in code.
   */
  public declaredExtensionCount?: number;

  constructor(init?: Partial<Pick<EEDID, 'base' | 'extensions'>>) {
    this.base = init?.base ?? new EDID();
    this.extensions = init?.extensions ?? [];
    this.checksum = 0;
    this.isValid = false;
    this.extensionsValid = true;
    this.checksumDiagnostics = [];
    this.baseDiagnostics = [];
    this.trailingBytes = new Uint8Array();
  }

  static decode(data: ArrayBuffer | Uint8Array): EEDID {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.length < BLOCK_SIZE) {
      throw new Error(`EEDID: minimum ${BLOCK_SIZE} bytes required; got ${bytes.length}`);
    }

    const base = EDID.decode(bytes.subarray(0, BLOCK_SIZE));

    const availableCount = Math.floor((bytes.length - BLOCK_SIZE) / BLOCK_SIZE);
    const declaredCount = bytes[BLOCK_SIZE - 2];
    // Only the blocks the base block declares are extensions. Anything after
    // them (EEPROM padding, a partial block) is kept verbatim as trailing
    // bytes. A truncated file (fewer blocks than declared) decodes what's there.
    const extensionCount = Math.min(availableCount, declaredCount);

    const extensions: Extension[] = [];
    for (let i = 0; i < extensionCount; i++) {
      const start = (i + 1) * BLOCK_SIZE;
      const block = bytes.subarray(start, start + BLOCK_SIZE);
      extensions.push(decodeExtension(block));
    }

    const diagnostics: string[] = [];
    if (!base.checksumValid) {
      diagnostics.push('Base EDID block checksum is invalid');
    }
    extensions.forEach((ext, i) => {
      const label = extensionLabel(ext);
      if (ext.checksumValid === false) {
        diagnostics.push(`Extension ${i + 1} (${label}) block checksum is invalid`);
      }
      if (isDisplayIdExtension(ext) && ext.sections) {
        ext.sections.forEach((section, n) => {
          if (!section.isChecksumValid) {
            diagnostics.push(
              `DisplayID section ${n + 1} (extension ${i + 1}) checksum is invalid`,
            );
          }
        });
      }
    });

    const eedid = new EEDID({ base, extensions });
    eedid.checksum = bytes[BLOCK_SIZE - 1];
    eedid.isValid = base.checksumValid;
    eedid.extensionsValid = extensions.every((ext) => ext.checksumValid === true);
    eedid.checksumDiagnostics = diagnostics;
    eedid.trailingBytes = bytes.slice((1 + extensionCount) * BLOCK_SIZE);
    eedid.declaredExtensionCount = extensionCount;
    eedid.baseDiagnostics = [...base.baseDiagnostics];
    if (availableCount > declaredCount && looksLikeUndeclaredExtension(eedid.trailingBytes)) {
      eedid.baseDiagnostics.push(
        `Byte 126 declares ${declaredCount} extension block(s), but the file holds another block that looks like an extension; it is kept as raw bytes, not decoded`,
      );
    }
    return eedid;
  }

  static encode(eedid: EEDID): Uint8Array {
    const blocksLength = (1 + eedid.extensions.length) * BLOCK_SIZE;
    // Extensions added since decode occupy the space trailing padding held, so
    // drop that much of it; removed extensions just let the padding move up.
    const trailing = eedid.trailingBytes ?? new Uint8Array();
    const added = Math.max(
      0,
      eedid.extensions.length - (eedid.declaredExtensionCount ?? eedid.extensions.length),
    );
    const keptTrailing = trailing.subarray(Math.min(trailing.length, added * BLOCK_SIZE));
    const out = new Uint8Array(blocksLength + keptTrailing.length);

    out.set(EDID.encode(eedid.base, { extensionCount: eedid.extensions.length }), 0);
    out[BLOCK_SIZE - 1] = checksum8(out.subarray(0, BLOCK_SIZE), BLOCK_SIZE - 1);

    for (let i = 0; i < eedid.extensions.length; i++) {
      out.set(encodeExtension(eedid.extensions[i]), (i + 1) * BLOCK_SIZE);
    }
    out.set(keptTrailing, blocksLength);

    return out;
  }

  static blank(): EEDID {
    return new EEDID({ base: EDID.blank(), extensions: [] });
  }
}

/**
 * True when the first block after the declared extensions carries a known
 * extension tag and a valid checksum — i.e. it is probably a real extension
 * that byte 126 forgot to count, not EEPROM padding.
 */
function looksLikeUndeclaredExtension(trailing: Uint8Array): boolean {
  if (trailing.length < BLOCK_SIZE) return false;
  const block = trailing.subarray(0, BLOCK_SIZE);
  return [0x02, 0x10, 0x40, 0x50, 0x60, 0x70, 0xf0].includes(block[0]) && checksum8(block) === block[127];
}

/**
 * Human-readable label for an extension, used in checksum diagnostics. Names
 * the two first-class extension types (CTA-861, DisplayID) and falls back to
 * the raw tag for opaque extensions (VTB, Block Map, manufacturer-defined…).
 */
function extensionLabel(ext: Extension): string {
  if (ext.tag === 0x02) return 'CTA-861, tag 0x02';
  if (isDisplayIdExtension(ext)) return 'DisplayID, tag 0x70';
  const tag = ext.tag;
  return `tag 0x${tag.toString(16).padStart(2, '0').toUpperCase()}`;
}
