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

  constructor(init?: Partial<Pick<EEDID, 'base' | 'extensions'>>) {
    this.base = init?.base ?? new EDID();
    this.extensions = init?.extensions ?? [];
    this.checksum = 0;
    this.isValid = false;
    this.extensionsValid = true;
    this.checksumDiagnostics = [];
    this.baseDiagnostics = [];
  }

  static decode(data: ArrayBuffer | Uint8Array): EEDID {
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    if (bytes.length < BLOCK_SIZE) {
      throw new Error(`EEDID: minimum ${BLOCK_SIZE} bytes required; got ${bytes.length}`);
    }

    const base = EDID.decode(bytes.subarray(0, BLOCK_SIZE));

    const actualCount = Math.floor((bytes.length - BLOCK_SIZE) / BLOCK_SIZE);
    const declaredCount = bytes[BLOCK_SIZE - 2];

    const extensions: Extension[] = [];
    for (let i = 0; i < actualCount; i++) {
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
    eedid.baseDiagnostics = base.baseDiagnostics;
    void declaredCount;
    return eedid;
  }

  static encode(eedid: EEDID): Uint8Array {
    const total = (1 + eedid.extensions.length) * BLOCK_SIZE;
    const out = new Uint8Array(total);

    out.set(EDID.encode(eedid.base, { extensionCount: eedid.extensions.length }), 0);
    out[BLOCK_SIZE - 1] = checksum8(out, BLOCK_SIZE - 1);

    for (let i = 0; i < eedid.extensions.length; i++) {
      out.set(encodeExtension(eedid.extensions[i]), (i + 1) * BLOCK_SIZE);
    }

    return out;
  }

  static blank(): EEDID {
    return new EEDID({ base: EDID.blank(), extensions: [] });
  }
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
