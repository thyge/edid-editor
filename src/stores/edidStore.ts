import { defineStore } from 'pinia'
import { EEDID } from '../edidjs/eedid.ts'
import { DescriptorType, CreateDesciptor } from '../edidjs/edid_descriptors.ts'
export const useEdidStore = defineStore('edids', {
  state: () => {
    return {
      mEEDID: new EEDID(),
    }
  },
  getters: {
    getDisplayProductName(): string {
      let dpm: DisplayProductName = this.mEEDID.EDID.DisplayDescriptors.find(e => e.Type === DescriptorType.DisplayProductName)
      if (dpm) {
        return dpm.text 
      } else {
        return ""
      }
    },
  },
  actions: {
    updateEdid() {
      this.mEEDID.EDID.Encode();
      let cea_bytes = this.mEEDID.CEA.Encode();
      this.mEEDID.CEA.raw = cea_bytes;
      // Try to force hex view update
      // Vue does not update on individual array element change
      let tmp = this.mEEDID.EDID.raw.slice();
      this.mEEDID.EDID.raw = tmp;
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
    }
  },
})