import { defineStore } from "pinia";
import { EEDID } from "../edidts/eedid.ts";
import { CEA } from "../edidts/cea.ts";
import { DisplayID } from "../edidts/did.ts";
import {
  DescriptorType,
  CreateDesciptor,
} from "../edidts/edid_descriptors.ts";
import { useUiStore } from "./uiStore.ts";
export const useEdidStore = defineStore("edids", {
  state: () => {
    return {
      mEEDID: new EEDID(),
    };
  },
  getters: {},
  actions: {
    rebuildMasterRaw() {
      let totalSize = 128;
      if (this.mEEDID.hasCEA) totalSize += 128;
      if (this.mEEDID.hasDisplayID) totalSize += 128;

      const newRaw = new Uint8Array(totalSize);

      // Overlay EDID block
      newRaw.set(this.mEEDID.EDID.raw.slice(0, 128), 0);
      this.mEEDID.EDID.raw = newRaw.subarray(0, 128);
      this.mEEDID.EDID.Extension = 0;

      let offset = 128;
      if (this.mEEDID.hasCEA) {
        newRaw.set(this.mEEDID.CEA.raw.slice(0, 128), offset);
        this.mEEDID.CEA.raw = newRaw.subarray(offset, offset + 128);
        this.mEEDID.CEA.Extension = offset / 128;
        offset += 128;
      }
      if (this.mEEDID.hasDisplayID) {
        newRaw.set(this.mEEDID.DID.raw.slice(0, 128), offset);
        this.mEEDID.DID.raw = newRaw.subarray(offset, offset + 128);
        this.mEEDID.DID.Extension = offset / 128;
        offset += 128;
      }

      this.mEEDID.raw = newRaw;
      this.mEEDID.Extensions = (totalSize / 128) - 1;
      this.mEEDID.raw[126] = this.mEEDID.Extensions;
      this.mEEDID.EDID.CalcChecksum();
    },
    updateEdid() {
      this.mEEDID.EDID.Encode();
      if (this.mEEDID.hasCEA) {
        this.mEEDID.CEA.Encode();
      }
      this.rebuildMasterRaw();
    },
    removeBlock(id: number) {
      console.log("removing block", id);
      this.mEEDID.EDID.DisplayDescriptors.splice(id, 1);
      this.updateEdid();
    },
    addBlock(type: DescriptorType) {
      console.log("adding block", type);
      let block = CreateDesciptor(type);
      this.mEEDID.EDID.DisplayDescriptors.push(block);
      this.updateEdid();
    },
    addExtensionBlock(type: 'cea' | 'displayid') {
      if (type === 'cea') {
        if (this.mEEDID.hasCEA) return;
        const cea = new CEA();
        cea.raw = new Uint8Array(128);
        cea.Header.Version = '3';
        cea.Header.dtdStartByte = 4;
        cea.Encode();
        this.mEEDID.CEA = cea;
        this.mEEDID.hasCEA = true;
      } else {
        if (this.mEEDID.hasDisplayID) return;
        const did = new DisplayID();
        did.raw = new Uint8Array(128);
        did.raw[0] = 0x70;
        let checksum = 0;
        for (let i = 0; i < 127; i++) {
          checksum += did.raw[i]!;
        }
        did.raw[127] = 256 - (checksum % 256);
        this.mEEDID.DID = did;
        this.mEEDID.hasDisplayID = true;
      }
      this.rebuildMasterRaw();
    },
    removeExtensionBlock(type: 'cea' | 'displayid') {
      const uiStore = useUiStore();
      if (type === 'cea') {
        if (!this.mEEDID.hasCEA) return;
        this.mEEDID.hasCEA = false;
      } else {
        if (!this.mEEDID.hasDisplayID) return;
        this.mEEDID.hasDisplayID = false;
      }
      if (uiStore.activeBlock === type) {
        uiStore.activeBlock = 'edid';
        uiStore.activeSubSection = 'header';
      }
      this.rebuildMasterRaw();
    },
  },
});
