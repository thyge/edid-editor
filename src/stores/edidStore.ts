import { defineStore } from 'pinia'
import { EEDID } from '../edidjs/eedid.ts'
export const useEdidStore = defineStore('edids', {
  state: () => {
    return {
      mEEDID: new EEDID(),
    }
  },
  getters: {
    getDisplayProductName(): string {
      let dpm = this.mEEDID.EDID.DisplayDescriptors.find(e => e.Type === "Display Product Name")
      if (dpm) {
        return dpm.Content 
      } else {
        return ""
      }
    },
  },
  actions: {
    setHeader(e) {
      this.mEEDID.EDID.Encode();
      // Try to force hex view update
      // Vue does not update on individual array element change
      let tmp = this.mEEDID.EDID.raw.slice();
      this.mEEDID.EDID.raw = tmp;
    },
  },
})