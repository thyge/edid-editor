import { EDID } from "./edid.ts";
import { CEA } from "./cea.ts";
import { DisplayID } from "./did.js";

const TimingExtension = 0x00;
const CEAExtension = 0x02;
const VideoTimingBlockExtension = 0x10;
const EDID2_0Extension = 0x20;
const DisplayInformationExtension = 0x40;
const LocalizedStringExtension = 0x50;
const MicrodisplayInterfaceExtension = 0x60;
const DisplayIDExtension = 0x70;
const DisplayTransferCharacteristicsDataBlock1 = 0xa7;
const DisplayTransferCharacteristicsDataBlock2 = 0xaf;
const DisplayTransferCharacteristicsDataBlock3 = 0xbf;
const BlockMap = 0xf0;
const DisplayDeviceDataBlock = 0xff;

export class EEDID {
  raw: Uint8Array;
  Extensions: number;
  EDID: EDID = new EDID();
  CEA: CEA = new CEA();
  DID: DisplayID;
  Errors = [];

  constructor() {
    this.raw = new Uint8Array();
    this.Extensions = 0;
  }

  ParseEEDID(bytes: Uint8Array) {
    this.raw = bytes;
    this.Extensions = this.raw[126];
    for (let i = 0; i < this.Extensions + 1; i++) {
      let extBytes = new Uint8Array(this.raw.slice(i * 128, 128 + i * 128));
      if (i === 0) {
        this.EDID = new EDID();
        console.log(this.EDID);
        this.EDID.Decode(extBytes);
        this.EDID.Extension = i;
      } else {
        switch (extBytes[0]) {
          case TimingExtension:
            break;
          case CEAExtension:
            this.CEA = new CEA();
            this.CEA.Decode(extBytes);
            this.CEA.Extension = i;
            // this.CEA.Encode();
            break;
          case VideoTimingBlockExtension:
            break;
          case EDID2_0Extension:
            break;
          case DisplayInformationExtension:
            break;
          case LocalizedStringExtension:
            break;
          case MicrodisplayInterfaceExtension:
            break;
          case DisplayIDExtension:
            this.DID = new DisplayID();
            this.DID.DecodeDisplayID(extBytes);
            this.DID.Extension = i;
            break;
          case DisplayTransferCharacteristicsDataBlock1:
            break;
          case DisplayTransferCharacteristicsDataBlock2:
            break;
          case DisplayTransferCharacteristicsDataBlock3:
            break;
          case BlockMap:
            break;
          case DisplayDeviceDataBlock:
            break;
          default:
            console.log("extension not supported");
            break;
        }
      }
    }
  }
  UpdateEEDIDRaw() {
    if (this.EDID) {
      for (let i = 0; i < this.EDID.raw.length; i++) {
        // Extension offset
        let ext = this.EDID.Extension * 128;
        this.raw[ext + i] = this.EDID.raw[i];
      }
    }
    if (this.CEA) {
      for (let i = 0; i < this.CEA.raw.length; i++) {
        let ext = this.CEA.Extension * 128;
        this.raw[ext + i] = this.CEA.raw[i];
      }
    }
    if (this.DID) {
      for (let i = 0; i < this.CEA.raw.length; i++) {
        let ext = this.CEA.Extension * 128;
        this.raw[ext + i] = this.CEA.raw[i];
      }
    }
  }
}