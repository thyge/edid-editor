import { defineStore } from 'pinia'
import { EEDID } from '../edidjs/eedid.ts'
import { DescriptorType } from '../edidjs/edid_descriptors.ts'
import { DummyDesciptor } from '../edidjs/edid_descriptors.ts'
export const useEdidStore = defineStore('edids', {
  state: () => {
    return {
      mEEDID: new EEDID(),
    }
  },
  getters: {
    getDisplayProductName(): string {
      let dpm = this.mEEDID.EDID.DisplayDescriptors.find(e => e.Type === DescriptorType.DisplayProductName)
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
      // Try to force hex view update
      // Vue does not update on individual array element change
      let tmp = this.mEEDID.EDID.raw.slice();
      this.mEEDID.EDID.raw = tmp;
    },
    removeBlock(id: number) {
      console.log("removing block", id);
      this.mEEDID.EDID.DisplayDescriptors.splice(id, 1);
      this.mEEDID.EDID.DisplayDescriptors.push(new DummyDesciptor());
    },
    changeBlock(id: number) {
      console.log("changing block", id);
    }
  },
})