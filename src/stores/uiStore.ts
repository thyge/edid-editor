import { defineStore } from 'pinia'
export const useUiStore = defineStore('ui', {
  state: () => {
    return {
      showHexView: false,
    }
  },
})