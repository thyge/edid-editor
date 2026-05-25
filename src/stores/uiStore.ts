import { defineStore } from 'pinia'
export const useUiStore = defineStore('ui', {
  state: () => {
    return {
      showHexView: true,
      activeBlock: 'edid' as 'edid' | 'cea' | 'displayid',
      activeSubSection: 'header' as string,
    }
  },
  actions: {
    navigateTo(block: 'edid' | 'cea' | 'displayid', subSection: string) {
      this.activeBlock = block
      this.activeSubSection = subSection
    },
  },
})