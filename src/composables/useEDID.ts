import { ref, shallowRef, computed, reactive } from 'vue'
import { EEDID } from 'edidts'

// shallowRef: only `.value` reassignment is tracked. The EEDID instance itself
// is wrapped in reactive() on load so Vue can see deep field edits; a plain
// ref would double-wrap and fight the explicit reactive() proxy.
const edid = shallowRef<EEDID | null>(null)
const error = ref<string | null>(null)
// Name of the file the current EDID was imported from (picked or dropped);
// null for pasted hex and blank EDIDs. Used to name the edited download.
const sourceFileName = ref<string | null>(null)

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
//
// Encoding can fail when an edit no longer fits the format (e.g. a CTA data
// block longer than 31 bytes, or more content than a 128-byte extension
// holds). The encoders refuse rather than silently truncate, so the failure
// is surfaced as `encodeError`, `edidData` goes null (download is blocked —
// there are no valid bytes for the current edits), and `previewData` keeps
// showing the last bytes that did encode.
const encodeResult = computed<{ bytes: Uint8Array | null; error: string | null }>(() => {
  if (!edid.value) return { bytes: null, error: null }
  try {
    return { bytes: EEDID.encode(edid.value), error: null }
  } catch (e) {
    return { bytes: null, error: e instanceof Error ? e.message : 'The edited EDID could not be encoded' }
  }
})
const edidData = computed<Uint8Array | null>(() => encodeResult.value.bytes)
const encodeError = computed<string | null>(() => encodeResult.value.error)

// Last successfully encoded bytes for the hex view, so it doesn't blank out
// while an edit is temporarily invalid. Reset whenever a new EDID is loaded.
let lastEncoded: Uint8Array | null = null
const previewData = computed<Uint8Array | null>(() => {
  if (!edid.value) {
    lastEncoded = null
    return null
  }
  const bytes = encodeResult.value.bytes
  if (bytes) lastEncoded = bytes
  return bytes ?? lastEncoded
})

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
function setEdid(bytes: Uint8Array, fileName: string | null = null) {
  lastEncoded = null
  edid.value = reactive(EEDID.decode(bytes)) as EEDID
  sourceFileName.value = fileName
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
        setEdid(parseHexString(text), file.name)
        return
      }

      setEdid(new Uint8Array(buffer), file.name)
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
    sourceFileName.value = null
  }

  const isLoaded = computed(() => edid.value !== null)

  return {
    edidData,
    previewData,
    encodeError,
    edid,
    error,
    sourceFileName,
    isLoaded,
    loadFromHex,
    loadFromFile,
    loadFromBytes,
    createBlankEdid,
    clear,
  }
}