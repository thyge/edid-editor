import { EDID } from '../edid';
import { decodeExtension, encodeExtension, type Extension } from './extension';
import { checksum8, isChecksum8Valid } from '../common/checksum';

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

  constructor(init?: Partial<Pick<EEDID, 'base' | 'extensions'>>) {
    this.base = init?.base ?? new EDID();
    this.extensions = init?.extensions ?? [];
    this.checksum = 0;
    this.isValid = false;
    this.extensionsValid = true;
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
    let extensionsValid = true;
    for (let i = 0; i < actualCount; i++) {
      const start = (i + 1) * BLOCK_SIZE;
      const block = bytes.subarray(start, start + BLOCK_SIZE);
      extensions.push(decodeExtension(block));
      if (!isChecksum8Valid(block)) {
        extensionsValid = false;
      }
    }

    const eedid = new EEDID({ base, extensions });
    eedid.checksum = bytes[BLOCK_SIZE - 1];
    eedid.isValid = isChecksum8Valid(bytes.subarray(0, BLOCK_SIZE));
    eedid.extensionsValid = extensionsValid;
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
