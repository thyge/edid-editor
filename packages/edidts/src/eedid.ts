import { EDID } from "./edid/edid.ts";
import { CEA } from "./cea/cea.ts";
import { DisplayID } from "./displayid/displayid.ts";
import { calcEDIDChecksum } from "./common/utils.ts";

const CEAExtension = 0x02;
const DisplayIDExtension = 0x70;

export interface BaseExtensionBlock {
  tag: number;
  extension: number;
  raw: Uint8Array;
}

export interface CEAExtensionBlock extends BaseExtensionBlock {
  tag: 0x02;
  block: CEA;
}

export interface DisplayIDExtensionBlock extends BaseExtensionBlock {
  tag: 0x70;
  block: DisplayID;
}

export interface UnknownExtensionBlock extends BaseExtensionBlock {
  tag: number;
}

export type ExtensionBlock =
  | CEAExtensionBlock
  | DisplayIDExtensionBlock
  | UnknownExtensionBlock;

export class ExtensionBlockParser {
  static decode(raw: Uint8Array, extensionIndex: number): ExtensionBlock {
    const tag = raw[0] ?? 0;
    switch (tag) {
      case CEAExtension:
        return {
          tag: 0x02,
          extension: extensionIndex,
          raw: new Uint8Array(raw),
          block: CEA.decode(raw),
        };
      case DisplayIDExtension:
        return {
          tag: 0x70,
          extension: extensionIndex,
          raw: new Uint8Array(raw),
          block: DisplayID.decode(raw),
        };
      default:
        return {
          tag,
          extension: extensionIndex,
          raw: new Uint8Array(raw),
        };
    }
  }

  static encode(block: ExtensionBlock): Uint8Array {
    switch (block.tag) {
      case 0x02:
        return (block as CEAExtensionBlock).block.Encode();
      case 0x70:
        return (block as DisplayIDExtensionBlock).block.encode();
      default:
        return block.raw;
    }
  }
}

export class EEDID {
  raw: Uint8Array;
  edid: EDID;
  blocks: ExtensionBlock[] = [];
  Errors: string[] = [];

  get EDID(): EDID {
    return this.edid;
  }
  set EDID(value: EDID) {
    this.edid = value;
  }

  get CEA(): CEA {
    return this.ceaBlocks[0]?.block ?? new CEA();
  }

  get DID(): DisplayID {
    return this.displayIDBlocks[0]?.block ?? new DisplayID();
  }

  get hasCEA(): boolean {
    return this.ceaBlocks.length > 0;
  }
  set hasCEA(value: boolean) {
    if (!value) {
      this.blocks = this.blocks.filter((b) => b.tag !== CEAExtension);
    }
  }

  get hasDisplayID(): boolean {
    return this.displayIDBlocks.length > 0;
  }
  set hasDisplayID(value: boolean) {
    if (!value) {
      this.blocks = this.blocks.filter((b) => b.tag !== DisplayIDExtension);
    }
  }

  Extensions: number = 0;

  get ceaBlocks(): CEAExtensionBlock[] {
    return this.blocks.filter((b): b is CEAExtensionBlock => b.tag === CEAExtension);
  }

  get displayIDBlocks(): DisplayIDExtensionBlock[] {
    return this.blocks.filter(
      (b): b is DisplayIDExtensionBlock => b.tag === DisplayIDExtension
    );
  }

  constructor() {
    this.raw = new Uint8Array();
    this.edid = new EDID();
  }

  static decode(bytes: Uint8Array): EEDID {
    const eedid = new EEDID();
    eedid.raw = new Uint8Array(bytes);
    const extensions = bytes[126] ?? 0;
    eedid.edid = EDID.decode(bytes.slice(0, 128));
    eedid.edid.Extension = 0;
    eedid.blocks = [];

    for (let i = 1; i <= extensions; i++) {
      const extBytes = bytes.slice(i * 128, (i + 1) * 128);
      if (extBytes.length === 128) {
        const block = ExtensionBlockParser.decode(extBytes, i);
        eedid.blocks.push(block);
      }
    }

    return eedid;
  }

  /** @deprecated Use EEDID.decode() */
  ParseEEDID(bytes: Uint8Array) {
    const decoded = EEDID.decode(bytes);
    this.raw = decoded.raw;
    this.edid = decoded.edid;
    this.blocks = decoded.blocks;
  }

  encode(): Uint8Array {
    // Encode base EDID
    const edidBytes = this.edid.Encode();
    const edidRaw = new Uint8Array(128);
    edidRaw.set(edidBytes.slice(0, 128));
    this.edid.raw = edidRaw;

    // Encode all extension blocks
    const extBytes: Uint8Array[] = [];
    for (const block of this.blocks) {
      const encoded = ExtensionBlockParser.encode(block);
      const padded = new Uint8Array(128);
      padded.set(encoded.slice(0, 128));
      extBytes.push(padded);
    }

    const totalSize = 128 + extBytes.length * 128;
    const result = new Uint8Array(totalSize);
    result.set(this.edid.raw, 0);
    for (let i = 0; i < extBytes.length; i++) {
      result.set(extBytes[i], (i + 1) * 128);
    }
    result[126] = extBytes.length;

    // Recalculate checksums for each 128-byte block
    for (let i = 0; i <= extBytes.length; i++) {
      const start = i * 128;
      result[start + 127] = calcEDIDChecksum(result.slice(start, start + 128));
    }

    this.raw = result;

    // Update legacy extension indices
    for (let i = 0; i < this.blocks.length; i++) {
      this.blocks[i].extension = i + 1;
    }

    return result;
  }

  /** @deprecated Use encode() */
  UpdateEEDIDRaw(): void {
    this.encode();
  }
}
