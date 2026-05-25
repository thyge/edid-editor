import { defineStore } from "pinia";
import {
  EEDID,
  CEA,
  DisplayID,
  DescriptorType,
  CreateDesciptor,
} from "edidts";
import { useUiStore } from "./uiStore.ts";

export const useEdidStore = defineStore("edids", {
  state: () => {
    return {
      mEEDID: new EEDID(),
    };
  },
  getters: {},
  actions: {
    updateEdid() {
      this.mEEDID.encode();
    },
    removeBlock(id: number) {
      this.mEEDID.EDID.DisplayDescriptors.splice(id, 1);
      this.updateEdid();
    },
    addBlock(type: DescriptorType) {
      const block = CreateDesciptor(type);
      this.mEEDID.EDID.DisplayDescriptors.push(block);
      this.updateEdid();
    },
    addExtensionBlock(type: 'cea' | 'displayid') {
      if (type === 'cea') {
        const cea = new CEA();
        cea.raw = new Uint8Array(128);
        cea.Header.Version = 3;
        cea.Header.dtdStartByte = 4;
        cea.Encode();
        this.mEEDID.blocks.push({
          tag: 0x02,
          extension: this.mEEDID.blocks.length + 1,
          raw: new Uint8Array(cea.raw),
          block: cea,
        });
      } else {
        const did = new DisplayID();
        did.raw = new Uint8Array(128);
        did.raw[0] = 0x70;
        let checksum = 0;
        for (let i = 0; i < 127; i++) {
          checksum += did.raw[i]!;
        }
        did.raw[127] = 256 - (checksum % 256);
        this.mEEDID.blocks.push({
          tag: 0x70,
          extension: this.mEEDID.blocks.length + 1,
          raw: new Uint8Array(did.raw),
          block: did,
        });
      }
      this.updateEdid();
    },
    removeExtensionBlock(index: number) {
      const uiStore = useUiStore();
      const removed = this.mEEDID.blocks[index];
      if (!removed) return;
      this.mEEDID.blocks.splice(index, 1);
      if (removed.tag === 0x02) {
        if (uiStore.activeBlock === 'cea') {
          uiStore.activeBlock = 'edid';
          uiStore.activeSubSection = 'header';
        }
      } else if (removed.tag === 0x70) {
        if (uiStore.activeBlock === 'displayid') {
          uiStore.activeBlock = 'edid';
          uiStore.activeSubSection = 'header';
        }
      }
      this.updateEdid();
    },
    removeFirstExtensionBlock(type: 'cea' | 'displayid') {
      const tag = type === 'cea' ? 0x02 : 0x70;
      const index = this.mEEDID.blocks.findIndex((b) => b.tag === tag);
      if (index >= 0) {
        this.removeExtensionBlock(index);
      }
    },
  },
});
