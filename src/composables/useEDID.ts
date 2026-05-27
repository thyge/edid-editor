import { ref, computed } from 'vue'
import { EDID } from 'edidts'

const edidData = ref<Uint8Array | null>(null)
const edid = ref<EDID | null>(null)
const error = ref<string | null>(null)

function parseHexString(hex: string): Uint8Array {
  const cleaned = hex.replace(/[^0-9A-Fa-f]/g, '')
  const bytes: number[] = []
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16))
  }
  return new Uint8Array(bytes)
}

function setEdidPayload(bytes: Uint8Array) {
  edidData.value = new Uint8Array(bytes)
  edid.value = new EDID(edidData.value)
}

export function useEDID() {
  const loadFromHex = (hex: string) => {
    try {
      error.value = null
      const parsed = parseHexString(hex)
      setEdidPayload(parsed)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to parse EDID'
      edid.value = null
    }
  }

  const loadFromFile = async (file: File) => {
    try {
      error.value = null
      const buffer = await file.arrayBuffer()

      if (file.name.endsWith('.txt')) {
        const text = new TextDecoder().decode(new Uint8Array(buffer))
        setEdidPayload(parseHexString(text))
        return
      }

      setEdidPayload(new Uint8Array(buffer))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to parse EDID'
      edid.value = null
    }
  }

  const loadFromBytes = (bytes: Uint8Array) => {
    try {
      error.value = null
      setEdidPayload(bytes)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to parse EDID'
      edid.value = null
    }
  }

  const createBlankEdid = () => {
    try {
      error.value = null
      const blank = new EDID()
      const encoded = blank.encode()
      setEdidPayload(encoded)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create EDID'
      edid.value = null
    }
  }

  const clear = () => {
    edidData.value = null
    edid.value = null
    error.value = null
  }

  const isLoaded = computed(() => edid.value !== null)

  return {
    edidData,
    edid,
    error,
    isLoaded,
    loadFromHex,
    loadFromFile,
    loadFromBytes,
    createBlankEdid,
    clear,
  }
}
