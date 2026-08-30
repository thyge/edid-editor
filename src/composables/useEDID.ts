import { ref, shallowRef, computed, reactive } from 'vue'
import { EEDID } from 'edidts'

// shallowRef: only `.value` reassignment is tracked. The EEDID instance itself
// is wrapped in reactive() on load so Vue can see deep field edits; a plain
// ref would double-wrap and fight the explicit reactive() proxy.
const edid = shallowRef<EEDID | null>(null)
const error = ref<string | null>(null)

// edidData is derived state: the reactive EEDID tree, re-encoded to bytes.
// Because edid.value is a reactive() proxy, EEDID.encode's property reads
// register as this computed's dependencies — any deep mutation (field edit,
// add/remove block) marks it dirty and it lazily re-evaluates on the next
// render. No watcher, no encode flag. EEDID.encode is pure (writes only to a
// fresh Uint8Array, never mutates the instance), so it is safe here.
//
// Trade-off vs the former watcher + suppressEncode: the hex view now shows
// re-encoded (canonical) bytes immediately after load — checksums recomputed,
// padding normalized — rather than the uploaded file's raw bytes verbatim
// until the first edit. For EDIDs that round-trip byte-identically (the common
// case) there is no visible difference.
const edidData = computed<Uint8Array | null>(() =>
  edid.value ? EEDID.encode(edid.value) : null,
)

function parseHexString(hex: string): Uint8Array {
  const cleaned = hex.replace(/[^0-9A-Fa-f]/g, '')
  const bytes: number[] = []
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes.push(parseInt(cleaned.slice(i, i + 2), 16))
  }
  return new Uint8Array(bytes)
}

// Load bytes into the reactive tree. The computed re-encodes from the tree on
// demand; there is no separate raw-byte store to preserve.
function setEdid(bytes: Uint8Array) {
  edid.value = reactive(EEDID.decode(bytes)) as EEDID
}

export function useEDID() {
  const loadFromHex = (hex: string) => {
    try {
      error.value = null
      setEdid(parseHexString(hex))
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
        setEdid(parseHexString(text))
        return
      }

      setEdid(new Uint8Array(buffer))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to parse EDID'
      edid.value = null
    }
  }

  const loadFromBytes = (bytes: Uint8Array) => {
    try {
      error.value = null
      setEdid(bytes)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to parse EDID'
      edid.value = null
    }
  }

  const createBlankEdid = () => {
    try {
      error.value = null
      // Route through setEdid so a blank has the same decoded shape as a load.
      setEdid(EEDID.encode(EEDID.blank()))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to create EDID'
      edid.value = null
    }
  }

  const clear = () => {
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