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
      console.log("setHeader")
      this.mEEDID.EDID.SetManufactureDate();
      this.mEEDID.EDID.SetEDIDVersion();
      this.mEEDID.EDID.SetFeatureSupport();
      this.mEEDID.EDID.SetSize();
      this.mEEDID.EDID.SetGamma();
      this.mEEDID.EDID.SetVideoInputParameters();
      this.mEEDID.EDID.SetSerialNumber();
      this.mEEDID.EDID.CalcChecksum();
      // Try to force hex view update
      // Vue does not update on individual array element change
      let tmp = this.mEEDID.EDID.raw.slice();
      this.mEEDID.EDID.raw = tmp;
    },
  },
})