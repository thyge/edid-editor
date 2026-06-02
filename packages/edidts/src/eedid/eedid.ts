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

  constructor(init?: Partial<Pick<EEDID, 'base' | 'extensions'>>) {
    this.base = init?.base ?? new EDID();
    this.extensions = init?.extensions ?? [];
    this.checksum = 0;
    this.isValid = false;
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
      extensions.push(decodeExtension(bytes.subarray(start, start + BLOCK_SIZE)));
    }

    const eedid = new EEDID({ base, extensions });
    eedid.checksum = bytes[BLOCK_SIZE - 1];
    eedid.isValid = isChecksum8Valid(bytes.subarray(0, BLOCK_SIZE));
    void declaredCount;
    return eedid;
  }

  static encode(eedid: EEDID): Uint8Array {
    const total = (1 + eedid.extensions.length) * BLOCK_SIZE;
    const out = new Uint8Array(total);

    out.set(EDID.encode(eedid.base), 0);
    out[BLOCK_SIZE - 2] = eedid.extensions.length;
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
