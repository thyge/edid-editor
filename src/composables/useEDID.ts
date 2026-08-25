import { ref, shallowRef, computed, watch, reactive } from 'vue'
import { EEDID } from 'edidts'

const edidData = ref<Uint8Array | null>(null)
// shallowRef: only `.value` reassignment is tracked. The EEDID instance itself
// is wrapped in reactive() on load so Vue can see deep field edits; a plain
// ref would double-wrap and fight the explicit reactive() proxy.
const edid = shallowRef<EEDID | null>(null)
const error = ref<string | null>(null)

// Suppress the deep watcher's encode for the one drain triggered by a load
// (setEdidPayload reassigns edid.value). Without this, loading would immediately
// re-encode and overwrite edidData with normalized bytes — we want an uploaded
// file's hex to show as-uploaded, and only user edits to re-encode. The flag
// self-resets on the first watcher drain.
let suppressEncode = false

// One deep watcher is the single encode site for the whole UI (TASK-66 AC#1).
// Any mutation to the reactive EEDID tree (field edit, add/remove block, etc.)
// fires this; default flush:'pre' coalesces synchronous mutations into one
// microtask encode (the "debounced to a microtask"). EEDID.encode is pure — it
// writes only to a fresh Uint8Array and never mutates the instance — so
// reassigning edidData here cannot re-trigger this watcher.
watch(
  edid,
  (val) => {
    if (suppressEncode) {
      suppressEncode = false
      return
    }
    if (!val) {
      edidData.value = null
      return
    }
    edidData.value = EEDID.encode(val)
  },
  { deep: true },
)

function parseHexString(hex: string): Uint8Array {
  const cleaned = hex.replace(/[^0-9A-Fa-f]/g, '')
  const bytes: number[] = []
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16))
  }
  return new Uint8Array(bytes)
}

function setEdidPayload(bytes: Uint8Array) {
  // Preserve the original bytes for the hex view; suppress the load-triggered
  // watcher drain so it doesn't overwrite them with a re-encoded copy.
  suppressEncode = true
  edidData.value = new Uint8Array(bytes)
  edid.value = reactive(EEDID.decode(bytes)) as EEDID
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
      const blank = EEDID.blank()
      const encoded = EEDID.encode(blank)
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
