import { defineStore } from 'pinia'
export const useUiStore = defineStore('ui', {
  state: () => {
    return {
      showHexView: true,
      activeBlock: 'edid' as 'edid' | 'cea' | 'displayid',
    }
  },
})